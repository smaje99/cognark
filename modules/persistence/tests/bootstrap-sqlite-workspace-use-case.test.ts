import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { NodeSqliteWorkspaceDatabaseFactory } from "@cognark/module-persistence/adapters/outbound/node-sqlite-workspace-database";
import {
  assertRequiredTables,
  BootstrapSqliteWorkspaceUseCase,
} from "@cognark/module-persistence/application/bootstrap-sqlite-workspace-use-case";
import { REQUIRED_SQLITE_TABLES } from "@cognark/module-persistence/domain/sqlite-schema";
import { NodeWorkspaceFileSystem } from "@cognark/module-workspace/adapters/outbound/node-workspace-file-system";
import { InitializeWorkspaceUseCase } from "@cognark/module-workspace/application/initialize-workspace-use-case";

const createdRoots: string[] = [];

describe("BootstrapSqliteWorkspaceUseCase", () => {
  afterEach(async () => {
    await Promise.all(
      createdRoots.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
      }),
    );
  });

  it("creates the local SQLite schema and registers the current project", async () => {
    const workspacePath = join(await createWorkspaceRoot(), "sqlite-workspace");
    const bootstrap = new BootstrapSqliteWorkspaceUseCase(new NodeSqliteWorkspaceDatabaseFactory());
    const initializer = new InitializeWorkspaceUseCase(new NodeWorkspaceFileSystem(), bootstrap);

    const initialized = await initializer.execute({
      rootPath: workspacePath,
      projectName: "SQLite Workspace",
      projectId: "PROJ-SQL",
      defaultCurrency: "COP",
    });

    expect(initialized.status).toBe("initialized");
    await expect(stat(join(workspacePath, ".workspace/workspace.db"))).resolves.toBeDefined();

    const result = await bootstrap.execute({
      workspace: initialized.workspace ?? expect.fail("Workspace should be initialized."),
      bootstrappedAt: "2026-04-23T00:00:00.000Z",
    });

    assertRequiredTables(result.tableNames);
    expect(result.foreignKeysEnabled).toBe(true);
    expect(result.appliedMigrationIds).toEqual([]);
    expect(result.tableNames).toEqual(REQUIRED_SQLITE_TABLES);

    const database = new NodeSqliteWorkspaceDatabaseFactory().openWorkspaceDatabase(workspacePath);
    try {
      const project = database.get<{
        id: string;
        human_id: string;
        name: string;
        default_currency: string;
      }>("SELECT id, human_id, name, default_currency FROM projects WHERE human_id = :human_id", {
        human_id: "PROJ-SQL",
      });
      const migrationCount = database.get<{ migration_count: number }>(
        "SELECT COUNT(*) AS migration_count FROM schema_migrations",
      );

      expect(project).toEqual({
        id: initialized.workspace?.manifest.project.uuid,
        human_id: "PROJ-SQL",
        name: "SQLite Workspace",
        default_currency: "COP",
      });
      expect(migrationCount?.migration_count).toBe(1);
    } finally {
      database.close();
    }
  });

  it("runs migrations idempotently and updates the project projection", async () => {
    const workspacePath = join(await createWorkspaceRoot(), "idempotent-workspace");
    const bootstrap = new BootstrapSqliteWorkspaceUseCase(new NodeSqliteWorkspaceDatabaseFactory());
    const initializer = new InitializeWorkspaceUseCase(new NodeWorkspaceFileSystem(), bootstrap);

    const initialized = await initializer.execute({
      rootPath: workspacePath,
      projectName: "Initial Name",
      projectId: "PROJ-IDEMPOTENT",
    });

    const workspace = initialized.workspace ?? expect.fail("Workspace should be initialized.");
    const secondRun = await bootstrap.execute({
      workspace: {
        ...workspace,
        manifest: {
          project: {
            ...workspace.manifest.project,
            name: "Updated Name",
          },
        },
      },
      bootstrappedAt: "2026-04-23T01:00:00.000Z",
    });

    expect(secondRun.appliedMigrationIds).toEqual([]);

    const database = new NodeSqliteWorkspaceDatabaseFactory().openWorkspaceDatabase(workspacePath);
    try {
      const migrationCount = database.get<{ migration_count: number }>(
        "SELECT COUNT(*) AS migration_count FROM schema_migrations",
      );
      const project = database.get<{ name: string; updated_at: string }>(
        "SELECT name, updated_at FROM projects WHERE human_id = :human_id",
        {
          human_id: "PROJ-IDEMPOTENT",
        },
      );

      expect(migrationCount?.migration_count).toBe(1);
      expect(project).toEqual({
        name: "Updated Name",
        updated_at: "2026-04-23T01:00:00.000Z",
      });
    } finally {
      database.close();
    }
  });

  it("creates a readable database file instead of leaving the workspace placeholder empty", async () => {
    const workspacePath = join(await createWorkspaceRoot(), "database-file-workspace");
    const bootstrap = new BootstrapSqliteWorkspaceUseCase(new NodeSqliteWorkspaceDatabaseFactory());
    const initializer = new InitializeWorkspaceUseCase(new NodeWorkspaceFileSystem(), bootstrap);

    await initializer.execute({
      rootPath: workspacePath,
      projectName: "Database File Workspace",
    });

    const header = await readFile(join(workspacePath, ".workspace/workspace.db"), {
      encoding: "utf8",
      flag: "r",
    });

    expect(header.startsWith("SQLite format 3")).toBe(true);
  });
});

async function createWorkspaceRoot(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "cognark-persistence-"));
  createdRoots.push(directory);
  return directory;
}
