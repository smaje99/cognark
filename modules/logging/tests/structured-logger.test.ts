import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ExportLogEntriesUseCase } from "@cognark/module-logging/application/export-log-entries-use-case";
import { ReadRecentLogEntriesUseCase } from "@cognark/module-logging/application/read-recent-log-entries-use-case";
import { StructuredLogger } from "@cognark/module-logging/application/structured-logger";
import { NodeWorkspaceLogStore } from "@cognark/module-logging/adapters/outbound/node-workspace-log-store";
import { parseLogEntry } from "@cognark/module-logging/domain/logging-model";

const createdRoots: string[] = [];

describe("StructuredLogger", () => {
  afterEach(async () => {
    await Promise.all(
      createdRoots.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
      }),
    );
  });

  it("writes structured JSONL entries into the workspace logs directory", async () => {
    const workspaceRootPath = await createWorkspaceRoot();
    const logStore = new NodeWorkspaceLogStore();
    const logger = new StructuredLogger(logStore, {
      workspaceRootPath,
      module: "persistence",
    });

    const entry = await logger.error({
      message: "Migration failed",
      category: "persistence",
      correlationId: "corr-001",
      projectId: "PROJ-001",
      occurredAt: "2026-04-23T10:00:00.000Z",
      metadata: {
        migrationId: "0001",
      },
      error: new Error("DDL failed"),
    });

    expect(entry?.level).toBe("error");

    const content = await readFile(
      join(workspaceRootPath, ".workspace/logs/cognark-2026-04-23.jsonl"),
      "utf8",
    );
    const parsed = parseLogEntry(content.trim());

    expect(parsed).toEqual(
      expect.objectContaining({
        level: "error",
        module: "persistence",
        message: "Migration failed",
        category: "persistence",
        correlationId: "corr-001",
        projectId: "PROJ-001",
        workspaceRootPath,
      }),
    );
    expect(parsed?.metadata).toEqual({
      migrationId: "0001",
    });
    expect(parsed?.error).toEqual(
      expect.objectContaining({
        name: "Error",
        message: "DDL failed",
      }),
    );
  });

  it("filters entries below the configured minimum level", async () => {
    const workspaceRootPath = await createWorkspaceRoot();
    const logStore = new NodeWorkspaceLogStore();
    const logger = new StructuredLogger(logStore, {
      workspaceRootPath,
      minimumLevel: "warn",
    });

    const skipped = await logger.info({
      module: "sync",
      message: "Heartbeat",
    });
    const written = await logger.warn({
      module: "sync",
      message: "Retry scheduled",
      occurredAt: "2026-04-23T11:00:00.000Z",
    });

    expect(skipped).toBeNull();
    expect(written?.level).toBe("warn");

    const entries = await new ReadRecentLogEntriesUseCase(logStore).execute({
      workspaceRootPath,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.message).toBe("Retry scheduled");
  });

  it("rotates log files when the active file reaches the size limit", async () => {
    const workspaceRootPath = await createWorkspaceRoot();
    const logStore = new NodeWorkspaceLogStore({
      maxLogFileBytes: 260,
    });
    const logger = new StructuredLogger(logStore, {
      workspaceRootPath,
      module: "agent",
    });

    await logger.info({
      message: "First long message that should fill a small test log file.",
      category: "agent",
      occurredAt: "2026-04-23T12:00:00.000Z",
    });
    await logger.info({
      message: "Second long message that should force a rotated log file.",
      category: "agent",
      occurredAt: "2026-04-23T12:01:00.000Z",
    });

    const files = await readdir(join(workspaceRootPath, ".workspace/logs"));

    expect(files.sort()).toEqual(["cognark-2026-04-23.1.jsonl", "cognark-2026-04-23.jsonl"]);
  });

  it("reads recent logs without requiring callers to inspect files manually", async () => {
    const workspaceRootPath = await createWorkspaceRoot();
    const logStore = new NodeWorkspaceLogStore();
    const logger = new StructuredLogger(logStore, {
      workspaceRootPath,
    });
    const reader = new ReadRecentLogEntriesUseCase(logStore);

    await logger.debug({
      module: "parser",
      message: "Ignored",
      category: "parsing",
      occurredAt: "2026-04-23T09:00:00.000Z",
    });
    await logger.error({
      module: "parser",
      message: "Frontmatter missing",
      category: "parsing",
      occurredAt: "2026-04-23T09:01:00.000Z",
    });
    await logger.warn({
      module: "sync",
      message: "Remote unavailable",
      category: "sync",
      occurredAt: "2026-04-23T09:02:00.000Z",
    });

    const recentErrors = await reader.execute({
      workspaceRootPath,
      levels: ["error"],
      categories: ["parsing"],
      limit: 5,
    });

    expect(recentErrors.map((entry) => entry.message)).toEqual(["Frontmatter missing"]);
  });

  it("exports recent logs as JSONL", async () => {
    const workspaceRootPath = await createWorkspaceRoot();
    const logStore = new NodeWorkspaceLogStore();
    const logger = new StructuredLogger(logStore, {
      workspaceRootPath,
      module: "export",
    });

    await logger.info({
      message: "PDF export queued",
      category: "export",
      occurredAt: "2026-04-23T13:00:00.000Z",
    });

    const jsonl = await new ExportLogEntriesUseCase(logStore).execute({
      workspaceRootPath,
    });

    expect(jsonl.trim().split("\n")).toHaveLength(1);
    expect(parseLogEntry(jsonl.trim())?.message).toBe("PDF export queued");
  });
});

async function createWorkspaceRoot(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "cognark-logging-"));
  createdRoots.push(directory);
  return directory;
}
