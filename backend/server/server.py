import json
import os
from datetime import datetime
from typing import Mapping, Sequence

import redis
import redis.exceptions
from dotenv import load_dotenv
from elasticsearch import Elasticsearch, NotFoundError
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
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


redis_host = "redis" if DOCKER == "true" else "localhost"
try:
    redis_client: Redis = redis.StrictRedis(
        host=redis_host, port=6379, db=0, decode_responses=True
    )
    redis_client.ping()
    redis_success = True
except redis.exceptions.ConnectionError:
    redis_success = False


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


@app.route("/api/materials", methods=["POST"])
def get_materials() -> tuple[Response, int]:
    # MAT: material
    # DSC: description of sample
    # SPL: symmetry or phase label
    # SMT: synthesis method
    # CMT: characterization method
    # PRO: property - may also include PVL (property value) or PUT (property unit)
    # APL: application
    try:
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
    except Exception as e:
        print(e)
        return jsonify(None), 500

    if page < 0:
        print("Page less than 0, returning None")
        return jsonify(None), 500
    if num_results < 0 or (
        num_results != 10
        and num_results != 20
        and num_results != 50
        and num_results != 100
    ):
        print("num_results invalid, returning None")
        return jsonify(None), 500

    if sorting == "Most-Recent" or sorting == "Most-Relevant":
        sort: str = "desc"
    elif sorting == "Oldest-First":
        sort = "asc"
    else:
        print("sorting invalid, returning None")
        return jsonify(None), 500

    valid_properties: dict = {
        "material": "MAT",
        "description": "DSC",
        "symmetry": "SPL",
        "synthesis": "SMT",
        "characterization": "CMT",
        "property": "PRO",
        "application": "APL",
    }

    for search in searches:
        if search["field"].lower() not in valid_properties:
            print("search invalid, returning None")
            return jsonify(None), 500

    cache_key: str = make_cache_key(
        [
            json.dumps(searches),
            f"{page}",
            f"{num_results}",
            sorting,
            f"{start_date}",
            f"{end_date}",
        ]
    )
    cached_data: dict | None = get_cached_results(cache_key)
    if cached_data:
        return jsonify({"papers": cached_data[0], "total": cached_data[1]}), 200

    try:
        must_clause: list[dict] = []
        not_clause: list[dict] = []
        or_clause: list[dict] = []
        query: dict | None = None

        for search in searches:
            if search["term"] == "all":
                query = {
                    "bool": {
                        "must": [{"match_all": {}}],
                        "filter": [
                            {"range": {"date": {"gte": start_date, "lte": end_date}}}
                        ],
                    }
                }
                break

            match_clause: dict = {
                "match": {
                    valid_properties[search["field"].lower()]: {
                        "query": search["term"],
                        "fuzziness": "AUTO",
                    }
                }
            }
            if search["operator"] == "" or search["operator"] == "AND":
                must_clause.append(match_clause)
            if search["operator"] == "" or search["operator"] == "NOT":
                not_clause.append(match_clause)
            if search["operator"] == "" or search["operator"] == "OR":
                or_clause.append(match_clause)

        if query is None:
            query = {
                "bool": {
                    "must": must_clause,
                    "should": or_clause,
                    "must_not": not_clause,
                    "filter": [
                        {"range": {"date": {"gte": start_date, "lte": end_date}}}
                    ],
                }
            }

        response = client.search(
            index=INDEX,
            query=query,
            size=num_results,
            from_=(page - 1) * num_results,
            sort=[{"date": {"order": sort}}]
            if (sorting == "Most-Recent" or sorting == "Oldest-First")
            else [],
        )
        total: int = response["hits"]["total"]["value"]
        papers: list[dict] = [
            paper["_source"]
            for paper in response["hits"]["hits"]
            if paper["_source"]["date"] > start_date
            and paper["_source"]["date"] < end_date
        ]

        cache_results(cache_key, (papers, total))

        return jsonify({"papers": papers, "total": total}), 200

    except Exception as e:
        print(e)
        return jsonify(None), 500


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


