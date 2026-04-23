export { NodeSqliteWorkspaceDatabaseFactory } from "@cognark/module-persistence/adapters/outbound/node-sqlite-workspace-database";
export {
  assertRequiredTables,
  BootstrapSqliteWorkspaceUseCase,
} from "@cognark/module-persistence/application/bootstrap-sqlite-workspace-use-case";
export type {
  BootstrapWorkspaceDatabaseInput,
  BootstrapWorkspaceDatabaseResult,
  ProjectPersistenceRecord,
  SqliteMigration,
} from "@cognark/module-persistence/domain/persistence-model";
export {
  REQUIRED_SQLITE_TABLES,
  SQLITE_BOOTSTRAP_MIGRATIONS,
} from "@cognark/module-persistence/domain/sqlite-schema";
export type {
  SqliteNamedParameters,
  SqliteValue,
  WorkspaceDatabaseConnection,
  WorkspaceDatabaseFactoryPort,
} from "@cognark/module-persistence/ports/outbound/workspace-database-port";

export interface PersistenceModuleDescriptor {
  readonly name: "persistence";
  readonly responsibility: "bootstrap-local-sqlite-operational-schema-and-project-projection";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "ready-for-req-003";
}

export const persistenceModule: PersistenceModuleDescriptor = {
  name: "persistence",
  responsibility: "bootstrap-local-sqlite-operational-schema-and-project-projection",
  architecture: "hexagonal-vertical-slice",
  status: "ready-for-req-003",
};
