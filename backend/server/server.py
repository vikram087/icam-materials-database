import json
import logging
import os
from datetime import datetime
from typing import Mapping, Sequence

import redis
import redis.exceptions
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from flask import Flask, Request, Response, jsonify, request
from flask_cors import CORS
from fuzzywuzzy import fuzz
from redis import Redis
from sentence_transformers import SentenceTransformer  # type: ignore

load_dotenv(dotenv_path="./env/.env")
API_KEY: str | None = os.getenv("API_KEY")
ES_URL: str | None = os.getenv("ES_URL")
DOCKER: str | None = os.getenv("DOCKER")
INDEX: str | None = os.getenv("INDEX")
CERT_PATH: str = os.getenv("CERT_PATH", "")

client: Elasticsearch = Elasticsearch(ES_URL, api_key=API_KEY, ca_certs=CERT_PATH)

app: Flask = Flask(__name__)
CORS(
    app,
    allow_headers=["Content-Type", "Authorization"],
)
model: SentenceTransformer = SentenceTransformer("all-MiniLM-L6-v2")

gunicorn_logger = logging.getLogger("gunicorn.error")
app.logger.handlers = gunicorn_logger.handlers
app.logger.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s"
)
for handler in gunicorn_logger.handlers:
    handler.setFormatter(formatter)

redis_host = "redis" if DOCKER == "true" else "localhost"
try:
    redis_client: Redis = redis.StrictRedis(
        host=redis_host, port=6379, db=0, decode_responses=True
    )
    redis_client.ping()
    redis_success = True
except redis.exceptions.ConnectionError:
    gunicorn_logger.exception("Failed to connect to redis")
    redis_success = False


@app.before_request
def require_api_key() -> tuple[Response, int] | None:
    if request.endpoint == "health":
        return None

    if request.method == "OPTIONS":
        return _cors_preflight_response()

    auth_response = check_api_key(request)
    if auth_response is not None:
        return auth_response

    return None


def _cors_preflight_response():
    """Handles CORS preflight OPTIONS requests."""
    response = jsonify({"success": True})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
    return response


def check_api_key(request):
    expected_api_key = os.getenv("SERVER_API_KEY")

    if not expected_api_key:
        return jsonify(
            {"success": False, "error": "Missing API_KEY in environment"}
        ), 404

    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify(
            {"success": False, "error": "Invalid or missing Bearer token"}
        ), 401

    provided_api_key = auth_header.split("Bearer ")[1]

    if provided_api_key != expected_api_key:
        return jsonify({"success": False, "error": "Invalid API key"}), 403

    return None


def get_embedding(text: str):  # type: ignore
    return model.encode(text)


@app.route("/health", methods=["GET"])
def health() -> tuple[Response, int]:
    return jsonify({"message": "Success"}), 200


# cache.clear()
# print("Cleared cache")
# redis-cli FLUSHALL # command on cli to clear cache
@app.route("/api/papers/<paper_id>", methods=["GET"])
def get_paper(paper_id: str) -> tuple[Response, int] | Response:
    results = client.get(index="search-papers-meta", id=paper_id)
    paper: dict = results["_source"]
    if paper:
        return jsonify(paper)
    else:
        return jsonify({"error": "No results found"}), 404


def get_cached_results(cache_key: str) -> dict | None:
    if redis_success:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)  # type: ignore
    return None


def cache_results(cache_key: str, data: tuple) -> None:
    if redis_success:
        redis_client.setex(cache_key, 3600, json.dumps(data))


def make_cache_key(args: list[str]):
    def parse(arg: str | list[str]) -> str:
        if isinstance(arg, list):
            arg = f"[{','.join(arg)}]"

        return arg

    return "_".join([parse(arg) for arg in args])


def parse_request(request: Request) -> tuple:
    data: dict = request.get_json()

    page: int = int(data.get("page", 0))
    num_results: int = int(data.get("results", 0))
    sorting: str = str(data.get("sorting", ""))

    today: datetime = datetime.today()
    formatted_date: str = today.strftime("%Y%m%d")
    date: str = str(data.get("date", f"00000000-{formatted_date}"))
    start_date: int = int(date.split("-")[0])
    end_date: int = int(date.split("-")[1])

    searches: list = list(data.get("searches", []))

    return page, num_results, sorting, start_date, end_date, searches


