export type { NodeWorkspaceLogStoreOptions } from "@cognark/module-logging/adapters/outbound/node-workspace-log-store";
export { NodeWorkspaceLogStore } from "@cognark/module-logging/adapters/outbound/node-workspace-log-store";
export { ExportLogEntriesUseCase } from "@cognark/module-logging/application/export-log-entries-use-case";
export { ReadRecentLogEntriesUseCase } from "@cognark/module-logging/application/read-recent-log-entries-use-case";
export type {
  StructuredLoggerInput,
  StructuredLoggerOptions,
} from "@cognark/module-logging/application/structured-logger";
export { StructuredLogger } from "@cognark/module-logging/application/structured-logger";
export type {
  CreateLogEntryInput,
  LogCategory,
  LogErrorPayload,
  LogLevel,
  ReadRecentLogEntriesInput,
  StructuredLogEntry,
} from "@cognark/module-logging/domain/logging-model";
export {
  exportLogEntriesAsJsonl,
  parseLogEntry,
  serializeLogEntry,
} from "@cognark/module-logging/domain/logging-model";
export type {
  AppendWorkspaceLogEntryInput,
  WorkspaceLogStorePort,
} from "@cognark/module-logging/ports/outbound/workspace-log-store-port";

export interface LoggingModuleDescriptor {
  readonly name: "logging";
  readonly responsibility: "write-read-and-export-local-structured-workspace-logs";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "ready-for-req-004";
}

export const loggingModule: LoggingModuleDescriptor = {
  name: "logging",
  responsibility: "write-read-and-export-local-structured-workspace-logs",
  architecture: "hexagonal-vertical-slice",
  status: "ready-for-req-004",
};
