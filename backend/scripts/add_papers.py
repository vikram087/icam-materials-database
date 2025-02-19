import argparse
import json
import logging
import math
import os
import time
from argparse import Namespace
from xml.etree import ElementTree as ET

import requests
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from sentence_transformers import SentenceTransformer  # type: ignore

program_name: str = """
add_papers.py
"""
program_usage: str = """
add_papers.py [options]
"""
program_description: str = """description:
This is a python script to upload a specified number of documents to an elasticsearch
database from arXiv (via OAI-PMH bulk, instead of the usual API).
"""
program_epilog: str = """ 
"""
program_version: str = """
Version 1.0.0 2025-02-19
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


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
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
        default=2,
        type=int,
        help="[Optional] Number of times to fetch papers from bulk api (min 1)\nDefault: 2",
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
        "-s",
        "--skip-annotate",
        required=False,
        default=False,
        action="store_true",
        help="[Optional] Do not do NLP annotation\nDefault: False",
    )
    parser.add_argument(
        "--ignore-dups",
        required=False,
        default=False,
        action="store_true",
        help="[Optional] Still upload duplicate papers",
    )
    parser.add_argument(
        "--sleep-between-calls",
        type=int,
        required=False,
        default=5,
        help="[Optional] Sleep time (in seconds) between API calls to arXiv\nDefault: 5",
    )
    parser.add_argument(
        "--sleep-after-rate-limit",
        type=int,
        required=False,
        default=5,
        help="[Optional] Sleep time (in seconds) after hitting rate limit before making next API call\nDefault: 5",
    )
    parser.add_argument("-v", "--version", action="version", version=program_version)

    return parser


def sleep_with_timer(seconds: int) -> None:
    for remaining in range(seconds, 0, -1):
        logging.info(f"Resuming in {remaining} seconds...")
        time.sleep(1)
    logging.info("\nResuming now...")


def findInfo() -> tuple[list[dict], int]:
    oai_set = "physics:cond-mat"
    base_url = f"https://export.arxiv.org/oai2?verb=ListRecords&metadataPrefix=oai_dc&set={oai_set}"

    paper_list: list[dict] = []
    dups: int = 0

    wait_time = 5

    # OAI-PMH pagination: use resumptionToken
    resumption_token: str | None = None

    # Keep fetching until we hit 'iter' iterations
    for _ in range(iter):
        if resumption_token is None:
            url = base_url
        else:
            url = f"https://export.arxiv.org/oai2?verb=ListRecords&resumptionToken={resumption_token}"

        logging.info(
            f"Fetching OAI-PMH page. Have {len(paper_list)} so far. URL: {url}"
        )

        try:
            # Use requests for consistency
            response = requests.get(url, timeout=60)
            response.raise_for_status()
        except Exception as e:
            if response.status_code == 503:
                wait_time = int(
                    response.headers.get("Retry-After") or sleep_after_rate_limit
                )
                logging.exception(f"Rate limit, sleeping for {wait_time} seconds")
                sleep_with_timer(int(wait_time))

            logging.exception(f"Error fetching OAI-PMH data, exiting: {e}")
            exit()

        # Parse XML
        root = ET.fromstring(response.text)

        # Namespaces for OAI
        ns = {
            "dc": "http://purl.org/dc/elements/1.1/",
            "oai_dc": "http://www.openarchives.org/OAI/2.0/oai_dc/",
            "oai": "http://www.openarchives.org/OAI/2.0/",
        }

        records = root.findall(".//oai:record", ns)

        if len(records) == 0:
            logging.error("No data returned, exiting program")
            exit()

        paper_dicts: list[dict] = []
        summaries: list[str] = []
        for record in records:
            try:
                summary, doi, comment, journal_ref = [None] * 4

                header = record.find("oai:header", ns)
                if header is None:
                    continue

                metadata = record.find("oai:metadata", ns)
                if metadata is None:
                    continue

                # Extract category and dates
                category = header.find("oai:setSpec", ns)
                submission_date = header.find("oai:datestamp", ns)

                # Extract OAI_DC metadata block
                oai_dc = metadata.find("oai_dc:dc", ns)
                if oai_dc is None:
                    continue

                # Extract fields
                id_elem = header.find("oai:identifier", ns)
                title_elem = oai_dc.find("dc:title", ns)
                summary_elem = oai_dc.findall("dc:description", ns)
                update_date_elem = oai_dc.findall("dc:date", ns)
                categories = oai_dc.findall("dc:subject", ns)
                authors = oai_dc.findall("dc:creator", ns)
                links = oai_dc.findall("dc:identifier", ns)

                # Validate elements before accessing `.text`

                id_text = "N/A"
                if id_elem is not None and id_elem.text:
                    id_text = id_elem.text.split(":")[-1]

                # Duplicate check in ES
                if not no_es:
                    bad = client.options(ignore_status=[404]).get(
                        index=INDEX, id=id_text
                    )
                    exists = bad.get("found")
                    if exists is True and not ignore_dups:
                        logging.info("Duplicate paper found")
                        dups += 1
                        continue

                title_text = title_elem.text if title_elem is not None else "N/A"
                category_text = category.text if category is not None else "N/A"
                submission_date_text = (
                    submission_date.text if submission_date is not None else "N/A"
                )

                for sum in summary_elem:
                    if sum.text is None:
                        continue

                    if sum.text.startswith("Comment: "):
                        comment = sum.text
                    else:
                        summary = sum.text.strip()

                if summary:
                    summaries.append(summary)

                final_links = []
                for link in links:
                    if link.text is None:
                        continue

                    if link.text.startswith("doi:"):
                        doi = link.text.removeprefix("doi:")
                        final_links.append(f"https://www.doi.org/{doi}")
                    elif not link.text.startswith("http"):
                        journal_ref = link.text
                    else:
                        final_links.append(link.text)

                submission_date_text_new = "N/A"
                if submission_date_text is not None:
                    submission_date_text_new = submission_date_text.replace("-", "")

                # Build dictionary
                entry = {
                    "id": id_text,
                    "title": title_text,
                    "links": final_links,
                    "summary": summary if summary else "N/A",
                    "date": submission_date_text_new,
                    "updated": [
                        date.text.replace("-", "")
                        for date in update_date_elem or []
                        if date is not None and date.text
                    ],
                    "authors": [auth.text for auth in authors if auth is not None],
                    "doi": doi if doi else "N/A",
                    "comments": comment if comment else "N/A",
                    "primary_category": category_text,
                    "topics": [cat.text for cat in categories if cat is not None],
                    "journal_ref": journal_ref if journal_ref else "N/A",
                    # no categories
                }

                paper_dicts.append(entry)

            except Exception as ex:
                logging.exception(f"Error parsing record: {ex}")

        # Collect all feed entries
        if not paper_dicts:
            # If for some reason we had records but couldn't parse anything
            logging.error("No valid entries, exit flag enabled, exiting program")
            exit()

        if not no_annotate:
            logging.info("Fetched papers, starting annotations")

        # The annotation logic remains the same
        num_batches: int = math.ceil(len(summaries) / batch_size)
        all_annotations: list[dict] = []
        batch_num: int = 0

        while batch_num < num_batches and not no_annotate:
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
                if not drop_batches:
                    logging.warning(
                        "Batch did not successfully complete, uploading current documents"
                    )
                    break

                logging.error(
                    "Batch did not successfully complete, dropping all batches\n"
                    "To upload partial iterations, please remove the --drop-batches flag"
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

        if not no_annotate:
            # Merge annotations into paper_dicts
            for p_dict, annotation in zip(paper_dicts, all_annotations):
                p_dict["APL"] = annotation.get("APL", [])
                p_dict["CMT"] = annotation.get("CMT", [])
                p_dict["DSC"] = annotation.get("DSC", [])
                p_dict["MAT"] = annotation.get("MAT", [])
                p_dict["PRO"] = annotation.get("PRO", [])
                p_dict["PVL"] = annotation.get("PVL", [])
                p_dict["PUT"] = annotation.get("PUT", [])
                p_dict["SMT"] = annotation.get("SMT", [])
                p_dict["SPL"] = annotation.get("SPL", [])

        paper_list.extend(paper_dicts)
        logging.info(
            f"Collected papers (so far) 0 - {len(paper_list)}; Duplicates skipped: {dups}"
        )

        # Check for resumptionToken
        rt_elem = root.find(".//oai:resumptionToken", ns)
        resumption_token = rt_elem.text if rt_elem is not None else None
        if not resumption_token:
            logging.info("No resumptionToken found; no more pages to fetch from OAI.")
            break

        wait_time = sleep_between_calls or wait_time
        logging.info(f"Iteration complete, sleeping {wait_time} seconds")
        sleep_with_timer(wait_time)

    return replaceNullValues(paper_list), dups


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


def getEmbedding(text: str):
    return model.encode(text)


def insert_documents(documents: list[dict], index: str):
    if no_es and not output:
        print(json.dumps(documents, indent=4))
        return

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
        start_db_count: int = client.count(index=INDEX)["count"]
    else:
        start_db_count = 0

    logging.info(f"Total documents in DB: {start_db_count}\n")

    docs, dups = findInfo()
    if len(docs) == 0:
        logging.error("No docs to upload, exiting")
        exit()

    insert_documents(docs, INDEX)
    logging.info(f"Uploaded {iter * 1000 - dups} documents")


def main() -> None:
    if not no_es:
        createNewIndex(False, INDEX)

    if iter < 1:
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

    # Same argument usage
    iter: int = args.iter
    batch_size: int = args.batch_size
    drop_batches: bool = args.drop_batches
    output: str = args.output
    no_es: bool = args.no_es
    ignore_dups: bool = args.ignore_dups
    no_annotate: bool = args.skip_annotate
    sleep_after_rate_limit: int = args.sleep_after_rate_limit
    sleep_between_calls: int = args.sleep_between_calls

    logging.info("Running script with the following arguments:")
    for key, value in vars(args).items():
        logging.info(f"{key}: {value}")

    # Set up the Elasticsearch client
    client: Elasticsearch = Elasticsearch(ES_URL, api_key=API_KEY, ca_certs=CERT_PATH)

    main()
