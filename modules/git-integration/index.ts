export interface GitIntegrationModuleDescriptor {
  readonly name: "git-integration";
  readonly responsibility: "manage-git-bootstrap-snapshots-signing-and-repository-events";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const gitIntegrationModule: GitIntegrationModuleDescriptor = {
  name: "git-integration",
  responsibility:
    "manage-git-bootstrap-snapshots-signing-and-repository-events",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
