# Monorepo Structure

Cognark uses a TypeScript monorepo organized around applications, shared packages, and vertical domain modules.

```text
apps/
  desktop/
  mcp/
packages/
  shared-kernel/
  ui/
  design-system/
  sdk/
modules/
  workspace/
  session/
  persistence/
  logging/
  documents/
  artifacts/
  context/
  graph/
  methodology/
  backlog/
  diagrams/
  git-integration/
  sync/
  export/
```

## Applications

`apps/desktop` is the future Tauri desktop shell. It owns runtime composition, navigation, providers, desktop wiring, and presentation entrypoints.

`apps/mcp` is the future local MCP server. It exposes scoped tools and resources for the active workspace only.

Applications may compose modules and adapters. They must not contain deep business rules.

## Shared Packages

`packages/shared-kernel` contains small cross-cutting primitives: IDs, result types, domain errors, and base events.

`packages/ui` contains reusable UI components without domain logic.

`packages/design-system` contains design tokens, themes, primitives, and accessibility conventions.

`packages/sdk` contains extension contracts for plugins and integrations.

## Vertical Modules

Each `modules/*` package is a vertical slice with its own domain, application layer, ports, adapters, contracts, tests, and public `index.ts`.

Modules should evolve independently and communicate through public contracts, application use cases, events, or read models.

`modules/session` owns the single active workspace session boundary. It prevents cross-workspace operations and coordinates contextual cache cleanup when the active workspace changes.

`modules/persistence` owns the local SQLite operational schema, migration runner, and project projection bootstrap. It enters the workspace initializer through an outbound port so workspace domain code stays independent from SQLite bindings.

`modules/logging` owns local structured JSONL logs under `.workspace/logs`. It provides append, recent-read, rotation, and export operations without external telemetry.

`modules/documents` owns Markdown artifact frontmatter parsing and local index synchronization. It validates mandatory YAML frontmatter and projects valid artifacts into SQLite through a persistence port.
