export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogCategory =
  | "application"
  | "persistence"
  | "parsing"
  | "sync"
  | "git"
  | "agent"
  | "export"
  | "integration"
  | "plugin";

export interface LogErrorPayload {
  readonly name?: string;
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
}

export interface CreateLogEntryInput {
  readonly level: LogLevel;
  readonly module: string;
  readonly message: string;
  readonly category?: LogCategory;
  readonly correlationId?: string;
  readonly traceId?: string;
  readonly projectId?: string;
  readonly workspaceRootPath?: string;
  readonly metadata?: Record<string, unknown>;
  readonly error?: unknown;
  readonly occurredAt?: string;
  readonly id?: string;
}

export interface StructuredLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly module: string;
  readonly message: string;
  readonly category: LogCategory;
  readonly correlationId: string;
  readonly traceId: string | null;
  readonly projectId: string | null;
  readonly workspaceRootPath: string | null;
  readonly metadata: Record<string, unknown>;
  readonly error: LogErrorPayload | null;
}

export interface ReadRecentLogEntriesInput {
  readonly workspaceRootPath: string;
  readonly limit?: number;
  readonly levels?: readonly LogLevel[];
  readonly modules?: readonly string[];
  readonly categories?: readonly LogCategory[];
}

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function createStructuredLogEntry(input: CreateLogEntryInput): StructuredLogEntry {
  return {
    id: input.id ?? crypto.randomUUID(),
    timestamp: input.occurredAt ?? new Date().toISOString(),
    level: input.level,
    module: input.module,
    message: input.message,
    category: input.category ?? "application",
    correlationId: input.correlationId ?? crypto.randomUUID(),
    traceId: input.traceId ?? null,
    projectId: input.projectId ?? null,
    workspaceRootPath: input.workspaceRootPath ?? null,
    metadata: input.metadata ?? {},
    error: normalizeLogError(input.error),
  };
}

export function shouldWriteLogLevel(level: LogLevel, minimumLevel: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minimumLevel];
}

export function serializeLogEntry(entry: StructuredLogEntry): string {
  return `${JSON.stringify(entry)}\n`;
}

export function parseLogEntry(line: string): StructuredLogEntry | null {
  if (!line.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(line) as StructuredLogEntry;

    if (!isStructuredLogEntry(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function exportLogEntriesAsJsonl(entries: readonly StructuredLogEntry[]): string {
  return entries.map((entry) => serializeLogEntry(entry)).join("");
}

function normalizeLogError(error: unknown): LogErrorPayload | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: "code" in error && typeof error.code === "string" ? error.code : undefined,
    };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return {
      message: String(error.message),
    };
  }

  return {
    message: String(error),
  };
}

function isStructuredLogEntry(value: StructuredLogEntry): value is StructuredLogEntry {
  return (
    typeof value.id === "string" &&
    typeof value.timestamp === "string" &&
    isLogLevel(value.level) &&
    typeof value.module === "string" &&
    typeof value.message === "string" &&
    typeof value.category === "string" &&
    typeof value.correlationId === "string"
  );
}

function isLogLevel(value: unknown): value is LogLevel {
  return value === "debug" || value === "info" || value === "warn" || value === "error";
}
