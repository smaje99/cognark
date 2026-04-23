# Dependency Rules

The domain model owns the product language. Frameworks and third-party libraries enter through adapters.

## Allowed

- `apps/*` may depend on `modules/*` and `packages/*`.
- `modules/*/application` may depend on its own `domain` and `ports`.
- `modules/*/adapters` may depend on its own `ports`.
- `packages/ui` may depend on `packages/design-system`.
- Shared primitives may come from `packages/shared-kernel`.

## Forbidden

- Domain code importing adapters.
- Domain code importing Tauri, React, BlockNote, React Flow, bpmn-js, SQLite drivers, Git CLI wrappers, or MCP SDKs.
- UI writing directly to SQLite or workspace files.
- MCP handlers reading files or DB tables without going through use cases.
- A module importing another module's internals.

## Integration Pattern

Use ports for dependencies that may change:

- `FileSystemPort`
- `WorkspaceRepository`
- `WorkspacePersistenceBootstrapPort`
- `GraphRepository`
- `GitPort`
- `McpToolPort`
- `RichTextEditorPort`
- `GraphCanvasPort`
- `BpmnModelerPort`

Concrete implementations live in adapters.
