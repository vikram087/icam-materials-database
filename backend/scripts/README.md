# Setup of Scripts

This guide details how to set up and run the `add_papers.py` script, which pulls data from the Arxiv API and populates it into your database. The script allows you to specify the number of iterations and the amount of data per iteration to fetch papers efficiently while respecting API limits.

## Table of Contents
- [Setup](#setup)
  - [Clone the Repository](#1-clone-the-repository)
  - [Set up .env file](#2-set-up-env-file)
  - [Install Dependencies](#3-install-dependencies)
  - [Copy ca.crt File](#4-copy-cacrt-file)
  - [Run the Script](#5-run-the-script)
- [Helper Scripts](#helper-scripts)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Setup

### 1. Clone the Repository

Clone the repository containing the script code, then navigate to the `scripts` directory.

   ```bash
   git clone https://github.com/vikram087/icam-materials-database.git
   cd icam-materials-database/backend/scripts
   ```

### 2. Set up `.env` File

   ```ini
    # API key for Elasticsearch
    API_KEY=YOUR_API_KEY_HERE

    # url for elasticsearch, defaults to https://localhost:9200
    ES_URL=https://localhost:9200

    # url for the NLP server to annotate texts
    LBNLP_URL=http://localhost:8000

    # hard coded value
    DOCKER=false

    # index you want to use
    INDEX=name-of-index
   ```

### 3. Install Dependencies

Set up a Python virtual environment and install dependencies.

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### 4. Copy ca.crt File

Run the following command to copy the ca.crt file for the script to run properly.

   ```bash
   docker cp es01:/usr/share/elasticsearch/config/certs/ca/ca.crt ./ca.crt
   ```

### 5. Run the Script

Run the script to populate the database with papers from the Arxiv API.

   ```bash
   python3 add_papers.py [options]
   ```

   > **Note**: Run ```python3 add_papers.py --help``` to see help on the usage of the script.

   > **Note**: The model will take some time to download for the first time, before you can add papers the model must be fully downloaded
   
   > **Note**: The Arxiv API limits requests to 2000 papers at a time. If you need to pull more than 2000, wait before making additional requests to avoid throttling.


## Helper Scripts

### 1. `db_to_file.py`

Run the script to create a json file which can be run on using curl bulk requests to recreate the index.

   ```bash
   python3 db_to_file.py [options]
   ```

   > **Note**: Run ```python3 add_papers.py --help``` to see help on the usage of the script.

### 2. curl_upload.sh

Run the script to bulk upload documents to an elasticsearch document from a json.

   ```bash
   ./curl_upload.sh [options]
   ```

   > **Note**: Run ```./curl_upload.sh --help``` to see help on the usage of the script. 

## Troubleshooting

- **API Request Limit**: If you exceed the 2000 paper limit, wait for a while before making additional requests.
- **Database Connection Errors**: Ensure your `.env` file has the correct database credentials and that your database is running.

## Next Steps

After populating the database, you can:
- Query the database to verify that the papers were successfully added.
- Use the data for analysis, search, or integration with other parts of your application.
