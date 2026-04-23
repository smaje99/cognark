import type {
  ReadRecentLogEntriesInput,
  StructuredLogEntry,
} from "@cognark/module-logging/domain/logging-model";
import type { WorkspaceLogStorePort } from "@cognark/module-logging/ports/outbound/workspace-log-store-port";

export class ReadRecentLogEntriesUseCase {
  public constructor(private readonly logStore: WorkspaceLogStorePort) {}

  public async execute(input: ReadRecentLogEntriesInput): Promise<readonly StructuredLogEntry[]> {
    return this.logStore.readRecent(input);
  }
}
