# Samuel Production Brief

Character ID: samuel
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
- Amadis-style tactical JRPG battle animation, polished fantasy 2D sprite feel

## Action prompts
### master
full body hero, A-pose, front view, transparent or plain background, same face, same armor, same sword, consistent proportions

### idle
subtle breathing idle loop, fantasy warrior, same costume, transparent background

### run
side-facing tactical run cycle, fantasy warrior, same costume, transparent background

### hit
brief recoil hit reaction, fantasy warrior, same costume, transparent background

### death
falling defeat sequence, fantasy warrior, same costume, transparent background

### attackFx
bright sword slash arc, alpha background, fantasy hit effect

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

