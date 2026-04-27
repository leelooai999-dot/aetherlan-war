# Aetherlan War Hetzner Backend Plan

## Goal

Reuse the existing Hetzner host at `178.156.247.8` without mixing Aetherlan War with the existing MonteCarloo / Pyeces services.

## Confirmed host state

- Host: `178.156.247.8`
- Class: effectively CPX21-tier
- Memory: ~`3.7 GiB`
- Disk: `75G` total, ~`44G` free
- Running services already present:
  - `montecarloo.service`
  - `pyeces.service`
  - `nginx.service`
  - `postgresql@16-main.service`
  - `redis-server.service`
- Existing app dirs:
  - `/opt/montecarloo`
  - `/opt/pyeces`

## Isolation rule

Aetherlan War must not share app directories, env files, or systemd units with the existing apps.

## Proposed Aetherlan War layout on Hetzner

```text
/opt/aetherlan-war/
  backend/             # API service code
  worker/              # queue / processing worker code if split later
  uploads/             # persistent raw uploads
  queue/               # queued job JSON / intake metadata
  results/             # worker outputs / manifests / atlases
  logs/                # optional app-level logs
  .env                 # Aetherlan-only env vars
```

## Proposed systemd units

- `aetherlan-war-backend.service`
- `aetherlan-war-worker.service`

## Proposed nginx / domain shape

Keep existing projects untouched. Add Aetherlan as its own upstream and server_name later, for example:

- `api.aetherlan-war.com` or similar future subdomain
- reverse proxy to `127.0.0.1:8010`

## Proposed runtime split

### Vercel frontend keeps doing
- UI
- upload form
- pipeline viewer
- lightweight status display

### Hetzner backend takes over
- multipart upload intake
- persistent file storage on disk
- job metadata persistence
- worker dispatch
- Python image preprocess (trim / background prep / split / atlas prep)

## First practical backend milestone

Implement a small intake API that accepts the current generator payload and writes:

1. raw uploaded files into `/opt/aetherlan-war/uploads/<jobId>/`
2. a job JSON into `/opt/aetherlan-war/queue/<jobId>.json`
3. a normalized worker payload matching the current shared schema:
   - `jobId`
   - `role`
   - `action`
   - `provider`
   - `uploadCount`
   - `uploadNames`
   - `status`
   - `nextStep`

## Compatibility target

The Hetzner intake payload should stay compatible with:

- `frontend/src/lib/worker-payload.ts`
- `/generator` success echo
- `/pipeline` worker-ready JSON block
- local `tools/animation-pipeline` queue/result conventions

## Near-term rollout order

1. Stand up isolated backend service skeleton
2. Add persistent upload + queue write
3. Point frontend generator POST to Hetzner backend
4. Return normalized worker payload back to frontend
5. Add worker loop to consume queued jobs
6. Write queue results / manifest for `/pipeline`

## Non-goals for the first backend cut

- No mixing with `/opt/montecarloo` or `/opt/pyeces`
- No reuse of another app's `.env`
- No pretending this is already a full production animation farm
- No direct file writes from Vercel serverless into workspace paths
