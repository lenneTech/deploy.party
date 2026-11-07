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

## Install
Replace follow placeholders with your values:  
`SERVER_IP`: IP of the server  

```bash
ssh root@SERVER_IP
```

### Interactive Installation
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/lenneTech/deploy.party/main/install.sh)"
```

### Automated Installation
For automated deployments, you can pass parameters directly to the install script:

```bash
# Download install script
curl -fsSL https://raw.githubusercontent.com/lenneTech/deploy.party/main/install.sh -o install.sh
chmod +x install.sh

# Local installation
./install.sh --local --name my-instance --username admin --password secret123

# Production installation  
./install.sh --name my-instance --url example.com --email admin@example.com --username admin --password secret123
```

#### Available Parameters
- `-l, --local` - Run deploy.party locally (skips URL and email prompts)
- `-n, --name NAME` - Instance name
- `-u, --url URL` - Base URL (required for production setup)
- `-e, --email EMAIL` - Email for SSL certificates (required for production setup)
- `--username USER` - Username for Traefik dashboard
- `--password PASS` - Password for Traefik dashboard
- `-h, --help` - Show help message

#### Examples
```bash
# Minimal local setup
./install.sh -l -n dev-server --username admin --password mypassword

# Full production setup
./install.sh -n production \
             -u mydomain.com \
             -e admin@mydomain.com \
             --username traefik-admin \
             --password secure-password-123

