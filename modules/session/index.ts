export { InMemorySessionContextCache } from "@cognark/module-session/adapters/outbound/in-memory-session-context-cache";
export { WorkspaceSessionManager } from "@cognark/module-session/application/workspace-session-manager";
export type {
  CloseWorkspaceSessionResult,
  CloseWorkspaceSessionStatus,
  OpenWorkspaceSessionInput,
  OpenWorkspaceSessionResult,
  OpenWorkspaceSessionStatus,
  WorkspaceOperationAuthorization,
  WorkspaceOperationAuthorizationDenialReason,
  WorkspaceOperationScope,
  WorkspaceSession,
  WorkspaceSessionChangedEvent,
  WorkspaceSessionOpenMode,
} from "@cognark/module-session/domain/session-model";
export {
  createWorkspaceSession,
  isSameWorkspace,
} from "@cognark/module-session/domain/session-model";
export {
  NoopSessionContextCache,
  type SessionContextCacheClearRecord,
  type SessionContextCachePort,
} from "@cognark/module-session/ports/outbound/session-context-cache-port";

export interface SessionModuleDescriptor {
  readonly name: "session";
  readonly responsibility: "enforce-single-active-workspace-session-and-context-isolation";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "ready-for-req-002";
}

export const sessionModule: SessionModuleDescriptor = {
  name: "session",
  responsibility: "enforce-single-active-workspace-session-and-context-isolation",
  architecture: "hexagonal-vertical-slice",
  status: "ready-for-req-002",
};
