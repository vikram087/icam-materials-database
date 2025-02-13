import argparse
import json
import logging
import os

from dotenv import load_dotenv
from elasticsearch import Elasticsearch

program_name: str = """
db_to_file.py
"""
program_usage: str = """
db_to_file.py [options] -f FILE
"""
program_description: str = """description:
This is a python script to destructure an index into a file which can be used to recreate the index
"""
program_epilog: str = """ 
"""
program_version: str = """
Version 1.0.0 2025-02-04
Created by Vikram Penumarti
"""


load_dotenv()

logging.basicConfig(level=logging.INFO)

API_KEY: str | None = os.getenv("API_KEY")
ES_URL: str | None = os.getenv("ES_URL")
INDEX: str = os.getenv("INDEX") or ""
CERT_PATH: str = os.getenv("CERT_PATH", "")

client: Elasticsearch = Elasticsearch(ES_URL, api_key=API_KEY, ca_certs=CERT_PATH)


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
        "-f",
        "--file",
        required=False,
        default="db_output.ndjson",
        type=str,
        help="[Optional] File to output the commands to\nDefault: db_output.ndjson",
    )
    parser.add_argument("-v", "--version", action="version", version=program_version)

    return parser


def fetch_all_documents(index: str, output_file: str | None = None) -> str:
    logging.info(f"Fetching all documents from index: {index}")

    operations_string = ""
    batch_size = 1000

    response = client.search(
        index=index, scroll="2m", body={"size": batch_size, "query": {"match_all": {}}}
    )

    scroll_id = response["_scroll_id"]
    hits = response["hits"]["hits"]

    while hits:
        for hit in hits:
            doc_id = hit["_id"]
            source = hit["_source"]

            create_action = json.dumps({"index": {"_index": index, "_id": doc_id}})
            document_action = json.dumps(source)

            operations_string += f"{create_action}\n{document_action}\n"

        response = client.scroll(scroll_id=scroll_id, scroll="2m")
        scroll_id = response["_scroll_id"]
        hits = response["hits"]["hits"]

    if output_file:
        with open(output_file, "w") as file:
            file.write(operations_string)
        logging.info(f"Successfully wrote data to {output_file}")

    logging.info("Completed fetching and structuring documents")
    return operations_string


if __name__ == "__main__":
    parser: argparse.ArgumentParser = set_parser(
        program_name,
        program_usage,
        program_description,
        program_epilog,
        program_version,
    )
    args = parser.parse_args()

    file: str = args.file

    bulk_string = fetch_all_documents(INDEX, file)
    print(f"Formatted bulk operations written to: {file}")
