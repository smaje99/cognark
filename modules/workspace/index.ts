export { NodeWorkspaceFileSystem } from "@cognark/module-workspace/adapters/outbound/node-workspace-file-system";
export { InitializeWorkspaceUseCase } from "@cognark/module-workspace/application/initialize-workspace-use-case";
export {
  createWorkspaceManifest,
  createWorkspaceReadme,
  createWorkspaceSettings,
  createWorkspaceSyncState,
  DEFAULT_ENABLED_MODULES,
  slugifyProjectName,
  WORKSPACE_DIRECTORY_PATHS,
  WORKSPACE_EXPECTED_ENTRIES,
} from "@cognark/module-workspace/domain/workspace-model";
export type {
  InitializeWorkspaceInput,
  InitializeWorkspaceResult,
  WorkspaceDescriptor,
  WorkspaceExpectedEntry,
  WorkspaceIntegrityIssue,
  WorkspaceIntegrityReport,
  WorkspaceManifest,
  WorkspaceSettings,
  WorkspaceSyncState,
} from "@cognark/module-workspace/domain/workspace-model";

export interface WorkspaceModuleDescriptor {
  readonly name: "workspace";
  readonly responsibility: "open-initialize-validate-and-repair-active-workspaces";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "ready-for-req-001";
}

export const workspaceModule: WorkspaceModuleDescriptor = {
  name: "workspace",
  responsibility: "open-initialize-validate-and-repair-active-workspaces",
  architecture: "hexagonal-vertical-slice",
  status: "ready-for-req-001",
};
