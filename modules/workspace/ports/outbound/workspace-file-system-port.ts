import type { WorkspacePathKind } from "@cognark/module-workspace/domain/workspace-model";

export type WorkspacePathState = WorkspacePathKind | "missing";

export interface WorkspaceFileSystemPort {
  resolvePath(path: string): string;
  joinPath(rootPath: string, relativePath: string): string;
  inspectPath(path: string): Promise<WorkspacePathState>;
  ensureDirectory(path: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
}
