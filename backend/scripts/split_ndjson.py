import argparse

program_name: str = "split_bulk_ndjson.py"
program_usage: str = """
split_bulk_ndjson.py [options]
"""
program_description: str = """description:
This is a helper script used by curl_upload.sh to split an Elasticsearch bulk NDJSON 
file into smaller files by size, ensuring that each 'action + document' pair stays 
together in the same file.
"""
program_epilog: str = """ 
Example:
  python split_bulk_ndjson.py -i bulkfile.ndjson -o chunks_ --max-size 50
"""
program_version: str = """
Version 1.0.0
Created by Vikram Penumarti
"""


def set_parser(
    prog_name: str,
    prog_usage: str,
    prog_description: str,
    prog_epilog: str,
    prog_version: str,
) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog=prog_name,
        usage=prog_usage,
        description=prog_description,
        epilog=prog_epilog,
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "-i",
        "--input-file",
        type=str,
        required=True,
        help="Path to the bulk NDJSON input file",
    )
    parser.add_argument(
        "-m",
        "--max-size",
        type=int,
        default=50,
        help="[Optional] Maximum file size in MB for each chunk.\nDefault: 50 (MB)",
    )
    parser.add_argument("-v", "--version", action="version", version=prog_version)

    return parser


def split_bulk_pairs_by_size(input_file: str, output_prefix: str, max_mb: int) -> None:
    """
    Splits a bulk NDJSON file (action+document pairs) into multiple files,
    each up to 'max_mb' megabytes in size. Ensures each create/index action
    line is followed by its document line in the same file.
    """
    max_bytes = max_mb * 1024 * 1024  # MB -> bytes

    with open(input_file, "r", encoding="utf-8") as infile:
        chunk_idx = 0
        current_bytes = 0

        out_filename = f"{output_prefix}{chunk_idx}.ndjson"
        outfile = open(out_filename, "w", encoding="utf-8")

        while True:
            # Read one line (the action line)
            action_line = infile.readline()
            if not action_line:
                # EOF reached
                break

            # Next line should be the document line
            doc_line = infile.readline()
            if not doc_line:
                # Edge case: the file ended unexpectedly
                # with an action line but no document line
                # We'll write the action_line anyway, but this is an invalid bulk file
                outfile.write(action_line)
                print("Warning: Action line found without a matching document line.")
                break

            # Compute the combined size of these two lines in bytes
            pair_bytes = len(action_line.encode("utf-8")) + len(
                doc_line.encode("utf-8")
            )

            # If adding this pair would exceed our chunk size, start a new file
            if current_bytes + pair_bytes > max_bytes:
                outfile.close()
                chunk_idx += 1
                out_filename = f"{output_prefix}{chunk_idx}.ndjson"
                outfile = open(out_filename, "w", encoding="utf-8")
                current_bytes = 0

            # Write both lines (action + doc) to the current chunk
            outfile.write(action_line)
            outfile.write(doc_line)
            current_bytes += pair_bytes

        outfile.close()


def main() -> None:
    parser = set_parser(
        program_name,
        program_usage,
        program_description,
        program_epilog,
        program_version,
    )
    args = parser.parse_args()

    input_file: str = args.input_file
    output_prefix: str = "chunk_"
    max_mb: int = args.max_size

    split_bulk_pairs_by_size(input_file, output_prefix, max_mb)
    print("Splitting complete.")


if __name__ == "__main__":
    main()