# fuzzy search for category, authors
# vector-based search for title, summary
# /api/papers
@app.route("/api/papers", methods=["POST"])
def papers() -> tuple[Response, int]:
    try:
        data: dict = request.get_json()
        page: int = int(data.get("page", 0))
        num_results: int = int(data.get("results", 0))
        sorting: str = str(data.get("sorting", ""))

        today: datetime = datetime.today()
        formatted_date: str = today.strftime("%Y%m%d")
        date: str = str(data.get("date", f"00000000-{formatted_date}"))
        start_date: int = int(date.split("-")[0])
        end_date: int = int(date.split("-")[1])

        searches: list[dict] = list(data.get("searches", []))

    except Exception as e:
        print(e)
        return jsonify(None), 500

    if page < 0:
        print("Pages less than 0, returning None")
        return jsonify(None), 500
    if num_results < 0 or (
        num_results != 10
        and num_results != 20
        and num_results != 50
        and num_results != 100
    ):
        print("num_results invalid, returning None")
        return jsonify(None), 500

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
                    "accuracy": cached[2],
                    "inflated": cached[3],
                }
            ), 200

    if sorting == "Most-Recent" or sorting == "Most-Relevant":
        sort: str = "desc"
    elif sorting == "Oldest-First":
        sort = "asc"
    else:
        print("sorting invalid, returning None")
        return jsonify(None), 500

    knn_search: bool = False

    try:
        size: int = client.count(index=INDEX)["count"]
    except NotFoundError as e:
        print(e)
        return jsonify(None), 500

    if sorting == "Most-Recent" or sorting == "Oldest-First":
        p_sort: Sequence[Mapping | str] = [{"date": {"order": sort}}, "_score"]
    elif sorting == "Most-Relevant":
        p_sort = [{"_score": {"order": sort}}]

    must_clause: list[dict] = []
    not_clause: list[dict] = []
    or_clause: list[dict] = []
    quer: dict | None = None
    vector_field: str | None = None
    vector_query: str | None = None
    all_query: bool | None = None

    for search in searches:
        if search["term"] == "all":
            all_query = True
            quer = {
                "bool": {
                    "must": [{"match_all": {}}],
                    "filter": [
                        {"range": {"date": {"gte": start_date, "lte": end_date}}}
                    ],
                }
            }
            break

        if search["isVector"]:
            if search["field"].lower() == "abstract":
                vector_field = "summary_embedding"
            else:
                vector_field = "title_embedding"
            vector_query = search["term"].lower()

        if search["field"].lower() == "abstract":
            search["field"] = "summary"
        if search["field"].lower() == "category":
            search["field"] = "categories"

        match_clause: dict = {
            "match": {
                search["field"].lower(): {
                    "query": search["term"],
                    "fuzziness": "AUTO",
                }
            }
        }
        if search["operator"] == "" or search["operator"] == "AND":
            must_clause.append(match_clause)
        if search["operator"] == "" or search["operator"] == "NOT":
            not_clause.append(match_clause)
        if search["operator"] == "" or search["operator"] == "OR":
            or_clause.append(match_clause)

    if quer is None:
        quer = {
            "bool": {
                "must": must_clause,
                "should": or_clause,
                "must_not": not_clause,
                "filter": [{"range": {"date": {"gte": start_date, "lte": end_date}}}],
            }
        }

    highlight: dict = {
        "pre_tags": ["<mark>"],
        "post_tags": ["</mark>"],
        "fields": {
            "summary": {
                "type": "unified",
                "fragment_size": 100,
                "number_of_fragments": 2,
            },
            "title": {
                "type": "unified",
                "fragment_size": 50,
                "number_of_fragments": 1,
            },
            "authors": {
                "type": "unified",
                "fragment_size": 50,
                "number_of_fragments": 1,
            },
        },
    }

    if vector_field is None or vector_query is None:
        knn_search = False
        try:
            results = client.search(
                query=quer,
                size=num_results,
                from_=(page - 1) * num_results,
                highlight=highlight,
                sort=[{"date": {"order": sort}}]
                if (sorting == "Most-Recent" or sorting == "Oldest-First")
                else None,
                index=INDEX,
            )
        except Exception as e:
            print(e)
            return jsonify(None), 500
        if results["hits"]["hits"] == []:
            print("No hits")
            return jsonify(None), 500
    else:
        if size < num_results:
            size = num_results
        knn_search = True
        try:
            results = client.search(
                knn={
                    "field": vector_field,
                    "query_vector": get_embedding(vector_query),
                    "num_candidates": size if size < 10000 else 10000,
                    "k": num_results,
                },
                query=quer,
                highlight=highlight,
                from_=0,  # consider changing to (page-1)*num_results
                size=page * num_results,
                sort=p_sort,
                index=INDEX,
            )
        except Exception as e:
            print(e)
            return jsonify(None), 500
        if results["hits"]["hits"] == []:
            print("No hits")
            return jsonify(None), 500

    hits: dict = results["hits"]["hits"]
    accuracy: dict = {}

    total: int = results["hits"]["total"]["value"]
    inflated: int = -1
    if knn_search and all_query is None:
        try:
            if vector_field == "summary_embedding":
                quer_field = "summary"
            elif vector_field == "title_embedding":
                quer_field = "title"

            quer["bool"]["must"] = [
                {"match": {quer_field: {"query": vector_query, "fuzziness": "AUTO"}}}
            ]
            total = client.search(
                query=quer,
                size=num_results,
                from_=(page - 1)
                * num_results,  # try with this, if different total for every page, switch to line below
                # from_=0,
                # sort=[{"date": {"order": sort}}],
                index=INDEX,
            )["hits"]["total"]["value"]
        except Exception as e:
            print(e)
            return jsonify(None), 500

        if total < 100 and size >= 100:
            inflated = total
            total = 100

        papers: list[dict] = hits[(page - 1) * num_results :]
        filtered_papers: list[dict] = []

        for paper in papers:
            source: dict = paper["_source"]
            source.pop("summary_embedding", None)
            source.pop("title_embedding", None)

            filtered_papers.append(source)

            if paper.get("_score") is not None:
                accuracy[source["id"]] = float(str(paper["_score"])[1:])
    else:
        filtered_papers = []
        for hit in hits:
            source = hit["_source"]
            highlight = hit.get("highlight", {})

            source["summary"] = highlight.get("summary", source.get("summary"))
            source["title"] = highlight.get("title", source.get("title"))
            source["authors"] = highlight.get("authors", source.get("authors"))

            filtered_papers.append(source)

    if filtered_papers:
        cache_results(cache_key, (filtered_papers, total, accuracy, inflated))

        return jsonify(
            {
                "papers": filtered_papers,
                "total": total,
                "accuracy": accuracy,
                "inflated": inflated,
            }
        ), 200
    else:
        return jsonify({"error": "No results found"}), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
