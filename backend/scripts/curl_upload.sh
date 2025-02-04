#!/bin/bash

# Set script to exit on error
set -e

# Get the script's directory (so relative paths work)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env file if it exists
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "Warning: .env file not found in $SCRIPT_DIR"
fi

# Default values
DEFAULT_FILE="output.json"
DEFAULT_API_KEY="$API_KEY"  # From .env if available

# Function to display help message
show_help() {
    echo "Usage: ./script.sh [FILENAME] [API_KEY]"
    echo ""
    echo "Arguments:"
    echo "  FILENAME     (Optional) The JSON file to upload. Default: '$DEFAULT_FILE'."
    echo "  API_KEY      (Optional) The API key for authentication. Default: Read from .env."
    echo ""
    echo "Options:"
    echo "  --help       Show this help message and exit."
    echo ""
    echo "Examples:"
    echo "  ./script.sh                      # Uses output.json and API key from .env"
    echo "  ./script.sh my_data.json         # Uses my_data.json and API key from .env"
    echo "  ./script.sh my_data.json my_key  # Uses my_data.json and provided API key"
    exit 0
}

# Check if --help argument is provided
if [[ "$1" == "--help" ]]; then
    show_help
fi

# Allow user to provide filename and API key as arguments
FILE_NAME=${1:-$DEFAULT_FILE}
API_KEY_INPUT=${2:-$DEFAULT_API_KEY}

# Ensure API_KEY is set
if [[ -z "$API_KEY_INPUT" ]]; then
    echo "Error: API_KEY not set in .env and not provided as an argument"
    exit 1
fi

# Ensure the provided file exists
if [[ ! -f "$SCRIPT_DIR/$FILE_NAME" ]]; then
    echo "Error: File '$FILE_NAME' not found in $SCRIPT_DIR"
    exit 1
fi

echo "Using file: $FILE_NAME"
echo "Using API Key: (hidden for security)"

# Elasticsearch bulk upload
curl --cacert "$SCRIPT_DIR/ca.crt" -X POST "https://localhost:9200/_bulk" \
     -H "Content-Type: application/x-ndjson" \
     -H "Authorization: ApiKey $API_KEY_INPUT" \
     --data-binary "@$SCRIPT_DIR/$FILE_NAME"

# Count indexed documents
echo -e "\nChecking document count...\n"
curl --cacert "$SCRIPT_DIR/ca.crt" -X GET "https://localhost:9200/search-papers-meta/_count?pretty" \
     -H "Authorization: ApiKey $API_KEY_INPUT"

