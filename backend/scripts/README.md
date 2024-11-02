# Setup of Scripts

This guide details how to set up and run the `add_papers.py` script, which pulls data from the Arxiv API and populates it into your database. The script allows you to specify the number of iterations and the amount of data per iteration to fetch papers efficiently while respecting API limits.

## Table of Contents
- [Setup](#setup)
  - [Clone the Repository](#1-clone-the-repository)
  - [Install Dependencies](#2-install-dependencies)
  - [Run the Script](#3-run-the-script)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Setup

### 1. Clone the Repository

Clone the repository containing the script code, then navigate to the `scripts` directory.

   ```bash
   git clone https://github.com/vikram087/icam-superconducticity-repository.git
   cd icam-superconducticity-repository/backend/scripts
   ```

### 2. Install Dependencies

Set up a Python virtual environment and install dependencies.

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### 3. Run the Script

Run the script to populate the database with papers from the Arxiv API.

   ```bash
   python3 add_papers.py [options] -i <ITER> -a <AMT>
   ```

   - `-i ITER`: Number of iterations to fetch papers.
   - `-a AMT`: Amount of papers per iteration (max: 2000).

   > **Note**: The Arxiv API limits requests to 2000 papers at a time. If you need to pull more than 2000, wait before making additional requests to avoid throttling.

## Troubleshooting

- **API Request Limit**: If you exceed the 2000 paper limit, wait for a while before making additional requests.
- **Database Connection Errors**: Ensure your `.env` file has the correct database credentials and that your database is running.

## Next Steps

After populating the database, you can:
- Query the database to verify that the papers were successfully added.
- Use the data for analysis, search, or integration with other parts of your application.