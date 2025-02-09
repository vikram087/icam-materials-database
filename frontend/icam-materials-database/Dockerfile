# Use Node slim image
FROM node:18-slim

# Set working directory
WORKDIR /app

RUN apt update && apt install -y curl && rm -rf /var/lib/apt/lists/*

# Copy only package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

ARG VITE_API_KEY
ENV VITE_API_KEY=${VITE_API_KEY}

# Copy the rest of the application files
COPY . .

RUN npm run build

# Start the development server
CMD ["npm", "run", "preview"]
