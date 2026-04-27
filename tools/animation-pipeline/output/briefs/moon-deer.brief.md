# Moon Deer Production Brief

Character ID: moon-deer
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
- Amadis-style mystical deer companion, luminous fantasy creature sprite feel

## Action prompts
### master
full body moon deer, front view, clean silhouette, glowing antlers, consistent markings, plain background

### idle
subtle magical idle loop, glowing deer companion, transparent background

### run
graceful fantasy deer run cycle, transparent background

### hit
brief stagger hit reaction, magical deer, transparent background

### death
gentle collapse sequence, magical deer, transparent background

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

