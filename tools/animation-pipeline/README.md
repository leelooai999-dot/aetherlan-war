# Aetherlan Animation Pipeline

This pipeline standardizes character frame animation, skill effect metadata, atlas packing, and delivery manifests for Aetherlan War.

## What it does
- reads per-character config
- inspects existing local assets
- ingests new assets from inbox drop folders
- emits normalized metadata JSON
- splits sprite sheets into frame PNGs
- builds atlas planning JSON
- builds runtime manifest JSON
- audits asset completeness and frame validity
- builds AI generation task specs
- builds character production briefs
- ranks production priority
- builds priority production packs and per-action tasks
- emits a runtime gate report
- builds shot lists for first-priority characters
- builds a per-character gap matrix
- builds a markdown gap board
- builds progress summary percentages
- includes a Python trim-preprocess hook for sprite cleanup

## Output highlights
- `output/progress-summary.json`
- `output/gap-board.md`
- `output/runtime-gate.json`
- `production-packs/samuel/`
- `production-packs/isolde/`

## Production use
1. drop or generate assets
2. ingest inbox if needed
3. if uploads were received on Hetzner persistent intake, run `./scripts/pull-hetzner-queue.sh`
4. run pipeline / queue consumer
5. check audit + runtime gate + gap board + progress summary
6. use production packs and task files to drive next asset generation wave

## Hetzner persistent intake bridge

Remote persistent intake jobs can be mirrored into the local worker workspace with:

```bash
./scripts/pull-hetzner-queue.sh
```

That syncs Hetzner queue JSON from `/opt/aetherlan-war/queue/` into local `queue/`, so the existing `process-queue.mjs` consumer can keep working without a full worker rewrite.

After local processing, push queue result JSON back to Hetzner with:

```bash
./scripts/push-hetzner-results.sh
```

That mirrors local `output/queue-results/` into Hetzner `/opt/aetherlan-war/results/`, so the hosted side has a persistent results surface too.
