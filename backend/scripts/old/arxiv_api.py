import argparse
import json
import logging
import math
import os
import time
import urllib.request as libreq
from argparse import Namespace

import feedparser  # type: ignore
import requests
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from feedparser import FeedParserDict
from sentence_transformers import SentenceTransformer  # type: ignore

program_name: str = """
add_papers.py
"""
program_usage: str = """
add_papers.py [options] -i ITER -a AMT
"""
program_description: str = """description:
This is a python script to upload a specified number of documents to an elasticsearch
database from arXiv
"""
program_epilog: str = """ 
Higher values for amount and iterations are more likely to be rate limited
"""
program_version: str = """
Version 2.3.1 2024-06-01
Created by Vikram Penumarti
"""

load_dotenv()
LBNLP_URL: str | None = os.getenv("LBNLP_URL")
DOCKER: str | None = os.getenv("DOCKER")

API_KEY: str | None = os.getenv("API_KEY")
ES_URL: str | None = os.getenv("ES_URL")
INDEX: str = os.getenv("INDEX", "")
MODELS_API_KEY: str | None = os.getenv("MODELS_API_KEY")
CERT_PATH: str = os.getenv("CERT_PATH", "")

logging.basicConfig(level=logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.getLogger("elastic_transport").setLevel(logging.WARNING)
logging.getLogger("root").setLevel(logging.INFO)

model: SentenceTransformer = SentenceTransformer("all-MiniLM-L6-v2")


def set_parser(
    program_name: str,
    program_usage: str,
    program_description: str,
    program_epilog: str,
    program_version: str,
) -> argparse.ArgumentParser:
    parser: argparse.ArgumentParser = argparse.ArgumentParser(
        prog=program_name,
        usage=program_usage,
        description=program_description,
        epilog=program_epilog,
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "-i",
        "--iter",
        required=False,
        default=40,
        type=int,
        help="[Optional] Number of iterations of document uploads to perform (min 1)\nDefault: 40",
    )
    parser.add_argument(
        "-a",
        "--amt",
        required=False,
        default=50,
        type=int,
        help="[Optional] Number of papers to fetch from arXiv (max 2000, min 1)\nDefault: 50",
    )
    parser.add_argument(
        "-b",
        "--batch-size",
        required=False,
        default=50,
        type=int,
        help="[Optional] Batch size of documents to be annotated at once\nDefault: 50",
    )
    parser.add_argument(
        "-s",
        "--sleep-between-calls",
        type=int,
        required=False,
        default=15,
        help="[Optional] Sleep time (in seconds) between API calls to arXiv\nDefault: 15",
    )
    parser.add_argument(
        "-r",
        "--sleep-after-rate-limit",
        type=int,
        required=False,
        default=300,
        help="[Optional] Sleep time (in seconds) after hitting rate limit before making next API call\nDefault: 300",
    )
    parser.add_argument(
        "-d",
        "--drop-batches",
        required=False,
        default=False,
        action="store_true",
        help="[Optional] Enabling flag does not upload an iteration of papers if all the batches do not successfully complete\nDefault: False",
    )
    parser.add_argument(
        "-o",
        "--output",
        required=False,
        type=str,
        help="[Optional] Location of file to output Elasticsearch insert command. Script run with this will not upload any documents and instead append to a file.",
    )
    parser.add_argument(
        "-n",
        "--no-es",
        required=False,
        default=False,
        action="store_true",
        help="[Optional] Enabling flag makes sure this script does not connect to Elasticsearch\nDefault: False",
    )
    parser.add_argument(
        "--start",
        required=False,
        type=int,
        help="[Optional] Which location in ArXiv to start at\nDefault: Documents in Elasticsearch",
    )
    parser.add_argument(
        "-e",
        "--exit",
        required=False,
        default=False,
        action="store_true",
        help="[Optional] Exits on first ArXiv rate limit\nDefault: False",
    )
    parser.add_argument(
        "--ignore-dups",
        required=False,
        default=False,
        action="store_true",
        help="[Optional] Still upload duplicate papers",
    )
    parser.add_argument("-v", "--version", action="version", version=program_version)

    return parser


def sleep_with_timer(seconds: int) -> None:
    for remaining in range(seconds, 0, -1):
        print(f"INFO:root:Resuming in {remaining} seconds...", end="\r", flush=True)
        time.sleep(1)
    logging.info("\nResuming now...")


def findInfo(
    start: int,
) -> tuple[list[dict], bool]:
    search_query: str = "all:superconductivity"
    paper_list: list[dict] = []
    dups: int = 0

    i: int = 0
    while True:
        url: str = f"http://export.arxiv.org/api/query?search_query={search_query}&start={start}&max_results={amount}"

        logging.info(f"Searching arXiv for {search_query}")

        try:
            with libreq.urlopen(url) as response:
                content: bytes = response.read()
        except Exception as e:
            logging.error(f"Error fetching data from arXiv: {e}")
            exit()

        feed: FeedParserDict = feedparser.parse(content)

        if len(feed.entries) == 0:
            if rate_exit:
                logging.error("Rate limited, and exit flag enabled, exiting program")
                exit()

            if i == 2:
                logging.error(
                    "Rate limited three times in a row. Consider increasing wait time or adjusting query."
                )
                logging.error("Exiting program")
                exit()

            logging.warning(
                f"Rate limited. Sleeping for {sleep_after_rate_limit} seconds"
            )
            sleep_with_timer(sleep_after_rate_limit)
            i += 1
            continue

        summaries: list[str] = []
        paper_dicts: list[dict] = []

        for entry in feed.entries:
            paper_dict: dict = {
                "id": entry.id.split("/abs/")[-1].replace("/", "-"),
                "title": entry.title,
                "links": [link["href"] for link in entry.get("links")],
                "summary": entry.get("summary"),
                "date": int(time.strftime("%Y%m%d", entry.get("published_parsed"))),
                "updated": int(time.strftime("%Y%m%d", entry.get("updated_parsed"))),
                "categories": [category["term"] for category in entry.get("tags")],
                "authors": [author["name"] for author in entry.get("authors")],
                "doi": entry.get("arxiv_doi"),
                "journal_ref": entry.get("arxiv_journal_ref"),
                "comments": entry.get("arxiv_comment"),
                "primary_category": entry.get("arxiv_primary_category").get("term"),
            }

            if not no_es:
                bad = client.options(ignore_status=[404]).get(
                    index=INDEX, id=paper_dict["id"]
                )
                exists = bad.get("found")
                if exists is True and not ignore_dups:
                    logging.info("Duplicate paper found")
                    dups += 1
                    continue

            summaries.append(paper_dict["summary"])
            paper_dicts.append(paper_dict)

        logging.info("Fetched papers, starting annotations")

        num_batches: int = math.ceil(len(summaries) / batch_size)

        all_annotations: list[dict] = []
        interrupted: bool = False

        batch_num: int = 0

        while batch_num < num_batches:
            batch_start: int = batch_num * batch_size
            batch_end: int = batch_start + batch_size

            batch_summaries: list[str] = summaries[batch_start:batch_end]
            batch_paper_dicts: list[dict] = paper_dicts[batch_start:batch_end]

            try:
                annotations_response: requests.Response = requests.post(
                    f"{LBNLP_URL}/annotate/matbert",
                    json={"docs": batch_summaries},
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {MODELS_API_KEY}",
                    },
                    verify=CERT_PATH,
                )
            except Exception:
                if not drop_batches and batch_size >= amount:
                    logging.error(
                        "Batch did not successfully complete and current payload is empty, exiting"
                    )
                    exit()

                elif not drop_batches:
                    interrupted = True
                    logging.warning(
                        "Batch did not successfully complete, uploading current documents"
                    )
                    break

                logging.error(
                    "Batch did not successfully complete, dropping all batches\nTo upload partial iterations, please remove the --drop-batches flag"
                )
                exit()

            if annotations_response.status_code == 200:
                logging.info(
                    f"Batch {batch_num + 1}/{num_batches} annotation succeeded"
                )
                batch_annotations = annotations_response.json().get("annotation", [])
            else:
                logging.error(
                    f"Batch {batch_num + 1}/{num_batches} annotation failed: "
                    f"{annotations_response.status_code}, {annotations_response.text}"
                )
                batch_annotations = [{}] * len(batch_paper_dicts)

            all_annotations.extend(batch_annotations)

            batch_num += 1

        for paper_dict, annotation in zip(paper_dicts, all_annotations):
            paper_dict["APL"] = annotation.get("APL", [])
            paper_dict["CMT"] = annotation.get("CMT", [])
            paper_dict["DSC"] = annotation.get("DSC", [])
            paper_dict["MAT"] = annotation.get("MAT", [])
            paper_dict["PRO"] = annotation.get("PRO", [])
            paper_dict["PVL"] = annotation.get("PVL", [])
            paper_dict["PUT"] = annotation.get("PUT", [])
            paper_dict["SMT"] = annotation.get("SMT", [])
            paper_dict["SPL"] = annotation.get("SPL", [])

            paper_list.append(paper_dict)

        logging.info(f"Collected papers {start} - {start + amount - dups}")
        return replaceNullValues(paper_list), interrupted


