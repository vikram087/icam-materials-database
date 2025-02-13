#!/bin/sh

# Certificate Generator (Self-Signed)
# Generates a Certificate Authority (CA) certificates

CERTS_DIR="/etc/nginx/certs"
DAYS_VALID=365
# SERVER_NAME=env var here
COUNTRY="US"
STATE="California"
LOCALITY="San Francisco"
ORG_NAME="ICAM"
ORG_UNIT="Dev"

mkdir -p "$CERTS_DIR"

echo "Creating Certificate Authority (CA)..."
openssl genrsa -out "$CERTS_DIR/ca.key" 4096
openssl req -x509 -new -nodes -key "$CERTS_DIR/ca.key" -sha256 -days $DAYS_VALID -out "$CERTS_DIR/ca.crt" -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORG_NAME/OU=$ORG_UNIT/CN=MyProxyCA"

echo "Creating Server Key and CSR for $SERVER_NAME..."
openssl genrsa -out "$CERTS_DIR/$SERVER_NAME.key" 4096
openssl req -new -key "$CERTS_DIR/$SERVER_NAME.key" -out "$CERTS_DIR/$SERVER_NAME.csr" -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORG_NAME/OU=$ORG_UNIT/CN=$SERVER_NAME"

echo "Creating OpenSSL Configuration for SAN (Subject Alternative Names)..."
cat > "$CERTS_DIR/openssl.cnf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
[req_distinguished_name]
[v3_req]
subjectAltName = @alt_names
[alt_names]
DNS.1 = $SERVER_NAME
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

echo "Signing the CSR with the CA to generate a server certificate..."
openssl x509 -req -in "$CERTS_DIR/$SERVER_NAME.csr" -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial -out "$CERTS_DIR/$SERVER_NAME.crt" -days $DAYS_VALID -sha256 -extfile "$CERTS_DIR/openssl.cnf" -extensions v3_req

echo "Creating Full Chain Certificate (fullchain.pem)..."
cat "$CERTS_DIR/$SERVER_NAME.crt" "$CERTS_DIR/ca.crt" > "$CERTS_DIR/fullchain.pem"

echo "Certificate generation completed!"
echo "Certificates are saved in $CERTS_DIR/"
ls -l "$CERTS_DIR"

chmod 640 "$CERTS_DIR"/*.key
chmod 644 "$CERTS_DIR"/*.crt
chmod 644 "$CERTS_DIR/fullchain.pem"