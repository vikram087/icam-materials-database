#!/bin/bash

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_FILE="output.json"

if [[ -f "$SCRIPT_DIR/.env" ]]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "Warning: .env file not found in $SCRIPT_DIR"
fi

show_help() {
    echo "Usage: $0 [FILE_NAME] [API_KEY]"
    echo
    echo "Uploads an NDJSON file in 50MB chunks to Elasticsearch."
    echo
    echo "Arguments:"
    echo "  FILE_NAME   (optional) The NDJSON file to upload (default: output.json)"
    echo "  API_KEY     (optional) API key for authentication (default: from .env file)"
    echo
    echo "Options:"
    echo "  --help      Show this help message and exit"
    echo
    echo "Examples:"
    echo "  $0 my_data.ndjson    # Upload 'my_data.ndjson' using API_KEY from .env"
    echo "  $0 my_data.ndjson my_api_key123    # Upload with a specified API key"
    exit 0
}

# Check for --help flag
if [[ "$1" == "--help" ]]; then
    show_help
fi

# User inputs (Optional)
FILE_NAME=${1:-$DEFAULT_FILE}
API_KEY_INPUT=${2:-$API_KEY}

if [[ -z "$API_KEY_INPUT" ]]; then
    echo "Error: API_KEY not set in .env and not provided as an argument"
    exit 1
fi

if [[ ! -f "$SCRIPT_DIR/$FILE_NAME" ]]; then
    echo "Error: File '$FILE_NAME' not found in $SCRIPT_DIR"
    exit 1
fi

echo "Using file: $FILE_NAME"
echo "Using API Key: (hidden for security)"

echo "Splitting NDJSON file into 50MB chunks using split_ndjson.py..."
python3 "$SCRIPT_DIR/split_ndjson.py" \
    -i "$SCRIPT_DIR/$FILE_NAME" \
    -o "$SCRIPT_DIR/chunk_" \
    --max-size 50

for chunk in "$SCRIPT_DIR"/chunk_*.ndjson; do
    echo "Uploading chunk: $chunk"

    response=$(curl --silent --write-out "%{http_code}" --cacert "$SCRIPT_DIR/ca.crt" \
        -X POST "$ES_URL/_bulk" \
        -H "Content-Type: application/x-ndjson" \
        -H "Authorization: ApiKey $API_KEY_INPUT" \
        --data-binary "@$chunk")

    http_code="${response: -3}"

    if [[ "$http_code" -ne 200 ]]; then
        echo "Error: Bulk upload failed for $chunk (HTTP $http_code)"
        exit 1
    fi

    echo "Chunk uploaded successfully!"
    rm "$chunk"  # Remove chunk after successful upload
done

# if you want to use reverse proxy on dev with self-signed certs
# remove --cacert flag and replace with -k flag
echo -e "\nChecking document count...\n"
curl --cacert "$SCRIPT_DIR/ca.crt" -X GET "$ES_URL/search-papers-meta/_count?pretty" \
     -H "Authorization: ApiKey $API_KEY_INPUT"

echo "Bulk upload completed successfully!"