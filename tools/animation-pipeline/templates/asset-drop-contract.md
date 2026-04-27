# Asset Drop Contract

Use this contract whenever new animation assets are delivered into the repo.

## Required placement
- character references -> `frontend/public/characters/`
- map sheets -> `frontend/public/characters/`
- cinematic effects -> `frontend/public/effects/<character>/`
- optional raw source dumps -> `tools/animation-pipeline/inbox/<character>/`

## Required naming
- `<character>.png` for master reference
- `<character>-profile-pic.png` for avatar or portrait
- `<character>-sprite.png` for map sheet
- `<character>-<action>.png` or sequence folder for cinematic assets

## Required spec for tactical map sheet
- transparent background
- 256x256 frame size
- 4x4 grid target
- includes idle, run, hit, death
- no cropped silhouette
- consistent baseline across frames

## Required metadata update
After dropping assets:
1. update `config/characters.<id>.json` if any source path changed
2. run `node run-pipeline.mjs`
3. inspect `output/asset-audit.json`
4. do not promote assets to runtime use until audit is clean or intentionally waived

## Acceptance rule
A new asset drop is production-acceptable only if:
- frame counts match config intent
- action ranges do not overflow existing frames
- identity stays consistent with the master reference
- transparent edges are clean enough for atlas packaging
