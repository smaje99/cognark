import type { WorkspaceDescriptor } from "@cognark/module-workspace";

export interface WorkspaceSession {
  readonly id: string;
  readonly openedAt: string;
  readonly workspace: WorkspaceDescriptor;
}

export type WorkspaceSessionOpenMode = "replace-active" | "reject-if-active";

export interface OpenWorkspaceSessionInput {
  readonly workspace: WorkspaceDescriptor;
  readonly mode?: WorkspaceSessionOpenMode;
  readonly sessionId?: string;
  readonly openedAt?: string;
}

export type OpenWorkspaceSessionStatus = "opened" | "reused" | "switched" | "rejected";

export interface OpenWorkspaceSessionResult {
  readonly status: OpenWorkspaceSessionStatus;
  readonly activeSession: WorkspaceSession;
  readonly previousSession: WorkspaceSession | null;
  readonly cacheCleared: boolean;
}

export type CloseWorkspaceSessionStatus = "closed" | "no-active-session";

export interface CloseWorkspaceSessionResult {
  readonly status: CloseWorkspaceSessionStatus;
  readonly closedSession: WorkspaceSession | null;
  readonly cacheCleared: boolean;
}

export interface WorkspaceOperationScope {
  readonly rootPath: string;
  readonly projectId?: string;
}

export type WorkspaceOperationAuthorizationDenialReason =
  | "no-active-workspace"
  | "workspace-root-mismatch"
  | "project-id-mismatch";

export type WorkspaceOperationAuthorization =
  | {
      readonly authorized: true;
      readonly session: WorkspaceSession;
    }
  | {
      readonly authorized: false;
      readonly reason: WorkspaceOperationAuthorizationDenialReason;
      readonly activeSession: WorkspaceSession | null;
    };

export interface WorkspaceSessionChangedEvent {
  readonly previousSession: WorkspaceSession | null;
  readonly activeSession: WorkspaceSession | null;
  readonly reason: "opened" | "switched" | "closed";
}

export function createWorkspaceSession(input: {
  readonly workspace: WorkspaceDescriptor;
  readonly sessionId?: string;
  readonly openedAt?: string;
}): WorkspaceSession {
  return {
    id: input.sessionId ?? crypto.randomUUID(),
    openedAt: input.openedAt ?? new Date().toISOString(),
    workspace: input.workspace,
  };
}

export function isSameWorkspace(left: WorkspaceDescriptor, right: WorkspaceDescriptor): boolean {
  return left.rootPath === right.rootPath && left.manifest.project.id === right.manifest.project.id;
}
