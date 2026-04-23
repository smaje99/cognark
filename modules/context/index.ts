export interface ContextModuleDescriptor {
  readonly name: "context";
  readonly responsibility: "manage-agent-context-summaries-and-retrieval-policy";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const contextModule: ContextModuleDescriptor = {
  name: "context",
  responsibility: "manage-agent-context-summaries-and-retrieval-policy",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
