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
