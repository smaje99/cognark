import type {
  WorkspaceSession,
  WorkspaceSessionChangedEvent,
} from "@cognark/module-session/domain/session-model";

export interface SessionContextCachePort {
  clearForWorkspaceChange(event: WorkspaceSessionChangedEvent): Promise<void>;
}

export class NoopSessionContextCache implements SessionContextCachePort {
  public async clearForWorkspaceChange(_event: WorkspaceSessionChangedEvent): Promise<void> {
    return;
  }
}

export interface SessionContextCacheClearRecord {
  readonly previousSession: WorkspaceSession | null;
  readonly activeSession: WorkspaceSession | null;
  readonly reason: WorkspaceSessionChangedEvent["reason"];
}
