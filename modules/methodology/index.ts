export interface MethodologyModuleDescriptor {
  readonly name: "methodology";
  readonly responsibility: "load-validate-and-query-methodology-profiles-and-lifecycles";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "scaffolded";
}

export const methodologyModule: MethodologyModuleDescriptor = {
  name: "methodology",
  responsibility: "load-validate-and-query-methodology-profiles-and-lifecycles",
  architecture: "hexagonal-vertical-slice",
  status: "scaffolded",
};