def replaceNullValues(papers_list: list[dict]) -> list[dict]:
    for paper_dict in papers_list:
        for key, val in paper_dict.items():
            if not val:
                paper_dict[key] = "N/A"

    return papers_list


def createNewIndex(delete: bool, index: str) -> None:
    if client.indices.exists(index=index) and delete:
        client.indices.delete(index=index)
    if not client.indices.exists(index=index):
        client.indices.create(
            index=index,
            body={
                "mappings": {
                    "properties": {
                        "embedding": {"type": "dense_vector"},
                    },
                },
                "settings": {
                    "number_of_replicas": 0,
                },
            },
        )
    else:
        logging.info("Index already exists and no deletion specified")


def getEmbedding(text: str):  # type: ignore
    return model.encode(text)


def insert_documents(documents: list[dict], index: str):
    logging.info("Starting Insertion")
    operations: list[dict] = []
    operations_string: str = ""
    for document in documents:
        summary_embedding = (
            getEmbedding(document["summary"]).tolist()
            if output
            else getEmbedding(document["summary"])
        )
        title_embedding = (
            getEmbedding(document["title"]).tolist()
            if output
            else getEmbedding(document["title"])
        )
        create_action = {"create": {"_index": index, "_id": document["id"]}}
        document_action = {
            **document,
            "summary_embedding": summary_embedding,
            "title_embedding": title_embedding,
        }

        if output:
            operations_string += (
                f"{json.dumps(create_action)}\n{json.dumps(document_action)}\n"
            )
        else:
            operations.append(create_action)
            operations.append(document_action)

    if output:
        with open(output, "a") as file:
            file.write(operations_string)
        logging.info("Successfully wrote to file")
    elif not no_es:
        client.bulk(operations=operations)
        logging.info("Successfully Completed Insertion")


