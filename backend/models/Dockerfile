# Use Ubuntu with specific platform
# FROM --platform=linux/amd64 ubuntu:22.04
FROM ubuntu:22.04

# Install Python 3.7 and dependencies in a single RUN statement
RUN apt update && \
    apt install -y software-properties-common curl && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt install -y python3.7 python3.7-venv python3.7-dev build-essential git && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only requirements first to leverage Docker cache
COPY requirements-shared.txt requirements-matbert.txt /app/

# Create virtual environment and install dependencies
RUN python3.7 -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir -r /app/requirements-shared.txt -r /app/requirements-matbert.txt

COPY pdfminer.py /app/venv/lib/python3.7/site-packages/pdfminer/__init__.py

RUN /app/venv/bin/cde data download

# Copy the rest of the application files
COPY . /app/

# Set entrypoint to use virtualenv and run the script
# CMD ["/app/venv/bin/gunicorn", "--bind", "0.0.0.0:8000", "annotate_texts:app"]
CMD ["/app/start.sh"]