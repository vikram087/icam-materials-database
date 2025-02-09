#!/bin/bash

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_FILE="output.json"

if [[ -f "$SCRIPT_DIR/.env" ]]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "Warning: .env file not found in $SCRIPT_DIR"
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
        -X POST "https://localhost:9200/_bulk" \
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

echo -e "\nChecking document count...\n"
curl --cacert "$SCRIPT_DIR/ca.crt" -X GET "https://localhost:9200/search-papers-meta/_count?pretty" \
     -H "Authorization: ApiKey $API_KEY_INPUT"

echo "Bulk upload completed successfully!"
