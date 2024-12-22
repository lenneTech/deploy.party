#!/bin/sh

# Exit in case of error
set -e

OS_TYPE=$(cat /etc/os-release | grep -w "ID" | cut -d "=" -f 2 | tr -d '"')
OS_VERSION=$(cat /etc/os-release | grep -w "VERSION_ID" | cut -d "=" -f 2 | tr -d '"')
DATE=$(date +"%Y%m%d-%H%M%S")
INSTALL_PATH="/var/opt/deploy-party"
PROJECTS_PATH="/data"
LOCAL_SETUP=0
HOST_IP=$(hostname -I | cut -d ' ' -f 1)

if [ $OS_TYPE != "ubuntu" ] && [ $OS_TYPE != "debian" ]; then
    echo "This script only supports Ubuntu and Debian for now."
    exit
fi

read -p "Run deploy.party local? (Y/N) " LOCAL
read -p "Please enter the instance name: " NAME

if [ $LOCAL != "N" ] && [ $LOCAL != "n" ]; then
    LOCAL_SETUP=1
    URL="localhost"
else
    LOCAL_SETUP=0
    read -p "Please enter the base url: " URL
    read -p "Please enter the email for ssl certs: " EMAIL
fi

read -p "Please enter the username for traefik: " USERNAME
read -p "Please enter the password for traefik: " PASSWORD

echo "--------------------------------------------------------------------------------"
echo "Welcome to deploy.party installer!"
echo "This script will install everything for you."
echo "--------------------------------------------------------------------------------"

echo "OS: $OS_TYPE $OS_VERSION"

echo "--------------------------------------------------------------------------------"
echo "Installing required packages..."

apt update -y >/dev/null 2>&1
apt install -y curl wget git jq >/dev/null 2>&1

if ! [ -x "$(command -v docker)" ]; then
    echo "--------------------------------------------------------------------------------"
    echo "Docker is not installed. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg

    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update

    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose
    echo "Docker installed successfully"
fi

echo "--------------------------------------------------------------------------------"
echo "Check Docker Configuration..."

mkdir -p /etc/docker
mkdir -p $INSTALL_PATH
mkdir -p $PROJECTS_PATH/projects

chown -R 9999:root $PROJECTS_PATH
chown -R 9999:root $INSTALL_PATH
chmod -R 700 $PROJECTS_PATH
chmod -R 700 $INSTALL_PATH

ENV_PATH="$INSTALL_PATH/.env"

systemctl restart docker

echo "--------------------------------------------------------------------------------"
echo "Download config files for deploy-party..."

if [ $LOCAL_SETUP != 0 ]; then
  curl "https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.traefik-local.yml" >> $INSTALL_PATH/docker-compose.traefik.yml
  curl "https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.prod-local.yml" >> $INSTALL_PATH/docker-compose.yml
else
  curl "https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.traefik.yml" >> $INSTALL_PATH/docker-compose.traefik.yml
  curl "https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.prod.yml" >> $INSTALL_PATH/docker-compose.yml
fi

curl "https://raw.githubusercontent.com/lenneTech/deploy.party/main/reconfigure.sh" >> $INSTALL_PATH/reconfigure.sh
curl "https://raw.githubusercontent.com/lenneTech/deploy.party/main/update.sh" >> $INSTALL_PATH/update.sh
echo "--------------------------------------------------------------------------------"
echo "Init docker swarm..."
docker swarm init
export NODE_ID=$(docker info -f '{{.Swarm.NodeID}}')
docker node update --label-add traefik-public.traefik-public-certificates=true $NODE_ID
echo "Congratulations! Docker is installed."

echo "--------------------------------------------------------------------------------"
echo "Generate keys..."
KEY_FILE="web-push-keys.json"
docker run --rm node:20-alpine sh -c "npx web-push generate-vapid-keys --json" > $KEY_FILE
PUBLIC_KEY=$(jq -r '.publicKey' "$KEY_FILE")
PRIVATE_KEY=$(jq -r '.privateKey' "$KEY_FILE")

echo "--------------------------------------------------------------------------------"
echo "Write $INSTALL_PATH/.env file"
echo "# GENERAL" >> $ENV_PATH
echo "NODE_ENV=production" >> $ENV_PATH
echo "INSTANCE_NAME=$NAME" >> $ENV_PATH
echo "HOST_IP=$HOST_IP" >> $ENV_PATH

if [ $LOCAL_SETUP != 0 ]; then
  echo "TERMINAL_HOST=ws://$HOST_IP:3002" >> $ENV_PATH
  echo "API_URL=http://$HOST_IP:3000" >> $ENV_PATH
else
  echo "TERMINAL_HOST=wss://api.terminal.$URL" >> $ENV_PATH
  echo "API_URL=https://api.$URL" >> $ENV_PATH
fi

echo "STORAGE_PREFIX=$NAME" >> $ENV_PATH
echo "GENERATE_TYPES=0" >> $ENV_PATH

echo "\n# SERVER" >> $ENV_PATH
echo "NSC__ENV=production" >> $ENV_PATH
echo "NSC__INSTANCE_NAME=$NAME" >> $ENV_PATH
echo "NSC__PORT=3000" >> $ENV_PATH
echo "NSC__PROJECTS_DIR=/data/projects" >> $ENV_PATH
echo "NSC__DOCKER_SWARM=true" >> $ENV_PATH
echo "NSC__BUILD_CONCURRENCY=3" >> $ENV_PATH
echo "NSC__ENABLE_METRICS=false" >> $ENV_PATH

