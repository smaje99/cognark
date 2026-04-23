# Workspace Model

A Cognark project is a portable local folder. The workspace is the primary operating boundary and the source of truth for a single active session.

Only one workspace may be active in an application session. Opening another workspace must switch the active session explicitly and clear contextual caches before downstream queries, writes, graphs, or agent context can operate on the new project.

## Workspace Runtime

```text
.workspace/
  workspace.db
  settings.json
  sync-state.json
  logs/
  cache/
  temp/
  agent/
    project-context.md
    question-memory.json
    summaries/
```

## Canonical Project Files

The workspace root contains `project.yaml` and domain folders such as:

- `requirements/`
- `architecture/`
- `meetings/`
- `backlog/`
- `diagrams/`
- `templates/`
- `exports/`

All important Markdown artifacts require frontmatter with human ID, UUID, type, title, status, lifecycle phase, owner, timestamps, and links.

The document parser treats that frontmatter as mandatory. Valid Markdown artifacts are projected into `nodes`, `artifact_files`, and `file_index`; invalid artifacts are recorded as parse errors in `file_index` without creating semantic graph nodes.

## SQLite Role

SQLite stores operational projections:

- project record;
- schema migrations;
- nodes and edges;
- file index;
- artifact file metadata;
- methodology profiles;
- sync targets and sessions;
- conflicts;
- git events;
- dashboard snapshots;
- agent context snapshots.

SQLite must be rebuildable from canonical files whenever practical.

## Local Logs

Workspace logs are local-only JSONL files stored under `.workspace/logs`. They are operational evidence for application, persistence, parsing, sync, Git, agent, export, integration, and plugin events; they are not external telemetry.
