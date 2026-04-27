# Aetherlan War Hetzner Intake Backend

Minimal persistent upload intake server for the first Hetzner backend cut.

## Purpose

Replace Vercel preview-only intake with a persistent endpoint that:

- receives multipart uploads
- writes raw files to `/opt/aetherlan-war/uploads/<jobId>/`
- writes queue job JSON to `/opt/aetherlan-war/queue/<jobId>.json`
- returns normalized worker payload JSON to the caller

## Run locally

```bash
cd backend
python3 intake_server.py
```

## Env vars

- `AETHERLAN_BASE_DIR` default: `/opt/aetherlan-war`
- `AETHERLAN_HOST` default: `0.0.0.0`
- `AETHERLAN_PORT` default: `8010`

## First deployment target on Hetzner

- code dir: `/opt/aetherlan-war/backend`
- health endpoint: `GET /health`
- intake endpoint: `POST /api/generator`

## Current limitations

- no auth yet
- no nginx reverse proxy yet
- no systemd unit yet
- no worker consumer yet

## Browser form behavior

- JSON/API callers receive a JSON response.
- Browser form posts with `Accept: text/html` now receive a `303` redirect back to `/generator?...` with the same success query params the Vercel preview flow already uses.
- This keeps the existing generator success UI compatible while the backend moves to Hetzner.

This is intentionally the smallest persistent backend skeleton that proves the storage and queue write path.
