# Use Python slim image
FROM python:3.10-slim

RUN apt update && apt install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only requirements first to cache pip installs
COPY requirements.txt /app/

# Install dependencies in a virtual environment
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the rest of the application files
COPY . /app/

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "server:app"]