echo "\n# JWT" >> $ENV_PATH
echo "NSC__JWT__SECRET=$(openssl rand -base64 32)" >> $ENV_PATH
echo "NSC__JWT__SIGN_IN_OPTIONS__EXPIRES_IN=1d" >> $ENV_PATH
echo "NSC__JWT__REFRESH__RENEWAL=true" >> $ENV_PATH
echo "NSC__JWT__REFRESH__SECRET=$(openssl rand -base64 32)" >> $ENV_PATH
echo "NSC__JWT__REFRESH__SIGN_IN_OPTIONS__EXPIRES_IN=1d" >> $ENV_PATH

echo "\n# MONGO" >> $ENV_PATH
echo "NSC__MONGOOSE__URI=mongodb://db/deploy-party" >> $ENV_PATH

echo "\n# WEB PUSH" >> $ENV_PATH
echo "NSC__WEB_PUSH__PRIVATE_KEY=$PRIVATE_KEY" >> $ENV_PATH
echo "NSC__WEB_PUSH__PUBLIC_KEY=$PUBLIC_KEY" >> $ENV_PATH

echo "\n# GRAPHQL" >> $ENV_PATH
echo "NSC__GRAPHQL__DRIVER__INTROSPECTION=true" >> $ENV_PATH
echo "NSC__GRAPHQL__DRIVER__PLAYGROUND=false" >> $ENV_PATH
echo "NSC__GRAPHQL__MAX_COMPLEXITY=60" >> $ENV_PATH

echo "\n# REDIS" >> $ENV_PATH
echo "NSC__REDIS__HOST=redis" >> $ENV_PATH
echo "NSC__REDIS__PORT=6379" >> $ENV_PATH
echo "NSC__REDIS__USERNAME=default" >> $ENV_PATH
echo "NSC__REDIS__PASSWORD=$(openssl rand -base64 32)" >> $ENV_PATH

echo "\n# SMTP" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__HOST=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__PORT=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__SECURE=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__AUTH__USER=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__AUTH__PASSWORD=" >> $ENV_PATH
echo "NSC__EMAIL__DEFAULT_SENDER_EMAIL=" >> $ENV_PATH
echo "NSC__EMAIL__DEFAULT_SENDER_NAME=" >> $ENV_PATH

if [ $LOCAL_SETUP != 0 ]; then
  echo "NSC__EMAIL_PASSWORD_RESET_LINK=http://$HOST_IP:3001/auth/password-set?token=" >> $ENV_PATH
  echo "\n# Minio configuration" >> $ENV_PATH
  echo "MINIO_SERVER_URL=" >> $ENV_PATH
  echo "MINIO_BROWSER_REDIRECT_URL="  >> $ENV_PATH
else
  echo "NSC__EMAIL_PASSWORD_RESET_LINK=https://$URL/auth/password-set?token=" >> $ENV_PATH
  echo "\n# Minio configuration" >> $ENV_PATH
  echo "MINIO_SERVER_URL=https://s3.$URL" >> $ENV_PATH
  echo "MINIO_BROWSER_REDIRECT_URL=https://s3.$URL"  >> $ENV_PATH
fi

echo "MINIO_ROOT_USER=root" >> $ENV_PATH
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"  >> $ENV_PATH

echo "\n# TRAEFIK" >> $ENV_PATH
echo "EMAIL=$EMAIL" >> $ENV_PATH
echo "APP_URL=$URL" >> $ENV_PATH
echo "DOMAIN=lb.$URL" >> $ENV_PATH
echo "USERNAME=$USERNAME" >> $ENV_PATH
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
echo "HASHED_PASSWORD=$HASHED_PASSWORD" >> $ENV_PATH
export NODE_ID=$(docker info -f '{{.Swarm.NodeID}}')
echo "NODE_ID=$NODE_ID" >> $ENV_PATH

echo "--------------------------------------------------------------------------------"
echo "Load .env file for traefik"
# Load local .env
if [ -f $ENV_PATH ]; then
    # Load Environment Variables
    export $(cat $ENV_PATH | grep -v '#' | awk '/=/ {print $1}')
fi

echo "--------------------------------------------------------------------------------"
echo "Start registry"
docker run -d -p 5000:5000 --restart=always -e REGISTRY_STORAGE_DELETE_ENABLED='true' --name registry registry:2

echo "--------------------------------------------------------------------------------"
echo "Start traefik"
docker network create --driver=overlay traefik-public
docker stack deploy -c $INSTALL_PATH/docker-compose.traefik.yml traefik

echo "--------------------------------------------------------------------------------"
echo "Start deploy.party"
docker network create --driver=overlay deploy-party
docker pull ghcr.io/lennetech/deploy.party/app:latest
docker pull ghcr.io/lennetech/deploy.party/api:latest
docker stack deploy -c $INSTALL_PATH/docker-compose.yml deploy-party


echo "--------------------------------------------------------------------------------"
echo "Waiting for deploy.party to start..."

TIMEOUT=180
START_TIME=$(date +%s)

while true; do
    CONTAINER_ID=$(docker ps --filter "ancestor=ghcr.io/lennetech/deploy.party/app:latest" --format "{{.ID}}")
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null)

    if [ "$STATUS" = "healthy" ]; then
        if [ $LOCAL_SETUP != 0 ]; then
          echo "\nCongratulations! Your deploy.party instance is ready to use. \n"
          echo "deploy.party is running on http://$HOST_IP:3001 \n"
          echo "Minio is running on http://$HOST_IP:9000 \n"
          exit 0
        else
          echo "\n--------------------------------------------------------------------------------"
          echo "Setup firewall..."
          ufw allow 22
          ufw allow 80/tcp
          ufw allow 443/tcp
          ufw default allow outgoing
          ufw default deny incoming
          ufw deny 27017/tcp
          ufw enable
          echo "--------------------------------------------------------------------------------"
          echo "\nCongratulations! Your deploy.party instance is ready to use.\nOpen https://$URL in your browser. \n"
          exit 0
        fi
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