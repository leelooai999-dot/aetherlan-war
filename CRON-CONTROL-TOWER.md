# Aetherlan Cron Control Tower

## 2026-04-28 13:15 UTC backend autopilot note

Live intake backend drift is now resolved; the remaining public upload/status issue has narrowed to frontend deployment drift.

Observed directly:
- `bash backend/deploy-intake-smoke.sh` now passes end-to-end with `preflight_ok=1 post_ok=1 status_ok=1`
- live `OPTIONS https://aetherlan-intake.montecarloo.com/api/generator` from origin `https://aetherlan-war.vercel.app` now returns `204` with correct CORS headers
- live multipart `POST` returns `uploadCount: 1` and persists a fresh job (`gen-20260428131535-800050`)
- live intake `GET /api/generator/status?jobId=gen-20260428131535-800050` now returns `200` with `found: true`, `status: "queued"`, and healthy `queueSummary.health.ok: true`

Implication:
- do not spend more backend cycles chasing the old Hetzner CORS/status bug unless this smoke regresses again
- highest-leverage next action is a Vercel/frontend deploy verification, because the intake host is healthy and older public `/api/generator/status` behavior is now the likely remaining stale layer
- after the frontend deploy, re-run one public `/generator` smoke upload and verify: action URL points at intake host -> upload accepted -> public status route reports queued/processing instead of `unknown` -> preview/result visibility
