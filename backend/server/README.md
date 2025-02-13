# Setup of Server

This guide details how to set up and run the server, which integrates with Elasticsearch to provide API functionalities for your application.

## Table of Contents
- [Setup](#setup)
  - [Clone the Repository](#1-clone-the-repository)
  - [Set up .env File](#2-set-up-env-file)
  - [Set up Python Environment](#3-setup-python-environment)
  - [Copy ca.crt](#4-copy-cacrt)
  - [Run the Server](#5-run-the-server)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Setup

### 1. Clone the Repository

Clone the repository containing the server code, then navigate to the server directory.

   ```bash
   git clone https://github.com/vikram087/icam-materials-database.git
   cd icam-materials-database/backend/server
   ```

### 2. Set up `.env` File

Create a `./env/.env` file for the Python Elasticsearch API. Replace `your-es-api-key` with the API key you obtained from [Elasticsearch](../elasticsearch/README.md).

   ```ini
   ## DEV

   ES_URL=https://localhost:9200

   ## PROD

   ES_URL=https://DOMAIN:9200

   ## BOTH

   INDEX=your-index
   SERVER_API_KEY=your-backend-api-key
   CERT_PATH="./ca.crt"
   API_KEY=your-es-api-key
   ```

   > Note: You can use `openssl rand -hex 32` to generate random api keys

### 3. Set up Python Environment

Set up a virtual environment to isolate dependencies.

   - **Create and activate a virtual environment**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

   - **Install dependencies**:
     ```bash
     pip install -r requirements.txt
     ```

### 4. Copy `ca.crt`

Run the following command to copy Elasticsearch's ca.crt to run the server

   ```bash
   docker cp es01:/usr/share/elasticsearch/config/certs/ca/ca.crt ./ca.crt
   ```


### 5. Run the Server

Start the server to begin processing requests.

   ```bash
   python3 server.py
   ```

   You should see a message confirming that the server is running.

## Troubleshooting

- **Cannot connect to Elasticsearch**: Verify that your `.env` file has the correct `API_KEY`, and that Elasticsearch is running and accessible on the specified port.
- **Python dependencies not installing**: Ensure that your virtual environment is activated and try re-running `pip install -r requirements.txt`.

## Next Steps

- **Test Server Endpoints**: You can test the API by making requests to the server (e.g., using `curl` or Postman).
- **Integrate with Application**: Connect this server with other parts of your application to leverage Elasticsearch data.