# MAT: material
# DSC: description of sample
# SPL: symmetry or phase labels
# SMT: synthesis method
# CMT: characterization method
# PRO: property - may also include PVL (property value) or PUT (property unit)
# APL: application
def handle_bool_searching(
    searches: list[dict], start_date: int, end_date: int, sorting: str
) -> tuple:
    must_clause: list[dict] = []
    or_clause: list[dict] = []
    not_clause: list[dict] = []
    query: dict | None = None
    all_query: bool = False
    vector_field: str | None = None
    vector_query: str | None = None

    valid_properties: dict = {
        "material": "MAT",
        "description": "DSC",
        "symmetry or phase labels": "SPL",
        "synthesis": "SMT",
        "characterization": "CMT",
        "property": "PRO",
        "application": "APL",
        "abstract": "summary",
        "category": "categories",
        "authors": "authors",
        "title": "title",
    }

    for search in searches:
        if search["field"].lower() not in valid_properties:
            return None, None, None, None

        # all query will always be all papers
        if search["term"] == "all":
            all_query = True
            query = {
                "bool": {
                    "must": [{"match_all": {}}],
                    "filter": [
                        {"range": {"date": {"gte": start_date, "lte": end_date}}}
                    ],
                }
            }
            break

        # vector search will use embedding fields
        if (
            search["isVector"]
            and sorting == "Most-Relevant"
            and search["field"].lower() in ("abstract", "title")
        ):
            if search["field"].lower() == "abstract":
                vector_field = "summary_embedding"
            else:
                vector_field = "title_embedding"
            vector_query = search["term"].lower()
            continue

        # adjusting field according to correct search term
        search["field"] = valid_properties[search["field"].lower()]

        # constructing match clause
        match_clause: dict = {
            "match": {
                search["field"]: {
                    "query": search["term"],
                    "fuzziness": "AUTO",
                }
            }
        }

        # deciding where to put match clause
        if search["operator"] == "" or search["operator"] == "AND":
            must_clause.append(match_clause)
        elif search["operator"] == "NOT":
            not_clause.append(match_clause)
        elif search["operator"] == "OR":
            or_clause.append(match_clause)

    # if not all query construct query according to constraints
    if not all_query:
        query = {
            "bool": {
                "must": must_clause,
                "should": or_clause,
                "must_not": not_clause,
                "filter": [{"range": {"date": {"gte": start_date, "lte": end_date}}}],
            }
        }

    return (
        all_query,
        query,
        vector_field,
        vector_query,
    )


def req_validation(page: int, num_results: int, sorting: str) -> str | None:
    if page < 0:
        gunicorn_logger.error("Pages less than 0, returning None")
        return None
    if num_results < 0 or (
        num_results != 10
        and num_results != 20
        and num_results != 50
        and num_results != 100
    ):
        gunicorn_logger.error("num_results invalid, returning None")
        return None
    if sorting == "Most-Recent" or sorting == "Most-Relevant":
        sort: str = "desc"
    elif sorting == "Oldest-First":
        sort = "asc"
    else:
        gunicorn_logger.error("sorting invalid, returning None")
        return None

    return sort


def bool_expression_to_dict(query_body):
    # Grab the boolean part
    bool_part = query_body.get("bool", {})
    must_clauses = bool_part.get("must", [])
    should_clauses = bool_part.get("should", [])

    # This dictionary will hold { field: [query_string, ...], ... }
    result = {}

    def extract_terms(match_array):
        for clause in match_array:
            # clause might look like {"match": {"authors": {"query": "something", ...}}}
            if "match" in clause:
                match_content = clause["match"]
                # match_content is e.g. {"authors": {"query": "piers coleman", "fuzziness": "AUTO"}}
                for field, match_info in match_content.items():
                    query_value = match_info.get("query")
                    if query_value:
                        # Append to our result dict
                        if field not in result:
                            result[field] = []
                        result[field].append(query_value)

    # Extract queries from must & should
    extract_terms(must_clauses)
    extract_terms(should_clauses)

    # Optional: remove duplicates if needed
    for field in result:
        result[field] = list(dict.fromkeys(result[field]))

    return result


