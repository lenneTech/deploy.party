#!/bin/bash

# Traefik v2 to v3 Upgrade Script
# This script upgrades an existing Traefik v2 installation to v3

# Exit in case of error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

INSTALL_PATH="/var/opt/deploy-party"
BACKUP_TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

echo "================================================================================"
echo "Traefik v2 → v3 Upgrade Script"
echo "================================================================================"

# Change to install directory
cd $INSTALL_PATH

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found in $INSTALL_PATH${NC}"
    echo "Please ensure deploy.party is installed correctly."
    exit 1
fi

echo "Loading .env file..."
# Load Environment Variables
export $(cat .env | grep -v '#' | awk '/=/ {print $1}')

# Detect if this is a local or production setup
LOCAL_SETUP=0
if [ -f docker-compose.traefik.yml ]; then
    if grep -q "8080:8080" docker-compose.traefik.yml; then
        LOCAL_SETUP=1
        echo -e "${YELLOW}Detected: Local development setup${NC}"
    else
        echo -e "${GREEN}Detected: Production setup${NC}"
    fi
else
    echo -e "${RED}Error: docker-compose.traefik.yml not found${NC}"
    exit 1
fi

# Check if Traefik is running
echo "Checking Traefik status..."
if ! docker stack ps traefik >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Traefik stack not running. Continuing anyway...${NC}"
else
    echo "Traefik is currently running."
fi

# Create backup
echo "--------------------------------------------------------------------------------"
echo "Creating backup of current Traefik configuration..."
BACKUP_FILE="docker-compose.traefik.yml.backup.v2.$BACKUP_TIMESTAMP"
cp docker-compose.traefik.yml "$BACKUP_FILE"
echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"

# Check if already v3
if grep -q "traefik:v3" docker-compose.traefik.yml; then
    echo -e "${YELLOW}Warning: Traefik v3 configuration already detected!${NC}"
    read -p "Do you want to continue anyway? (y/N) " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        echo "Upgrade cancelled."
        exit 0
    fi
fi

# Stop Traefik
echo "--------------------------------------------------------------------------------"
echo "Stopping Traefik v2..."
docker stack rm traefik

# Wait for complete shutdown
echo "Waiting for Traefik to shut down completely..."
WAIT_COUNT=0
MAX_WAIT=30
while docker ps | grep -q traefik && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    printf "."
done
echo ""

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}Warning: Traefik did not shut down within 30 seconds${NC}"
    echo "Continuing anyway..."
else
    echo -e "${GREEN}Traefik stopped successfully${NC}"
fi

# Additional safety wait
sleep 5

# Download new v3 configuration
echo "--------------------------------------------------------------------------------"
echo "Downloading Traefik v3 configuration..."

if [ $LOCAL_SETUP -eq 1 ]; then
    echo "Downloading local development configuration..."
    curl -f -o docker-compose.traefik.yml.new "https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.traefik-local.yml"
else
    echo "Downloading production configuration..."
    curl -f -o docker-compose.traefik.yml.new "https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.traefik.yml"
fi

if [ $? -eq 0 ]; then
    mv docker-compose.traefik.yml.new docker-compose.traefik.yml
    echo -e "${GREEN}Configuration downloaded successfully${NC}"
else
    echo -e "${RED}Error: Failed to download new configuration${NC}"
    echo "Restoring backup..."
    mv "$BACKUP_FILE" docker-compose.traefik.yml
    exit 1
fi

# Ensure traefik-public network exists
echo "--------------------------------------------------------------------------------"
echo "Checking traefik-public network..."
if ! docker network ls --format '{{.Name}}' | grep -q '^traefik-public$'; then
    echo "Creating traefik-public network..."
    docker network create --driver=overlay traefik-public
else
    echo "traefik-public network already exists."
fi

# Start Traefik v3
echo "--------------------------------------------------------------------------------"
echo "Starting Traefik v3..."
docker stack deploy -c docker-compose.traefik.yml traefik

# Wait for Traefik to start
echo "--------------------------------------------------------------------------------"
echo "Waiting for Traefik v3 to start..."

TIMEOUT=180
START_TIME=$(date +%s)
BAR_LENGTH=50

while true; do
    # Check if Traefik container is running
    CONTAINER_ID=$(docker ps --filter "name=traefik_traefik" --format "{{.ID}}" 2>/dev/null | head -n 1)

    if [ -n "$CONTAINER_ID" ]; then
        # Check if container is running (not checking health since Traefik might not have health check)
        STATE=$(docker inspect --format='{{.State.Running}}' "$CONTAINER_ID" 2>/dev/null)

        if [ "$STATE" = "true" ]; then
            PROGRESS=100
            FILLED=$((PROGRESS * BAR_LENGTH / 100))
            EMPTY=$((BAR_LENGTH - FILLED))
            BAR=$(printf "%0.s#" $(seq 1 $FILLED))
            SPACES=$(printf "%0.s " $(seq 1 $EMPTY))
            printf "\r[%s%s] %d%%" "$BAR" "$SPACES" "$PROGRESS"
            sleep 2
            echo ""
            echo "================================================================================"
            echo -e "${GREEN}Successfully upgraded Traefik to v3!${NC}"
            echo "================================================================================"
            echo ""
            echo "Traefik v3 is now running."
            echo "Dashboard should be available at: lb.$APP_URL"
            echo ""
            echo "Backup file: $BACKUP_FILE"
            echo ""
            echo "To verify the upgrade:"
            echo "  docker ps | grep traefik"
            echo "  docker logs \$(docker ps -q -f name=traefik)"
            echo ""
            echo -e "${GREEN}All your containers should continue to work without any changes.${NC}"
            exit 0
        fi
    fi

    CURRENT_TIME=$(date +%s)
    ELAPSED_TIME=$((CURRENT_TIME - START_TIME))
    if [ $ELAPSED_TIME -ge $TIMEOUT ]; then
        echo ""
        echo -e "${RED}Error: Traefik did not start within the timeout period.${NC}"
        echo ""
        echo "To rollback to v2:"
        echo "  cd $INSTALL_PATH"
        echo "  docker stack rm traefik"
        echo "  sleep 20"
        echo "  mv $BACKUP_FILE docker-compose.traefik.yml"
        echo "  export \$(cat .env | grep -v '#' | awk '/=/ {print \$1}')"
        echo "  docker stack deploy -c docker-compose.traefik.yml traefik"
        echo ""
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
