import { exportLogEntriesAsJsonl } from "@cognark/module-logging/domain/logging-model";
import type { ReadRecentLogEntriesInput } from "@cognark/module-logging/domain/logging-model";
import type { WorkspaceLogStorePort } from "@cognark/module-logging/ports/outbound/workspace-log-store-port";

export class ExportLogEntriesUseCase {
  public constructor(private readonly logStore: WorkspaceLogStorePort) {}

  public async execute(input: ReadRecentLogEntriesInput): Promise<string> {
    const entries = await this.logStore.readRecent(input);
    return exportLogEntriesAsJsonl(entries);
  }
}
