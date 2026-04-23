export interface McpServerDescriptor {
  readonly app: "mcp";
  readonly scope: "active-workspace";
  readonly status: "scaffolded";
}

export const mcpServer: McpServerDescriptor = {
  app: "mcp",
  scope: "active-workspace",
  status: "scaffolded",
};
