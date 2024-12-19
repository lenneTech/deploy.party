# deploy.party - quick deploy, party enjoy!
deploy.party is a simple and easy-to-use deployment tool for your applications.

## Features
- 🎉 Deploy any application with a simple UI
- 🎉 Deploy directly from GitLab or GitHub
- 🎉 Deploy docker image to local registry or other registries
- 🎉 Start databases with a single click (MongoDB, MariaDB)
- 🎉 Create custom containers with custom docker-compose and Dockerfile
- 🎉 Split your containers into projects
- 🎉 Automatic SSL and www-redirect
- 🎉 Simple backups to S3 compatible storage
- 🎉 Integrated terminal for direct access to the container _beta_
- 🎉 See logs of your containers
- 🎉 See statistics of your containers

## Requirements
- Server access with root permissions
- **Configure DNS** with A record for `YOUR_URL` and `*.YOUR_URL` to `SERVER_IP`.

## Installation
Replace follow placeholders with your values:  
`SERVER_IP`: IP of the server  

### 1. Connect to server as root
```bash
ssh root@SERVER_IP
```
```bash
apt-get update && apt-get upgrade -y
```

### 2. Run install script
```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/lenneTech/deploy-party/main/install.sh)"
```

### 6. Configure ufw
```bash
ufw allow 22
```  
```bash
ufw allow ssh
```  
```bash
ufw allow 80/tcp
```  
```bash
ufw allow 443/tcp
```  
```bash
ufw default allow outgoing
```  
```bash
ufw default deny incoming
```  
```bash
ufw deny 27017/tcp
```  
```bash
ufw enable
```

### 7. Install fail2ban (optional)
https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-22-04

### 8. Configure deploy.party in .env file (optional)
```bash
nano /var/opt/deploy-party/data/.env
```

### 9. Reconfigure deploy.party
```bash
sh /var/opt/deploy-party/reconfigure.sh
```

### 10. Check container are running
```bash
docker ps
```

### 12. Check urls
Now Traefik UI will be available at `lb.YOUR_URL` and deploy.party at `YOUR_URL`.
Traefik has basic auth lock and can be accessed with the `USERNAME` and `PASSWORD` you set in the init.sh script.

On **local setup**:
- Traefik UI: [http://localhost:8080](http://localhost:8080)
- Deploy Party API: [http://localhost:3000](http://localhost:3000)
- Deploy Party: [http://localhost:3001](http://localhost:3001)
- Deploy Party Terminal API: [http://localhost:3002](http://localhost:3002)
- Minio API: [http://localhost:3003](http://localhost:3003)
- Minio UI: [http://localhost:3004](http://localhost:3004)

### 13. Login to deploy.party  
Default credentails are:  
`admin@deploy.party`  
`deploy-party`  

**Please create a new admin account and delete the old one.**

# Configuration of deploy-party

### Create new admin account or invite new users
1. Click on plus in topbar and create new member
2. Fill form and choose the right role
3. The invited user receives an e-mail with the request to set a password.

### Create source
1. Go to sources
2. Click on plus in topbar and create new source
3. Enter name of source for example GitLab
4. Enter the URL of the GitLab instance for example https://gitlab.com
5. Enter the personal access token for the GitLab API [GitLab Docs](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
    - Create personal access token with following scopes: `api, read_api, read_registry, write_registry`
    - Personal access token global (-/user_settings/personal_access_tokens) or Personal access token for project (/GROUP/PROJECT/-/settings/access_tokens)

### Create your first project
1. Click on plus in topbar and create new project
2. Enter name for project

### Create your first container
1. Click on plus in topbar and create new container
2. Select the created project
3. Enter the name of the container
4. Choose the kind of container (`APPLICATION`, `DATABASE`, `SERVICE`, `CUSTOM`)
    - `APPLICATION`: A normal application
    - `DATABASE`: A database
    - `SERVICE`: A service like a directus, ...
    - `CUSTOM`: A custom container with custom docker-compose and Dockerfile
5. Select the source
6. Enter the image name
7. Select registry
8. Enter commands
9. Enter environment variables
10. Enter ports
11. Start the container

## Helpful commands

## Update deploy.party
```bash
sh /var/opt/deploy-party/update.sh
```

## Show all containers
```bash
docker ps
```

## Find deploy party containers by name and show logs
```bash
docker logs DOCKER_ID_OF_CONTAINER
```

## Restart container of deploy.party
```bash
docker stop DOCKER_ID_OF_CONTAINER && docker rm DOCKER_ID_OF_CONTAINER
```

## Restart traefik
```bash
docker stack rm traefik
```

**Wait if traefik container not shown under `docker ps`** before you run the next command.

```bash
cd /var/opt/deploy-party
```
```bash
export $(cat /data/.env | grep -v '#' | awk '/=/ {print $1}') && docker stack deploy -c docker-compose.traefik.yml traefik
```

## Restart deploy.party
```bash
docker stack rm deploy-party
```

**Wait if traefik container not shown under `docker ps`** before you run the next command.

```bash
cd /var/opt/deploy-party
```
**Replace `$URL` with your URL.**

```bash
docker stack deploy -c docker-compose.yml deploy-party
```