#!/bin/bash
# Binds the local deploy.party registry to 127.0.0.1 (DEV-4027).
#
# Why: install.sh used to start the registry with `-p 5000:5000` and without authentication. Docker
# publishes that on every interface, IPv4 and IPv6, and bypasses UFW. Whether the internet could
# read every image, including the `.env` and `.git` baked into it, depended on the provider
# firewall alone. On 05.11.2026 a registry without such a firewall leaked production secrets.
#
# What it does: recreates the container `registry` with the same image, the same registry settings
# and the SAME data volume, published on 127.0.0.1:5000 only. deploy.party, Swarm and the
# registry-gc job reach it as `localhost:5000` on the node itself, so nothing changes for them.
# The old container is kept, stopped, as `registry-pre-localhost` for a rollback.
#
# Safety:
#   - refuses on a multi-node swarm (other nodes pull from this registry and would lose access)
#   - refuses while a push is running (POST/PATCH/PUT in the registry log of the last 10 minutes)
#   - compares the image catalog before and after and rolls back on any difference
#
# Usage:
#   bash secure-registry.sh             switch (idempotent, does nothing if already on 127.0.0.1)
#   bash secure-registry.sh --check     report only, exit 2 if the registry is still public
#   bash secure-registry.sh --rollback  restore the previous container
#   bash secure-registry.sh --cleanup   remove the stopped backup container (the volume stays)
set -euo pipefail

# NAME, BACKUP and PORT are only overridden to test the script against a throwaway registry.
NAME=${NAME:-registry}
BACKUP=${BACKUP:-registry-pre-localhost}
PORT=${PORT:-5000}
MODE=${1:-switch}
PUSH_WINDOW=${PUSH_WINDOW:-10m}

bindings() { docker inspect -f '{{json .HostConfig.PortBindings}}' "$1"; }
# Full repository list. The registry pages the catalog (n is capped at 1000), so follow `Link`.
catalog() {
  local path="/v2/_catalog?n=1000" headers out=""
  headers=$(mktemp)
  while [ -n "$path" ]; do
    out+=$(curl -fsS --max-time 15 -D "$headers" "http://127.0.0.1:${PORT}${path}")$'\n'
    path=$(grep -i '^link:' "$headers" | sed -E 's/.*<([^>]+)>.*/\1/' | tr -d '\r' || true)
  done
  rm -f "$headers"
  printf '%s' "$out"
}
wait_ready() {
  for _ in $(seq 1 30); do
    curl -fsS --max-time 2 -o /dev/null http://127.0.0.1:${PORT}/v2/ && return 0
    sleep 1
  done
  return 1
}

rollback() {
  docker inspect "$BACKUP" >/dev/null 2>&1 || { echo "No container '$BACKUP', nothing to roll back."; return 1; }
  # `docker rm` without -v keeps the volume, which the backup container mounts as well.
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker rename "$BACKUP" "$NAME"
  docker update --restart=always "$NAME" >/dev/null
  docker start "$NAME" >/dev/null
  wait_ready || echo "WARNING: registry does not answer on 127.0.0.1:${PORT} after the rollback."
  echo "Rolled back. Bindings: $(bindings "$NAME")"
}

case "$MODE" in
  --rollback) rollback; exit $? ;;
  --cleanup)
    docker inspect "$BACKUP" >/dev/null 2>&1 || { echo "No container '$BACKUP'."; exit 0; }
    docker rm "$BACKUP" >/dev/null
    echo "Removed '$BACKUP'. The data volume stays with '$NAME'."
    exit 0 ;;
  switch|--check) ;;
  *) echo "Unknown option: $MODE"; exit 1 ;;
esac

docker inspect "$NAME" >/dev/null 2>&1 || { echo "No container named '$NAME'."; exit 1; }
CURRENT=$(bindings "$NAME")
if [[ "$CURRENT" != *'"HostIp":""'* && "$CURRENT" == *'"HostIp":"127.0.0.1"'* ]]; then
  echo "Registry already bound to 127.0.0.1 only: $CURRENT"
  exit 0
fi
if [ "$MODE" = "--check" ]; then
  echo "Registry is published on all interfaces: $CURRENT"
  exit 2
fi

NODES=$(docker info --format '{{.Swarm.Nodes}}' 2>/dev/null || echo 0)
if [ "${NODES:-0}" -gt 1 ]; then
  echo "ABORT: the swarm has $NODES nodes. The other nodes pull from this registry and would lose access."
  exit 1
fi
if docker inspect "$BACKUP" >/dev/null 2>&1; then
  echo "ABORT: '$BACKUP' already exists. Run --rollback or --cleanup first."
  exit 1
fi

VOLUME=$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/lib/registry"}}{{.Name}}{{end}}{{end}}' "$NAME")
[ -n "$VOLUME" ] || { echo "ABORT: the registry data is not on a volume."; exit 1; }
IMAGE=$(docker inspect -f '{{.Image}}' "$NAME")
mapfile -t REGISTRY_ENV < <(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$NAME" | grep '^REGISTRY_' || true)
ENV_ARGS=()
for e in "${REGISTRY_ENV[@]}"; do [ -n "$e" ] && ENV_ARGS+=(-e "$e"); done

# Count instead of `grep -q`: with pipefail, grep -q exits on the first match, `docker logs` dies of
# SIGPIPE and the whole pipeline counts as failed, so the guard would wave a running push through.
PUSHES=$(docker logs "$NAME" --since "$PUSH_WINDOW" 2>&1 | grep -cE 'http\.request\.method=(POST|PATCH|PUT)' || true)
if [ "${PUSHES:-0}" -gt 0 ]; then
  echo "ABORT: push activity in the last $PUSH_WINDOW. Try again when no build is running."
  exit 3
fi

BEFORE=$(catalog)
echo "Volume: $VOLUME"
echo "Image:  $IMAGE"
echo "Repositories before: $(echo "$BEFORE" | grep -o '"[^"]*"' | grep -vc '"repositories"')"

docker stop "$NAME" >/dev/null
docker rename "$NAME" "$BACKUP"
docker update --restart=no "$BACKUP" >/dev/null

if ! docker run -d --name "$NAME" --restart=always -p "127.0.0.1:${PORT}:5000" \
  -v "$VOLUME:/var/lib/registry" "${ENV_ARGS[@]}" "$IMAGE" >/dev/null; then
  echo "ERROR: could not start the new registry, rolling back."
  rollback
  exit 1
fi

if ! wait_ready; then
  echo "ERROR: the new registry does not answer, rolling back."
  rollback
  exit 1
fi

AFTER=$(catalog)
if [ "$BEFORE" != "$AFTER" ]; then
  echo "ERROR: the catalog differs after the switch, rolling back."
  rollback
  exit 1
fi

echo "Registry now bound to: $(bindings "$NAME")"
echo "Catalog unchanged. The old container is kept stopped as '$BACKUP'."
echo "Remove it once deployments work: bash secure-registry.sh --cleanup"
