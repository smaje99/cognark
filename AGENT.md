# Cognark Agent Guide

## Operating Principle

Cognark is local-first, file-first, graph-centered, and agent-ready. Plain files are canonical. SQLite is an operational index for queries, graph traversal, sync state, caches, and dashboards. Agents must preserve that separation.

## Architecture Rules

- Use hexagonal architecture inside each vertical module.
- Keep domain code free of Tauri, React, BlockNote, React Flow, bpmn-js, SQLite drivers, Git CLI details, and MCP SDK details.
- Use ports for external dependencies and adapters for concrete implementations.
- Do not import internals from another module. Communicate through public contracts, application use cases, or events.
- UI and MCP entrypoints must call application use cases, not repositories or files directly.

## Backlog Execution

The prioritized backlog lives in:

`/home/smaje/Documentos/Projects/cognark/docs/plan_requisitos_priorizados_agente.md`

When implementing requirements:

1. Find the first `pending` requirement whose dependencies are `done` or `validated`.
2. Mark it `in_progress` before changing implementation files.
3. Keep edits scoped to the requirement.
4. Record modified files, decisions, risks, and remaining work.
5. Mark the requirement `done` after implementation and verification.
6. Use `validated` only after review or explicit validation.
7. If blocked, mark `blocked` and document the exact blocker.

Do not skip dependency order unless the backlog explicitly marks work as parallelizable.

## Context Engineering

Use `docs/context-engineering` before loading broad project context. Prefer narrow retrieval:

- architectural decisions first;
- module contracts second;
- canonical artifact files third;
- SQLite-derived outputs only as indexes or caches;
- `.workspace/agent/project-context.md` only as summarized operational context, never as canonical truth.

When context changes through a semantic event, update the relevant context summary policy rather than appending uncontrolled notes.

## File And Persistence Rules

- New workspace artifacts must have valid YAML frontmatter.
- Human IDs and UUIDs are both required for durable project nodes.
- SQLite migrations must be idempotent and versioned.
- Logs must be local, structured, and exportable.
- No external telemetry is allowed.

## Verification

For scaffold and platform changes, run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Run narrower checks when working inside one module, but report any checks that could not be executed.
