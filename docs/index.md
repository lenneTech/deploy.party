---
title: deploy.party
description: A self-hosted deployment tool on Docker Swarm. Build and run applications from GitLab or GitHub, start databases, and get SSL, backups and logs from one UI.
navigation:
  title: Overview
---

deploy.party runs on your own server and deploys your applications from a web UI.

- Deploy any application from GitLab or GitHub
- Push images to the local registry or to other registries
- Start databases with one click (MongoDB, MariaDB)
- Custom containers with your own `docker-compose.yml` and `Dockerfile`
- Projects to group containers
- Automatic SSL and www redirect
- Backups to S3-compatible storage
- Logs, statistics and a terminal (beta) for every container

## Architecture

| Part | Technology |
|---|---|
| API | NestJS with GraphQL (`@lenne.tech/nest-server`) |
| App | Nuxt 3 |
| Database | MongoDB |
| Queue | Redis: builds wait in a queue, by default two run at the same time, so a build peak does not slow down the other services on the server |
| Reverse proxy | Traefik, with Let's Encrypt certificates |

Everything runs as stacks in a [Docker Swarm](./6.server/2.docker-swarm.md). A container that crashes or fails its
health check is restarted, and a new version replaces the old one only once it is healthy.

## Pages

| Page | What it covers |
|---|---|
| [Installation](./1.installation.md) | Requirements, DNS, `install.sh`, the first login |
| [Configuration](./2.configuration.md) | The `.env` file and the settings that matter |
| [Usage](./3.usage.md) | Members, sources, projects and containers |
| [Updates](./4.updates.md) | `update.sh` and the steps older installations need once |
| [Administration](./5.administration.md) | Restart Traefik and deploy.party, read logs |
| [Running the server](./6.server/1.server-login.md) | Login, Docker Swarm, Docker commands, maintenance, files and databases |

The migration from Traefik v2 to v3 is described in
[MIGRATION.md](https://github.com/lenneTech/deploy.party/blob/main/MIGRATION.md).
