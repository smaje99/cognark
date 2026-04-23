export type WorkspacePathKind = "file" | "directory";

export interface WorkspaceExpectedEntry {
  readonly path: string;
  readonly kind: WorkspacePathKind;
  readonly contentKind?: "json" | "yaml" | "text";
}

export interface WorkspaceManifest {
  readonly project: {
    readonly id: string;
    readonly uuid: string;
    readonly name: string;
    readonly slug: string;
    readonly default_currency: string;
    readonly secondary_currencies: readonly string[];
    readonly methodology_profile: string;
    readonly owner: string;
    readonly created_at: string;
    readonly modules: readonly string[];
  };
}

export interface WorkspaceSettings {
  readonly theme: "dark" | "light";
  readonly autosave: boolean;
  readonly git_auto_snapshot: boolean;
  readonly sync_mode: "manual" | "interval";
  readonly sync_interval_minutes: number | null;
  readonly keyboard_profile: "vscode";
  readonly enabled_plugins: readonly string[];
}

export interface WorkspaceSyncState {
  readonly version: 1;
  readonly status: "idle";
  readonly last_sync_at: string | null;
  readonly last_successful_sync_at: string | null;
  readonly manifest_hash: string | null;
  readonly pending_operations: number;
  readonly conflicts: readonly string[];
}

export interface WorkspaceDescriptor {
  readonly rootPath: string;
  readonly manifest: WorkspaceManifest;
}

export type WorkspaceIntegrityIssueCode =
  | "missing_path"
  | "path_type_mismatch"
  | "invalid_json"
  | "invalid_yaml";

export interface WorkspaceIntegrityIssue {
  readonly code: WorkspaceIntegrityIssueCode;
  readonly path: string;
  readonly expectedKind: WorkspacePathKind;
  readonly actualKind: WorkspacePathKind | "missing" | null;
  readonly detail: string;
  readonly repairable: boolean;
}

export interface WorkspaceIntegrityReport {
  readonly isValid: boolean;
  readonly hasWorkspaceMarkers: boolean;
  readonly issues: readonly WorkspaceIntegrityIssue[];
}

export interface InitializeWorkspaceInput {
  readonly rootPath: string;
  readonly projectName?: string;
  readonly projectSlug?: string;
  readonly projectId?: string;
  readonly owner?: string;
  readonly methodologyProfile?: string;
  readonly defaultCurrency?: string;
  readonly secondaryCurrencies?: readonly string[];
  readonly enabledModules?: readonly string[];
  readonly repairMode?: "none" | "apply";
}

export type InitializeWorkspaceStatus = "initialized" | "opened" | "repair-required" | "repaired";

export interface InitializeWorkspaceResult {
  readonly status: InitializeWorkspaceStatus;
  readonly workspace: WorkspaceDescriptor | null;
  readonly integrity: WorkspaceIntegrityReport;
  readonly repairedPaths: readonly string[];
}

export const WORKSPACE_DIRECTORY_PATHS = [
  ".workspace",
  ".workspace/logs",
  ".workspace/cache",
  ".workspace/temp",
  "docs",
  "ideas",
  "brainstorming",
  "benchmarking",
  "strategy",
  "stakeholders",
  "crm",
  "requirements",
  "requirements/epics",
  "requirements/user-stories",
  "requirements/use-cases",
  "requirements/business-rules",
  "requirements/acceptance-criteria",
  "personas",
  "releases",
  "backlog",
  "processes",
  "architecture",
  "architecture/business",
  "architecture/it",
  "architecture/software",
  "architecture/design",
  "architecture/decisions",
  "data",
  "data/models",
  "data/dictionary",
  "resources",
  "costs",
  "accounting",
  "planning",
  "planning/wbs",
  "planning/pert",
  "planning/gantt",
  "normatives",
  "meetings",
  "implementation",
  "spikes",
  "dashboards",
  "diagrams",
  "diagrams/bpmn",
  "diagrams/erd",
  "diagrams/story-maps",
  "diagrams/flow",
  "diagrams/sequence",
  "templates",
  "templates/static",
  "templates/dynamic",
  "exports",
] as const;

export const WORKSPACE_FILE_ENTRIES: readonly WorkspaceExpectedEntry[] = [
  {
    path: "project.yaml",
    kind: "file",
    contentKind: "yaml",
  },
  {
    path: ".workspace/settings.json",
    kind: "file",
    contentKind: "json",
  },
  {
    path: ".workspace/sync-state.json",
    kind: "file",
    contentKind: "json",
  },
  {
    path: ".workspace/workspace.db",
    kind: "file",
    contentKind: "text",
  },
  {
    path: "README.md",
    kind: "file",
    contentKind: "text",
  },
] as const;

export const WORKSPACE_EXPECTED_ENTRIES: readonly WorkspaceExpectedEntry[] = [
  ...WORKSPACE_DIRECTORY_PATHS.map((path) => ({ path, kind: "directory" as const })),
  ...WORKSPACE_FILE_ENTRIES,
];

export const DEFAULT_ENABLED_MODULES = [
  "requirements",
  "architecture",
  "processes",
  "cost-accounting",
  "meetings",
  "sync",
  "mcp",
] as const;

export function createWorkspaceManifest(
  input: Required<
    Pick<
      InitializeWorkspaceInput,
      | "projectName"
      | "projectSlug"
      | "projectId"
      | "owner"
      | "methodologyProfile"
      | "defaultCurrency"
      | "secondaryCurrencies"
      | "enabledModules"
    >
  > & {
    readonly createdAt: string;
    readonly uuid: string;
  },
): WorkspaceManifest {
  return {
    project: {
      id: input.projectId,
      uuid: input.uuid,
      name: input.projectName,
      slug: input.projectSlug,
      default_currency: input.defaultCurrency,
      secondary_currencies: [...input.secondaryCurrencies],
      methodology_profile: input.methodologyProfile,
      owner: input.owner,
      created_at: input.createdAt,
      modules: [...input.enabledModules],
    },
  };
}

export function createWorkspaceSettings(): WorkspaceSettings {
  return {
    theme: "dark",
    autosave: true,
    git_auto_snapshot: true,
    sync_mode: "manual",
    sync_interval_minutes: null,
    keyboard_profile: "vscode",
    enabled_plugins: ["core.requirements", "core.graph", "core.git"],
  };
}

export function createWorkspaceSyncState(): WorkspaceSyncState {
  return {
    version: 1,
    status: "idle",
    last_sync_at: null,
    last_successful_sync_at: null,
    manifest_hash: null,
    pending_operations: 0,
    conflicts: [],
  };
}

export function createWorkspaceReadme(manifest: WorkspaceManifest): string {
  return `# ${manifest.project.name}

This is a Cognark local-first workspace.

- Project ID: \`${manifest.project.id}\`
- Project UUID: \`${manifest.project.uuid}\`
- Methodology profile: \`${manifest.project.methodology_profile}\`
- Default currency: \`${manifest.project.default_currency}\`
- Owner: \`${manifest.project.owner}\`
`;
}

export function createWorkspaceIntegrityIssue(
  issue: WorkspaceIntegrityIssue,
): WorkspaceIntegrityIssue {
  return issue;
}

export function slugifyProjectName(projectName: string): string {
  return projectName
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .replaceAll(/-{2,}/g, "-");
}
