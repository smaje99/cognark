---
name: cognark-requirement-runner
description: Use when implementing, validating, or updating a Cognark REQ-XXX item from the prioritized agent backlog.
---

# Cognark Requirement Runner

Use this skill for backlog-driven work.

1. Read `AGENT.md`.
2. Read `/home/smaje/Documentos/Projects/cognark/docs/plan_requisitos_priorizados_agente.md`.
3. Select the first `pending` requirement whose dependencies are `done` or `validated`.
4. Mark it `in_progress` before implementation.
5. Keep edits scoped to that requirement and its direct dependencies.
6. Update the requirement status and implementation notes after verification.

Do not skip dependency order without an explicit reason in the backlog or user request.

For architecture placement, read `docs/architecture/dependency-rules.md`.
For context updates, read `docs/context-engineering/update-policy.md`.
