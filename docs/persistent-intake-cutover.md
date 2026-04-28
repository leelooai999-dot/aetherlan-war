# Aetherlan War Persistent Intake Cutover

## Goal

Switch the public generator upload form away from Vercel preview intake and onto the Hetzner persistent intake path.

## Current state

Already working:
- Hetzner persistent intake service on port `8010`
- systemd service: `aetherlan-war-intake.service`
- nginx host-based reverse proxy for `aetherlan-intake.montecarloo.com`
- persistent upload storage under `/opt/aetherlan-war/uploads/`
- persistent queue under `/opt/aetherlan-war/queue/`
- local worker bridge:
  - `pull-hetzner-queue.sh`
  - `process-queue.mjs`
  - `push-hetzner-results.sh`

## Current frontend switch mechanism

`frontend/src/app/generator/page.tsx` reads:

- `NEXT_PUBLIC_GENERATOR_ACTION_URL`

Default:

```bash
NEXT_PUBLIC_GENERATOR_ACTION_URL=/api/generator
```

Persistent cutover target:

```bash
NEXT_PUBLIC_GENERATOR_ACTION_URL=https://aetherlan-intake.montecarloo.com/api/generator
```

## Safe cutover order

1. Confirm nginx host-based route works locally on Hetzner
2. Add public DNS for `aetherlan-intake.montecarloo.com` -> `178.156.247.8`
3. Issue SSL cert for `aetherlan-intake.montecarloo.com`
4. Update nginx site to listen on 443 with cert
5. Set Vercel env var:
   - `NEXT_PUBLIC_GENERATOR_ACTION_URL=https://aetherlan-intake.montecarloo.com/api/generator`
6. Redeploy frontend
7. Browser-upload smoke test from public site
8. Confirm new jobs land in `/opt/aetherlan-war/queue/`
9. Pull queue locally, process, and push results back
10. Confirm `/pipeline` shows persistent queue state

## Why not switch immediately

Until DNS + SSL are public, the browser cannot reliably post to the host-based Hetzner endpoint from the public Vercel frontend.

## Post-cutover target behavior

- user uploads on `/generator`
- browser posts directly to Hetzner persistent intake
- Hetzner returns browser-compatible redirect
- success UI still lands back on `/generator?...`
- worker-ready queue job lands persistently on Hetzner
- local consumer can process and push results back

## Status truth today

Current status is assembled from the local pipeline side, not directly from the intake host:

- intake host writes queue jobs to `/opt/aetherlan-war/queue/`
- `tools/animation-pipeline/scripts/pull-hetzner-queue.sh` mirrors remote queue/uploads locally
- `tools/animation-pipeline/scripts/process-queue.mjs` changes queued jobs to `processing`/`done` and emits `output/queue-results/<jobId>.result.json`
- `tools/animation-pipeline/scripts/build-queue-dashboard.mjs` rebuilds `output/queue-dashboard.json`
- frontend `GET /api/generator/status?jobId=...` reads that local dashboard/result snapshot

That means uploads can succeed while status appears stale if the queue pull/process/dashboard steps are not run.

As a temporary mitigation, the frontend status route now accepts request metadata fallback (`role`, `characterId`, `characterLabel`, `action`, `targetSlot`, `assetKind`, `uploadCount`, `recentUploadNames`, `queueDepth`) and will surface a safe queued-state summary even before the local dashboard/result mirror has caught up.

## Known live regression to watch

If `OPTIONS https://aetherlan-intake.montecarloo.com/api/generator` returns `501 Unsupported method ('OPTIONS')`, nginx is still forwarding preflight to an older intake process that does not expose `do_OPTIONS`, or the live service has not been restarted onto the current backend code. In that state, browser uploads from `https://aetherlan-war.vercel.app` can fail before POST even starts.

A second symptom can accompany this: multipart `POST /api/generator` may return `200` but report `uploadCount: 0` / empty `job.uploads` even when a file was sent. That indicates the live intake process is older than the workspace code expected by the frontend.

### 2026-04-27/28 healthcheck evidence

Observed directly against live endpoints:
- `https://aetherlan-war.vercel.app/generator` still embeds the persistent intake URL, so the frontend cutover target itself still looks sane.
- `OPTIONS https://aetherlan-intake.montecarloo.com/api/generator` from origin `https://aetherlan-war.vercel.app` currently returns `501` with no CORS preflight headers.
- Direct multipart smoke `POST` to the live persistent intake now returns `200` and correctly reports `uploadCount: 1` with a persisted upload path under `/opt/aetherlan-war/uploads/<jobId>/...`.
- Direct multipart smoke `POST` to the Vercel preview intake also returns `200` and reports `uploadCount: 1`.
- Historical regression note: a previous live check saw `GET https://aetherlan-intake.montecarloo.com/api/generator/status` return `404 {"ok": false, "message": "Not found"}`. Workspace backend code now implements this endpoint, so if that 404 reappears live it likely means the Hetzner service is running older code or nginx is still pointed at a stale process.
- `GET https://aetherlan-war.vercel.app/api/generator/status?...` previously fell back to `found: false` / `status: "unknown"` for fresh jobs; workspace frontend code now includes persistent-status probing plus query-param queued fallback, so any recurrence should be treated as a deployment-drift or cache issue rather than a known expected behavior.
- Fresh 2026-04-28 09:15 UTC recheck confirms the split still exists: live preflight is still `501`, while local backend smoke checks both pass (`smoke-intake-status.mjs` and `smoke-queue-flow.mjs` both returned `ok: true`).

