# Context Update Policy

Agent context updates are triggered by semantic events, not every file save.

## Trigger Events

- Workspace initialization or repair.
- Phase or methodology changes.
- Creation or closure of spikes.
- Approval or supersession of ADRs.
- Meeting closure with decisions or derived work.
- Requirement batch approval.
- Release changes.
- Cost consolidation.
- Sync sessions and conflict resolution.

## Constraints

- Keep summaries bounded.
- Prefer incremental updates.
- Record source artifact IDs for every summary entry.
- Regenerate when incremental consistency is uncertain.
