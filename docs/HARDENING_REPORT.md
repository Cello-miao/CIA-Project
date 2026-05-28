# CIA Project — Hardening Report

**Scope:** Local containerized stack (`docker-compose.yml`). No cloud runtime claims.  
**Stack:** `cia-db` (MySQL 8.0) · `cia-api` (Node 20 / Express / TypeORM) · `cia-web` (Nginx + React)

---

## 1. Infrastructure Analysis

Four bare-metal VMs were rebuilt after compromise indicators (exposed Portainer, weak creds, stale kernels). Host remediation was identical in pattern; roles were split after containerization.

| IP | Prior state | Target role |
| :--- | :--- | :--- |
| `192.168.78.129` | Web + Portainer | Frontend (Nginx/React) |
| `192.168.78.130` | Nagios, MySQL, Docker | Persistence (MySQL 8.0) |
| `192.168.78.131` | Gitea, MySQL, SSH | API (Node.js) |
| `192.168.78.132` | Apache, FTP, SSH | Gateway / ops jump |

**Host remediation (all nodes):**

- Kernel upgraded to `>= 3.10.0-514` to close Dirty COW (CVE-2016-5195) local privilege escalation.
- SSH: `PasswordAuthentication no`, `PermitRootLogin prohibit-password`, ED25519 keys in `authorized_keys`.
- Service passwords rotated (>20 chars). Portainer removed; no `/var/run/docker.sock` bind-mounts on app containers.

**Repo reality:** The reference implementation runs all three services on **one host** via Compose (`cia-net` bridge). The four-IP layout is the production split; this repository is the single-machine orchestration source of truth.

---

## 2. Hardening Details

### Execution model

| Before | After |
| :--- | :--- |
| Processes as root on host | Containers as `service-web` (UID/GID **1001**) |
| Ad-hoc env / baked secrets | `.env` on host, `env_file` in Compose |
| `console.log` | **Pino** JSON on stdout (`back_student/src/utils/logger.ts`) |
| No APM | New Relic preload: `node -r newrelic start.js` |

- **API image:** `USER service-web` in `back_student/Dockerfile`; Compose maps `SERVICE_USER_UID` / `SERVICE_USER_GID` from `.env.example` (default `1001`).
- **Web image:** same user pattern in `front_student/Dockerfile`.
- **Database:** MySQL 8 with `--default-authentication-plugin=mysql_native_password` (driver compatibility).
- **CORS:** `ALLOWED_ORIGINS` comma-list in `back_student/src/index.ts` — no wildcard in production configs.
- **Auth:** JWT in header `auth:` (not `Authorization: Bearer`). Admin routes gated by `checkJwt` + `checkRole(['ADMIN'])`.
- **New Relic redaction:** `back_student/newrelic.js` excludes `request.headers.auth` and `request.headers.cookie` from transaction attributes.

---

## 3. War Stories

### Port 3000 → 3001

Compose and the frontend kept fighting over **3000** (stale docs, healthcheck mismatches, `REACT_APP_API_URL` drift). Standardized on **`API_INTERNAL_PORT=3001`** everywhere: `docker-compose.yml` publish mapping, `front_student/src/common/api.ts` fallback, smoke script `STANDARD_API_PORT`, and `.env.example`. Phase 1 of `run_smoke_tests.sh` fails the build if `3000` appears in compose or ports diverge.

### New Relic v11 on Node 20

`newrelic@14` blocks on Node `<22`. Production images use **Node 20 Alpine**. Pinned **`newrelic@^11.13.0`** in `back_student/package.json`. Agent loads via `-r newrelic` in Dockerfile CMD and Compose `command`. Log forwarding enabled in `newrelic.js`; header redaction added after audit found credentials could leak into NR attributes.

### Pino instead of console

Boot and controllers emit single-line JSON (`service`, `userId`, `msg`, …). New Relic application log forwarding ingests stdout from the container — no sidecar. Trade-off: Morgan still prints Apache-style access lines alongside JSON; grep for `{"level"` when tailing logs.

### `wget` in Alpine healthchecks

API and web images are slim Alpine — **no `curl` in the healthcheck path**. Compose healthchecks use **`wget --spider`** against `127.0.0.1:3001/api/health` and `127.0.0.1/health`. Host-side smoke tests use `curl` on the developer machine; do not assume curl exists inside the container.

### Other scars (short)

- **0-byte `package.json` in Docker layer** — fixed with `test -s package.json` in Dockerfile and `docker compose build --no-cache` when I/O corruption suspected.
- **`sqlite3` removed** — native addon failed Node 20 CI builds; MySQL-only path.
- **Custom JWT header `auth:`** — frontend and smoke tests must send `auth: <token>`, not Bearer.

---

## 4. Quality Assurance

**Gate script:** `./run_smoke_tests.sh` (repo root). Exit `0` only when `FAIL=0`. Target: **`PASS: 11`**.

| Phase | What it proves |
| :--- | :--- |
| 1 | Port **3001** sync — compose, `.env`, frontend `api.ts`; **no** legacy `3000` in compose |
| 2 | `cia-db`, `cia-api`, `cia-web` report healthy |
| 3 | Admin login → JWT from MySQL-backed user |
| 4 | Product **create + list** persistence (not browser storage) |
| 4 | **Order** `POST /order/` + product stock decrement (transaction / inventory) |

**RBAC (403):** Not automated in the smoke script today. Middleware returns **`403 Forbidden`** when a `NORMAL` user hits `/product/`, `/order/`, or `/user/`. Verify after deploy:

```bash
# register once, then login
curl -s -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"student_tester","password":"TestPassword2026!"}'
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"student_tester","password":"TestPassword2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/product/ -H "auth: $TOKEN"
# expect 403
```

Run smoke tests before every merge that touches API, compose, or env templates.

**CI:** `.github/workflows/ci.yml` — single job `basic-integration-suite` (Yarn backend build, npm frontend build). Does not replace local smoke tests against running containers.

---

## 5. File Map

| Path | Role |
| :--- | :--- |
| `docker-compose.yml` | Local orchestration |
| `.env.example` | Template — copy to `.env` |
| `run_smoke_tests.sh` | 11-check integration gate |
| `back_student/newrelic.js` | APM + log forwarding + header exclude |
| `docs/INFRASTRUCTURE_REMEDIATION_REPORT.md` | Remediation narrative (companion) |
| `docs/DEPLOY.md` | Host prep for `service-web` deploy user |