This narrows the remaining live regression: file upload parsing is healthy again, but browser uploads from the public frontend can still fail on CORS preflight if `OPTIONS` is not reaching current backend code. Status visibility should now be considered a deployment verification item, not a missing feature.

Fresh 2026-04-28 10:48 UTC recheck still shows the same split on live traffic:
- public `/generator` still embeds `https://aetherlan-intake.montecarloo.com/api/generator`
- live intake `POST /api/generator` returns `uploadCount: 1` for `gen-20260428104816-1bb41f`
- live intake `GET /api/generator/status?jobId=gen-20260428104816-1bb41f` still returns `{"ok": false, "message": "Not found"}`
- public frontend `GET /api/generator/status?...queueDepth=persistent...` still collapses to `found: false` / `status: "unknown"`, which now strongly suggests Vercel is serving older frontend code than the workspace patch set

## Live drift triage checklist

Use this when the public frontend reports upload failure, stale queued state, or a confusing mismatch between live Hetzner behavior and the workspace code.

### 1) Preflight reachability

```bash
curl -i -X OPTIONS \
  -H 'Origin: https://aetherlan-war.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  https://aetherlan-intake.montecarloo.com/api/generator
```

Expected healthy signs:
- HTTP `204`
- `Access-Control-Allow-Origin: https://aetherlan-war.vercel.app`
- `Access-Control-Allow-Methods` includes `POST`

If this returns `501` or lacks CORS headers, treat it as **live service drift**:
- backend process on Hetzner is older than workspace `backend/intake_server.py`, or
- nginx is routing to a stale process / wrong listener.

### 2) Multipart intake parsing

```bash
curl -i \
  -H 'Accept: application/json' \
  -F 'role=立绘' \
  -F 'characterId=isolde' \
  -F 'characterLabel=伊索德' \
  -F 'action=attack' \
  -F 'targetSlot=attack' \
  -F 'assetKind=battle-animation' \
  -F 'referenceFiles=@tmp/aetherlan-male-lead.png;type=image/png' \
  https://aetherlan-intake.montecarloo.com/api/generator
```

Expected healthy signs:
- HTTP `200`
- JSON `ok: true`
- JSON `job.uploadCount >= 1`
- JSON `queueDepth: "persistent"`

If POST succeeds but `uploadCount` is `0`, the live intake process is almost certainly stale.

### 3) Status endpoint reachability

```bash
curl -i 'https://aetherlan-intake.montecarloo.com/api/generator/status?jobId=<jobId>'
```

Expected healthy signs:
- HTTP `200`
- JSON payload with `found`, `status`, and `progress`

If this returns `404` on live while workspace code supports it, treat that as the same **deployed-code drift** class of issue.

### Decision rule

- **Local smoke passes + live preflight/status fail** → do not debug frontend first; prioritize Hetzner service/nginx deployment drift.
- **Local smoke fails too** → fix workspace backend code or pipeline scripts before blaming deployment.
- **Live intake POST works + live status works + frontend still fails** → hand off to frontend cron as a frontend/backend fit issue, not a backend storage issue.

## Minimal smoke check

Run these from `projects/aetherlan-war` to verify backend status wiring without touching production data:

### Queue -> result -> dashboard smoke

```bash
node tools/animation-pipeline/scripts/smoke-queue-flow.mjs
```

Expected result:
- prints JSON with `"ok": true`
- confirms the synthetic job becomes `done`
- confirms `queue-dashboard.json` also reflects `done`
- confirms `queue-dashboard.json.health.ok === true` (no job/result status mismatch detected)

### Intake-side `/api/generator/status` smoke

```bash
node tools/animation-pipeline/scripts/smoke-intake-status.mjs
```

Expected result:
- prints JSON with `"ok": true`
- confirms the local intake server serves `status: "done"`
- confirms `progress.stage === "done-with-preview"`
- confirms `queueDepth === "persistent"`
- confirms browser CORS origin is `https://aetherlan-war.vercel.app`

## Recommended next backend step

Highest-leverage backend reliability improvement after this cutover: let the frontend status route consult the intake-side `/api/generator/status` endpoint first for persistent jobs, while keeping the local dashboard/result mirror as a fallback.

Status:
- frontend `GET /api/generator/status` now prefers the intake-side status endpoint when `NEXT_PUBLIC_GENERATOR_ACTION_URL` points at the persistent intake host (or when `queueDepth=persistent` is present on the redirect)
- local `queue-dashboard.json` / `queue-results/*.result.json` remain the fallback path for previews, offline dev, and mirror lag

This reduces the “accepted upload but unknown/stale status” window for persistent jobs even before the local bridge has rebuilt its mirror.

## Status payload hygiene

The intake-side status response now keeps worker-payload progress semantics while avoiding extra client-facing detail like provider names and raw upload filenames inside `workerPayload`.

Client-visible worker payload now exposes:
- job identity + request binding metadata
- `uploadCount`
- abstract upload labels (`asset-1`, `asset-2`, ...)
- status + next step

This keeps `/api/generator/status` useful for UI progress while reducing accidental implementation-detail leakage.

## Queue/result consistency guard

`tools/animation-pipeline/scripts/build-queue-dashboard.mjs` now emits lightweight backend health fields:

- `health.ok`
- `health.statusMismatchCount`
- `health.orphanResultCount`
- `statusMismatches[]`
- `orphanResults[]`

This makes queue/result drift visible to both local debugging and the intake status endpoint via `queueSummary`, so stale worker/result handoff bugs can be spotted without digging through raw files.
