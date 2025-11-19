#!/bin/bash

# Traefik v2 to v3 Upgrade Script
# This script upgrades an existing Traefik v2 installation to v3
#
# Usage:
#   ./upgrade-traefik-v3.sh [OPTIONS]
#
# Options:
#   --api-url URL          API URL for container migration (e.g., https://api.deploy.party)
#   --api-token TOKEN      API token for authentication (starts with dp-)
#   --skip-migration       Skip automatic container migration
#   -h, --help            Show this help message

# Exit in case of error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

INSTALL_PATH="/var/opt/deploy-party"
BACKUP_TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Default values
API_URL=""
API_TOKEN=""
SKIP_MIGRATION=false
SKIP_DEPLOY_PARTY_UPDATE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --api-token)
            API_TOKEN="$2"
            shift 2
            ;;
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        --skip-deploy-party-update)
            SKIP_DEPLOY_PARTY_UPDATE=true
            shift
            ;;
        -h|--help)
            echo "Traefik v2 to v3 Upgrade Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --api-url URL                API URL for container migration (e.g., https://api.deploy.party)"
            echo "  --api-token TOKEN            API token for authentication (starts with dp-)"
            echo "  --skip-migration             Skip automatic container migration"
            echo "  --skip-deploy-party-update   Skip deploy.party update after Traefik upgrade"
            echo "  -h, --help                   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --api-url https://api.deploy.party --api-token dp-xxx..."
            echo "  $0 --skip-migration"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Function to update deploy.party
update_deploy_party() {
    if [ "$SKIP_DEPLOY_PARTY_UPDATE" = true ]; then
        echo -e "${YELLOW}Skipping deploy.party update (--skip-deploy-party-update flag).${NC}"
        return
    fi

    echo ""
    echo "================================================================================"
    echo "Updating deploy.party to latest version..."
    echo "================================================================================"
    echo ""

    # Stop deploy.party
    echo "Stopping deploy.party..."
    docker stack rm deploy-party
    sleep 10

    # Pull latest images
    echo "Pulling latest images..."
    docker pull ghcr.io/lennetech/deploy.party/app:latest
    docker pull ghcr.io/lennetech/deploy.party/api:latest

    # Redeploy
    echo "Redeploying deploy.party..."
    docker stack deploy -c docker-compose.yml deploy-party

    # Wait for health check
    echo "--------------------------------------------------------------------------------"
    echo "Waiting for deploy.party to start..."
    sleep 10

    local UPDATE_TIMEOUT=180
    local UPDATE_START_TIME=$(date +%s)
    local UPDATE_BAR_LENGTH=50

    while true; do
        local DEPLOY_PARTY_CONTAINER_ID=$(docker ps --filter "ancestor=ghcr.io/lennetech/deploy.party/app:latest" --format "{{.ID}}" 2>/dev/null | head -n 1)

        if [ -n "$DEPLOY_PARTY_CONTAINER_ID" ]; then
            local DEPLOY_PARTY_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$DEPLOY_PARTY_CONTAINER_ID" 2>/dev/null)

            if [ "$DEPLOY_PARTY_STATUS" = "healthy" ]; then
                local UPDATE_PROGRESS=100
                local UPDATE_FILLED=$((UPDATE_PROGRESS * UPDATE_BAR_LENGTH / 100))
                local UPDATE_EMPTY=$((UPDATE_BAR_LENGTH - UPDATE_FILLED))
                local UPDATE_BAR=$(printf "%0.s#" $(seq 1 $UPDATE_FILLED))
                local UPDATE_SPACES=$(printf "%0.s " $(seq 1 $UPDATE_EMPTY))
                printf "\r[%s%s] %d%%" "$UPDATE_BAR" "$UPDATE_SPACES" "$UPDATE_PROGRESS"
                sleep 2
                echo ""
                echo -e "${GREEN}Successfully updated deploy.party!${NC}"
                break
            fi
        fi

        local UPDATE_CURRENT_TIME=$(date +%s)
        local UPDATE_ELAPSED_TIME=$((UPDATE_CURRENT_TIME - UPDATE_START_TIME))
        if [ $UPDATE_ELAPSED_TIME -ge $UPDATE_TIMEOUT ]; then
            echo ""
            echo -e "${YELLOW}Warning: deploy.party did not reach healthy status within timeout${NC}"
            echo "You may need to check the logs: docker service logs deploy-party_app"
            break
        fi

        local UPDATE_PROGRESS=$((UPDATE_ELAPSED_TIME * 100 / UPDATE_TIMEOUT))
        local UPDATE_FILLED=$((UPDATE_PROGRESS * UPDATE_BAR_LENGTH / 100))
        local UPDATE_EMPTY=$((UPDATE_BAR_LENGTH - UPDATE_FILLED))
        local UPDATE_BAR=$(printf "%0.s#" $(seq 1 $UPDATE_FILLED))
        local UPDATE_SPACES=$(printf "%0.s " $(seq 1 $UPDATE_EMPTY))
        printf "\r[%s%s] %d%%" "$UPDATE_BAR" "$UPDATE_SPACES" "$UPDATE_PROGRESS"

        sleep 2
    done
}

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

# Create dynamic directory for Traefik file provider if it doesn't exist
echo "--------------------------------------------------------------------------------"
echo "Checking dynamic configuration directory..."
if [ ! -d "dynamic" ]; then
    echo "Creating dynamic directory..."
    mkdir -p dynamic
    echo -e "${GREEN}Dynamic directory created${NC}"
