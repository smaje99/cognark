import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import type {
  WorkspaceFileSystemPort,
  WorkspacePathState,
} from "@cognark/module-workspace/ports/outbound/workspace-file-system-port";

export class NodeWorkspaceFileSystem implements WorkspaceFileSystemPort {
  public resolvePath(path: string): string {
    return resolve(path);
  }

  public joinPath(rootPath: string, relativePath: string): string {
    return join(rootPath, relativePath);
  }

  public async inspectPath(path: string): Promise<WorkspacePathState> {
    try {
      const inspected = await stat(path);

      if (inspected.isDirectory()) {
        return "directory";
      }

      return "file";
    } catch (error) {
      if (isMissingPathError(error)) {
        return "missing";
      }

      throw error;
    }
  }

  public async ensureDirectory(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  public async readTextFile(path: string): Promise<string> {
    return readFile(path, "utf8");
  }

  public async writeTextFile(path: string, content: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
  }
}

function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR")
  );
}
