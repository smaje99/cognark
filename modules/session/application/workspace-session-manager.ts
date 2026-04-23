import type {
  CloseWorkspaceSessionResult,
  OpenWorkspaceSessionInput,
  OpenWorkspaceSessionResult,
  WorkspaceOperationAuthorization,
  WorkspaceOperationScope,
  WorkspaceSession,
} from "@cognark/module-session/domain/session-model";
import {
  createWorkspaceSession,
  isSameWorkspace,
} from "@cognark/module-session/domain/session-model";
import {
  NoopSessionContextCache,
  type SessionContextCachePort,
} from "@cognark/module-session/ports/outbound/session-context-cache-port";

export class WorkspaceSessionManager {
  private activeSession: WorkspaceSession | null = null;

  public constructor(
    private readonly contextCache: SessionContextCachePort = new NoopSessionContextCache(),
  ) {}

  public getActiveSession(): WorkspaceSession | null {
    return this.activeSession;
  }

  public async openWorkspace(
    input: OpenWorkspaceSessionInput,
  ): Promise<OpenWorkspaceSessionResult> {
    if (this.activeSession && isSameWorkspace(this.activeSession.workspace, input.workspace)) {
      return {
        status: "reused",
        activeSession: this.activeSession,
        previousSession: this.activeSession,
        cacheCleared: false,
      };
    }

    if (this.activeSession && input.mode === "reject-if-active") {
      return {
        status: "rejected",
        activeSession: this.activeSession,
        previousSession: this.activeSession,
        cacheCleared: false,
      };
    }

    const previousSession = this.activeSession;
    const nextSession = createWorkspaceSession({
      workspace: input.workspace,
      sessionId: input.sessionId,
      openedAt: input.openedAt,
    });
    this.activeSession = nextSession;

    const status = previousSession ? "switched" : "opened";

    if (previousSession) {
      await this.contextCache.clearForWorkspaceChange({
        previousSession,
        activeSession: nextSession,
        reason: "switched",
      });
    }

    return {
      status,
      activeSession: nextSession,
      previousSession,
      cacheCleared: Boolean(previousSession),
    };
  }

  public async closeActiveWorkspace(): Promise<CloseWorkspaceSessionResult> {
    if (!this.activeSession) {
      return {
        status: "no-active-session",
        closedSession: null,
        cacheCleared: false,
      };
    }

    const closedSession = this.activeSession;
    this.activeSession = null;

    await this.contextCache.clearForWorkspaceChange({
      previousSession: closedSession,
      activeSession: null,
      reason: "closed",
    });

    return {
      status: "closed",
      closedSession,
      cacheCleared: true,
    };
  }

  public authorizeWorkspaceOperation(
    scope: WorkspaceOperationScope,
  ): WorkspaceOperationAuthorization {
    if (!this.activeSession) {
      return {
        authorized: false,
        reason: "no-active-workspace",
        activeSession: null,
      };
    }

    if (this.activeSession.workspace.rootPath !== scope.rootPath) {
      return {
        authorized: false,
        reason: "workspace-root-mismatch",
        activeSession: this.activeSession,
      };
    }

    if (
      scope.projectId !== undefined &&
      this.activeSession.workspace.manifest.project.id !== scope.projectId
    ) {
      return {
        authorized: false,
        reason: "project-id-mismatch",
        activeSession: this.activeSession,
      };
    }

    return {
      authorized: true,
      session: this.activeSession,
    };
  }
}
