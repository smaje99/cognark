# Cognark

Cognark is a local-first desktop workspace for integral project engineering. It is designed around plain files as the canonical source, SQLite as an operational index, and a semantic graph that connects requirements, architecture, meetings, backlog, costs, diagrams, repository events, and agent context.

## Repository Shape

This repository starts as a TypeScript monorepo using `pnpm` and `turbo`.

- `apps/desktop`: future Tauri desktop shell and module composition.
- `apps/mcp`: future local MCP server scoped to the active workspace.
- `packages/*`: shared kernel, UI primitives, design system, and SDK contracts.
- `modules/*`: vertical slices following hexagonal architecture.
- `docs/architecture`: durable architectural guidance.
- `docs/context-engineering`: agent context and retrieval policy.
- `.codex/skills`: local Codex skills for this repository.

See `docs/architecture/technology-stack.md` for active tooling and planned product dependencies.

## Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm format
```

## License

This project is licensed under the Business Source License 1.1 (BUSL).

- Free for personal and non-production use
- Commercial use requires a license
- Converts to GPL-3.0 after 2031-01-01

See LICENSE for details.
