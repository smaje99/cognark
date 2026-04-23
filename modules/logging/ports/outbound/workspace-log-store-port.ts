import type {
  ReadRecentLogEntriesInput,
  StructuredLogEntry,
} from "@cognark/module-logging/domain/logging-model";

export interface AppendWorkspaceLogEntryInput {
  readonly workspaceRootPath: string;
  readonly entry: StructuredLogEntry;
}

export interface WorkspaceLogStorePort {
  append(input: AppendWorkspaceLogEntryInput): Promise<void>;
  readRecent(input: ReadRecentLogEntriesInput): Promise<readonly StructuredLogEntry[]>;
}
