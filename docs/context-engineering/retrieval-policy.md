# Retrieval Policy

Use the smallest context that can answer the task safely.

## Default Order

1. Read `AGENT.md`.
2. Read the relevant ADR or architecture note.
3. Read the target module public API and local contracts.
4. Read the specific source files involved in the change.
5. Use summarized agent context only to identify likely relevant artifacts.
6. Verify durable facts against canonical files or typed indexes.

## Avoid

- Loading the whole workspace by default.
- Treating summaries as canonical.
- Reading SQLite-derived data when a source file is required for correctness.
- Mixing workspaces in the same session.
