import { appendFile, mkdir, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { parseLogEntry, serializeLogEntry } from "@cognark/module-logging/domain/logging-model";
import type {
  ReadRecentLogEntriesInput,
  StructuredLogEntry,
} from "@cognark/module-logging/domain/logging-model";
import type {
  AppendWorkspaceLogEntryInput,
  WorkspaceLogStorePort,
} from "@cognark/module-logging/ports/outbound/workspace-log-store-port";

export interface NodeWorkspaceLogStoreOptions {
  readonly maxLogFileBytes?: number;
  readonly filePrefix?: string;
}

export class NodeWorkspaceLogStore implements WorkspaceLogStorePort {
  private readonly maxLogFileBytes: number;
  private readonly filePrefix: string;

  public constructor(options: NodeWorkspaceLogStoreOptions = {}) {
    this.maxLogFileBytes = options.maxLogFileBytes ?? 5 * 1024 * 1024;
    this.filePrefix = options.filePrefix ?? "cognark";
  }

  public async append(input: AppendWorkspaceLogEntryInput): Promise<void> {
    const logsPath = getLogsPath(input.workspaceRootPath);
    await mkdir(logsPath, { recursive: true });

    const content = serializeLogEntry(input.entry);
    const logFilePath = await this.resolveWritableLogFilePath(
      logsPath,
      input.entry.timestamp,
      Buffer.byteLength(content),
    );

    await appendFile(logFilePath, content, "utf8");
  }

  public async readRecent(
    input: ReadRecentLogEntriesInput,
  ): Promise<readonly StructuredLogEntry[]> {
    const logsPath = getLogsPath(input.workspaceRootPath);
    const files = await this.listLogFiles(logsPath);
    const entries: StructuredLogEntry[] = [];

    for (const file of files) {
      const content = await readFile(join(logsPath, file), "utf8");

      for (const line of content.split("\n")) {
        const entry = parseLogEntry(line);

        if (entry && matchesReadFilter(entry, input)) {
          entries.push(entry);
        }
      }
    }

    return entries
      .toSorted((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, input.limit ?? 100);
  }

  private async resolveWritableLogFilePath(
    logsPath: string,
    timestamp: string,
    contentBytes: number,
  ): Promise<string> {
    const date = timestamp.slice(0, 10);
    let rotationIndex = 0;

    while (true) {
      const fileName = this.buildLogFileName(date, rotationIndex);
      const candidatePath = join(logsPath, fileName);
      const currentSize = await getFileSize(candidatePath);

      if (currentSize + contentBytes <= this.maxLogFileBytes || currentSize === 0) {
        return candidatePath;
      }

      rotationIndex += 1;
    }
  }

  private buildLogFileName(date: string, rotationIndex: number): string {
    if (rotationIndex === 0) {
      return `${this.filePrefix}-${date}.jsonl`;
    }

    return `${this.filePrefix}-${date}.${rotationIndex}.jsonl`;
  }

  private async listLogFiles(logsPath: string): Promise<readonly string[]> {
    try {
      const entries = await readdir(logsPath);

      return entries
        .filter((entry) => entry.startsWith(`${this.filePrefix}-`) && entry.endsWith(".jsonl"))
        .sort();
    } catch (error) {
      if (isMissingPathError(error)) {
        return [];
      }

      throw error;
    }
  }
}

function getLogsPath(workspaceRootPath: string): string {
  return join(workspaceRootPath, ".workspace", "logs");
}

async function getFileSize(path: string): Promise<number> {
  try {
    return (await stat(path)).size;
  } catch (error) {
    if (isMissingPathError(error)) {
      return 0;
    }

    throw error;
  }
}

function matchesReadFilter(entry: StructuredLogEntry, input: ReadRecentLogEntriesInput): boolean {
  return (
    (!input.levels || input.levels.includes(entry.level)) &&
    (!input.modules || input.modules.includes(entry.module)) &&
    (!input.categories || input.categories.includes(entry.category))
  );
}

function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
