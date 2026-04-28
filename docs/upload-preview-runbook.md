# Upload / Transparent PNG Preview Runbook

## What must be true for end-to-end success

1. `https://aetherlan-war.vercel.app/generator` posts to
   `https://aetherlan-intake.montecarloo.com/api/generator`
2. Hetzner intake must support browser CORS preflight (`OPTIONS`)
3. Hetzner intake must write queue JSON + uploaded file into `/opt/aetherlan-war`
4. Worker bridge must run:
   - `pull-hetzner-queue.sh`
   - `process-queue.mjs`
   - `build-queue-dashboard.mjs`
   - `push-hetzner-results.sh`
5. Frontend status route must be able to read `tools/animation-pipeline/output/queue-results/<jobId>.result.json`
6. `processedPreviewUrl` must exist for the page to show transparent PNG preview

## Fast diagnosis

### A. Upload fails immediately in browser
Check preflight:

```bash
curl -i -X OPTIONS https://aetherlan-intake.montecarloo.com/api/generator \
  -H 'Origin: https://aetherlan-war.vercel.app' \
  -H 'Access-Control-Request-Method: POST'
```

Expected:
- `204`
- `Access-Control-Allow-Origin: https://aetherlan-war.vercel.app`

If you still get `501`, the Hetzner intake service is still running old code and must be restarted.

### B. Upload succeeds but no transparent PNG preview
Run the local bridge once:

```bash
cd /root/.openclaw/workspace/projects/aetherlan-war/tools/animation-pipeline
node ./scripts/run-hetzner-bridge.mjs
```

Then verify a result file exists:

```bash
ls output/queue-results | tail
```

And verify processed preview exists in frontend public dir:

```bash
ls /root/.openclaw/workspace/projects/aetherlan-war/frontend/public/generated-previews | tail
```

## Smoke test

```bash
cd /root/.openclaw/workspace/projects/aetherlan-war/tools/animation-pipeline
node ./scripts/smoke-queue-flow.mjs
```

Expected JSON includes:
- `ok: true`
- `previewUrl`
- `processedPreviewUrl`

## Current architecture limitation

Right now the queue consumer is local-workspace based. Hetzner intake persistence and local preview generation are bridged, not yet unified into a single always-on remote worker.

That means if the bridge does not run, uploads may be accepted but no new transparent preview will show up.
