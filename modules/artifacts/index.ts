export interface ArtifactsModuleDescriptor {
  readonly name: "artifacts";
  readonly responsibility: "create-validate-template-and-index-document-artifacts";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const artifactsModule: ArtifactsModuleDescriptor = {
  name: "artifacts",
  responsibility: "create-validate-template-and-index-document-artifacts",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
