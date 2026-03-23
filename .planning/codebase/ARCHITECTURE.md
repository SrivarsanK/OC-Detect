# System Architecture

## Pattern
- **Spec-Driven Development:** Context engineering via GSD (Get-Shit-Done).
- **Agent Orchestration:** Multi-agent workflow (Researcher, Synthesizer, Roadmapper, Planner, Executor, Verifier).

## Layers
- **Planning Layer:** `.planning/` files (PROJECT, REQUIREMENTS, ROADMAP, STATE).
- **Execution Layer:** Phase plans and direct code modifications by Antigravity.
- **Skill Layer:** `.agent/skills/` (modular units of agent capability).

## Entry Points
- `/gsd-new-project`: Start point for new project life-cycle.
- `/gsd-plan-phase`: Start point for execution phases.
