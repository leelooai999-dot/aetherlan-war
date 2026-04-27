#!/usr/bin/env bash
set -euo pipefail

REMOTE="hetzner"
REMOTE_BASE="/opt/aetherlan-war"
LOCAL_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$LOCAL_ROOT/queue" "$LOCAL_ROOT/output/queue-results" "$LOCAL_ROOT/staging/hetzner-uploads"

rsync -av --delete "$REMOTE:$REMOTE_BASE/queue/" "$LOCAL_ROOT/queue/"
rsync -av "$REMOTE:$REMOTE_BASE/results/" "$LOCAL_ROOT/output/queue-results/" || true
rsync -av "$REMOTE:$REMOTE_BASE/uploads/" "$LOCAL_ROOT/staging/hetzner-uploads/" || true

echo "pulled hetzner queue -> $LOCAL_ROOT/queue"
echo "pulled hetzner uploads -> $LOCAL_ROOT/staging/hetzner-uploads"
