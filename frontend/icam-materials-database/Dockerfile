FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache nginx certbot certbot-nginx openssl curl

# Create directories for SSL certificates
RUN mkdir -p /etc/nginx/certs /etc/letsencrypt/live

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create a working directory for our app source code
WORKDIR /app

# Copy package.json and package-lock.json (if any), then install deps
COPY package*.json /app/
RUN npm install

# Copy the rest of the frontend source code
COPY . /app/

# Expose ports for HTTP and HTTPS
EXPOSE 80 443

# The container's startup command
CMD ["/app/start.sh"]
