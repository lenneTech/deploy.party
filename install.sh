#!/bin/sh

# Exit in case of error
set -e

OS_TYPE=$(cat /etc/os-release | grep -w "ID" | cut -d "=" -f 2 | tr -d '"')
OS_VERSION=$(cat /etc/os-release | grep -w "VERSION_ID" | cut -d "=" -f 2 | tr -d '"')
DATE=$(date +"%Y%m%d-%H%M%S")
INSTALL_PATH="/var/opt/deploy-party"
PROJECTS_PATH="/data"
LOCAL_SETUP=0

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
echo "--------------------------------------------------------------------------------"
echo "Init docker swarm..."
docker swarm init
export NODE_ID=$(docker info -f '{{.Swarm.NodeID}}')
docker node update --label-add traefik-public.traefik-public-certificates=true $NODE_ID
echo "Congratulations! Docker is installed."

echo "--------------------------------------------------------------------------------"
echo "Write $INSTALL_PATH/.env file"
echo "NODE_ENV=production" >> $ENV_PATH

if [ $LOCAL_SETUP != 0 ]; then
  echo "TERMINAL_HOST=ws://localhost:3002" >> $ENV_PATH
  echo "API_URL=http://localhost:3000" >> $ENV_PATH
else
  echo "TERMINAL_HOST=wss://api.terminal.$URL" >> $ENV_PATH
  echo "API_URL=https://api.$URL" >> $ENV_PATH
fi

echo "STORAGE_PREFIX=$NAME" >> $ENV_PATH
echo "GENERATE_TYPES=0" >> $ENV_PATH

echo "NSC__ENV=production" >> $ENV_PATH
echo "NSC__INSTANCE_NAME=$NAME" >> $ENV_PATH
echo "NSC__PORT=3000" >> $ENV_PATH
echo "NSC__PROJECTS_DIR=/data/projects" >> $ENV_PATH
echo "NSC__DOCKER_SWARM=true" >> $ENV_PATH
echo "NSC__BUILD_CONCURRENCY=3" >> $ENV_PATH
echo "NSC__ENABLE_METRICS=false" >> $ENV_PATH

echo "# JWT" >> $ENV_PATH
echo "NSC__JWT__SECRET=$(openssl rand -base64 32)" >> $ENV_PATH
echo "NSC__JWT__SIGN_IN_OPTIONS__EXPIRES_IN=1d" >> $ENV_PATH
echo "NSC__JWT__REFRESH__RENEWAL=true" >> $ENV_PATH
echo "NSC__JWT__REFRESH__SECRET=$(openssl rand -base64 32)" >> $ENV_PATH
echo "NSC__JWT__REFRESH__SIGN_IN_OPTIONS__EXPIRES_IN=1d" >> $ENV_PATH

echo "# MONGO" >> $ENV_PATH
echo "NSC__MONGOOSE__URI=mongodb://db/deploy-party" >> $ENV_PATH

echo "# WEB PUSH" >> $ENV_PATH
echo "NSC__WEB_PUSH__PRIVATE_KEY=$(openssl rand -base64 32)" >> $ENV_PATH
echo "NSC__WEB_PUSH__PUBLIC_KEY=$(openssl rand -base64 32)" >> $ENV_PATH

echo "# GRAPHQL" >> $ENV_PATH
echo "NCS__GRAPHQL__DRIVER__INTROSPECTION=true" >> $ENV_PATH
echo "NCS__GRAPHQL__DRIVER__PLAYGROUND=false" >> $ENV_PATH
echo "NCS__GRAPHQL__MAX_COMPLEXITY=60" >> $ENV_PATH

echo "# REDIS" >> $ENV_PATH
echo "NSC__REDIS__HOST=redis" >> $ENV_PATH
echo "NSC__REDIS__PORT=6379" >> $ENV_PATH
echo "NSC__REDIS__USERNAME=default" >> $ENV_PATH
echo "NSC__REDIS__PASSWORD=$(openssl rand -base64 32)" >> $ENV_PATH

echo "# SMTP" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__HOST=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__PORT=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__SECURE=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__AUTH__USER=" >> $ENV_PATH
echo "NSC__EMAIL__SMTP__AUTH__PASSWORD=" >> $ENV_PATH
echo "NSC__EMAIL_DEFAULT_SENDER_EMAIL=" >> $ENV_PATH
echo "NSC__EMAIL_DEFAULT_SENDER_NAME=" >> $ENV_PATH
echo "NSC__EMAIL_PASSWORD_RESET_LINK=https://$URL/auth/password-set?token=" >> $ENV_PATH

echo "# Minio configuration" >> $ENV_PATH
echo "MINIO_SERVER_URL=https://s3.$URL" >> $ENV_PATH
echo "MINIO_BROWSER_REDIRECT_URL=https://s3.$URL"  >> $ENV_PATH
echo "MINIO_ROOT_USER=root" >> $ENV_PATH
echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"  >> $ENV_PATH

echo "# TRAEFIK" >> $ENV_PATH
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
docker pull ghcr.io/lenneTech/deploy.party/app:latest
docker pull ghcr.io/lenneTech/deploy.party/api:latest
docker stack deploy -c $INSTALL_PATH/docker-compose.yml deploy-party

echo "--------------------------------------------------------------------------------"
if [ $LOCAL_SETUP != 0 ]; then
  echo "\nCongratulations! Your deploy.party instance is ready to use. \n"
  echo "\deploy.party is running on http://localhost:3001 \n"
  echo "\nTraefik dashboard is running on http://localhost:8080 \n"
else
  echo "\nCongratulations! Your deploy.party instance is ready to use. Open https://$URL in your browser. \n"
  echo "!!! IMPORTANT: Please configure firewall rules for your server:"
  echo "ufw allow 22"
  echo "ufw allow 80/tcp"
  echo "ufw allow 443/tcp"
  echo "ufw default allow outgoing"
  echo "ufw default deny incoming"
  echo "ufw deny 27017/tcp"
  echo "ufw enable"
fi
