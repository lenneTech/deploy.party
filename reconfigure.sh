#!/bin/sh

# Exit in case of error
set -e

echo "Load .env file"
# Load local .env
if [ -f /var/opt/deploy-party/.env ]; then
    # Load Environment Variables
    export $(cat /var/opt/deploy-party/.env | grep -v '#' | awk '/=/ {print $1}')
fi

docker stack rm deploy-party
sleep 20
docker pull ghcr.io/lenneTech/deploy.party/app:latest
docker pull ghcr.io/lenneTech/deploy.party/api:latest
docker stack deploy -c docker-compose.yml deploy-party