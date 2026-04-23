import type { WorkspaceDescriptor } from "@cognark/module-workspace";

export interface SqliteMigration {
  readonly id: string;
  readonly description: string;
  readonly sql: string;
}

export interface BootstrapWorkspaceDatabaseInput {
  readonly workspace: WorkspaceDescriptor;
  readonly bootstrappedAt?: string;
}

export interface BootstrapWorkspaceDatabaseResult {
  readonly databasePath: string;
  readonly projectId: string;
  readonly projectHumanId: string;
  readonly appliedMigrationIds: readonly string[];
  readonly tableNames: readonly string[];
  readonly foreignKeysEnabled: boolean;
}

export interface ProjectPersistenceRecord {
  readonly id: string;
  readonly human_id: string;
  readonly name: string;
  readonly slug: string;
  readonly default_currency: string;
  readonly methodology_profile: string;
  readonly root_path: string;
  readonly owner: string;
  readonly created_at: string;
  readonly updated_at: string;
}
