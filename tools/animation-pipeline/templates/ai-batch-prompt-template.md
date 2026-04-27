# AI Batch Prompt Template

Use this template per character and action set.

## System intent
Produce Amadis-style tactical fantasy animation assets for Aetherlan War.

## Character identity lock
- Keep the same face, costume, silhouette, weapon, and proportions across all outputs.
- Use the master reference as the anchor image.
- Do not redesign the character between actions.

## Required map actions
Generate a 4x4 tactical sprite sheet with these action allocations:
- idle: 4 frames
- run: 4 frames
- hit: 2 frames
- death: 4 frames
- reserve: 2 frames

## Technical constraints
- transparent background
- output frame size: 256x256
- consistent baseline and ground contact
- readable silhouette at small tactical scale
- no cropped limbs or weapon tips

## Cinematic actions
Generate separate transparent assets for:
- attack
- skill
- magic
- ultimate

## FX prompt addon
If creating skill effects, output transparent-background sequence or sheet for:
- sword slash
- fire burst
- ice burst
- lightning strike