def apply_highlight_markup(
    source,
    highlighted_terms,
    fields_to_highlight,
    similarity_threshold: int = 80,
):
    for field in fields_to_highlight:
        if field in highlighted_terms:
            highlight_values = highlighted_terms[field]

            if isinstance(source.get(field), list):
                source[field] = [
                    apply_fuzzy_mark_tags(item, highlight_values, similarity_threshold)
                    for item in source[field]
                ]
            elif isinstance(source.get(field), str):
                source[field] = apply_fuzzy_mark_tags(
                    source[field], highlight_values, similarity_threshold
                )

    return source


def apply_fuzzy_mark_tags(text, terms, similarity_threshold):
    if not isinstance(text, str):
        return text

    # Keep track of matches to avoid overlapping highlights
    matches = []

    # Find all potential matches for each term
    for term in terms:
        text_lower = text.lower()
        term_lower = term.lower()

        # Slide a window the size of the search term through the text
        window_size = len(term)
        for i in range(len(text_lower) - window_size + 1):
            window = text_lower[i : i + window_size]

            # Calculate similarity score
            score = fuzz.ratio(window.lower(), term_lower)

            if score >= similarity_threshold:
                matches.append(
                    {
                        "start": i,
                        "end": i + window_size,
                        "text": text[i : i + window_size],
                        "score": score,
                    }
                )

    # Sort matches by score (highest first) and position
    matches.sort(key=lambda x: (-x["score"], x["start"]))

    # Filter out overlapping matches, keeping the highest scoring ones
    filtered_matches = []
    for match in matches:
        overlapping = False
        for existing in filtered_matches:
            if match["start"] < existing["end"] and match["end"] > existing["start"]:
                overlapping = True
                break
        if not overlapping:
            filtered_matches.append(match)

    # Sort matches by position for proper highlighting
    filtered_matches.sort(key=lambda x: x["start"])

    # Apply highlighting tags
    result = ""
    last_end = 0
    for match in filtered_matches:
        result += text[last_end : match["start"]]
        result += f"<mark>{match['text']}</mark>"
        last_end = match["end"]
    result += text[last_end:]

    return result


def handle_vector_search(
    num_results: int,
    vector_field: str,
    vector_query: str,
    quer: dict,
    page: int,
    p_sort: Sequence[Mapping | str],
    size: int,
):
    # queries done based on size of index
    if size < num_results:
        size = num_results

    results = client.search(
        knn={
            "field": vector_field,
            "query_vector": get_embedding(vector_query),
            "num_candidates": size
            if size < 10000
            else 10000,  # not sure if should be lower or not
            "k": num_results,
        },
        query=quer,
        from_=(page - 1) * num_results,
        size=num_results,
        sort=p_sort,
        index=INDEX,
    )

    # if empty return Nones
    if results["hits"]["hits"] == []:
        return None, None, None

    hits: dict = results["hits"]["hits"]
    inflated: int = -1

    # getting query field
    if vector_field == "summary_embedding":
        quer_field = "summary"
    elif vector_field == "title_embedding":
        quer_field = "title"

    # creating "must" bool expression
    quer["bool"]["must"].append(
        {"match": {quer_field: {"query": vector_query, "fuzziness": "AUTO"}}}
    )

    # running fuzzy search to see apprx how many papers to display
    total = client.search(
        query=quer,
        size=num_results,
        from_=(page - 1) * num_results,
        index=INDEX,
    )["hits"]["total"]["value"]

    # if small total, set inflated to be papers found and total is 100 default
    if total < 100 and size >= 100:
        inflated = total
        total = 100

    to_highlight = bool_expression_to_dict(quer)

    # constructing filtered papers
    filtered_papers: list[dict] = []
    for paper in hits:
        source: dict = paper["_source"]

        source.pop("summary_embedding", None)
        source.pop("title_embedding", None)

        fields_to_highlight = [
            "summary",
            "title",
            "authors",
            "APL",
            "CMT",
            "DSC",
            "MAT",
            "PRO",
            "PVL",
            "PUT",
            "SMT",
            "SPL",
        ]

        source = apply_highlight_markup(source, to_highlight, fields_to_highlight)

        filtered_papers.append(source)

    return inflated, filtered_papers, total