# Get help
./install.sh --help
```

**Note:** Any missing parameters will be prompted interactively during installation.

#### Install fail2ban (optional)
https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-ubuntu-22-04

## Configuration
```bash
nano /var/opt/deploy-party/data/.env
```

After you have configured the `.env` file, you can reconfigure the deploy.party with the following command:
```bash
sh /var/opt/deploy-party/reconfigure.sh
```

## Update
```bash
sh /var/opt/deploy-party/update.sh
```

### Registry only on localhost (installs before DEV-4027)

Older installs started the local registry with `-p 5000:5000`. It has no authentication, and Docker bypasses UFW, so every image (including its `.env`) was readable from the internet unless the provider firewall blocked port 5000. New installs bind it to `127.0.0.1`. For an existing install, run once:

```bash
cd /var/opt/deploy-party
curl -fsSL https://raw.githubusercontent.com/lenneTech/deploy.party/main/secure-registry.sh -o secure-registry.sh
bash secure-registry.sh --check   # exit 2: still public
bash secure-registry.sh           # switch; keeps the data volume, rolls back by itself on any difference
bash secure-registry.sh --cleanup # after the next successful deploy: remove the stopped old container
```

The script refuses on a multi-node swarm (other nodes pull from this registry) and while a push is running. `--rollback` restores the previous container. Once `secure-registry.sh` sits next to `update.sh`, every update runs it as well.

### Build files from the container settings (installs before DEV-4068)

A build used to take the `Dockerfile` and `docker-compose.yml` that were on disk. Only a deploy from the UI and a tag build wrote them again from the container settings, so a changed setting went live only after a deploy, and the healthcheck of NODE containers and the rollback settings of CUSTOM containers reached existing containers only that way. With `NSC__REFRESH_BUILD_FILES=true` every build writes both files from the settings first; a file whose content changes is kept as `Dockerfile.prev` or `docker-compose.yml.prev`, and the build log says which file changed. New installs set it. For an existing install, check first what the first builds would change:

```bash
docker exec $(docker ps -qf name=deploy-party_api) node dist/src/server/scripts/build-files-drift.js
```

One line per container: `UNCHANGED`, `EXPECTED` (only the healthcheck, the update and rollback settings or a basic-auth label in the new hash format) or `OTHER` with the keys that differ (never values). Settle every `OTHER` first: settings that were changed but never deployed, or a file edited by hand on the server. Then add `NSC__REFRESH_BUILD_FILES=true` to `/var/opt/deploy-party/.env` and run `update.sh`.

### Webhook secret (installs before DEV-4068)

`POST /webhook` used to accept every request: whoever knew a GitLab project id could start builds, and for containers with a tag pattern choose the tag that gets deployed. Every source now has its own secret (created by a migration for existing sources), which GitLab sends as `X-Gitlab-Token`; new hooks created from the UI carry it. `NSC__WEBHOOK_TOKEN_MODE` switches the check: `off` (default), `report` (accept, but log every request without the right secret) or `enforce` (build only with the secret; otherwise HTTP 401). New installs set `enforce`. For an existing install:

1. Run `update.sh` (the migration creates the secrets), set `NSC__WEBHOOK_TOKEN_MODE=report` and run `update.sh` again.
2. Put the secrets into the existing hooks. The GitLab token goes in on stdin and needs Maintainer rights with scope `api`; the script prints only project and hook ids:
   ```bash
   printf '%s\n' "$GITLAB_ADMIN_TOKEN" | docker exec -i $(docker ps -qf name=deploy-party_api) \
     node dist/src/server/scripts/webhook-secret-hooks.js --gitlab-host gitlab.example.com          # dry run
   printf '%s\n' "$GITLAB_ADMIN_TOKEN" | docker exec -i $(docker ps -qf name=deploy-party_api) \
     node dist/src/server/scripts/webhook-secret-hooks.js --gitlab-host gitlab.example.com --apply
   ```
3. Watch the API log for `came with no X-Gitlab-Token` / `a wrong X-Gitlab-Token` (for example CI jobs that call the webhook themselves). When nothing shows up any more, set `NSC__WEBHOOK_TOKEN_MODE=enforce` and run `update.sh`.

### Swagger (off since 2.21.2)

The API served Swagger UI under `api.YOUR_URL/api` and the OpenAPI document under `/api-json` to everyone. Both are off now; deploy.party itself does not use them. To switch them on for an instance, set `NSC__SWAGGER=true` in the `.env` and run `update.sh`.

## URLs
Now Traefik UI will be available at `lb.YOUR_URL` and deploy.party at `YOUR_URL`.
Traefik has basic auth lock and can be accessed with the `USERNAME` and `PASSWORD` you set in the init.sh script.

On **local setup**:
- Deploy Party: [http://[IP]:3001](http://[IP]:3001)
- Minio UI: [http://[IP]:3004](http://[IP]:9000)
- Deploy Party API: [http://[IP]:3000](http://[IP]:3000)
- Deploy Party Terminal API: [http://[IP]:3002](http://[IP]:3002)
- Minio API: [http://[IP]:3003](http://[IP]:9001)

## First steps
Default credentails are:  
`admin@deploy.party`  
`deploy-party`  

**Please create a new admin account and delete the old one.**

## Usage

### Create new admin account or invite new users
1. Click on plus in topbar and create new member
2. Fill form and choose the right role
3. The invited user receives an e-mail with the request to set a password.

### Create source
1. Go to sources
2. Click on plus in topbar and create new source
3. Enter name of source for example GitLab
4. Enter the URL of the GitLab instance for example https://gitlab.com
5. Enter an access token for the GitLab API [GitLab Docs](https://docs.gitlab.com/user/project/settings/project_access_tokens/)
    - **Use a project or group access token, not a personal one.** deploy.party uses the token to clone, to list projects, branches and releases, and to create the webhook, so it needs the role Maintainer and the scope `api`. Add `read_registry, write_registry` only if you push to the GitLab registry.
    - A personal access token reaches every project of its owner. If it leaks, all of them are exposed, not only the deployed ones. A project token (`/GROUP/PROJECT/-/settings/access_tokens`) or group token (`/groups/GROUP/-/settings/access_tokens`) is limited to what deploy.party deploys.
    - Give the token an expiry date and note where it is used.
    - Since DEV-4027 the token is passed to `git clone` as a header and no longer stored in the clone (`.git/config`), in the image or in the build log.

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

### Restart traefik
```bash
docker stack rm traefik
```

**Wait if traefik container not shown under `docker ps`** before you run the next command.

```bash
cd /var/opt/deploy-party
```
```bash
export $(cat .env | grep -v '#' | awk '/=/ {print $1}') && docker stack deploy -c docker-compose.traefik.yml traefik
```

## Restart deploy.party
```bash
cd /var/opt/deploy-party
```
```bash
sh reconfigure.sh
```

## Migration to Traefik v3

As of the latest version, deploy.party uses **Traefik v3** by default. If you have an existing installation running Traefik v2, please see the comprehensive migration guide:

📖 **[Complete Migration Guide (MIGRATION.md)](MIGRATION.md)**

The guide includes:
- ✅ Automated migration script (recommended)
- ✅ Manual migration steps
- ✅ Rollback instructions
- ✅ Troubleshooting guide
- ✅ Post-migration checklist

### Quick Start

For a quick automated migration:

```bash
cd /var/opt/deploy-party
curl -fsSL https://raw.githubusercontent.com/lenneTech/deploy.party/main/upgrade-traefik-v3.sh -o upgrade-traefik-v3.sh
chmod +x upgrade-traefik-v3.sh

# Interactive mode (prompts for API URL and token)
./upgrade-traefik-v3.sh

# Or with parameters for automation
./upgrade-traefik-v3.sh --api-url https://api.deploy.party --api-token dp-xxx...

# Skip container migration
./upgrade-traefik-v3.sh --skip-migration

# Skip deploy.party update
./upgrade-traefik-v3.sh --skip-deploy-party-update
```

**What you'll need:**
- 🌐 **API URL** (optional - auto-detected from APP_URL if available)
  - Format: `https://api.YOUR_DOMAIN` or `https://YOUR_DOMAIN:3000`
  - The script will try to auto-detect or prompt you
- 🔑 **API Token** (optional but recommended for automatic container migration)
  - Get it from: Settings → API Keys in your deploy.party UI
  - Starts with `dp-`
  - Can be passed via `--api-token` flag or entered interactively

**What happens:**
- ⚠️ Traefik v3 requires middleware syntax changes (`@swarm` suffix)
- 🔄 All deployed containers will be restarted with updated configuration (rolling update)
- ⏱️ Each container has ~5-10 seconds downtime during restart
- ✅ Docker Compose files are automatically regenerated
- 🚀 deploy.party is updated to the latest version
