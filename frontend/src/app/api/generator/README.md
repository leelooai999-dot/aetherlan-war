# Generator Upload Flow (Current State)

## What works now
- `POST /api/generator` accepts upload requests on Vercel.
- `frontend/src/app/generator/page.tsx` now supports a configurable form target through `NEXT_PUBLIC_GENERATOR_ACTION_URL`, so the browser form can later post directly to an external Hetzner intake endpoint without rewriting the page again.
- The UI confirms the received request with:
  - job id
  - role
  - action
  - provider
  - upload count
  - upload file names
- `/pipeline` can show a lightweight "recent online receipt" handoff from the success page.

## What is not fully online yet
- Persistent storage for uploaded files
- Real server-side queue persistence shared between Vercel and local pipeline
- Automatic background worker execution on uploaded assets
- Automatic trim -> split -> atlas -> manifest pipeline on the hosted deployment

## Local pipeline progress
- `tools/animation-pipeline/scripts/process-queue.mjs` can now:
  - consume local queue files
  - copy uploaded inputs into a job workspace
  - attempt PNG/WebP trim preprocessing through `python/preprocess_frames.py`
  - emit stub manifests and queue result JSON

## Recommended next storage step
The next real milestone should be one of:
1. Vercel Blob for uploaded files + lightweight metadata JSON
2. Supabase / Postgres table for queue jobs
3. A small external worker endpoint that receives upload metadata and runs the local pipeline remotely

Until one of those exists, the hosted flow is still a preview intake + visible confirmation layer, not a full production asset pipeline.

## Planned external backend switch
When the Hetzner backend is ready, set:

```bash
NEXT_PUBLIC_GENERATOR_ACTION_URL=https://<future-aetherlan-backend>/api/generator
```

That will let the public upload form post to the isolated persistent backend while keeping the current generator UI intact.
