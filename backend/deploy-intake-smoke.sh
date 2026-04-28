#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://aetherlan-intake.montecarloo.com}"
ORIGIN="${AETHERLAN_PUBLIC_APP_ORIGIN:-https://aetherlan-war.vercel.app}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
FIXTURE_FILE="${AETHERLAN_SMOKE_FIXTURE:-$PROJECT_ROOT/../../tmp/aetherlan-male-lead.png}"
TMP_HEADERS="${TMPDIR:-/tmp}/aetherlan-intake-headers.$$"
TMP_BODY="${TMPDIR:-/tmp}/aetherlan-intake-body.$$"
TMP_STATUS_HEADERS="${TMPDIR:-/tmp}/aetherlan-intake-status-headers.$$"
TMP_STATUS_BODY="${TMPDIR:-/tmp}/aetherlan-intake-status-body.$$"
trap 'rm -f "$TMP_HEADERS" "$TMP_BODY" "$TMP_STATUS_HEADERS" "$TMP_STATUS_BODY"' EXIT

if [[ ! -f "$FIXTURE_FILE" ]]; then
  echo "missing smoke fixture: $FIXTURE_FILE" >&2
  exit 1
fi

preflight_ok=0
post_ok=0
status_ok=0
job_id=""

printf '== OPTIONS %s/api/generator ==\n' "$BASE_URL"
preflight_status="$(curl -sS -D "$TMP_HEADERS" -o /dev/null -w '%{http_code}' -X OPTIONS \
  -H "Origin: $ORIGIN" \
  -H 'Access-Control-Request-Method: POST' \
  "$BASE_URL/api/generator" || true)"
allow_origin="$(awk 'tolower($0) ~ /^access-control-allow-origin:/{sub(/\r$/, "", $2); print $2; exit}' "$TMP_HEADERS")"
allow_methods="$(awk 'tolower($0) ~ /^access-control-allow-methods:/{line=$0; sub(/\r$/, "", line); print line; exit}' "$TMP_HEADERS")"
printf 'preflight_status=%s\n' "$preflight_status"
printf 'allow_origin=%s\n' "$allow_origin"
printf 'allow_methods=%s\n' "$allow_methods"
if [[ "$preflight_status" == "204" && -n "$allow_origin" ]]; then
  preflight_ok=1
else
  printf 'preflight_hint=%s\n' 'expected 204 + CORS headers; stale nginx/service code often shows up here first'
fi

printf '\n== POST %s/api/generator ==\n' "$BASE_URL"
post_status="$(curl -sS -o "$TMP_BODY" -w '%{http_code}' \
  -H 'Accept: application/json' \
  -F 'role=立绘' \
  -F 'characterId=isolde' \
  -F 'characterLabel=伊索德' \
  -F 'action=attack' \
  -F 'targetSlot=attack' \
  -F 'assetKind=battle-animation' \
  -F "referenceFiles=@${FIXTURE_FILE};type=image/png" \
  "$BASE_URL/api/generator" || true)"
if [[ -f "$TMP_BODY" ]]; then
  cat "$TMP_BODY"
fi
printf '\npost_status=%s\n' "$post_status"
post_upload_count="$(python3 - <<'PY' "$TMP_BODY"
import json, sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    job = data.get('job') or {}
    print(job.get('uploadCount') or len(job.get('uploads') or []))
except Exception:
    print('')
PY
)"
if [[ "$post_status" == "200" ]]; then
  post_ok=1
fi
job_id="$(python3 - <<'PY' "$TMP_BODY"
import json, sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    print((data.get('job') or {}).get('id') or '')
except Exception:
    print('')
PY
)"
printf 'job_id=%s\n' "$job_id"
printf 'post_upload_count=%s\n' "$post_upload_count"
if [[ "$post_ok" == "1" && ( -z "$post_upload_count" || "$post_upload_count" == "0" ) ]]; then
  printf 'post_hint=%s\n' 'POST reached intake but no files were persisted; suspect stale multipart parsing code or proxy/body handling drift'
fi

if [[ -n "$job_id" ]]; then
  printf '\n== GET %s/api/generator/status?jobId=%s ==\n' "$BASE_URL" "$job_id"
  status_status="$(curl -sS -D "$TMP_STATUS_HEADERS" -o "$TMP_STATUS_BODY" -w '%{http_code}' \
    "$BASE_URL/api/generator/status?jobId=$job_id" || true)"
  cat "$TMP_STATUS_BODY"
  printf '\nstatus_status=%s\n' "$status_status"
  status_found="$(python3 - <<'PY' "$TMP_STATUS_BODY"
import json, sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    print('1' if data.get('found') else '0')
except Exception:
    print('')
PY
)"
  status_label="$(python3 - <<'PY' "$TMP_STATUS_BODY"
import json, sys
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    print(data.get('status') or '')
except Exception:
    print('')
PY
)"
  printf 'status_found=%s\n' "$status_found"
  printf 'status_label=%s\n' "$status_label"
  if [[ "$status_status" == "200" && "$status_found" == "1" ]]; then
    status_ok=1
  else
    printf 'status_hint=%s\n' 'expected 200 + found=true for the fresh job; if POST succeeded but this failed, suspect stale status routing or result visibility drift'
  fi
else
  printf '\n== GET skipped: no job id from POST response ==\n'
  status_status="skipped"
fi

summary_ok=0
if [[ $preflight_ok -eq 1 && $post_ok -eq 1 && $status_ok -eq 1 ]]; then
  summary_ok=1
fi

printf '\n== SUMMARY ==\n'
printf 'ok=%s\n' "$summary_ok"
printf 'preflight_ok=%s\n' "$preflight_ok"
printf 'post_ok=%s\n' "$post_ok"
printf 'status_ok=%s\n' "$status_ok"

if [[ $summary_ok -ne 1 ]]; then
  exit 1
fi
