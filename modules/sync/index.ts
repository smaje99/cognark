export interface SyncModuleDescriptor {
  readonly name: "sync";
  readonly responsibility: "manage-eventual-sync-targets-sessions-queues-and-conflicts";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const syncModule: SyncModuleDescriptor = {
  name: "sync",
  responsibility: "manage-eventual-sync-targets-sessions-queues-and-conflicts",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
