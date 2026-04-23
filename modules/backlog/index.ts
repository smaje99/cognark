export interface BacklogModuleDescriptor {
  readonly name: "backlog";
  readonly responsibility: "manage-work-items-priority-severity-releases-and-estimates";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const backlogModule: BacklogModuleDescriptor = {
  name: "backlog",
  responsibility: "manage-work-items-priority-severity-releases-and-estimates",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
