#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"

printf '[browser-verify] target: %s\n' "$BASE_URL"

command -v curl >/dev/null 2>&1 || { echo 'curl is required'; exit 2; }

check_url() {
  local path="$1"
  local code
  code="$(curl -sS -o /tmp/cardelume-browser-verify-body -w '%{http_code}' "$BASE_URL$path")"
  if [[ "$code" != "200" ]]; then
    echo "FAIL $path -> HTTP $code"
    exit 1
  fi
  echo "PASS $path -> HTTP 200"
}

check_url "/"
check_url "/create"

# Basic header smoke. This is NOT a substitute for browser CSP/a11y/performance QA.
headers="$(curl -sSI "$BASE_URL/" | tr -d '\r')"
echo "$headers" | grep -qi '^content-security-policy\|^content-security-policy-report-only' \
  && echo 'PASS CSP header present' \
  || echo 'WARN CSP header not observed on HEAD /'

echo "$headers" | grep -qi '^x-content-type-options: *nosniff' \
  && echo 'PASS nosniff header present' \
  || echo 'WARN nosniff header not observed'

if command -v pnpm >/dev/null 2>&1 && pnpm exec playwright --version >/dev/null 2>&1; then
  if [[ -f tests/playwright/browser-verify.mjs ]]; then
    BASE_URL="$BASE_URL" pnpm exec playwright test tests/playwright/browser-verify.mjs
  else
    echo 'INFO Playwright is available but no committed browser suite exists yet.'
    echo 'INFO Step18 must add/execute real browser/device verification before claiming BROWSER PASS.'
  fi
else
  echo 'INFO Playwright not installed/configured. HTTP smoke completed only.'
  echo 'INFO This script intentionally does not claim real browser/a11y/performance PASS.'
fi
