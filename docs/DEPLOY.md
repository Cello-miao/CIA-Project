# Deployment Guide — Production

This document describes the final steps to prepare a production host for non-root deploys, a production-ready Docker Compose snippet that pulls images from GHCR, and a verification playbook for basic smoke tests.

IMPORTANT: never commit your production secrets (.env.production) to git. Store them in a secure secret manager and place them on the host filesystem with strict permissions.

---

## 1) Target Host Preparation

Goal: create a non-root deployment user `service-web` that can run Docker commands without sudo and grant safe access to the Docker socket.

Recommended approach: add the user to the `docker` group (preferred over chmod 666 on the socket). The docker daemon creates the `docker` group; if it does not exist create it.

Commands (run as root or a sudo-enabled admin):

```bash
# 1. Create the user (home directory, bash shell)
sudo useradd -m -s /bin/bash service-web

# 2. Ensure docker group exists (Docker normally creates this on install)
sudo groupadd -f docker

# 3. Add the user to the docker group so it can talk to the Docker socket
sudo usermod -aG docker service-web

# 4. Ensure the docker socket is group-owned by 'docker' and has restricted group write
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock

# 5. (Optional hardening) Limit who can ssh in as service-web. Create an .ssh folder and set permissions
sudo -u service-web mkdir -p /home/service-web/.ssh
sudo -u service-web chmod 700 /home/service-web/.ssh

# 6. Add deploy key (copy your public key to authorized_keys)
# On your workstation: cat deploy_key.pub
# On the host (as root or with sudo): append the public key
sudo tee -a /home/service-web/.ssh/authorized_keys >/dev/null
sudo chown service-web:service-web /home/service-web/.ssh/authorized_keys
sudo chmod 600 /home/service-web/.ssh/authorized_keys

# 7. To ensure new group membership takes effect, either log out/in the user or restart the ssh session.
# If you plan to run CI/CD commands via SSH in GitHub Actions, the workflow will use the provided SSH key to authenticate as this user.
```

Alternative (ACL) — avoid changing docker socket mode to 666:

```bash
# Grant a single user access to the socket using setfacl (if supported)
sudo setfacl -m u:service-web:rw /var/run/docker.sock

# Verify ACL
getfacl /var/run/docker.sock
```

Notes and security considerations:
- Adding a user to the `docker` group is effectively granting root-equivalent privileges for container operations. Keep the number of users in this group minimal and audit keys regularly.
- Do not `chmod 666 /var/run/docker.sock` in production — this makes Docker usable by any user on the system and is a large security risk.
- Ensure `service-web` does not have unnecessary sudo privileges.

---

## 2) Production Orchestration — docker-compose.prod.yml

Place your runtime variables in an **untracked** `.env.production` file on the host (example earlier: `.deploy/.env.production.example`). The compose file below reads runtime env vars from that file. Example location: `/opt/cia/.env.production`.

Save the following as `/opt/cia/docker-compose.prod.yml` (or the path referenced in your CI deployments via `PROD_COMPOSE_PATH`). Replace `<GHCR_OWNER>` or set the `GHCR_USER` / `IMAGE_TAG` variables in your `.env.production` to control image source and tag.

```yaml
version: '3.8'

services:
  cia-api:
    image: "ghcr.io/${GHCR_USER:-<GHCR_OWNER>}/cia-api:${IMAGE_TAG:-latest}"
    env_file: [".env.production"]
    restart: unless-stopped
    ports:
      - "3001:3001" # internal API port mapping (adjust as appropriate)
    networks:
      - cia-net
    depends_on:
      - db
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  cia-web:
    image: "ghcr.io/${GHCR_USER:-<GHCR_OWNER>}/cia-web:${IMAGE_TAG:-latest}"
    env_file: [".env.production"]
    restart: unless-stopped
    ports:
      - "80:80" # public web
    networks:
      - cia-net
    depends_on:
      - cia-api
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  db:
    image: mysql:8.0
    env_file: [".env.production"]
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  db_data:

networks:
  cia-net:
    driver: bridge

# Usage notes:
# - Put .env.production in the same folder as this compose file or set COMPOSE_FILE/--env-file accordingly.
# - The CI/CD workflow should pull the sha-tagged images and optionally tag them as :latest on the host before docker-compose up.

```

Example (.env.production) important variables (DO NOT COMMIT):

