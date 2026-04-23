import type { WorkspaceDescriptor } from "@cognark/module-workspace";
import type {
  BootstrapWorkspaceDatabaseInput,
  BootstrapWorkspaceDatabaseResult,
  ProjectPersistenceRecord,
} from "@cognark/module-persistence/domain/persistence-model";
import {
  REQUIRED_SQLITE_TABLES,
  SQLITE_BOOTSTRAP_MIGRATIONS,
} from "@cognark/module-persistence/domain/sqlite-schema";
import type {
  SqliteNamedParameters,
  WorkspaceDatabaseConnection,
  WorkspaceDatabaseFactoryPort,
} from "@cognark/module-persistence/ports/outbound/workspace-database-port";

export class BootstrapSqliteWorkspaceUseCase {
  public constructor(private readonly databaseFactory: WorkspaceDatabaseFactoryPort) {}

  public async bootstrapWorkspacePersistence(
    workspace: WorkspaceDescriptor,
  ): Promise<BootstrapWorkspaceDatabaseResult> {
    return this.execute({ workspace });
  }

  public async execute(
    input: BootstrapWorkspaceDatabaseInput,
  ): Promise<BootstrapWorkspaceDatabaseResult> {
    const database = this.databaseFactory.openWorkspaceDatabase(input.workspace.rootPath);

    try {
      const bootstrappedAt = input.bootstrappedAt ?? new Date().toISOString();

      database.exec("PRAGMA foreign_keys = ON;");
      ensureMigrationTable(database);
      const appliedMigrationIds = applyPendingMigrations(database, bootstrappedAt);
      upsertProject(database, input.workspace, bootstrappedAt);

      const tableNames = database
        .all<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .map((row) => row.name);
      const foreignKeys = database.get<{ foreign_keys: number }>("PRAGMA foreign_keys");

      return {
        databasePath: database.databasePath,
        projectId: input.workspace.manifest.project.uuid,
        projectHumanId: input.workspace.manifest.project.id,
        appliedMigrationIds,
        tableNames,
        foreignKeysEnabled: foreignKeys?.foreign_keys === 1,
      };
    } finally {
      database.close();
    }
  }
}

function ensureMigrationTable(database: WorkspaceDatabaseConnection): void {
  database.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`);
}

function applyPendingMigrations(
  database: WorkspaceDatabaseConnection,
  appliedAt: string,
): readonly string[] {
  const applied = new Set(
    database
      .all<{ id: string }>("SELECT id FROM schema_migrations")
      .map((migration) => migration.id),
  );
  const appliedNow: string[] = [];

  for (const migration of SQLITE_BOOTSTRAP_MIGRATIONS) {
    if (applied.has(migration.id)) {
      continue;
    }

    database.exec("BEGIN;");

    try {
      database.exec(migration.sql);
      database.run(
        `INSERT INTO schema_migrations (id, description, applied_at)
         VALUES (:id, :description, :applied_at)`,
        {
          id: migration.id,
          description: migration.description,
          applied_at: appliedAt,
        },
      );
      database.exec("COMMIT;");
      appliedNow.push(migration.id);
    } catch (error) {
      database.exec("ROLLBACK;");
      throw error;
    }
  }

  return appliedNow;
}

function upsertProject(
  database: WorkspaceDatabaseConnection,
  workspace: WorkspaceDescriptor,
  updatedAt: string,
): void {
  const { project } = workspace.manifest;
  const record: ProjectPersistenceRecord = {
    id: project.uuid,
    human_id: project.id,
    name: project.name,
    slug: project.slug,
    default_currency: project.default_currency,
    methodology_profile: project.methodology_profile,
    root_path: workspace.rootPath,
    owner: project.owner,
    created_at: project.created_at,
    updated_at: updatedAt,
  };

  database.run(
    `INSERT INTO projects (
       id,
       human_id,
       name,
       slug,
       default_currency,
       methodology_profile,
       root_path,
       owner,
       created_at,
       updated_at
     )
     VALUES (
       :id,
       :human_id,
       :name,
       :slug,
       :default_currency,
       :methodology_profile,
       :root_path,
       :owner,
       :created_at,
       :updated_at
     )
     ON CONFLICT(id) DO UPDATE SET
       human_id = excluded.human_id,
       name = excluded.name,
       slug = excluded.slug,
       default_currency = excluded.default_currency,
       methodology_profile = excluded.methodology_profile,
       root_path = excluded.root_path,
       owner = excluded.owner,
       updated_at = excluded.updated_at`,
    record as unknown as SqliteNamedParameters,
  );
}

export function assertRequiredTables(tableNames: readonly string[]): void {
  const missingTables = REQUIRED_SQLITE_TABLES.filter(
    (tableName) => !tableNames.includes(tableName),
  );

  if (missingTables.length > 0) {
    throw new Error(`SQLite bootstrap is missing required tables: ${missingTables.join(", ")}`);
  }
}
