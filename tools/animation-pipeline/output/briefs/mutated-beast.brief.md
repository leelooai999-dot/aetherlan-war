# Mutated Beast Production Brief

Character ID: mutated-beast
Status: error

## Asset gap
- Expected frames: 16
- Actual frames: 2
- Blocking issue: current tactical sprite sheet is incomplete for gameplay use.

## Required deliverables
- master A-pose reference PNG
- map sprite sheet with idle/run/hit/death
- per-action metadata json
- transparent-background skill effect frames when needed

## Style
- Amadis-style grotesque corrupted monster, readable battle sprite silhouette

## Action prompts
### master
full body mutated beast, front view, monstrous anatomy, consistent corrupted details, plain background

### idle
hostile monster idle loop, breathing and twitching, transparent background

### run
aggressive charge run cycle, corrupted beast, transparent background

### hit
violent recoil hit reaction, monster, transparent background

### death
heavy collapse defeat sequence, monster, transparent background

## Technical target
- Frame size: 256x256
- Grid: 4 x 4
- Background: transparent
- Identity consistency: mandatory

## Current audit errors
- [warning] expected 16 frames from config grid, found 2
- [error] idle expects frame index 3, but only 2 frames exist
- [error] run expects frame index 7, but only 2 frames exist
- [error] hit expects frame index 9, but only 2 frames exist
- [error] death expects frame index 13, but only 2 frames exist