- GHCR_USER=your-ghcr-organization-or-user
- IMAGE_TAG=abcdef1234567890   # set by CI to the commit SHA, or use 'latest'
- DB_HOST=db
- DB_PORT=3306
- DB_USER=cia_user
- DB_PASSWORD=strong-db-password
- DB_NAME=cia_db
- JWT_SECRET=replace-with-long-secret

---

## 3) Verification Playbook — Smoke tests & quick checks

Run these steps after the CI/CD pipeline deploys the new images and restarts services. Execute as the `service-web` user (or an admin) on the host.

1) Confirm compose pulled and restarted services

```bash
# from the deployment directory where docker-compose.prod.yml lives
export COMPOSE_FILE=/opt/cia/docker-compose.prod.yml
docker-compose -f "$COMPOSE_FILE" ps
docker-compose -f "$COMPOSE_FILE" images
```

Expected: `cia-api` and `cia-web` containers are listed and show an `Up` state. The image column should reflect the tag you expect (commit SHA or latest).

2) Inspect logs for obvious startup errors

```bash
docker-compose -f "$COMPOSE_FILE" logs --tail=200 cia-api
docker-compose -f "$COMPOSE_FILE" logs --tail=200 cia-web
```

Look for errors like database connection failures, uncaught exceptions, or failed migrations.

3) Health checks and container status

```bash
docker inspect --format='{{.State.Health.Status}} {{.Name}}' $(docker ps -q --filter "name=cia-api" --filter "name=cia-web") || true
```

If a service is `unhealthy`, check its logs and restart it after fixing the issue.

4) Basic HTTP smoke test — web UI

```bash
# Test the web root
curl -f -I http://localhost/ || echo "web root failed"

# Test a web asset or API endpoint
curl -f http://localhost/api/health || echo "api health endpoint failed"
```

Expected: HTTP 200 responses where appropriate.

5) Automated login smoke test (admin:admin)

Replace the login URL and body with the actual API endpoints used by your application (the example below assumes a JSON API login endpoint at `/api/auth/login` that returns a JWT token).

```bash
# 1) Authenticate and capture token
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
echo "HTTP_CODE=$HTTP_CODE"
echo "BODY=$BODY"

if [ "$HTTP_CODE" -ne 200 ]; then
  echo "Login failed (expected 200). Check server logs and DB seed state."; exit 1
fi

# extract token (adjust path depending on your API response)
TOKEN=$(echo "$BODY" | jq -r '.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Token not returned by login endpoint"; exit 1
fi
echo "Login OK — token obtained"
```

6) API integration tests — Products / Orders

Use the obtained token to request inventory and orders. Adjust endpoints to match your API's routes.

```bash
# list products
curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/product | jq '.'

# list orders
curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/order | jq '.'
```

Expected: Valid JSON arrays or objects; no 500 errors. If endpoints return errors, check `cia-api` logs for stack traces and DB connection errors.

7) Data-level check — ensure DB migrations ran (if applicable)

If you run migrations at container start, verify that the DB schema exists and that the default admin user was created.

```bash
# connect to the mysql container and run a quick query (requires mysql client inside container)
docker exec -it $(docker ps -q -f name=db) mysql -u"${DB_USER}" -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SHOW TABLES;" || true
```

8) Rollback / Troubleshoot plan

- If the new version fails, you can roll back to the previous image tag (if retained) by updating `IMAGE_TAG` in `.env.production` to the previous SHA and running:

```bash
docker-compose -f "$COMPOSE_FILE" pull
docker-compose -f "$COMPOSE_FILE" up -d --no-deps --build cia-api cia-web
```

- If containers fail to start due to config or secrets, verify `.env.production` values and confirm that the database is reachable and accepting connections from the host and containers.

---

Appendix — Common troubleshooting commands

```bash
# show recently started containers
docker ps --filter "name=cia-" --format "table {{.Names}}	{{.Image}}	{{.Status}}"

# view logs (follow)
docker-compose -f "$COMPOSE_FILE" logs -f cia-api

# show last exit code of a container
docker inspect $(docker ps -aq -f name=cia-api) --format='{{.State.ExitCode}}'

# exec into a running container for debugging
docker exec -it $(docker ps -q -f name=cia-api) /bin/bash
```

If you want, I can also provide a `systemd` unit that wraps `docker-compose` for auto-start at boot, or a Portainer webhook example for deployments instead of SSH. Ask and I will add it.

