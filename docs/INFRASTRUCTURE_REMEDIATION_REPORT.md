# Infrastructure Remediation & Security Hardening Report

**Project:** CIA Project (Infrastructure Reconstruction and Security Hardening)  
**Deployment model:** **Local Containerized Orchestration** (Docker Compose on the host — not cloud blueprints)  
**Status:** Remediated and Hardened  

---

## 1. Executive Summary

This report documents the systematic hardening of the CIA platform baseline. The environment was initially exposed to legacy host risks (including CVE-2016-5195 class issues, exposed management UIs, and weak credential practices). Remediation moved application workloads into an isolated, reproducible **three-service Docker Compose stack** (`cia-db`, `cia-api`, `cia-web`) with strict secret injection, non-root execution, structured logging, and automated verification.

**Orchestration:** Production-like runs use **local containerized orchestration** via `docker-compose.yml` at the repository root. Render or other cloud blueprints are optional references only; the authoritative runtime for audit and smoke validation is Compose on the operator host.

---

## 2. Architecture (Local Containerized Orchestration)

| Service | Container | Role | Host port (default) |
| :--- | :--- | :--- | :--- |
| **cia-web** | Nginx + React static build | Frontend | **80** |
| **cia-api** | Node.js 20 (TypeORM API) | Application logic | **3001** |
| **cia-db** | MySQL 8.0 | Persistence | internal `3306` |

- **Network:** isolated bridge `cia-net` (no application container mounts `/var/run/docker.sock`).
- **Secrets:** all credentials via host `.env` (see `.env.example`); never committed.
- **Non-root API:** `service-web` inside the image; host mapping `SERVICE_USER_UID` / `SERVICE_USER_GID` (default **1001**).
- **MySQL auth:** `--default-authentication-plugin=mysql_native_password`.

Optional four-VM host mapping (e.g. `192.168.78.129`–`132`) may be used in production by placing one Compose service per machine; the repository ships a **single-host Compose** reference implementation.

---

## 3. Security Remediation

### 3.1 Host-level (operator responsibility)

- Kernel patched to mitigate Dirty COW (CVE-2016-5195) class exploits where applicable.
- SSH: `PasswordAuthentication no`, `PermitRootLogin prohibit-password`, ED25519 keys in `authorized_keys`.
- High-entropy passwords for privileged accounts; Portainer and Docker socket mounts removed from **workload** containers.

See `docs/DEPLOY.md` for `service-web` provisioning and deploy-user Docker access (deploy hosts only — not inside `cia-api` / `cia-web`).

### 3.2 Container hardening

- Least privilege: API and web images run as `service-web`.
- No Docker socket mounts in application services.
- Log rotation: `json-file` driver with size/file caps on all services.
- Dynamic CORS via `ALLOWED_ORIGINS` in `back_student/src/index.ts`.

### 3.3 Application logic, logging, and telemetry

| Control | Implementation |
| :--- | :--- |
| Structured logging | **Pino** JSON to stdout (`back_student/src/utils/logger.ts`); controller-level `info` / `warn` / `error` on auth, product, and order paths |
| APM | New Relic agent preloaded: `node -r newrelic start.js` (Dockerfile + Compose `command`) |
| **Log redaction (active)** | `back_student/newrelic.js` — `attributes.exclude` redacts `request.headers.auth` and `request.headers.cookie` so JWTs and cookies do not appear in New Relic transaction attributes |
| Application log forwarding | `application_logging.forwarding.enabled: true` in `newrelic.js` |

Passwords are not logged by application code; Pino events use identifiers such as `userId` and `username` only.

---

## 4. Authorization (RBAC)

Admin routes (`/product/`, `/order/`, `/user/`) require JWT header **`auth:`** and role **ADMIN** via `checkJwt` + `checkRole`.

- **NORMAL** users receive **403 Forbidden** on admin endpoints (verified manually and recommended in operational runbooks).

---

## 5. Post-Remediation Verification

Automated suite: **`./run_smoke_tests.sh`** at the repository root.

### Quality gates (11 assertions)

| Phase | Validates |
| :--- | :--- |
| 1 | Port **3001** consistency (no legacy 3000); frontend/API alignment |
| 2 | `cia-db`, `cia-api`, `cia-web` healthy in Compose |
| 3 | Admin login → JWT |
| 4 | Product create (HTTP 201) + list persistence (MySQL-backed) |
| 4 | **Order POST `/order/`** (HTTP 201) + **product stock decrement** after order (inventory transaction integrity) |

**Pass criteria:** `PASS: 11`, `FAIL: 0`, `OVERALL RESULT: PASS`.

### CI

- Single workflow: `.github/workflows/ci.yml` — job `basic-integration-suite` (Yarn backend build, frontend build). No duplicate `deploy.yml`.

---

## 6. Configuration reference

| File | Purpose |
| :--- | :--- |
| `docker-compose.yml` | Local containerized orchestration |
| `.env.example` | Secret and port template (`API_INTERNAL_PORT=3001`, `SERVICE_USER_UID=1001`) |
| `back_student/newrelic.js` | APM + **active header redaction** + log forwarding |
| `back_student/Dockerfile` | `CMD ["node", "-r", "newrelic", "start.js"]` |
| `run_smoke_tests.sh` | 11-check integration suite |

---

## 7. Conclusion

The CIA platform baseline is **secure, auditable, and reproducible** under **local containerized orchestration**. Secrets are externalized, workloads run non-root, telemetry uses Pino and New Relic with **credential header redaction enabled**, and `run_smoke_tests.sh` enforces eleven automated gates including order persistence and inventory decrement before release sign-off.
