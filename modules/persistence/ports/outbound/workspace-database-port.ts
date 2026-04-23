export type SqliteValue = null | number | bigint | string | NodeJS.ArrayBufferView;
export type SqliteNamedParameters = Record<string, SqliteValue>;

export interface WorkspaceDatabaseConnection {
  readonly databasePath: string;
  exec(sql: string): void;
  run(sql: string, parameters?: SqliteNamedParameters): void;
  get<TRow extends Record<string, unknown>>(
    sql: string,
    parameters?: SqliteNamedParameters,
  ): TRow | undefined;
  all<TRow extends Record<string, unknown>>(
    sql: string,
    parameters?: SqliteNamedParameters,
  ): TRow[];
  close(): void;
}

export interface WorkspaceDatabaseFactoryPort {
  openWorkspaceDatabase(rootPath: string): WorkspaceDatabaseConnection;
}
