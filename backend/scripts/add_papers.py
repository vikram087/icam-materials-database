import argparse
import json
import logging
import math
import os
import re
import time
import unicodedata
from argparse import Namespace
from datetime import datetime
from io import BytesIO
from xml.etree import ElementTree as ET

import fitz
import requests
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from sentence_transformers import SentenceTransformer  # type: ignore

# CANNOT DISPLAY FULL TEXTS

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
Relevant links:

https://info.arxiv.org/help/bulk_data/index.html
https://info.arxiv.org/help/bulk_data_s3.html
https://www.kaggle.com/datasets/Cornell-University/arxiv/data
https://info.arxiv.org/help/bulk_data.html#harvest
https://info.arxiv.org/help/oa/index.html

Kaggle dataset used for all papers' metadata, but may be out of date
AWS S3 used for full text extraction, but is paid (works with metadata too)
Bulk OAI API used for massive metadata extraction, fully up to date, but rate limits, and is an api
Can scrape for full text, but I want to avoid this
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
    parser.add_argument(
        "-f",
        "--file-dataset",
        required=False,
        default=None,
        type=str,
        help="[Optional] Location of input dataset. Will not use bulk API.",
    )
    parser.add_argument("-v", "--version", action="version", version=program_version)

    return parser


def sleep_with_timer(seconds: int) -> None:
    for remaining in range(seconds, 0, -1):
        logging.info(f"Resuming in {remaining} seconds...")
        time.sleep(1)
    logging.info("\nResuming now...")


# using AWS S3 bulk data (full text only)
# can also get metadata, but kaggle dataset/bulk api is better bc it's free
# def get_full_text(arxiv_id):
#     BUCKET_NAME = "arxiv"
#     REGION_NAME = "us-east-1"
#     PDF_PREFIX = "pdf/"

#     # Extract the year and month from the arXiv ID
#     year_month = arxiv_id[:4]
#     pdf_file_name = f"{arxiv_id.replace('.', '/')}.pdf"
#     tar_file_key = f"{PDF_PREFIX}arXiv_pdf_{year_month}_001.tar"

#     s3_client = boto3.client("s3", region_name=REGION_NAME)

#     try:
#         # Download the tar file with Requester Pays
#         response = s3_client.get_object(
#             Bucket=BUCKET_NAME, Key=tar_file_key, RequestPayer="requester"
#         )
#         tar_content = BytesIO(response["Body"].read())

#         # Extract the specific PDF from the tar file
#         with tarfile.open(fileobj=tar_content, mode="r:") as tar:
#             for member in tar.getmembers():
#                 if member.name.endswith(pdf_file_name):
#                     pdf_file = tar.extractfile(member)
#                     pdf_content = BytesIO(pdf_file.read())
#                     text_content = convert_pdf_to_text(pdf_content)
#                     logging.info(f"Full text indexed for arXiv ID: {arxiv_id}")
#                     return text_content

#         logging.error(f"PDF not found in tar for arXiv ID: {arxiv_id}")

#     except s3_client.exceptions.NoSuchKey:
#         logging.error(f"Tar file not found for arXiv ID: {arxiv_id}")
#     except Exception as e:
#         logging.exception(f"Error fetching full text: {e}")


#     return None
def get_full_text(arxiv_id):
    """Download a PDF from arXiv and return cleaned text."""
    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    response = None

    for i in range(2):
        try:
            logging.info(f"Attempt {i + 1}")
            response = requests.get(pdf_url, timeout=60)
            response.raise_for_status()
            break
        except requests.exceptions.RequestException as e:
            if response is not None and response.status_code == 503:
                wait_time = int(
                    response.headers.get("Retry-After") or sleep_after_rate_limit
                )
                logging.exception(f"Rate limit, sleeping for {wait_time} seconds")
                sleep_with_timer(wait_time)
            else:
                logging.exception(f"Error fetching page, will try again. {e}")

    if response is None:
        logging.error("Could not download PDF after multiple attempts.")
        return None

    pdf_content = BytesIO(response.content)
    text_content = convert_pdf_to_text(pdf_content)

    logging.info(f"Full text indexed for arXiv ID: {arxiv_id}")
    return text_content


def convert_pdf_to_text(pdf_content):
    """
    Convert PDF bytes into (cleaned) text.
    1) Extract raw text from each page.
    2) Concatenate pages.
    3) Clean the resulting text with various heuristics.
    """
    doc = fitz.open(stream=pdf_content, filetype="pdf")
    raw_pages = []
    for page in doc:
        raw_pages.append(page.get_text())

    raw_text = "\n".join(raw_pages)
    cleaned_text = clean_pdf_text(raw_text)
    return cleaned_text


def clean_pdf_text(text: str) -> str:
    """
    Apply a series of cleaning steps to make
    PDF-extracted text more coherent.
    """
    text = normalize_unicode(text)
    text = remove_headers_footers(text)
    text = merge_line_breaks(text)
    text = normalize_whitespace(text)
    return text


def normalize_unicode(text: str) -> str:
    """
    Normalize unusual Unicode characters, ligatures, etc.
    using NFKC or similar forms.
    """
    text = unicodedata.normalize("NFKC", text)

    # You can add known ligature replacements if needed, e.g.:
    ligatures = {
        "\ufb01": "fi",  # example of a common ligature
        "\ufb02": "fl",
        # Add others if needed
    }
    for lig_char, replacement in ligatures.items():
        text = text.replace(lig_char, replacement)

    return text


