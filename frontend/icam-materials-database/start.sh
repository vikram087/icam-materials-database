#!/bin/sh

# Run build process
npm run build

# Copy built files to Nginx root
cp -R dist /usr/share/nginx/html

# Check if domain is not localhost
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
    echo "Setting up Nginx for domain: $DOMAIN"

    # Replace server_name _ with actual domain config
    sed -i "s|server_name _;|server_name $DOMAIN www.$DOMAIN;|g" /etc/nginx/nginx.conf

    # Issue SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

    # Set up automatic renewal (optional)
    certbot renew --quiet
else
    echo "Running in localhost mode, skipping domain configuration."
fi

# Start Nginx
nginx -g 'daemon off;'
