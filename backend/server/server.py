import json
import math
import os
from datetime import datetime
from typing import Mapping, Sequence

import redis
from dotenv import load_dotenv
from elastic_transport import ObjectApiResponse
from elasticsearch import Elasticsearch, NotFoundError
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from redis import Redis
from sentence_transformers import SentenceTransformer  # type: ignore

load_dotenv()
API_KEY: str | None = os.getenv("API_KEY")
ES_URL: str | None = os.getenv("ES_URL")
DOCKER: str | None = os.getenv("DOCKER")

client: Elasticsearch = Elasticsearch(ES_URL, api_key=API_KEY, ca_certs="./ca.crt")

app: Flask = Flask(__name__)
CORS(app)
model: SentenceTransformer = SentenceTransformer("all-MiniLM-L6-v2")


def get_embedding(text: str) -> list[int]:
    return model.encode(text)


@app.route("/", methods=["GET"])
def test():
    return jsonify({"message": "Success"}), 200


# /api/papers/${paperId}
@app.route("/api/papers/<paper_id>", methods=["GET"])
def get_paper(paper_id: str) -> tuple[Response, int] | Response:
    results: ObjectApiResponse = client.get(index="search-papers-meta", id=paper_id)
    paper: dict = results["_source"]
    if paper:
        return jsonify(paper)
    else:
        return jsonify({"error": "No results found"}), 404


redis_host = "redis" if DOCKER == "true" else "localhost"
redis_client: Redis = redis.StrictRedis(
    host=redis_host, port=6379, db=0, decode_responses=True
)


def get_cached_results(cache_key: str) -> dict | None:
    cached_data = redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)  # type: ignore
    return None


def cache_results(cache_key: str, data: tuple[list[dict], int, dict]) -> None:
    redis_client.setex(cache_key, 3600, json.dumps(data))


def make_cache_key(
    query: str,
    sorting: str,
    page: int,
    num_results: int,
    term: str,
    start_date: int,
    end_date: int,
    parsed_results: dict,
) -> str:
    key: str = f"{query}_{sorting}_{page}_{num_results}_{term}_{start_date}_{end_date}_{parsed_results['must']}_{parsed_results['not']}_{parsed_results['or']}"
    return key


def get_excluded_ids(cache_key: str) -> list[str]:
    split_key: list[str] = cache_key.split("_")
    excluded_ids: list[str] = []

    for i in range(1, 501):
        split_key[2] = str(i)
        new_cache_key: str = "_".join(split_key)
        cached: dict | None = get_cached_results(new_cache_key)
        if cached:
            id: str = cached[0]["id"]
            excluded_ids.append(id)

    return excluded_ids


@app.route("/api/materials/<property>/<value>", methods=["POST"])
def get_materials(property: str, value: str) -> Response:
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
    except Exception:
        return jsonify(None)

    if sorting == "Most-Recent" or sorting == "Most-Relevant":
        sort: str = "desc"
    elif sorting == "Oldest-First":
        sort = "asc"
    else:
        return jsonify(None)

    property = property.lower()

    valid_properties: dict = {
        "material": "MAT",
        "description": "DSC",
        "symmetry": "SPL",
        "synthesis": "SMT",
        "characterization": "CMT",
        "property": "PRO",
        "application": "APL",
    }

    if property not in valid_properties:
        return jsonify(None)

    cache_key = (
        f"{property}_{value}_{page}_{num_results}_{sorting}_{start_date}_{end_date}"
    )
    cached_data = redis_client.get(cache_key)
    if cached_data:
        data = json.loads(cached_data)  # type: ignore
        return jsonify({"papers": data[0], "total": data[1]})

    prop: str = valid_properties[property]
    try:
        query = {
            "bool": {
                "must": [{"match": {prop: {"query": value, "fuzziness": "AUTO"}}}],
                "filter": [{"range": {"date": {"gte": start_date, "lte": end_date}}}],
            }
        }
        if value == "all":
            query["bool"]["must"] = {"match_all": {}}

        response: ObjectApiResponse = client.search(
            index="search-papers-meta",
            query=query,
            size=num_results,
            from_=(page - 1) * num_results,
            sort=[{"date": {"order": sort}}]
            if (sorting == "Most-Recent" or sorting == "Oldest-First")
            else None,
        )
        total: int = response["hits"]["total"]["value"]
        papers: list[dict] = [
            paper["_source"]
            for paper in response["hits"]["hits"]
            if paper["_source"]["date"] > start_date
            and paper["_source"]["date"] < end_date
        ]

        redis_client.setex(cache_key, 3600, json.dumps((papers, total)))

        return jsonify({"papers": papers, "total": total})

    except Exception as e:
        print(e)
        return jsonify(None)


