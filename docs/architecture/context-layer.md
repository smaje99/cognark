# Context Layer

The context layer exists to make agentic work efficient without making summaries canonical.

## Canonical Sources

- Workspace files with valid frontmatter.
- Diagram files such as BPMN XML.
- `project.yaml`.
- Versioned methodology profiles and templates.

## Operational Indexes

- SQLite tables for nodes, edges, file index, sync state, snapshots, queues, and dashboards.
- These tables accelerate access and preserve traceability, but do not replace source files.

## Agent Context

The workspace will maintain:

- `.workspace/agent/project-context.md`
- `.workspace/agent/question-memory.json`
- `.workspace/agent/summaries/`

These files summarize the active state of the project, recent semantic events, open risks, decisions, and relevant context fragments.

## Rule

Agents may use summarized context to decide what to read next. They must verify important facts against canonical files or typed indexes before making durable changes.
