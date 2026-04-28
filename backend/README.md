# Aetherlan War Hetzner Intake Backend

Persistent intake backend for generator uploads.

## Purpose

This service replaces the old Vercel preview-only intake path with a persistent upload + queue entrypoint that:

- receives multipart uploads
- writes raw files to `/opt/aetherlan-war/uploads/<jobId>/`
- writes queue job JSON to `/opt/aetherlan-war/queue/<jobId>.json`
- serves intake-side job status from queue/results state
- returns a normalized worker payload / job summary to callers

## Current live architecture

Already in play around this service:

- nginx reverse proxy for `aetherlan-intake.montecarloo.com`
- systemd service: `aetherlan-war-intake.service`
- persistent storage under `/opt/aetherlan-war`
- local bridge / worker scripts under `tools/animation-pipeline/`

The backend is no longer just a skeleton write path — it is part of the active generator upload flow and should be treated as such when debugging.

One small but important wording note: client-visible `nextStep` fields should describe the real live bridge path (`mirror -> process queue -> push result writeback`), not the older "worker dispatch is the next integration step" phrasing from earlier cutover stages.

## Endpoints

- `GET /health` (also accepts trailing slash)
- `POST /api/generator` (also accepts trailing slash)
- `GET /api/generator/status?jobId=...` (also accepts trailing slash before query)
- `POST /api/generator/status?jobId=...` (compat path, also accepts trailing slash)
- `OPTIONS /health`
- `OPTIONS /api/generator`
- `OPTIONS /api/generator/status`

## Run locally

```bash
cd backend
python3 intake_server.py
```

## Env vars

- `AETHERLAN_BASE_DIR` default: `/opt/aetherlan-war`
- `AETHERLAN_PIPELINE_DIR` default: `../tools/animation-pipeline`
- `AETHERLAN_HOST` default: `0.0.0.0`
- `AETHERLAN_PORT` default: `8010`
- `AETHERLAN_PUBLIC_APP_ORIGIN` default: `https://aetherlan-war.vercel.app`

## Browser/API behavior

- JSON/API callers receive JSON.
- Browser form posts with `Accept: text/html` receive a `303` redirect back to `/generator?...`.
- CORS is explicitly supported for the public frontend origin so browser uploads can preflight cleanly.

## Status behavior

`/api/generator/status` looks for job state in:

1. persistent Hetzner queue/results directories first
2. local mirrored queue/results directories as fallback

Returned status payloads include:

- `found`
- `status`
- `progress`
- request binding metadata (`characterId`, `action`, `targetSlot`, `assetKind`, etc.)
- queue summary / health hints when available

This is meant to reduce the “upload accepted but UI status is unknown” debugging gap.

## Smoke checks

From `projects/aetherlan-war`:

```bash
node tools/animation-pipeline/scripts/smoke-intake-status.mjs
node tools/animation-pipeline/scripts/smoke-queue-flow.mjs
```

Expected result for each: JSON with `ok: true`.

## Current limitations

- no auth yet
- remote queue consumption is still bridged, not a single always-on remote worker
- live issues can still be caused by deployment drift if nginx/systemd serve older code than this workspace

## Current live health snapshot

As of 2026-04-28 14:15 UTC, the deployed intake host passed the full smoke flow again:

- `OPTIONS /api/generator` → `204` with expected CORS headers
- multipart `POST /api/generator` → `200` with `uploadCount: 1`
- `GET /api/generator/status?jobId=...` → `200` with `found: true`

That means the older `501` preflight / `Not found` status behavior should now be treated as a **historical drift symptom**, not the current expected state. If it reappears, suspect a fresh deploy/routing regression.

## Common drift symptoms

- `OPTIONS /api/generator` returns `501` instead of `204`
- `/api/generator/status` returns `404` on live while local code supports it
- `/api/generator/` or `/api/generator/status/` behave differently from the non-slashed path on a live proxy
- multipart POST returns `200` but `uploadCount: 0`

Those usually indicate stale deployed backend code or stale routing, not a frontend-only bug.

## Fast live drift check

From `projects/aetherlan-war`:

```bash
bash backend/deploy-intake-smoke.sh
```

This single smoke script checks:
- live `OPTIONS /api/generator` preflight status + CORS headers
- live multipart `POST /api/generator`
- live `GET /api/generator/status?jobId=...` for the freshly created job

Interpretation:
- preflight `204` + CORS headers + status JSON payload → live intake deployment is aligned
- preflight `501` or status `{"ok": false, "message": "Not found"}` → nginx/service is still serving stale Hetzner code or routing to the wrong intake process

Most recent known-good live smoke: 2026-04-28 14:15 UTC (`preflight_ok=1 post_ok=1 status_ok=1`).

Helpful shorthand from the script output:
- `preflight_ok=1 post_ok=1 status_ok=1` → live intake path is healthy end-to-end
- `post_ok=1` with `preflight_ok=0` → browser uploads can still fail before POST starts; treat as CORS/routing drift
- `post_ok=1` with `status_ok=0` → uploads persist but live status lookup is stale/misrouted

Follow with local proof:

```bash
node tools/animation-pipeline/scripts/smoke-intake-status.mjs
node tools/animation-pipeline/scripts/smoke-queue-flow.mjs
```

If both local smokes pass while the deploy smoke still fails, treat the issue as **deployment drift on Hetzner**, not a workspace backend bug.

## Queue dashboard active-work hints

`tools/animation-pipeline/scripts/build-queue-dashboard.mjs` now also emits cheap queue-liveness clues for backend debugging:

- `health.activeJobCount`
- `health.oldestActiveJobAt`
- `health.newestActiveJobAt`
- `health.staleQueuedJobCount`
- `staleQueuedJobs[]`

This helps distinguish an actually empty queue from a queue that is accepted by intake but still waiting on mirror/worker handoff.

The dashboard now also includes per-job `queuedMinutes` plus health thresholds:

- `health.staleQueuedThresholdMinutes`
- `health.staleQueuedOverThresholdCount`
- `staleQueuedJobs[].queuedMinutes`
- `staleQueuedJobs[].exceedsThreshold`

That makes it easier to tell the difference between “some queued jobs exist” and “jobs have been stuck long enough to suspect bridge/worker drift”. Override the threshold with `AETHERLAN_STALE_QUEUED_MINUTES` when needed.

The dashboard also normalizes legacy `workerPayload.nextStep` values like `dispatch-worker-from-queue` to the current live wording `mirror-to-worker-and-process-queue`, so old archived job JSON does not mislead backend debugging.

## Related docs

- `docs/persistent-intake-cutover.md`
- `docs/upload-preview-runbook.md`
- `CRON-CONTROL-TOWER.md`
