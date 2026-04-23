import type { WorkspaceSessionChangedEvent } from "@cognark/module-session/domain/session-model";
import type {
  SessionContextCacheClearRecord,
  SessionContextCachePort,
} from "@cognark/module-session/ports/outbound/session-context-cache-port";

export class InMemorySessionContextCache implements SessionContextCachePort {
  private readonly records: SessionContextCacheClearRecord[] = [];

  public async clearForWorkspaceChange(event: WorkspaceSessionChangedEvent): Promise<void> {
    this.records.push({
      previousSession: event.previousSession,
      activeSession: event.activeSession,
      reason: event.reason,
    });
  }

  public getClearRecords(): readonly SessionContextCacheClearRecord[] {
    return this.records;
  }
}
