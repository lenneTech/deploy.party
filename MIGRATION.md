# Traefik v2 to v3 Migration Guide

This guide helps you migrate your existing deploy.party installation from Traefik v2 to v3.

## Prerequisites

- Existing deploy.party installation with Traefik v2
- SSH access to your server
- Root or sudo permissions

## Important Information

### What Changes?
- **Traefik image**: v2.11 → v3.5
- **Provider syntax**: `--providers.docker.swarmmode` → `--providers.swarm.endpoint=unix:///var/run/docker.sock`

### What Stays the Same?
- **All your containers** - No changes needed! 100% compatible
- **Docker labels** - All dynamic configuration remains identical
- **SSL certificates** - Will be preserved
- **Network configuration** - traefik-public network stays the same
- **Middleware** - All middleware configurations work without changes

## Migration Options

Choose one of the following migration methods:

---

## Option 1: Automated Migration (Recommended)

Use the automated upgrade script for a safe, guided migration:

### Step 1: SSH to your server
```bash
ssh root@YOUR_SERVER_IP
```

### Step 2: Download the upgrade script
```bash
cd /var/opt/deploy-party
curl -fsSL https://raw.githubusercontent.com/lenneTech/deploy.party/main/upgrade-traefik-v3.sh -o upgrade-traefik-v3.sh
chmod +x upgrade-traefik-v3.sh
```

### Step 3: Run the upgrade script
```bash
./upgrade-traefik-v3.sh
```

The script will:
- ✅ Automatically detect your setup type (local/production)
- ✅ Create a timestamped backup of your current configuration
- ✅ Stop Traefik v2 safely
- ✅ Download the correct v3 configuration
- ✅ Start Traefik v3
- ✅ Verify the upgrade was successful
- ✅ Show you verification commands
- ✅ Provide rollback instructions if anything goes wrong

### Step 4: Verify the migration
```bash
# Check Traefik is running
docker ps | grep traefik

# Check Traefik logs
docker logs $(docker ps -q -f name=traefik)

# Verify version
docker exec $(docker ps -q -f name=traefik) traefik version
```

### Step 5: Test your applications
- Visit your Traefik dashboard at `lb.YOUR_URL`
- Test a few of your deployed applications
- All should work exactly as before

---

## Option 2: Manual Migration

If you prefer to do it manually or the automated script fails:

### Step 1: SSH to your server
```bash
ssh root@YOUR_SERVER_IP
cd /var/opt/deploy-party
```

### Step 2: Load environment variables
```bash
export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
```

### Step 3: Create a backup
```bash
cp docker-compose.traefik.yml docker-compose.traefik.yml.backup.v2
```

### Step 4: Stop Traefik v2
```bash
docker stack rm traefik
```

### Step 5: Wait for complete shutdown
```bash
# Wait until no traefik containers are shown (20-30 seconds)
docker ps | grep traefik
```

### Step 6: Download new v3 configuration

**For Production Setup:**
```bash
curl -o docker-compose.traefik.yml https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.traefik.yml
```

**For Local Development Setup:**
```bash
curl -o docker-compose.traefik.yml https://raw.githubusercontent.com/lenneTech/deploy.party/main/docker-compose.traefik-local.yml
```

### Step 7: Deploy Traefik v3
```bash
export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
docker stack deploy -c docker-compose.traefik.yml traefik
```

### Step 8: Verify the deployment
```bash
# Check container status
docker ps | grep traefik

# Check logs
docker logs $(docker ps -q -f name=traefik)

# Verify version
docker exec $(docker ps -q -f name=traefik) traefik version
```

### Step 9: Test your applications
- Access Traefik dashboard: `lb.YOUR_URL`
- Test your deployed applications
- Everything should work as before

---

## Rollback to v2

If you encounter any issues with v3, you can easily rollback:

### Using the backup file
```bash
cd /var/opt/deploy-party
docker stack rm traefik
sleep 20
mv docker-compose.traefik.yml.backup.v2 docker-compose.traefik.yml
export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
docker stack deploy -c docker-compose.traefik.yml traefik
```

### Using install.sh with v2 flag
```bash
curl -fsSL https://raw.githubusercontent.com/lenneTech/deploy.party/main/install.sh -o install.sh
chmod +x install.sh
./install.sh --traefik-v2 [your other options...]
```

---

## Troubleshooting

### Traefik won't start
```bash
# Check Docker logs
docker service logs traefik_traefik

# Check if traefik-public network exists
docker network ls | grep traefik-public

# If network is missing, create it
docker network create --driver=overlay traefik-public
```

### Containers can't be reached
```bash
# Check if containers are in the traefik-public network
docker network inspect traefik-public

# Restart a specific stack
docker stack rm YOUR_STACK_NAME
sleep 10
docker stack deploy -c /data/projects/YOUR_PROJECT/docker-compose.yml YOUR_STACK_NAME
```

### SSL certificates not working
```bash
# Check Traefik logs for ACME errors
docker logs $(docker ps -q -f name=traefik) | grep acme

# Check certificates volume
docker volume inspect traefik_traefik-public-certificates

# If needed, remove and recreate (certificates will be re-issued)
# WARNING: This will cause brief downtime
docker stack rm traefik
docker volume rm traefik_traefik-public-certificates
# Then redeploy Traefik
```

### Dashboard not accessible
```bash
# Verify environment variables are set
echo $DOMAIN
echo $USERNAME

# Ensure you're using the correct URL
# Should be: lb.YOUR_DOMAIN

# Check basic auth middleware
docker exec $(docker ps -q -f name=traefik) cat /etc/traefik/traefik.yml
```

---

## Post-Migration Checklist

After successful migration, verify:

- [ ] Traefik dashboard accessible at `lb.YOUR_URL`
- [ ] All containers accessible via their URLs
- [ ] SSL/HTTPS working properly
- [ ] HTTP to HTTPS redirect working
- [ ] Basic auth on Traefik dashboard working
- [ ] Container logs accessible
- [ ] New container deployments work
- [ ] Container updates work
- [ ] Terminal access works (if used)

---

## Support

If you encounter issues during migration:

1. **Check logs**: `docker logs $(docker ps -q -f name=traefik)`
2. **Verify configuration**: Compare your docker-compose.traefik.yml with the v3 template
3. **Rollback**: Use the rollback instructions above
4. **Report issue**: https://github.com/lenneTech/deploy.party/issues

---

## Key Differences: v2 vs v3

For reference, here are the main configuration differences:

### Traefik v2 Configuration
```yaml
image: traefik:v2.11
command:
  - --providers.docker
  - --providers.docker.constraints=Label(`traefik.constraint-label`, `traefik-public`)
  - --providers.docker.exposedbydefault=false
  - --providers.docker.swarmmode
```

### Traefik v3 Configuration
```yaml
image: traefik:v3.5
command:
  - --providers.swarm.endpoint=unix:///var/run/docker.sock
  - --providers.swarm.constraints=Label(`traefik.constraint-label`, `traefik-public`)
  - --providers.swarm.exposedbydefault=false
```

**Note**: All other configuration (labels, middleware, entrypoints, certificates) remains identical.

---

## Additional Resources

- [Traefik v3 Migration Guide](https://doc.traefik.io/traefik/migration/v2-to-v3/)
- [deploy.party Documentation](https://github.com/lenneTech/deploy.party)
- [Traefik v3 Documentation](https://doc.traefik.io/traefik/)
