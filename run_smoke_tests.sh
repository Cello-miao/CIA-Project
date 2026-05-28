#!/usr/bin/env bash
# CIA Project — automated microservices smoke / diagnostic suite
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

API_TS="${ROOT_DIR}/front_student/src/common/api.ts"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_FILE="${ROOT_DIR}/.env"
STANDARD_API_PORT=3001

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

ADMIN_USER="${DEFAULT_ADMIN_USERNAME:-admin}"
ADMIN_PASS="${DEFAULT_ADMIN_PASSWORD:-SecureAdminPassword2026!}"

PASS=0
FAIL=0
WARN=0

banner() {
  echo ""
  echo "================================================================"
  echo " $1"
  echo "================================================================"
}

record() {
  local status="$1"
  local message="$2"
  case "$status" in
    PASS) PASS=$((PASS + 1)); echo "[PASS] $message" ;;
    FAIL) FAIL=$((FAIL + 1)); echo "[FAIL] $message" ;;
    WARN) WARN=$((WARN + 1)); echo "[WARN] $message" ;;
    INFO) echo "[INFO] $message" ;;
  esac
}

extract_port_from_url() {
  local url="$1"
  if [[ "$url" =~ :([0-9]+)(/|$) ]]; then
    echo "${BASH_REMATCH[1]}"
  elif [[ "$url" =~ ^https?://[^:/]+$ ]]; then
    echo "80"
  else
    echo ""
  fi
}

# ---------------------------------------------------------------------------
# Phase 1 — Environment & architecture sync
# ---------------------------------------------------------------------------
banner "PHASE 1: Environment & Architecture Sync Check"

if [[ ! -f "$API_TS" ]]; then
  record FAIL "Missing frontend API client: $API_TS"
else
  API_FALLBACK=$(grep -E 'REACT_APP_API_URL \|\|' "$API_TS" | sed -E 's/.*\|\|[[:space:]]*"([^"]+)".*/\1/' || true)
  record INFO "api.ts API_URL fallback string: ${API_FALLBACK:-<not found>}"
  FRONTEND_PORT=$(extract_port_from_url "$API_FALLBACK")
  record INFO "Parsed frontend fallback port: ${FRONTEND_PORT:-unknown}"
fi

COMPOSE_PUBLISHED_PORT=""
if [[ -f "$COMPOSE_FILE" ]]; then
  if grep -qE '3000' "$COMPOSE_FILE"; then
    record FAIL "docker-compose.yml contains legacy port 3000 references"
  else
    record PASS "docker-compose.yml has no legacy port 3000 references"
  fi
  COMPOSE_PUBLISHED_PORT=$(grep -E '^\s+-\s+"\$\{API_INTERNAL_PORT' "$COMPOSE_FILE" | head -1 | sed -E 's/.*API_INTERNAL_PORT:-([0-9]+).*/\1/' || true)
  COMPOSE_HC_PORT=$(grep -E 'API_INTERNAL_PORT:-[0-9]+' "$COMPOSE_FILE" | head -1 | sed -E 's/.*API_INTERNAL_PORT:-([0-9]+).*/\1/' || true)
  record INFO "docker-compose.yml published-port default (API_INTERNAL_PORT): ${COMPOSE_PUBLISHED_PORT:-unknown}"
  record INFO "docker-compose.yml healthcheck port default: ${COMPOSE_HC_PORT:-unknown}"
  if [[ -n "${COMPOSE_PUBLISHED_PORT:-}" && "$COMPOSE_PUBLISHED_PORT" != "$STANDARD_API_PORT" ]]; then
    record FAIL "docker-compose.yml API port default must be $STANDARD_API_PORT (found $COMPOSE_PUBLISHED_PORT)"
  elif [[ -n "${COMPOSE_PUBLISHED_PORT:-}" ]]; then
    record PASS "docker-compose.yml API port default is $STANDARD_API_PORT"
  fi
fi

ENV_API_PORT=""
if [[ -f "$ENV_FILE" ]]; then
  ENV_API_PORT=$(grep -E '^API_INTERNAL_PORT=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
  ENV_REACT_URL=$(grep -E '^REACT_APP_API_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
  record INFO ".env API_INTERNAL_PORT: ${ENV_API_PORT:-<unset>}"
  record INFO ".env REACT_APP_API_URL: ${ENV_REACT_URL:-<unset>}"
fi

BACKEND_PORT="${ENV_API_PORT:-$STANDARD_API_PORT}"
if [[ -n "${ENV_API_PORT:-}" && "$ENV_API_PORT" != "$STANDARD_API_PORT" ]]; then
  record WARN ".env API_INTERNAL_PORT=$ENV_API_PORT differs from standard $STANDARD_API_PORT"
fi
API_BASE_URL="${ENV_REACT_URL:-http://localhost:${STANDARD_API_PORT}}"
# Host smoke tests always hit published localhost port
if [[ "$API_BASE_URL" == *"cia-api"* ]]; then
  API_BASE_URL="http://localhost:${BACKEND_PORT}"
  record INFO "Rewriting in-cluster API URL to host URL for curl probes: $API_BASE_URL"
fi

record INFO "Effective backend probe base URL: $API_BASE_URL"

if [[ -n "${FRONTEND_PORT:-}" ]]; then
  if [[ "$FRONTEND_PORT" == "$STANDARD_API_PORT" ]]; then
    record PASS "Frontend fallback port ($FRONTEND_PORT) matches standard API port ($STANDARD_API_PORT)"
  else
    record FAIL "Port mismatch: frontend fallback=$FRONTEND_PORT, required=$STANDARD_API_PORT"
  fi
else
  record WARN "Could not parse frontend fallback port from api.ts"
fi

if [[ -n "${COMPOSE_HC_PORT:-}" && "$COMPOSE_HC_PORT" != "$STANDARD_API_PORT" ]]; then
  record FAIL "docker-compose healthcheck default port ($COMPOSE_HC_PORT) must be $STANDARD_API_PORT"
elif [[ -n "${COMPOSE_HC_PORT:-}" ]]; then
  record PASS "docker-compose healthcheck default port is $STANDARD_API_PORT"
fi

# ---------------------------------------------------------------------------
# Phase 2 — Container lifecycle health
# ---------------------------------------------------------------------------
banner "PHASE 2: Container Lifecycle Health Check"

if ! command -v docker >/dev/null 2>&1; then
  record FAIL "docker CLI not found"
else
  echo ""
  docker compose ps 2>&1 || docker-compose ps 2>&1 || true
  echo ""

  PS_RAW="$(docker compose ps --format '{{.Name}}|{{.Status}}' 2>/dev/null || true)"
  for svc in cia-db cia-api cia-web; do
    line="$(echo "$PS_RAW" | grep "^${svc}|" || true)"
    if [[ -z "$line" ]]; then
      record FAIL "$svc: container not found in compose ps output"
      continue
    fi
    status="${line#*|}"
    if echo "$status" | grep -qiE 'healthy'; then
      record PASS "$svc: $status"
    elif echo "$status" | grep -qiE '(^| )Up '; then
      record WARN "$svc: running but not healthy — $status"
    else
      record FAIL "$svc: $status"
    fi
  done
fi

# ---------------------------------------------------------------------------
# Phase 3 — Live database handshake (auth)
# ---------------------------------------------------------------------------
banner "PHASE 3: Live Database Handshake Test"

LOGIN_URL="${API_BASE_URL%/}/auth/login"
LOGIN_PAYLOAD=$(printf '{"username":"%s","password":"%s"}' "$ADMIN_USER" "$ADMIN_PASS")

record INFO "POST $LOGIN_URL"

LOGIN_RESPONSE="$(curl -sS -w '\n%{http_code}' -X POST "$LOGIN_URL" \
  -H 'Content-Type: application/json' \
  -d "$LOGIN_PAYLOAD" 2>&1)" || true

LOGIN_HTTP_CODE="$(echo "$LOGIN_RESPONSE" | tail -n1)"
LOGIN_BODY="$(echo "$LOGIN_RESPONSE" | sed '$d')"

record INFO "HTTP status: ${LOGIN_HTTP_CODE:-<none>}"

TOKEN=""
if [[ "$LOGIN_HTTP_CODE" == "200" ]]; then
  TOKEN="$(echo "$LOGIN_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null || true)"
  if [[ -n "$TOKEN" ]]; then
    record PASS "Authentication succeeded; JWT extracted (${#TOKEN} chars)"
    record INFO "Token prefix: ${TOKEN:0:20}..."
  else
    record FAIL "HTTP 200 but no token field in response body"
    record INFO "Body: $LOGIN_BODY"
  fi
else
  record FAIL "Authentication failed (expected HTTP 200, got ${LOGIN_HTTP_CODE:-error})"
  record INFO "Body: $LOGIN_BODY"
fi

# ---------------------------------------------------------------------------
# Phase 4 — Transactional integrity audit (product CRUD via API/DB)
# ---------------------------------------------------------------------------
banner "PHASE 4: Transactional Integrity Audit"

if [[ -z "$TOKEN" ]]; then
  record FAIL "Skipping product tests — no JWT from phase 3"
else
  UNIQUE_SUFFIX="$(date +%s)"
  PRODUCT_NAME="SmokeTest-MacBook-${UNIQUE_SUFFIX}"
  CREATE_URL="${API_BASE_URL%/}/product/"
  LIST_URL="${CREATE_URL}"

  CREATE_PAYLOAD=$(cat <<EOF
{"name":"${PRODUCT_NAME}","category":"Electronics","description":"Automated smoke test product","amount":10,"price":2500,"hasExpiryDate":false}
EOF
)

  record INFO "POST $CREATE_URL (product: $PRODUCT_NAME)"
  CREATE_RESPONSE="$(curl -sS -w '\n%{http_code}' -X POST "$CREATE_URL" \
    -H 'Content-Type: application/json' \
    -H "auth: $TOKEN" \
    -d "$CREATE_PAYLOAD" 2>&1)" || true

  CREATE_HTTP_CODE="$(echo "$CREATE_RESPONSE" | tail -n1)"
  CREATE_BODY="$(echo "$CREATE_RESPONSE" | sed '$d')"

  record INFO "Create HTTP status: ${CREATE_HTTP_CODE:-<none>}"

  PRODUCT_ID=""
  if [[ "$CREATE_HTTP_CODE" == "201" ]]; then
    SCHEMA_OK="$(echo "$CREATE_BODY" | python3 -c "
import sys, json
required = {'id', 'name', 'category', 'amount', 'price'}
try:
    d = json.load(sys.stdin)
except Exception:
    print('no')
    sys.exit(0)
if not isinstance(d, dict):
    print('no'); sys.exit(0)
if not required.issubset(d.keys()):
    print('no'); sys.exit(0)
if d.get('name') != '${PRODUCT_NAME}':
    print('no'); sys.exit(0)
print('yes')
" 2>/dev/null || echo "no")"

    PRODUCT_ID="$(echo "$CREATE_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)"

    if [[ "$SCHEMA_OK" == "yes" && -n "$PRODUCT_ID" ]]; then
      record PASS "Product created (HTTP 201) with valid DB-backed schema (id=$PRODUCT_ID)"
    else
      record FAIL "HTTP 201 but response schema validation failed"
      record INFO "Body: $CREATE_BODY"
    fi
  else
    record FAIL "Product creation failed (expected HTTP 201, got ${CREATE_HTTP_CODE:-error})"
    record INFO "Body: $CREATE_BODY"
  fi

  record INFO "GET $LIST_URL (list all products)"
  LIST_RESPONSE="$(curl -sS -w '\n%{http_code}' -X GET "$LIST_URL" \
    -H "auth: $TOKEN" 2>&1)" || true

  LIST_HTTP_CODE="$(echo "$LIST_RESPONSE" | tail -n1)"
  LIST_BODY="$(echo "$LIST_RESPONSE" | sed '$d')"

  record INFO "List HTTP status: ${LIST_HTTP_CODE:-<none>}"

  if [[ "$LIST_HTTP_CODE" == "200" && -n "$PRODUCT_ID" ]]; then
    FOUND="$(echo "$LIST_BODY" | python3 -c "
import sys, json
pid = int('${PRODUCT_ID}')
try:
    items = json.load(sys.stdin)
except Exception:
    print('no'); sys.exit(0)
if not isinstance(items, list):
    print('no'); sys.exit(0)
for p in items:
    if isinstance(p, dict) and p.get('id') == pid and p.get('name') == '${PRODUCT_NAME}':
        print('yes'); sys.exit(0)
print('no')
" 2>/dev/null || echo "no")"

    if [[ "$FOUND" == "yes" ]]; then
      record PASS "Product list (HTTP 200) contains persisted record id=$PRODUCT_ID — DB sync confirmed (not browser storage)"
    else
      record FAIL "HTTP 200 list response does not include created product id=$PRODUCT_ID"
    fi
  elif [[ "$LIST_HTTP_CODE" == "200" ]]; then
    record WARN "List returned HTTP 200 but create step did not yield a product id to verify"
  else
    record FAIL "Product list failed (expected HTTP 200, got ${LIST_HTTP_CODE:-error})"
    record INFO "Body: ${LIST_BODY:0:500}"
  fi

  # Order creation + inventory decrement (11th assertion)
  if [[ -n "$PRODUCT_ID" ]]; then
    ORDER_QTY=3
    INITIAL_STOCK=10
    EXPECTED_STOCK=$((INITIAL_STOCK - ORDER_QTY))
    ORDER_URL="${API_BASE_URL%/}/order/"
    PRODUCT_GET_URL="${API_BASE_URL%/}/product/${PRODUCT_ID}"
    ORDER_NAME="SmokeTest-Order-${UNIQUE_SUFFIX}"

    ORDER_PAYLOAD=$(cat <<EOF
{"name":"${ORDER_NAME}","amount":${ORDER_QTY},"productId":${PRODUCT_ID}}
EOF
)

    record INFO "POST $ORDER_URL (order: $ORDER_NAME, qty=$ORDER_QTY on product id=$PRODUCT_ID)"
    ORDER_RESPONSE="$(curl -sS -w '\n%{http_code}' -X POST "$ORDER_URL" \
      -H 'Content-Type: application/json' \
      -H "auth: $TOKEN" \
      -d "$ORDER_PAYLOAD" 2>&1)" || true

    ORDER_HTTP_CODE="$(echo "$ORDER_RESPONSE" | tail -n1)"
    ORDER_BODY="$(echo "$ORDER_RESPONSE" | sed '$d')"
    record INFO "Order create HTTP status: ${ORDER_HTTP_CODE:-<none>}"

    ORDER_INTEGRITY_OK="no"
    ORDER_ID=""
    ORDER_FAIL_MSG=""

    if [[ "$ORDER_HTTP_CODE" == "201" ]]; then
      ORDER_ID="$(echo "$ORDER_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || true)"
      ORDER_SCHEMA_OK="$(echo "$ORDER_BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print('no'); sys.exit(0)
if not isinstance(d, dict) or not d.get('id'):
    print('no'); sys.exit(0)
if d.get('name') != '${ORDER_NAME}' or int(d.get('amount', 0)) != ${ORDER_QTY}:
    print('no'); sys.exit(0)
prod = d.get('product') or {}
if int(prod.get('id', 0)) != int('${PRODUCT_ID}'):
    print('no'); sys.exit(0)
print('yes')
" 2>/dev/null || echo "no")"
      if [[ "$ORDER_SCHEMA_OK" != "yes" || -z "$ORDER_ID" ]]; then
        ORDER_FAIL_MSG="HTTP 201 but order response schema validation failed"
      fi
    else
      ORDER_FAIL_MSG="Order creation failed (expected HTTP 201, got ${ORDER_HTTP_CODE:-error})"
    fi

    if [[ -z "$ORDER_FAIL_MSG" ]]; then
      record INFO "GET $PRODUCT_GET_URL (verify stock decrement)"
      PRODUCT_GET_RESPONSE="$(curl -sS -w '\n%{http_code}' -X GET "$PRODUCT_GET_URL" \
        -H "auth: $TOKEN" 2>&1)" || true

      PRODUCT_GET_HTTP="$(echo "$PRODUCT_GET_RESPONSE" | tail -n1)"
      PRODUCT_GET_BODY="$(echo "$PRODUCT_GET_RESPONSE" | sed '$d')"
      record INFO "Product GET HTTP status: ${PRODUCT_GET_HTTP:-<none>}"

      if [[ "$PRODUCT_GET_HTTP" == "200" ]]; then
        STOCK_OK="$(echo "$PRODUCT_GET_BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print('no'); sys.exit(0)
if int(d.get('id', 0)) != int('${PRODUCT_ID}'):
    print('no'); sys.exit(0)
if int(d.get('amount', -1)) == int('${EXPECTED_STOCK}'):
    print('yes')
else:
    print('no')
" 2>/dev/null || echo "no")"
        if [[ "$STOCK_OK" == "yes" ]]; then
          ORDER_INTEGRITY_OK="yes"
        else
          ORDER_FAIL_MSG="Product stock not decremented to expected ${EXPECTED_STOCK} after order"
          record INFO "Body: $PRODUCT_GET_BODY"
        fi
      else
        ORDER_FAIL_MSG="Product fetch for stock check failed (expected HTTP 200, got ${PRODUCT_GET_HTTP:-error})"
        record INFO "Body: ${PRODUCT_GET_BODY:0:500}"
      fi
    fi

    if [[ "$ORDER_INTEGRITY_OK" == "yes" ]]; then
      record PASS "Order POST /order/ persisted (id=$ORDER_ID) and product stock decremented (${INITIAL_STOCK} -> ${EXPECTED_STOCK})"
    else
      record FAIL "${ORDER_FAIL_MSG:-Order/inventory integrity check failed}"
      if [[ "$ORDER_HTTP_CODE" != "201" ]]; then
        record INFO "Order body: $ORDER_BODY"
      fi
    fi
  else
    record FAIL "Skipping order test — no product id from create step"
  fi
fi

# ---------------------------------------------------------------------------
# Summary matrix
# ---------------------------------------------------------------------------
banner "DIAGNOSTIC SUMMARY MATRIX"
TOTAL=$((PASS + FAIL + WARN))
echo "  PASS : $PASS"
echo "  FAIL : $FAIL"
echo "  WARN : $WARN"
echo "  TOTAL: $TOTAL"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  echo "OVERALL RESULT: FAIL"
  exit 1
fi

echo "OVERALL RESULT: PASS"
exit 0