else
    echo "Dynamic directory already exists."
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
export $(cat /data/.env | grep -v '#' | awk '/=/ {print $1}') && docker stack deploy -c docker-compose.traefik.yml traefik

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

            # Update deploy.party first (required for migration endpoint)
            echo "--------------------------------------------------------------------------------"
            echo "Updating deploy.party"
            echo "--------------------------------------------------------------------------------"
            echo ""
            echo "Updating deploy.party to latest version (required for migration endpoint)..."
            echo ""

            update_deploy_party

            # Container Migration for Traefik v3 Middleware Syntax
            echo ""
            echo "--------------------------------------------------------------------------------"
            echo "Container Migration for Traefik v3"
            echo "--------------------------------------------------------------------------------"
            echo ""
            echo -e "${YELLOW}IMPORTANT: All deployed containers need updated middleware configuration.${NC}"
            echo "Traefik v3 requires middleware provider suffixes (@swarm)."
            echo ""

            # Skip if requested
            if [ "$SKIP_MIGRATION" = true ]; then
                echo -e "${YELLOW}Skipping automatic container migration (--skip-migration flag).${NC}"
                echo ""
                echo "To migrate containers later, run:"
                echo "  curl -X POST -H \"dp-api-token: YOUR_API_TOKEN\" https://YOUR_API_URL/extern/migrate/traefik-middleware"
                echo ""
                echo -e "${GREEN}Traefik v3 upgrade completed.${NC}"
                exit 0
            fi

            # Determine API URL
            if [ -z "$API_URL" ]; then
                # Try to auto-detect from environment
                if [ -n "$APP_URL" ]; then
                    API_URL="https://api.$APP_URL"
                    echo "Auto-detected API URL: $API_URL"
                else
                    echo "No API URL provided and could not auto-detect."
                    echo ""
                    read -p "Enter your API URL (e.g., https://api.deploy.party): " API_URL

                    if [ -z "$API_URL" ]; then
                        echo -e "${YELLOW}No API URL provided. Skipping automatic migration.${NC}"
                        echo ""
                        echo "To migrate containers later, run:"
                        echo "  curl -X POST -H \"dp-api-token: YOUR_API_TOKEN\" https://YOUR_API_URL/extern/migrate/traefik-middleware"
                        echo ""
                        echo -e "${GREEN}Traefik v3 upgrade completed.${NC}"
                        exit 0
                    fi
                fi
            fi

            # Get API token if not provided
            if [ -z "$API_TOKEN" ]; then
                echo ""
                echo "API token required for automatic container migration."
                echo "Get your token from: Settings → API Keys (starts with dp-)"
                echo ""
                # Use stty for compatibility with /bin/sh
                printf "Enter your API token (or press Enter to skip): "
                stty -echo
                read API_TOKEN
                stty echo
                echo ""

                if [ -z "$API_TOKEN" ]; then
                    echo -e "${YELLOW}No API token provided. Skipping automatic migration.${NC}"
                    echo ""
                    echo "To migrate containers later, run:"
                    echo "  curl -X POST -H \"dp-api-token: YOUR_API_TOKEN\" $API_URL/extern/migrate/traefik-middleware"
                    echo ""
                    echo -e "${GREEN}Traefik v3 upgrade completed.${NC}"
                    exit 0
                fi
            fi

            # Trigger migration via REST API
            echo ""
            echo "Triggering container migration..."
            echo "API URL: $API_URL"
            echo ""

            MIGRATION_RESULT=$(curl -s -X POST \
                -H "dp-api-token: $API_TOKEN" \
                -H "Content-Type: application/json" \
                "$API_URL/extern/migrate/traefik-middleware")

            if echo "$MIGRATION_RESULT" | grep -q '"success":true'; then
                TOTAL_CONTAINERS=$(echo "$MIGRATION_RESULT" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
                echo -e "${GREEN}Container migration started successfully!${NC}"
                echo ""
                echo "Migration running in background for $TOTAL_CONTAINERS containers."
                echo ""
                echo -e "${YELLOW}NOTE: The migration is running in the background and may take several minutes.${NC}"
                echo "Each container will be stopped, regenerated, and redeployed one by one."
                echo ""
                echo "To monitor progress, check the API logs:"
                echo "  docker service logs -f deploy-party_api | grep 'Traefik Migration'"
                echo ""
                echo "Or check running containers:"
                echo "  watch -n 2 'docker ps --format \"table {{.Names}}\t{{.Status}}\" | grep -v traefik'"
            elif echo "$MIGRATION_RESULT" | grep -q "Invalid API Token"; then
                echo -e "${RED}Error: Invalid API token provided.${NC}"
                echo ""
                echo "To migrate containers manually with correct token, run:"
                echo "  curl -X POST -H \"dp-api-token: YOUR_API_TOKEN\" $API_URL/extern/migrate/traefik-middleware"
            else
                echo -e "${YELLOW}Warning: Could not start container migration.${NC}"
                echo "Response: $MIGRATION_RESULT"
                echo ""
                echo "To retry migration manually, run:"
                echo "  curl -X POST -H \"dp-api-token: YOUR_API_TOKEN\" $API_URL/extern/migrate/traefik-middleware"
            fi

            echo ""
            echo "================================================================================"
            echo -e "${GREEN}Upgrade completed successfully!${NC}"
            echo "================================================================================"
            echo ""
            if [ "$SKIP_DEPLOY_PARTY_UPDATE" != true ]; then
                echo "✅ deploy.party updated to latest version"
            fi
            echo "✅ Traefik upgraded from v2 to v3"
            if [ "$SKIP_MIGRATION" != true ]; then
                if [ -n "$TOTAL_CONTAINERS" ]; then
                    echo "✅ Container migration started for $TOTAL_CONTAINERS containers (running in background)"
                else
                    echo "⚠️  Container migration status unknown - check logs"
                fi
            fi
            echo ""
            echo "Dashboard: lb.$APP_URL"
            echo "deploy.party: $APP_URL"
            echo ""
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
