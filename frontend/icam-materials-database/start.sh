#!/bin/sh

# maybe add like host env var and if host is on try to host otherwise don;t

# Run build process
npm run build

# Copy built files to Nginx root
cp -R dist /usr/share/nginx/html

# if host then host otherwise dont
if [ "$HOST" = "true" ]; then
    echo "Setting up Nginx with Let's Encrypt for domain: $DOMAIN"

    # Ensure certbot is installed
    if ! command -v certbot >/dev/null 2>&1; then
        echo "Certbot not found! Exiting..."
        exit 1
    fi

    # Request SSL certificate using Certbot
    certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

    # Create Nginx configuration for the domain
    cat >> /etc/nginx/nginx.conf <<EOF


    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$host\$request_uri;
    }

    server {
        listen 443 ssl;
        server_name $DOMAIN www.$DOMAIN;

        ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files \$uri /index.html;
        }

        error_page 404 /index.html;

        location /api/ {
            proxy_pass http://backend:8080;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;

            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET,POST,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization,Content-Type" always;

            if (\$request_method = OPTIONS) {
                return 204;
            }
        }

        location /models {
            proxy_pass http://models:8000;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;

            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET,POST,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization,Content-Type" always;

            if (\$request_method = OPTIONS) {
                return 204;
            }

            proxy_connect_timeout 300;
            proxy_send_timeout 300;
            proxy_read_timeout 300;
            send_timeout 300; 
        }

        location /kibana/ {
            proxy_pass http://kibana:5601/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_redirect off;
        }

        location /es01/ {
            proxy_pass https://es01:9200/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_redirect off;
        }
    }
}
EOF

    # Set up automatic renewal
    echo "0 0 * * * certbot renew --quiet" >> /etc/crontabs/root

else
    echo "Running in localhost mode, generating self-signed certificate with OpenSSL."

    # Check if the server certificate exists
    if [ -f "/etc/nginx/certs/$DOMAIN.crt" ]; then
        # Check if the server certificate is expired (or will expire in the next 24 hours)
        if openssl x509 -checkend 86400 -noout -in "/etc/nginx/certs/$DOMAIN.crt"; then
            echo "Server certificate is valid and exists. Skipping regeneration."
        else
            echo "Server certificate has expired or is expiring soon. Regenerating..."
            /app/gencert.sh
        fi
    else
        echo "Server certificate not found. Generating a new one..."
        /app/gencert.sh
    fi


    # Create Nginx configuration for localhost
    cat >> /etc/nginx/nginx.conf <<EOF


    server {
        listen 80;
        server_name $DOMAIN;
        return 301 https://\$host\$request_uri;
    }

    server {
        listen 443 ssl;
        server_name $DOMAIN;

        ssl_certificate /etc/nginx/certs/fullchain.pem; # fullchain cert
        ssl_certificate_key /etc/nginx/certs/$DOMAIN.key;

        # ssl_client_certificate /etc/nginx/certs/ca.crt;
        # ssl_verify_client on; # mutual TLS

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files \$uri /index.html;
        }

        error_page 404 /index.html;

        location /api/ {
            proxy_pass http://backend:8080;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;

            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET,POST,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization,Content-Type" always;

            if (\$request_method = OPTIONS) {
                return 204;
            }
        }

        # self signed certs in dev don't work with curl unless you use -k flag

        location /models/ {
            proxy_pass http://models:8000;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;

            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET,POST,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization,Content-Type" always;

            if (\$request_method = OPTIONS) {
                return 204;
            }

            proxy_connect_timeout 300;
            proxy_send_timeout 300;
            proxy_read_timeout 300;
            send_timeout 300; 
        }

        location /kibana/ {
            proxy_pass http://kibana:5601/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_redirect off;
        }

        location /es01/ {
            proxy_pass https://es01:9200/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_redirect off;
        }
    }
}
EOF
fi

# Start Nginx
nginx -g 'daemon off;'
