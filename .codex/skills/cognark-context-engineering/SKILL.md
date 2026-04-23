---
name: cognark-context-engineering
description: Use when creating, querying, updating, or designing Cognark agent context, prompt packs, retrieval policy, question memory, or summarized project context.
---

# Cognark Context Engineering

The context layer reduces token use. It does not replace canonical artifacts.

Read these files as needed:

- `docs/context-engineering/overview.md`
- `docs/context-engineering/context-map.md`
- `docs/context-engineering/retrieval-policy.md`
- `docs/context-engineering/prompt-packs.md`
- `docs/context-engineering/update-policy.md`
- `docs/context-engineering/agent-workflow.md`

Rules:

- Use summaries to find relevant sources, not to make irreversible claims.
- Verify durable facts against canonical files or typed indexes.
- Keep context updates event-driven and bounded.
- Preserve source artifact IDs in summaries whenever possible.
