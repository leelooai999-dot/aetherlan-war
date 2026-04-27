#!/usr/bin/env bash
set -euo pipefail

REMOTE="hetzner"
REMOTE_BASE="/opt/aetherlan-war"
LOCAL_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$LOCAL_ROOT/output/queue-results"

rsync -av "$LOCAL_ROOT/output/queue-results/" "$REMOTE:$REMOTE_BASE/results/"

echo "pushed local queue results -> $REMOTE:$REMOTE_BASE/results"
