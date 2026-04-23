export interface GraphModuleDescriptor {
  readonly name: "graph";
  readonly responsibility: "manage-semantic-nodes-edges-and-traceability-queries";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const graphModule: GraphModuleDescriptor = {
  name: "graph",
  responsibility: "manage-semantic-nodes-edges-and-traceability-queries",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