def handle_regular_search(
    quer: dict,
    num_results: int,
    page: int,
    sort: str,
    sorting: str,
) -> tuple:
    # searching index
    results = client.search(
        query=quer,
        size=num_results,
        from_=(page - 1) * num_results,
        sort=[{"date": {"order": sort}}]
        if (sorting == "Most-Recent" or sorting == "Oldest-First")
        else None,
        index=INDEX,
    )

    to_highlight = bool_expression_to_dict(quer)

    # no results, return Nones
    if results["hits"]["hits"] == []:
        return None, None, None

    # getting data, if highlights to be made, add those
    filtered_papers = []
    for hit in results["hits"]["hits"]:
        source = hit["_source"]

        source.pop("summary_embedding", None)
        source.pop("title_embedding", None)

        fields_to_highlight = [
            "summary",
            "title",
            "authors",
            "APL",
            "CMT",
            "DSC",
            "MAT",
            "PRO",
            "PVL",
            "PUT",
            "SMT",
            "SPL",
        ]

        source = apply_highlight_markup(source, to_highlight, fields_to_highlight)

        filtered_papers.append(source)

    return -1, filtered_papers, results["hits"]["total"]["value"]


@app.route("/api/papers", methods=["POST"])
def papers() -> tuple[Response, int]:
    try:
        # parsing req
        page, num_results, sorting, start_date, end_date, searches = parse_request(
            request
        )

        # returning None for invalid req
        sort: str | None = req_validation(page, num_results, sorting)
        if sort is None:
            logging.error("Request failed to validate")
            return jsonify(None), 500

        # constructing/querying cache
        cache_key: str = make_cache_key(
            [
                json.dumps(searches),
                sorting,
                f"{page}",
                f"{num_results}",
                f"{start_date}",
                f"{end_date}",
            ]
        )
        if redis_success:
            cached: dict | None = get_cached_results(cache_key)
            if cached:
                return jsonify(
                    {
                        "papers": cached[0],
                        "total": cached[1],
                        "inflated": cached[2],
                    }
                ), 200

        # getting size of index and how to sort
        size: int = client.count(index=INDEX)["count"]

        if sorting == "Most-Recent" or sorting == "Oldest-First":
            p_sort: Sequence[Mapping | str] = [{"date": {"order": sort}}, "_score"]
        elif sorting == "Most-Relevant":
            p_sort = [{"_score": {"order": sort}}]

        # boolean search query
        all_query, quer, vector_field, vector_query = handle_bool_searching(
            searches, start_date, end_date, sorting
        )
        if all_query is None or quer is None:
            gunicorn_logger.error("Failed to bool search")
            return jsonify(None), 500

        # which type of search
        if vector_field is None or vector_query is None or all_query:
            gunicorn_logger.info("Regular search")
            inflated, filtered_papers, total = handle_regular_search(
                quer,
                num_results,
                page,
                sort,
                sorting,
            )
        else:
            gunicorn_logger.info("Vector search")
            inflated, filtered_papers, total = handle_vector_search(
                num_results,
                vector_field,
                vector_query,
                quer,
                page,
                p_sort,
                size,
            )

        if inflated is None or filtered_papers is None or total is None:
            gunicorn_logger.error("No hits")
            return jsonify(None), 500

        # cache and return, else error
        if filtered_papers:
            cache_results(cache_key, (filtered_papers, total, inflated))

            return jsonify(
                {
                    "papers": filtered_papers,
                    "total": total,
                    "inflated": inflated,
                }
            ), 200
        else:
            return jsonify({"error": "No results found"}), 404
    except Exception as e:
        gunicorn_logger.exception(e)
        return jsonify(None), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
