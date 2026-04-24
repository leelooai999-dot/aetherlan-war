# Aetherlan Animation Workflow

## 1. Character Master
For each character, first create a consistent hyper-realistic master reference:
- full body
- A-pose
- front view
- clean background
- fixed face, costume, weapon, proportions

This is the anchor asset for all later animation generation.

## 2. Map Animation Module
The map sprite system is only for lightweight board-state animation.

Included actions:
- idle
- run
- hit
- death (optional later)

Excluded from map module:
- jump
- attack
- skill
- magic
- ultimate

These should not live in the chessboard movement sheet.

### Output
One master sheet per character:
- `map-sheet.png`
- `map-sheet.json`

The metadata should define:
- frameWidth
- frameHeight
- frameCount
- rows / columns
- action regions
- anchor point
- default scale
- facing rules

## 3. Full-Screen Performance Module
The following belong to the full-screen cinematic system:
- jump
- attack
- skill cast
- magic
- special move
- ultimate

These are presentation-heavy actions and should be authored as separate performance assets.

### Output
Store them separately, for example:
- `jump-sheet.png`
- `jump.json`
- `attack-sheet.png`
- `attack.json`
- `skill-sheet.png`
- `skill.json`
- `magic-sheet.png`
- `magic.json`
- `ultimate-sheet.png`
- `ultimate.json`

Recommended path:
- `/public/effects/<character>/...`

## 4. Runtime Logic
### Map state machine
Use map animation only for:
- idle when standing still
- run when moving across board tiles
- hit when damaged
- death when defeated

### Full-screen state machine
Use cinematic assets for:
- jump
- attack
- skill
- magic
- ultimate

When a cinematic action triggers:
1. board enters presentation state
2. play full-screen or near-full-screen performance asset
3. resolve gameplay result
4. return to board state

## 5. Recommended Asset Structure
```text
/public/characters/samuel/
  a-pose.png
  portrait.png
  map-sheet.png
  map-sheet.json

/public/effects/samuel/
  jump-sheet.png
  jump.json
  attack-sheet.png
  attack.json
  skill-sheet.png
  skill.json
  magic-sheet.png
  magic.json
  ultimate-sheet.png
  ultimate.json
```

## 6. Delivery Checklist For Each Character
### Base character assets
- A-pose master
- portrait
- full body reference

### Map module
- one map master sheet
- map metadata
- includes only idle / run / hit / death

### Performance module
- jump
- attack
- skill
- magic
- ultimate
- metadata for each

## 7. Standard Production Pipeline
1. Create the A-pose master image
2. Create the map sprite module
   - idle / run / hit / death
3. Integrate with board state logic
4. Create cinematic action assets
   - jump / attack / skill / magic / ultimate
5. Integrate with the performance module
6. Tune anchor, scale, timing, and layering in-game
