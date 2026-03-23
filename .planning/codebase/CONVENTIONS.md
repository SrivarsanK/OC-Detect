# Coding Conventions

## Framework
- **Metaprompt-driven:** Project is context-driven via `.planning/*.md` files.

## Documentation
- **Spec-first:** Always define goals in REQUIREMENTS.MD before planning.
- **Phase-based:** Progress is committed in waves.

## Git
- **Commit Pattern:** `chore: add project config`, `docs: initialize project`, `feat: [phase name]`.
- **Ignore Pattern:** Always ignore `.agent/skills/` and other user-specific agent metadata.

## Tooling
- **Powershell Policy:** Must use `cmd /C` or bypass policies when calling `npx` on Windows.
