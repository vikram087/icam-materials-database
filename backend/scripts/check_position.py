#!/usr/bin/env python3

import argparse
import logging
import os
import urllib.request as libreq
from argparse import Namespace

import feedparser  # type: ignore
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

program_name: str = """
check_position.py
"""
program_usage: str = """
check_position.py [options]
"""
program_description: str = """description:
This script compares arXiv paper IDs to the IDs in an Elasticsearch index
and prints out any arXiv paper IDs that are NOT found in that index.
"""
program_epilog: str = """ 
"""
program_version: str = """
Version 1.0.0 2025-02-08
Created by Vikram Penumarti
"""

load_dotenv()
ES_URL: str | None = os.getenv("ES_URL")
API_KEY: str | None = os.getenv("API_KEY")
INDEX: str = os.getenv("INDEX", "")
CERT_PATH: str = os.getenv("CERT_PATH", "./ca.crt")

logging.basicConfig(level=logging.INFO)


def set_parser(
    name: str,
    usage: str,
    description: str,
    epilog: str,
    version: str,
) -> argparse.ArgumentParser:
    parser: argparse.ArgumentParser = argparse.ArgumentParser(
        prog=name,
        usage=usage,
        description=description,
        epilog=epilog,
        formatter_class=argparse.RawTextHelpFormatter,
    )

    parser.add_argument(
        "-q",
        "--query",
        type=str,
        default="all:superconductivity",
        help="[Optional] ArXiv search query.\nDefault: all:superconductivity",
    )
    parser.add_argument(
        "-i",
        "--iter",
        required=False,
        default=40,
        type=int,
        help="[Optional] Number of iterations to run this script (min 1)\nDefault: 40",
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
        "-s",
        "--start",
        required=False,
        default=0,
        type=int,
        help="[Optional] Which location in arXiv to start fetching from.\nDefault: 0",
    )
    parser.add_argument(
        "--sleep-between-calls",
        type=int,
        required=False,
        default=15,
        help="[Optional] Sleep time (in seconds) between repeated calls (if any).\nDefault: 15",
    )
    parser.add_argument(
        "-n",
        "--no-es",
        required=False,
        default=False,
        action="store_true",
        help="[Optional] If set, do not connect to Elasticsearch. Useful for testing.\nDefault: False",
    )
    parser.add_argument(
        "--index",
        required=False,
        type=str,
        default=INDEX,
        help=f"[Optional] Elasticsearch index to compare IDs against.\nDefault: {INDEX}",
    )
    parser.add_argument("-v", "--version", action="version", version=version)

    return parser


def connect_elasticsearch() -> Elasticsearch:
    if not ES_URL:
        raise ValueError("ES_URL not set in environment.")
    if not API_KEY:
        logging.warning("API_KEY not set. Attempting connection without API key...")

    client = Elasticsearch(
        ES_URL,
        api_key=API_KEY,
        ca_certs=CERT_PATH,
    )
    return client


def get_all_document_ids(index_name: str) -> set[str]:
    query_body: dict = {"match_all": {}}

    resp = client.search(index=index_name, query=query_body, size=10000)
    doc_ids = {hit["_id"] for hit in resp["hits"]["hits"]}

    return doc_ids


def fetch_arxiv_entries(search_query: str, start: int, max_results: int) -> list[str]:
    url: str = (
        f"http://export.arxiv.org/api/query?search_query={search_query}"
        f"&start={start}&max_results={max_results}"
    )
    logging.info(
        f"Fetching arXiv papers with query='{search_query}', start={start}, amt={max_results}"
    )

    try:
        with libreq.urlopen(url) as response:
            content: bytes = response.read()
    except Exception as e:
        logging.error(f"Error fetching data from arXiv: {e}")
        return []

    feed = feedparser.parse(content)
    if not feed.entries:
        logging.warning(
            "No entries found from arXiv (possibly rate-limited or no results)."
        )
        return []

    arxiv_ids: list[str] = []
    for entry in feed.entries:
        arxiv_id = entry.id.split("/abs/")[-1].replace("/", "-")
        arxiv_ids.append(arxiv_id)

    return arxiv_ids


def main(args: Namespace) -> None:
    if not args.no_es:
        # Check if index exists
        if not client.indices.exists(index=args.index):
            logging.error(f"Index '{args.index}' does not exist in Elasticsearch.")
            return

        existing_ids = get_all_document_ids(args.index)
        logging.info(f"Found {len(existing_ids)} document IDs in index '{args.index}'.")
    else:
        existing_ids = set()
        logging.info("--no-es flag set; skipping Elasticsearch connection.")

    start = args.start
    for i in range(args.iter):
        arxiv_ids = fetch_arxiv_entries(
            search_query=args.query,
            start=start,
            max_results=args.amt,
        )

        if not arxiv_ids:
            logging.info("No arXiv IDs were fetched; exiting.")
            return

        # Compare
        missing_ids = [
            arxiv_id for arxiv_id in arxiv_ids if arxiv_id not in existing_ids
        ]

        logging.info("Comparing arXiv IDs with Elasticsearch documents...")
        if missing_ids:
            logging.info(
                f"Out of {len(arxiv_ids)} fetched arXiv entries, "
                f"{len(missing_ids)} are NOT in the ES index, "
                f"Iteration: {i}"
            )

            print(", ".join(missing_ids))
        else:
            logging.info(
                "All fetched arXiv IDs appear to be in the Elasticsearch index."
            )

        start += args.amt


if __name__ == "__main__":
    parser: argparse.ArgumentParser = set_parser(
        program_name,
        program_usage,
        program_description,
        program_epilog,
        program_version,
    )
    args: Namespace = parser.parse_args()

    if not args.no_es:
        client = connect_elasticsearch()

    if args.iter < 1 or args.amt < 1 or args.amt > 2000:
        logging.error("Fix 'iter' or 'amt' flags ")
        exit()

    main(args)
