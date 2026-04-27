# Aetherlan Animation Production Report

Generated: 2026-04-26T19:27:26.142Z

## Summary
- Characters audited: 4
- OK: 0
- Warning: 0
- Error: 4

## Key finding
- Current sprite assets are placeholder or partial sheets, not production-complete tactical animation sheets.
- Config expects 4x4 map sheets (16 frames), but current files yield only 2 frames each.
- Result: idle, run, hit, and death sequences are all incomplete.

## Character status
### Isolde (isolde)
- Status: error
- Expected frames: 16
- Actual frames: 2
- Source sheet: ../../../frontend/public/characters/isolde-sprite.png
- Source size: 480786 bytes
- Issues:
  - [warning] FRAME_COUNT_MISMATCH: expected 16 frames from config grid, found 2
  - [error] ACTION_OUT_OF_RANGE: idle expects frame index 3, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: run expects frame index 7, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: hit expects frame index 9, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: death expects frame index 13, but only 2 frames exist

### Moon Deer (moon-deer)
- Status: error
- Expected frames: 16
- Actual frames: 2
- Source sheet: ../../../frontend/public/characters/moon-deer-sprite.png
- Source size: 300861 bytes
- Issues:
  - [warning] FRAME_COUNT_MISMATCH: expected 16 frames from config grid, found 2
  - [error] ACTION_OUT_OF_RANGE: idle expects frame index 3, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: run expects frame index 7, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: hit expects frame index 9, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: death expects frame index 13, but only 2 frames exist

### Mutated Beast (mutated-beast)
- Status: error
- Expected frames: 16
- Actual frames: 2
- Source sheet: ../../../frontend/public/characters/mutated-beast-sprite.png
- Source size: 374818 bytes
- Issues:
  - [warning] FRAME_COUNT_MISMATCH: expected 16 frames from config grid, found 2
  - [error] ACTION_OUT_OF_RANGE: idle expects frame index 3, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: run expects frame index 7, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: hit expects frame index 9, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: death expects frame index 13, but only 2 frames exist

### Samuel (samuel)
- Status: error
- Expected frames: 16
- Actual frames: 2
- Source sheet: ../../../frontend/public/characters/samuel-sprite.png
- Source size: 356020 bytes
- Issues:
  - [warning] FRAME_COUNT_MISMATCH: expected 16 frames from config grid, found 2
  - [error] ACTION_OUT_OF_RANGE: idle expects frame index 3, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: run expects frame index 7, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: hit expects frame index 9, but only 2 frames exist
  - [error] ACTION_OUT_OF_RANGE: death expects frame index 13, but only 2 frames exist

## AI generation task summary
### Isolde
- Style: Amadis-style tactical JRPG battle animation, elegant fantasy heroine sprite feel
- Deliverables: master A-pose reference PNG, map sprite sheet with idle/run/hit/death, per-action metadata json, transparent-background skill effect frames when needed
- Map spec: 256x256, 4 rows x 4 columns

### Moon Deer
- Style: Amadis-style mystical deer companion, luminous fantasy creature sprite feel
- Deliverables: master A-pose reference PNG, map sprite sheet with idle/run/hit/death, per-action metadata json, transparent-background skill effect frames when needed
- Map spec: 256x256, 4 rows x 4 columns

### Mutated Beast
- Style: Amadis-style grotesque corrupted monster, readable battle sprite silhouette
- Deliverables: master A-pose reference PNG, map sprite sheet with idle/run/hit/death, per-action metadata json, transparent-background skill effect frames when needed
- Map spec: 256x256, 4 rows x 4 columns

### Samuel
- Style: Amadis-style tactical JRPG battle animation, polished fantasy 2D sprite feel
- Deliverables: master A-pose reference PNG, map sprite sheet with idle/run/hit/death, per-action metadata json, transparent-background skill effect frames when needed
- Map spec: 256x256, 4 rows x 4 columns

## Recommended next actions
1. Generate or paint complete 16-frame map sheets for each character.
2. Lock a per-character master reference before producing action frames.
3. Keep map sheet limited to idle, run, hit, death.
4. Build attack, skill, magic, and ultimate as separate cinematic assets.
5. Re-run this pipeline after every asset drop to catch sheet mismatches immediately.

