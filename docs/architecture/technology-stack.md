# Technology Stack

## Active Scaffold

The executable scaffold currently installs only repository tooling:

- `pnpm`
- `turbo`
- `typescript`
- `vitest`
- `eslint`
- `prettier`

This keeps the initial repo buildable before product slices need framework-specific setup.

## Planned Product Dependencies

Introduce these behind ports and adapters when the corresponding requirement needs them:

- Tauri for `apps/desktop`.
- React for desktop UI composition.
- BlockNote for the rich document editor.
- React Flow for the semantic graph canvas.
- bpmn-js for BPMN modeling.
- SQLite driver or binding selected during `REQ-003`.
- MCP SDK for `apps/mcp`.
- Zod or equivalent schema validation for contracts.
- Playwright for UI/e2e checks once UI surfaces exist.

## Rule

Do not import planned product dependencies directly into domain code. Add them only where an adapter, app shell, or integration package requires them.
