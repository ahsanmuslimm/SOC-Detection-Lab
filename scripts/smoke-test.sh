#!/usr/bin/env bash
# SOC Detection Lab — Smoke Test
#
# Verifies the deployed stack end-to-end across all core entity types.
# Expects the API on $BASE_URL (default http://localhost:3000/api/v1)
# and the seeded admin account from npm run db:seed.
#
# Usage:
#   bash scripts/smoke-test.sh
#   BASE_URL=https://soc.example.com/api/v1 bash scripts/smoke-test.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
EMAIL="${SOC_ADMIN_EMAIL:-admin@soc.local}"
PASSWORD="${SOC_ADMIN_PASSWORD:-SecurePassword123!}"

PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✓ $name (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name — expected HTTP $expected, got HTTP $actual"
    FAIL=$((FAIL + 1))
  fi
}

status_of() {
  curl -s -o /dev/null -w '%{http_code}' "$@"
}

echo ""
echo "══════════════════════════════════════════════"
echo "  SOC Detection Lab — Smoke Test"
echo "  Target : $BASE_URL"
echo "══════════════════════════════════════════════"
echo ""

# ── 1. Health ──────────────────────────────────────────────────────────────
echo "[ Health ]"
check "GET /health" 200 "$(status_of "$BASE_URL/health")"
echo ""

# ── 2. Authentication ─────────────────────────────────────────────────────
echo "[ Authentication ]"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "  ✓ POST /auth/login — access token issued"
  PASS=$((PASS + 1))
else
  echo "  ✗ POST /auth/login — no access token in response"
  echo "  Response: $LOGIN_RESPONSE"
  FAIL=$((FAIL + 1))
fi
echo ""

AUTH="Authorization: Bearer $TOKEN"

# ── 3. Alerts ─────────────────────────────────────────────────────────────
echo "[ Alerts ]"
check "GET  /alerts"                200 "$(status_of "$BASE_URL/alerts" -H "$AUTH")"

CREATED_ALERT=$(curl -s -X POST "$BASE_URL/alerts" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"title":"Smoke Test Alert","description":"From smoke-test.sh","severity":"low","alertType":"smoke_test"}')
ALERT_ID=$(echo "$CREATED_ALERT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$ALERT_ID" ]; then
  echo "  ✓ POST /alerts — created $ALERT_ID"
  PASS=$((PASS + 1))
  check "GET  /alerts/:id"          200 "$(status_of "$BASE_URL/alerts/$ALERT_ID" -H "$AUTH")"
  check "POST /alerts/:id/acknowledge" 200 "$(status_of -X POST "$BASE_URL/alerts/$ALERT_ID/acknowledge" \
    -H "$AUTH" -H 'Content-Type: application/json' -d '{}')"
  check "DELETE /alerts/:id"        204 "$(status_of -X DELETE "$BASE_URL/alerts/$ALERT_ID" -H "$AUTH")"
else
  echo "  ✗ POST /alerts — creation failed (response: $CREATED_ALERT)"
  FAIL=$((FAIL + 1))
fi
echo ""

# ── 4. Cases ──────────────────────────────────────────────────────────────
echo "[ Cases ]"
check "GET  /cases" 200 "$(status_of "$BASE_URL/cases" -H "$AUTH")"

CREATED_CASE=$(curl -s -X POST "$BASE_URL/cases" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"title":"Smoke Test Case","description":"From smoke-test.sh","severity":"low"}')
CASE_ID=$(echo "$CREATED_CASE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CASE_NUMBER=$(echo "$CREATED_CASE" | grep -o '"caseNumber":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$CASE_ID" ]; then
  echo "  ✓ POST /cases — created $CASE_NUMBER ($CASE_ID)"
  PASS=$((PASS + 1))
  check "GET  /cases/:id" 200 "$(status_of "$BASE_URL/cases/$CASE_ID" -H "$AUTH")"
else
  echo "  ✗ POST /cases — creation failed (response: $CREATED_CASE)"
  FAIL=$((FAIL + 1))
fi
echo ""

# ── 5. Detection Rules ────────────────────────────────────────────────────
echo "[ Detection Rules ]"
check "GET  /rules" 200 "$(status_of "$BASE_URL/rules" -H "$AUTH")"

CREATED_RULE=$(curl -s -X POST "$BASE_URL/rules" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test Rule","description":"From smoke-test.sh","severity":"low","ruleType":"atomic","ruleDefinition":{"condition":"test"}}')
RULE_ID=$(echo "$CREATED_RULE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$RULE_ID" ]; then
  echo "  ✓ POST /rules — created $RULE_ID"
  PASS=$((PASS + 1))
else
  echo "  ✗ POST /rules — creation failed (response: $CREATED_RULE)"
  FAIL=$((FAIL + 1))
fi
echo ""

# ── 6. Investigations ─────────────────────────────────────────────────────
echo "[ Investigations ]"
check "GET  /investigations" 200 "$(status_of "$BASE_URL/investigations" -H "$AUTH")"

if [ -n "$CASE_ID" ]; then
  CREATED_INV=$(curl -s -X POST "$BASE_URL/investigations" \
    -H "$AUTH" -H 'Content-Type: application/json' \
    -d "{\"title\":\"Smoke Test Investigation\",\"description\":\"From smoke-test.sh\",\"caseId\":\"$CASE_ID\"}")
  INV_ID=$(echo "$CREATED_INV" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  if [ -n "$INV_ID" ]; then
    echo "  ✓ POST /investigations — created $INV_ID"
    PASS=$((PASS + 1))
    check "GET  /investigations/:id/timeline" 200 \
      "$(status_of "$BASE_URL/investigations/$INV_ID/timeline" -H "$AUTH")"
  else
    echo "  ✗ POST /investigations — creation failed (response: $CREATED_INV)"
    FAIL=$((FAIL + 1))
  fi
fi
echo ""

# ── 7. Reports ────────────────────────────────────────────────────────────
echo "[ Reports ]"
check "GET  /reports" 200 "$(status_of "$BASE_URL/reports" -H "$AUTH")"

CREATED_REPORT=$(curl -s -X POST "$BASE_URL/reports" \
  -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"title":"Smoke Test Report","reportType":"summary"}')
REPORT_ID=$(echo "$CREATED_REPORT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$REPORT_ID" ]; then
  echo "  ✓ POST /reports — created $REPORT_ID"
  PASS=$((PASS + 1))
else
  echo "  ✗ POST /reports — creation failed (response: $CREATED_REPORT)"
  FAIL=$((FAIL + 1))
fi
echo ""

# ── 8. RBAC ───────────────────────────────────────────────────────────────
echo "[ RBAC ]"
check "GET  /rbac/roles"       200 "$(status_of "$BASE_URL/rbac/roles" -H "$AUTH")"
check "GET  /rbac/permissions" 200 "$(status_of "$BASE_URL/rbac/permissions" -H "$AUTH")"
echo ""

# ── 9. Users / profile ────────────────────────────────────────────────────
echo "[ Users ]"
check "GET  /users/me/profile" 200 "$(status_of "$BASE_URL/users/me/profile" -H "$AUTH")"
echo ""

# ── 10. Security — unauthenticated requests rejected ──────────────────────
echo "[ Security ]"
check "GET  /alerts (no token) → 401" 401 "$(status_of "$BASE_URL/alerts")"
check "GET  /cases  (no token) → 401" 401 "$(status_of "$BASE_URL/cases")"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────
echo "══════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════"
echo ""

[ "$FAIL" -eq 0 ]
