export interface DesktopShellDescriptor {
  readonly app: "desktop";
  readonly runtime: "tauri";
  readonly status: "scaffolded";
}

export const desktopShell: DesktopShellDescriptor = {
  app: "desktop",
  runtime: "tauri",
  status: "scaffolded",
};
