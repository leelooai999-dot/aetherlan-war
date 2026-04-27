#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
node ./scripts/promote-approved-to-inbox.mjs
node ./scripts/ingest-inbox.mjs
node ./run-pipeline.mjs
