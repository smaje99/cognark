export interface WorkspaceModuleDescriptor {
  readonly name: "workspace";
  readonly responsibility: "open-initialize-and-manage-active-workspace-session";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const workspaceModule: WorkspaceModuleDescriptor = {
  name: "workspace",
  responsibility: "open-initialize-and-manage-active-workspace-session",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
