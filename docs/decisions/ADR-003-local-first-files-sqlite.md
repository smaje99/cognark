# ADR-003: Use Plain Files Plus SQLite

## Status

Accepted

## Context

Cognark must work offline, remain portable, and allow project artifacts to be inspected outside the application.

## Decision

Use plain files as canonical project sources and SQLite as the local operational index.

## Consequences

- Markdown, YAML, XML, and templates remain readable and versionable.
- SQLite enables graph queries, dashboards, sync state, logs, and caches.
- The system must maintain clear rebuild and invalidation rules for derived state.
