export interface ExportModuleDescriptor {
  readonly name: "export";
  readonly responsibility: "produce-pdf-reports-and-document-packages";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const exportModule: ExportModuleDescriptor = {
  name: "export",
  responsibility: "produce-pdf-reports-and-document-packages",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