def upload_to_es() -> None:
    if not no_es:
        start: int = client.count(index=INDEX)["count"]
    else:
        start = 0

    if arxiv_start:
        start = arxiv_start

    logging.info(f"Total documents in DB, start: {start}\n")

    for i in range(iterations):
        docs, interrupted = findInfo(start)
        if len(docs) == 0:
            logging.error("No docs to upload, exiting")
            exit()

        insert_documents(docs, INDEX)
        logging.info(f"Uploaded documents {start} - {start + amount}")
        start += amount

        logging.info(f"Iteration {i+1}/{iterations} complete")
        logging.info(f"Sleeping for {sleep_between_calls} seconds")
        sleep_with_timer(sleep_between_calls)

        if interrupted:
            logging.warning("Exiting due to all batches not successfully completing")
            exit()

    logging.info(f"Total documents in DB, finish: {start}\n")


def main() -> None:
    if not no_es:
        createNewIndex(False, INDEX)

    if amount > 2000 or amount < 1 or iterations < 1:
        raise Exception(
            "Flag error: please ensure your flag values match the specifications"
        )

    upload_to_es()


if __name__ == "__main__":
    parser: argparse.ArgumentParser = set_parser(
        program_name,
        program_usage,
        program_description,
        program_epilog,
        program_version,
    )
    args: Namespace = parser.parse_args()

    amount: int = args.amt
    iterations: int = args.iter
    batch_size: int = args.batch_size
    sleep_after_rate_limit: int = args.sleep_after_rate_limit
    sleep_between_calls: int = args.sleep_between_calls
    drop_batches: bool = args.drop_batches
    output: str = args.output
    no_es: str = args.no_es
    arxiv_start: int = args.start
    rate_exit: bool = args.exit
    ignore_dups: bool = args.ignore_dups

    client: Elasticsearch = Elasticsearch(ES_URL, api_key=API_KEY, ca_certs=CERT_PATH)

    main()
