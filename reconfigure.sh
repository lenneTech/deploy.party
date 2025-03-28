#!/bin/bash

# Exit in case of error
set -e

echo "Load .env file"
# Load local .env
if [ -f .env ]; then
    # Load Environment Variables
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

docker stack rm deploy-party
sleep 20
docker stack deploy -c docker-compose.yml deploy-party

echo "--------------------------------------------------------------------------------"
echo "Waiting for deploy.party to start..."

TIMEOUT=180
START_TIME=$(date +%s)
BAR_LENGTH=50

while true; do
    CONTAINER_ID=$(docker ps --filter "ancestor=ghcr.io/lennetech/deploy.party/app:latest" --format "{{.ID}}")
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null)

    if [ "$STATUS" = "healthy" ]; then
        PROGRESS=100
        FILLED=$((PROGRESS * BAR_LENGTH / 100))
        EMPTY=$((BAR_LENGTH - FILLED))
        BAR=$(printf "%0.s#" $(seq 1 $FILLED))
        SPACES=$(printf "%0.s " $(seq 1 $EMPTY))
        printf "\r[%s%s] %d%%" "$BAR" "$SPACES" "$PROGRESS"
        sleep 10
        echo "\nSuccessfully reconfigured deploy.party!"
        exit 0
    fi

    CURRENT_TIME=$(date +%s)
    ELAPSED_TIME=$((CURRENT_TIME - START_TIME))
    if [ $ELAPSED_TIME -ge $TIMEOUT ]; then
        echo "\nThe container did not reach the 'healthy' status within the timeout period."
        exit 1
    fi


    PROGRESS=$((ELAPSED_TIME * 100 / TIMEOUT))
    FILLED=$((PROGRESS * BAR_LENGTH / 100))
    EMPTY=$((BAR_LENGTH - FILLED))
    BAR=$(printf "%0.s#" $(seq 1 $FILLED))
    SPACES=$(printf "%0.s " $(seq 1 $EMPTY))
    printf "\r[%s%s] %d%%" "$BAR" "$SPACES" "$PROGRESS"

    sleep 2
done