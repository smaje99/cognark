import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type {
  SqliteNamedParameters,
  WorkspaceDatabaseConnection,
  WorkspaceDatabaseFactoryPort,
} from "@cognark/module-persistence/ports/outbound/workspace-database-port";

export class NodeSqliteWorkspaceDatabaseFactory implements WorkspaceDatabaseFactoryPort {
  public openWorkspaceDatabase(rootPath: string): WorkspaceDatabaseConnection {
    const databasePath = join(rootPath, ".workspace", "workspace.db");
    mkdirSync(dirname(databasePath), { recursive: true });

    return new NodeSqliteWorkspaceDatabase(databasePath);
  }
}

export class NodeSqliteWorkspaceDatabase implements WorkspaceDatabaseConnection {
  private readonly database: DatabaseSync;

  public constructor(public readonly databasePath: string) {
    this.database = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
    });
  }

  public exec(sql: string): void {
    this.database.exec(sql);
  }

  public run(sql: string, parameters?: SqliteNamedParameters): void {
    const statement = this.database.prepare(sql);

    if (parameters) {
      statement.run(parameters);
      return;
    }

    statement.run();
  }

  public get<TRow extends Record<string, unknown>>(
    sql: string,
    parameters?: SqliteNamedParameters,
  ): TRow | undefined {
    const statement = this.database.prepare(sql);

    if (parameters) {
      return statement.get(parameters) as TRow | undefined;
    }

    return statement.get() as TRow | undefined;
  }

  public all<TRow extends Record<string, unknown>>(
    sql: string,
    parameters?: SqliteNamedParameters,
  ): TRow[] {
    const statement = this.database.prepare(sql);

    if (parameters) {
      return statement.all(parameters) as TRow[];
    }

    return statement.all() as TRow[];
  }

  public close(): void {
    this.database.close();
  }
}