# cache.clear()
# print("Cleared cache")
# redis-cli FLUSHALL # command on cli to clear cache


# fuzzy search for category, authors
# vector-based search for title, summary
# /api/papers
@app.route("/api/papers/<term>/<query>", methods=["POST"])
def papers(term: str, query: str) -> tuple[Response, int] | Response:
    try:
        data: dict = request.get_json()
        page: int = int(data.get("page", 0))
        num_results: int = int(data.get("results", 0))
        sorting: str = str(data.get("sorting", ""))
        pages: int = 30
        parsed_input: dict = dict(data.get("parsedInput", []))

        must_v: list[str] = parsed_input["must"]
        or_v: list[str] = parsed_input["or"]
        not_v: list[str] = parsed_input["not"]

        today: datetime = datetime.today()
        formatted_date: str = today.strftime("%Y%m%d")
        date: str = str(data.get("date", f"00000000-{formatted_date}"))
        start_date: int = int(date.split("-")[0])
        end_date: int = int(date.split("-")[1])
    except Exception:
        return jsonify(None)

    if page < 0:
        return jsonify(None)
    if num_results < 0 or (
        num_results != 10
        and num_results != 20
        and num_results != 50
        and num_results != 100
    ):
        return jsonify(None)

    if term == "Abstract":
        field: str = "summary_embedding"
    elif term == "Title":
        field = "title_embedding"
    elif term == "Category":
        field = "categories"
    elif term == "Authors":
        field = "authors"
    else:
        return jsonify(None)

    cache_key: str = make_cache_key(
        query,
        sorting,
        page,
        num_results,
        term,
        start_date,
        end_date,
        parsed_input,
    )
    cached: dict | None = get_cached_results(cache_key)
    if cached:
        return jsonify({"papers": cached[0], "total": cached[1], "accuracy": cached[2]})

    if sorting == "Most-Recent" or sorting == "Most-Relevant":
        sort: str = "desc"
    elif sorting == "Oldest-First":
        sort = "asc"
    else:
        return jsonify(None)

    knn_search: bool = False

    # size: int = client.search(query={"match_all": {}}, index="search-papers-meta")[
    #     "hits"
    # ]["total"]["value"]
    try:
        size: int = client.count(index="search-papers-meta")["count"]
    except NotFoundError:
        return jsonify(None)

    if pages * num_results > size:
        pages = math.ceil(size / num_results)

    k: int = page * num_results
    if k > size:
        k = size

    if sorting == "Most-Recent" or sorting == "Oldest-First":
        p_sort: Sequence[Mapping | str] = [{"date": {"order": sort}}, "_score"]
    elif sorting == "Most-Relevant":
        p_sort = [{"_score": {"order": sort}}]

    if query == "all" or field == "summary_embedding" or field == "title_embedding":
        tag = "summary" if field == "summary_embedding" else "title"
        must_clause = (
            [
                {"match": {tag: {"query": label, "fuzziness": "AUTO"}}}
                for label in must_v
            ]
            if must_v
            else {"match_all": {}}
        )
        should_clause = (
            [{"match": {tag: {"query": label, "fuzziness": "AUTO"}}} for label in or_v]
            if or_v
            else []
        )
        must_not_clause = (
            [{"match": {tag: {"query": label, "fuzziness": "AUTO"}}} for label in not_v]
            if not_v
            else []
        )
    else:
        must_clause = [{"match": {field: {"query": query, "fuzziness": "AUTO"}}}]

        if must_v:
            must_clause.extend(
                [
                    {"match": {field: {"query": label, "fuzziness": "AUTO"}}}
                    for label in must_v
                ]
            )

        should_clause = (
            [
                {"match": {field: {"query": label, "fuzziness": "AUTO"}}}
                for label in or_v
            ]
            if or_v
            else []
        )
        must_not_clause = (
            [
                {"match": {field: {"query": label, "fuzziness": "AUTO"}}}
                for label in not_v
            ]
            if not_v
            else []
        )

    # excluded_ids: list[str] = get_excluded_ids(
    #     cache_key
    # )  # can leverage excluding ids for pagination
    # must_not_pre: dict = {"ids": {"values": excluded_ids}}
    # print(excluded_ids)

    quer = {
        "bool": {
            "must": must_clause,
            "should": should_clause,
            "must_not": must_not_clause,
            "filter": {
                "range": {
                    "date": {
                        "gte": start_date,
                        "lte": end_date,
                    }
                }
            },
        }
    }

    if query == "all" or field == "authors" or field == "categories":
        knn_search = False
        try:
            results: ObjectApiResponse = client.search(
                query=quer,
                size=num_results,
                from_=(page - 1) * num_results,
                sort=[{"date": {"order": sort}}]
                if (sorting == "Most-Recent" or sorting == "Oldest-First")
                else None,
                index="search-papers-meta",
            )
        except Exception:
            return jsonify(None)
        if results["hits"]["hits"] == []:
            return jsonify(None)

    elif field == "summary_embedding" or field == "title_embedding":
        if size < num_results:
            size = num_results
        knn_search = True
        try:
            results = client.search(
                knn={
                    "field": field,
                    "query_vector": get_embedding(query),
                    "num_candidates": size if size < 10000 else 10000,
                    # "k": k,
                    "k": num_results,
                    # "filter": must_not_pre,
                },
                query=quer,
                from_=0,  # consider changing to (page-1)*num_results
                size=page * num_results,
                sort=p_sort,
                index="search-papers-meta",
            )
        except Exception:
            return jsonify(None)
        if results["hits"]["hits"] == []:
            return jsonify(None)

    hits: dict = results["hits"]["hits"]
    papers: list[dict] = []
    accuracy: dict = {}

    if not knn_search:
        for hit in hits:
            papers.append(hit["_source"])

    try:
        total: int = client.search(
            query=quer,
            size=num_results,
            from_=(page - 1) * num_results,
            sort=[{"date": {"order": sort}}],
            index="search-papers-meta",
        )["hits"]["total"]["value"]
    except Exception:
        return jsonify(None)

    if total > num_results * pages and knn_search:
        total = num_results * pages

    if knn_search:
        papers = hits[(page - 1) * num_results :]
        filtered_papers: list[dict] = [
            paper["_source"]
            for paper in papers
            if paper["_source"]["date"] > start_date
            and paper["_source"]["date"] < end_date
        ]
        filtered_papers = sorted(filtered_papers, key=lambda x: x["id"])
        for hit in hits:
            if not hit["_score"]:
                break
            accuracy[hit["_source"]["id"]] = float(str(hit["_score"])[1:])
    else:
        filtered_papers = list(papers)

    if filtered_papers:
        cache_results(cache_key, (filtered_papers, total, accuracy))

        return jsonify(
            {"papers": filtered_papers, "total": total, "accuracy": accuracy}
        )
    else:
        return jsonify({"error": "No results found"}), 404


if __name__ == "__main__":
    # app.run(debug=True, port=8080)
    app.run(host="0.0.0.0", port=8080, debug=True)