def remove_headers_footers(text: str) -> str:
    """
    Example heuristic-based removal of repeated lines,
    headers, or footers.
    """
    lines = text.splitlines()
    cleaned_lines = []
    for line in lines:
        stripped_line = line.strip()

        # Remove lines that look like repeated arXiv headers
        if stripped_line.startswith("arXiv:"):
            continue

        # Remove lines that are purely numeric (page numbers, etc.)
        if re.match(r"^\d+$", stripped_line):
            continue

        # You can add more heuristics for footers, e.g. "Page X of Y"

        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


def merge_line_breaks(text: str) -> str:
    """
    Merge lines that are obviously part of the same sentence.
    Also handle hyphenated words split across lines.
    """
    lines = text.splitlines()
    merged_lines = []
    buffer_line = ""

    for i, line in enumerate(lines):
        line_stripped = line.strip()

        # Check if line ends with a hyphen (possible hyphenation)
        if line_stripped.endswith("-"):
            # Remove the hyphen and continue in the same line
            buffer_line += line_stripped[:-1]
            continue

        # If the current line doesn't end with punctuation and the next line starts with lowercase,
        # it's likely mid-sentence. We merge them.
        if (
            line_stripped
            and not line_stripped.endswith((".", "?", "!", ":", ";"))
            and i + 1 < len(lines)
        ):
            next_line_stripped = lines[i + 1].strip()
            if next_line_stripped and next_line_stripped[0].islower():
                buffer_line += line_stripped + " "
                continue

        # Otherwise, we finalize the buffer_line here.
        buffer_line += line_stripped
        merged_lines.append(buffer_line)
        buffer_line = ""

    # If anything remains in buffer_line at the end, append it.
    if buffer_line:
        merged_lines.append(buffer_line)

    return "\n".join(merged_lines)


def normalize_whitespace(text: str) -> str:
    """
    Collapse extra spaces and remove leading/trailing whitespace.
    """
    # Convert multiple spaces/tabs/newlines into a single space
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# reading kaggle dataset (older papers)
def read_dataset(dataset: str) -> tuple[list[dict], int]:
    papers_list: list[dict] = []
    dups = 0
    summaries = []
    with open(dataset, "r") as file:
        for line in file:
            line_dict = json.loads(line)

            id = line_dict.get("id")
            if id is None:
                continue

            if not no_es:
                bad = client.options(ignore_status=[404]).get(index=INDEX, id=id)
                exists = bad.get("found")
                if exists is True and not ignore_dups:
                    logging.info("Duplicate paper found")
                    dups += 1
                    continue

            parsed_authors = line_dict.get("authors_parsed")
            if parsed_authors:
                authors = []
                for author in parsed_authors:
                    last, first, middle = author
                    authors.append(f"{first} {middle} {last}")

            links = []
            doi = line_dict.get("doi")
            if id:
                links.append(f"https://arxiv.org/abs/{id}")
            if doi:
                links.append(f"https://www.doi.org/{doi}")

            cat_string = line_dict.get("categories")
            if cat_string:
                categories = cat_string.split(" ")

            full_text = get_full_text(id) or "N/A"

            versions = line_dict.get("versions")
            updated = []
            if versions:
                for version in versions:
                    date_str = version.get("created")
                    if not date_str:
                        continue

                    date_obj = datetime.strptime(date_str, "%a, %d %b %Y %H:%M:%S %Z")
                    date_int = int(date_obj.strftime("%Y%m%d"))
                    updated.append(date_int)

            summary = line_dict.get("abstract").strip() or "N/A"
            summaries.append(summary)

            paper_dict = {
                "id": id or "N/A",
                "title": line_dict.get("title") or "N/A",
                "links": links if len(links) > 0 else "N/A",
                "summary": summary,
                "date": line_dict.get("update_date").replace("-", "") or "N/A",
                "updated": updated,
                "authors": authors or "N/A",
                "doi": doi or "N/A",
                "comments": line_dict.get("comments") or "N/A",
                "primary_category": categories[0],
                "journal_ref": line_dict.get("journal-ref") or "N/A",
                "full_text": full_text,
                "submitter": line_dict.get("submitter") or "N/A",
                "report-no": line_dict.get("report-no") or "N/A",
                "categories": categories,
                "license": line_dict.get("license") or "N/A",
                # no topics
            }

            papers_list.append(paper_dict)

            sleep_with_timer(sleep_between_calls)

    if not no_annotate:
        papers_list = annotate_papers(summaries, papers_list)

    return replaceNullValues(papers_list), dups


def annotate_papers(summaries: list[str], paper_dicts: list[dict]) -> list[dict]:
    num_batches: int = math.ceil(len(summaries) / batch_size)
    all_annotations: list[dict] = []
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
            logging.info(f"Batch {batch_num + 1}/{num_batches} annotation succeeded")
            batch_annotations = annotations_response.json().get("annotation", [])
        else:
            logging.error(
                f"Batch {batch_num + 1}/{num_batches} annotation failed: "
                f"{annotations_response.status_code}, {annotations_response.text}"
            )
            batch_annotations = [{}] * len(batch_paper_dicts)

        all_annotations.extend(batch_annotations)
        batch_num += 1

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

    return paper_dicts


# bulk OAI api for metadata (newer papers)
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

                full_text = get_full_text(id_text) or "N/A"

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
                    "full_text": full_text,
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

        if not no_annotate:
            paper_dicts = annotate_papers(summaries, paper_dicts)

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

    if dataset:
        docs, dups = read_dataset(dataset)
    else:
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
    dataset: str | None = args.file_dataset

    logging.info("Running script with the following arguments:")
    for key, value in vars(args).items():
        logging.info(f"{key}: {value}")

    # Set up the Elasticsearch client
    client: Elasticsearch = Elasticsearch(ES_URL, api_key=API_KEY, ca_certs=CERT_PATH)

    main()
