---
name: cognark-repo-onboarding
description: Use when entering the Cognark repository, reviewing its architecture, orienting a new task, or deciding where code should live in the monorepo.
---

# Cognark Repo Onboarding

Start with `AGENT.md`, then read only the architecture note needed for the task:

- `docs/architecture/monorepo-structure.md`
- `docs/architecture/dependency-rules.md`
- `docs/architecture/context-layer.md`
- `docs/architecture/workspace-model.md`

Respect these defaults:

- applications compose modules;
- modules are vertical slices;
- each module uses hexagonal architecture;
- domain code stays framework-free;
- files are canonical and SQLite is derived operational state.

If a task touches backlog execution, use `cognark-requirement-runner`.
If a task touches agent summaries, prompt packs, retrieval, or `.workspace/agent`, use `cognark-context-engineering`.
