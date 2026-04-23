export interface DiagramsModuleDescriptor {
  readonly name: "diagrams";
  readonly responsibility: "register-parse-and-synchronize-semantic-diagrams";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const diagramsModule: DiagramsModuleDescriptor = {
  name: "diagrams",
  responsibility: "register-parse-and-synchronize-semantic-diagrams",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
