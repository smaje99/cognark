# ADR-002: Use Hexagonal Architecture With Vertical Slicing

## Status

Accepted

## Context

The platform depends on several replaceable technologies: Tauri, React, BlockNote, React Flow, bpmn-js, SQLite, Git, MCP, exporters, and parsers.

## Decision

Each domain capability is a vertical module. Inside each module, use hexagonal architecture:

- `domain`
- `application`
- `ports`
- `adapters`
- `contracts`
- `tests`

## Consequences

- Domain rules stay independent of frameworks.
- Adapters can be replaced without rewriting core behavior.
- Modules must avoid importing other modules' internals.
