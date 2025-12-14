# Setup of Docker

This guide provides steps for setting up the project using Docker Compose. The setup of elasticsearch is based on the Elastic blog article [Getting Started with the Elastic Stack and Docker Compose](https://www.elastic.co/blog/getting-started-with-the-elastic-stack-and-docker-compose).


## Table of Contents
- [Setup](#setup)
  - [Clone the Repository](#1-clone-the-repository)
  - [Set up .env File](#2-set-up-env-file)
  - [Install Docker](#3-install-docker)
  - [Run the Docker Container](#4-run-the-docker-container)
  - [Edit nginx config](#5-edit-serverprodconf-prod)
  - [Access Kibana](#6-access-kibana-optional)
- [Stopping the Docker Container](#stopping-the-docker-container)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Setup

### 1. Clone the Repository

Clone the repo and navigate to the config directory

   ```bash
   git clone https://github.com/vikram087/icam-materials-database.git
   cd icam-materials-database/docker
   ```

### 2. Set up `.env` File

Create a `.env` file to define environment variables required for the stack configuration.

   ```ini
   ## DEV

   VITE_BACKEND_URL=https://localhost/api
   KIBANA_URL=https://localhost/kibana

   ## PROD

   VITE_BACKEND_URL=https://DOMAIN/api
   KIBANA_URL=https:///DOMAIN/kibana

   ## BOTH

   COMPOSE_PROJECT_NAME=icam
   ELASTIC_PASSWORD=your-elastic-password
   KIBANA_PASSWORD=your-kibana-password
   STACK_VERSION=8.15.0
   CLUSTER_NAME=ICAM
   LICENSE=basic
   ES_PORT=9200
   KIBANA_PORT=5601
   ES_MEM_LIMIT=2147483648
   KB_MEM_LIMIT=1073741824
   ENCRYPTION_KEY=your-encryption-key
   INDEX=your-index
   KIBANA_BASE_PATH=/kibana
   ```

   > Note: You can use `openssl rand -hex 32` to generate random api keys

### 3. Install Docker

Install Docker Desktop for your operating system:

- **[Mac](https://docs.docker.com/desktop/install/mac-install/)**
- **[Windows](https://docs.docker.com/desktop/install/windows-install/)**
- **[Linux](https://docs.docker.com/desktop/install/linux/)**

### 4. Run the Docker Container

Start the Docker container.

   - dev
      ```bash
      make dev
      ```

   - prod
      ```bash
      make prod
      ```

### 5. Edit server.prod.conf (prod)

   ```conf
   ## frontend/icam-materials-database/user_conf.d/server.prod.conf

   server_name DOMAIN.org www.DOMAIN.org; # change to your domain
   ```

### 6. Access Kibana (optional)

After starting the Docker container, you can access Kibana at `https://localhost/api`. Log in with:

   - **Username**: `elastic`
   - **Password**: the `ELASTIC_PASSWORD` from your `.env` file


### Stopping the Docker Container

To stop the container, run:

   ```bash
   make down
   ```

## Troubleshooting

- **Elasticsearch fails to start**: Ensure your machine has at least 4GB of free memory. You may need to adjust the memory limits in the `.env` file.

## Next Steps

- **Add Data to Elasticsearch**: You can ingest data via the Elasticsearch HTTP API.
- **Set Up Kibana Visualizations**: Use the Kibana dashboard to create visualizations and monitor your data.