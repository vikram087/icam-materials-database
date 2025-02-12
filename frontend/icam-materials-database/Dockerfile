FROM node:18-alpine

# Install Nginx
RUN apk add --no-cache nginx certbot certbot-nginx

COPY nginx.conf /etc/nginx/nginx.conf

# Create a working directory for our app source code
WORKDIR /app

# Copy package.json and package-lock.json (if any), then install deps
COPY package*.json /app/
RUN npm install

# Copy the rest of the frontend source code
COPY . /app/

# Expose port 80 inside the container
EXPOSE 80

# The container's startup command:
# 1) Build the app with environment variables available at runtime
# 2) Copy the built files to Nginx’s web directory
# 3) Start Nginx in the foreground
CMD ["/app/start.sh"]
