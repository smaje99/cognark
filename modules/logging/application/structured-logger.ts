import {
  createStructuredLogEntry,
  shouldWriteLogLevel,
} from "@cognark/module-logging/domain/logging-model";
import type {
  CreateLogEntryInput,
  LogLevel,
  StructuredLogEntry,
} from "@cognark/module-logging/domain/logging-model";
import type { WorkspaceLogStorePort } from "@cognark/module-logging/ports/outbound/workspace-log-store-port";

export interface StructuredLoggerOptions {
  readonly workspaceRootPath: string;
  readonly minimumLevel?: LogLevel;
  readonly module?: string;
}

export type StructuredLoggerInput = Omit<CreateLogEntryInput, "level" | "module"> &
  Partial<Pick<CreateLogEntryInput, "module">>;

export class StructuredLogger {
  private readonly minimumLevel: LogLevel;
  private readonly moduleName: string;

  public constructor(
    private readonly logStore: WorkspaceLogStorePort,
    private readonly options: StructuredLoggerOptions,
  ) {
    this.minimumLevel = options.minimumLevel ?? "debug";
    this.moduleName = options.module ?? "application";
  }

  public async debug(input: StructuredLoggerInput): Promise<StructuredLogEntry | null> {
    return this.log({
      ...input,
      module: input.module ?? this.moduleName,
      level: "debug",
    });
  }

  public async info(input: StructuredLoggerInput): Promise<StructuredLogEntry | null> {
    return this.log({
      ...input,
      module: input.module ?? this.moduleName,
      level: "info",
    });
  }

  public async warn(input: StructuredLoggerInput): Promise<StructuredLogEntry | null> {
    return this.log({
      ...input,
      module: input.module ?? this.moduleName,
      level: "warn",
    });
  }

  public async error(input: StructuredLoggerInput): Promise<StructuredLogEntry | null> {
    return this.log({
      ...input,
      module: input.module ?? this.moduleName,
      level: "error",
    });
  }

  public async log(input: CreateLogEntryInput): Promise<StructuredLogEntry | null> {
    if (!shouldWriteLogLevel(input.level, this.minimumLevel)) {
      return null;
    }

    const entry = createStructuredLogEntry({
      ...input,
      module: input.module || this.moduleName,
      workspaceRootPath: input.workspaceRootPath ?? this.options.workspaceRootPath,
    });

    await this.logStore.append({
      workspaceRootPath: this.options.workspaceRootPath,
      entry,
    });

    return entry;
  }
}
