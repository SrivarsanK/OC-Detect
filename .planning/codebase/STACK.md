# Technology Stack

## Core
- **Agent Framework:** Antigravity + Get-Shit-Done (GSD) v1.28.0
- **Skill System:** Vercel Skills / Open Agent Skills

## Dependencies
- `find-skills` (v1.0.0 via vercel-labs/skills)
- `get-shit-done-cc` (v1.28.0 via npx)

## Configuration
- `.agent/`: GSD and skills configuration
- `.gitignore`: Configured to ignore agent-specific metadata
- `skills-lock.json`: Lock file for agent skills

## Runtime
- Node.js (implicit via `npx` and `.cjs` tools)
