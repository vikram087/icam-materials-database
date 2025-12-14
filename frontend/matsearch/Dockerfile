FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept build argument
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY user_conf.d/server.conf /etc/nginx/conf.d/default.conf

EXPOSE 80