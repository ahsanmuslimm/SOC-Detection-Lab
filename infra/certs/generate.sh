#!/usr/bin/env bash
# Generate a self-signed TLS certificate for local development.
# Run this once after cloning: bash infra/certs/generate.sh
set -e
cd "$(dirname "$0")"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt \
  -config openssl.cnf
echo "✓ Certificate generated: server.crt + server.key"
echo "  Valid for 365 days — localhost + 127.0.0.1"
