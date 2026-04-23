# ADR-001: Use A TypeScript Monorepo

## Status

Accepted

## Context

Cognark combines a desktop app, a local MCP server, shared packages, and many product domains. The system needs consistent contracts and tooling while allowing modules to evolve independently.

## Decision

Use a `pnpm` and `turbo` TypeScript monorepo with `apps`, `packages`, and `modules`.

## Consequences

- Shared scripts and TypeScript settings stay centralized.
- Modules can be built and tested independently.
- Cross-module boundaries must be enforced through package APIs and architecture review.
