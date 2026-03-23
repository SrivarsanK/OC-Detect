# Directory Structure

## Root
- `.git/`: Vercel/Git source control
- `.gitignore`: User-defined ignore patterns for agent metadata
- `skills-lock.json`: Lock file for agent skills

## .agent/
- `get-shit-done/`: GSD binaries, tools, templates, and core logic (from `npx get-shit-done-cc`)
- `skills/`: Individual agent skills (find-skills, gsd-*, etc.)

## .planning/ (to be created completely)
- `codebase/`: Current codebase map (this document)
- `PROJECT.md`, `ROADMAP.md`, `STATE.md`: Project-level planning and memory

## .vscode/
- `settings.json`: Editor-specific environment settings
