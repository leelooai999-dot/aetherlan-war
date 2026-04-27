# Samuel Production Pack

Priority score: 100
Reason: core humanoid battle presentation benchmark

## Folders
- incoming: raw AI or artist deliveries
- reviewed: manually checked candidates
- approved: assets ready for runtime intake
- exports: packaged deliverables
- tasks: first-wave action task files

## Flow
1. drop new assets into incoming
2. review quality and consistency
3. move approved files into approved
4. run `bash ../../scripts/advance-approved-assets.sh`
5. inspect runtime gate, progress summary, and gap board
