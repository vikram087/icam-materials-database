# Setup of Server

This guide details how to set up and run the server, which integrates with Elasticsearch to provide API functionalities for your application.

## Table of Contents
- [Setup](#setup)
  - [Clone the Repository](#1-clone-the-repository)
  - [Set up Python Environment](#2-setup-python-environment)
  - [Run the Server](#3-run-the-server)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Setup

### 1. Clone the Repository

Clone the repository containing the server code, then navigate to the server directory.

   ```bash
   git clone https://github.com/vikram087/icam-materials-database.git
   cd icam-materials-database/backend/server
   ```

### 2. Set up Python Environment

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

### 3. Run the Server

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
