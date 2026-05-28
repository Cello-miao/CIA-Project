# CIA Project

Monorepo: React frontend (`front_student`), Express/TypeORM API (`back_student`), MySQL. **Local runtime = Docker Compose only** — no Render/Vercel requirement for development.

| Service | URL (default) |
| :--- | :--- |
| Web | http://localhost |
| API | http://localhost:3001 |
| Health | http://localhost:3001/api/health |

---

## Quick Start

### Prerequisites

- **Docker Desktop** (Compose v2)
- **Node 20** (optional — only if building backend/frontend on the host outside Docker)

### Setup

```bash
cp .env.example .env
# Edit .env: set MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, JWT_SECRET, DEFAULT_ADMIN_PASSWORD
```

Required for Compose: `MYSQL_*`, `JWT_SECRET`, `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD`, `SERVICE_USER_UID`, `SERVICE_USER_GID` (use `1001` / `1001` per `.env.example`).

Build the API artifact before the API image (Compose copies host `back_student/dist` → container `build/`):

```bash
cd back_student && yarn install --frozen-lockfile && yarn build && cd ..
```

The frontend image builds inside `front_student/Dockerfile` (`REACT_APP_API_URL` from compose build args). No host `npm run build` required for `cia-web`.

### Run

```bash
docker compose --env-file .env up -d --build
```

Check status:

```bash
docker compose ps
```

All three services should show **healthy**. API is published on **3001** only.

---

## API

- **Base URL:** `http://localhost:3001`
- **Auth header:** `auth: <JWT>` (returned from `POST /auth/login`)
- **Default admin** (seeded on first migration): `admin` / `SecureAdminPassword2026!`  
  Override via `.env`: `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD`.

Example login:

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"SecureAdminPassword2026!"}'
```

Admin-only routes: `/product/`, `/order/`, `/user/`. `NORMAL` users get **403** on those paths.

Swagger UI (when API is up): http://localhost:3001/api-docs

---

## Validation

**Run this before you call the stack “good”:**

```bash
./run_smoke_tests.sh
```

Expect:

```
PASS : 11
FAIL : 0
OVERALL RESULT: PASS
```

The script checks port **3001** consistency, container health, admin auth, product CRUD against MySQL, and order creation with inventory decrement. It does **not** replace a full security review; RBAC 403 for non-admin users is documented in `docs/HARDENING_REPORT.md` with a manual `curl` check.

---

## Layout

```
CIA-Project/
├── back_student/          # API (TypeScript → dist/)
├── front_student/         # React SPA
├── docker-compose.yml     # cia-db, cia-api, cia-web
├── run_smoke_tests.sh     # Integration gate
├── .env.example
└── docs/
    ├── HARDENING_REPORT.md
    ├── INFRASTRUCTURE_REMEDIATION_REPORT.md
    └── DEPLOY.md
```

---

## Docs

- **`docs/HARDENING_REPORT.md`** — VM remediation context, container hardening, war stories, QA gates.
- **`docs/INFRASTRUCTURE_REMEDIATION_REPORT.md`** — Remediation summary and config reference.
