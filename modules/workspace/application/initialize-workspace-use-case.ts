import { parse } from "yaml";

import {
  createWorkspaceIntegrityIssue,
  createWorkspaceManifest,
  createWorkspaceReadme,
  createWorkspaceSettings,
  createWorkspaceSyncState,
  DEFAULT_ENABLED_MODULES,
  slugifyProjectName,
  WORKSPACE_EXPECTED_ENTRIES,
} from "@cognark/module-workspace/domain/workspace-model";
import type {
  InitializeWorkspaceInput,
  InitializeWorkspaceResult,
  WorkspaceDescriptor,
  WorkspaceExpectedEntry,
  WorkspaceIntegrityIssue,
  WorkspaceIntegrityReport,
  WorkspaceManifest,
} from "@cognark/module-workspace/domain/workspace-model";
import {
  isTextEntry,
  isWorkspaceManifest,
  isWorkspaceSettings,
  isWorkspaceSyncState,
  serializeWorkspaceManifest,
  serializeWorkspaceSettings,
  serializeWorkspaceSyncState,
} from "@cognark/module-workspace/domain/workspace-serialization";
import type { WorkspaceFileSystemPort } from "@cognark/module-workspace/ports/outbound/workspace-file-system-port";

export class InitializeWorkspaceUseCase {
  public constructor(private readonly fileSystem: WorkspaceFileSystemPort) {}

  public async execute(input: InitializeWorkspaceInput): Promise<InitializeWorkspaceResult> {
    const rootPath = this.fileSystem.resolvePath(input.rootPath);
    const integrity = await this.inspectWorkspace(rootPath);

    if (integrity.isValid) {
      return {
        status: "opened",
        workspace: await this.loadWorkspaceDescriptor(rootPath),
        integrity,
        repairedPaths: [],
      };
    }

    if (!integrity.hasWorkspaceMarkers) {
      const manifest = this.buildManifest(input);
      await this.materializeWorkspace(rootPath, manifest);

      return {
        status: "initialized",
        workspace: {
          rootPath,
          manifest,
        },
        integrity: {
          isValid: true,
          hasWorkspaceMarkers: true,
          issues: [],
        },
        repairedPaths: WORKSPACE_EXPECTED_ENTRIES.map((entry) => entry.path),
      };
    }

    if (input.repairMode === "apply") {
      const nonRepairableIssues = integrity.issues.filter((issue) => !issue.repairable);

      if (nonRepairableIssues.length > 0) {
        return {
          status: "repair-required",
          workspace: null,
          integrity,
          repairedPaths: [],
        };
      }

      const manifest = await this.resolveManifestForRepair(rootPath, input);
      const repairedPaths = await this.applyRepair(rootPath, integrity.issues, manifest);
      const repairedIntegrity = await this.inspectWorkspace(rootPath);

      if (!repairedIntegrity.isValid) {
        return {
          status: "repair-required",
          workspace: null,
          integrity: repairedIntegrity,
          repairedPaths,
        };
      }

      return {
        status: "repaired",
        workspace: {
          rootPath,
          manifest,
        },
        integrity: repairedIntegrity,
        repairedPaths,
      };
    }

    return {
      status: "repair-required",
      workspace: null,
      integrity,
      repairedPaths: [],
    };
  }

  private buildManifest(input: InitializeWorkspaceInput): WorkspaceManifest {
    const projectName = input.projectName?.trim() || "Workspace Integral";
    const projectSlug = input.projectSlug?.trim() || slugifyProjectName(projectName);

    return createWorkspaceManifest({
      projectName,
      projectSlug,
      projectId: input.projectId?.trim() || "PROJ-001",
      owner: input.owner?.trim() || "owner",
      methodologyProfile: input.methodologyProfile?.trim() || "hybrid-consulting",
      defaultCurrency: input.defaultCurrency?.trim() || "COP",
      secondaryCurrencies: input.secondaryCurrencies ?? ["USD"],
      enabledModules: input.enabledModules ?? DEFAULT_ENABLED_MODULES,
      createdAt: new Date().toISOString().slice(0, 10),
      uuid: crypto.randomUUID(),
    });
  }

  private async resolveManifestForRepair(
    rootPath: string,
    input: InitializeWorkspaceInput,
  ): Promise<WorkspaceManifest> {
    const manifestPath = this.fileSystem.joinPath(rootPath, "project.yaml");
    const manifestState = await this.fileSystem.inspectPath(manifestPath);

    if (manifestState === "file") {
      try {
        const manifestContent = await this.fileSystem.readTextFile(manifestPath);
        const parsed = parse(manifestContent);

        if (isWorkspaceManifest(parsed)) {
          return parsed;
        }
      } catch {
        // Fall through to default manifest regeneration for controlled repair.
      }
    }

    return this.buildManifest(input);
  }

  private async materializeWorkspace(rootPath: string, manifest: WorkspaceManifest): Promise<void> {
    await this.fileSystem.ensureDirectory(rootPath);

    for (const entry of WORKSPACE_EXPECTED_ENTRIES) {
      if (entry.kind === "directory") {
        await this.fileSystem.ensureDirectory(this.fileSystem.joinPath(rootPath, entry.path));
        continue;
      }

      await this.fileSystem.writeTextFile(
        this.fileSystem.joinPath(rootPath, entry.path),
        this.buildFileContent(entry, manifest),
      );
    }
  }

  private async applyRepair(
    rootPath: string,
    issues: readonly WorkspaceIntegrityIssue[],
    manifest: WorkspaceManifest,
  ): Promise<readonly string[]> {
    const repairedPaths = new Set<string>();

    for (const issue of issues) {
      if (!issue.repairable) {
        continue;
      }

      const entry = WORKSPACE_EXPECTED_ENTRIES.find((candidate) => candidate.path === issue.path);

      if (!entry) {
        continue;
      }

      const absolutePath = this.fileSystem.joinPath(rootPath, entry.path);

      if (entry.kind === "directory") {
        await this.fileSystem.ensureDirectory(absolutePath);
      } else {
        await this.fileSystem.writeTextFile(absolutePath, this.buildFileContent(entry, manifest));
      }

      repairedPaths.add(entry.path);
    }

    return [...repairedPaths];
  }

  private buildFileContent(entry: WorkspaceExpectedEntry, manifest: WorkspaceManifest): string {
    switch (entry.path) {
      case "project.yaml":
        return serializeWorkspaceManifest(manifest);
      case ".workspace/settings.json":
        return serializeWorkspaceSettings(createWorkspaceSettings());
      case ".workspace/sync-state.json":
        return serializeWorkspaceSyncState(createWorkspaceSyncState());
      case "README.md":
        return createWorkspaceReadme(manifest);
      case ".workspace/workspace.db":
        return "";
      default:
        if (isTextEntry(entry)) {
          return "";
        }

        throw new Error(`Unsupported workspace file entry: ${entry.path}`);
    }
  }

  private async loadWorkspaceDescriptor(rootPath: string): Promise<WorkspaceDescriptor> {
    const manifestPath = this.fileSystem.joinPath(rootPath, "project.yaml");
    const manifestContent = await this.fileSystem.readTextFile(manifestPath);
    const parsed = parse(manifestContent);

    if (!isWorkspaceManifest(parsed)) {
      throw new Error("Workspace manifest is not valid after integrity validation.");
    }

    return {
      rootPath,
      manifest: parsed,
    };
  }

  private async inspectWorkspace(rootPath: string): Promise<WorkspaceIntegrityReport> {
    const entryStates = await Promise.all(
      WORKSPACE_EXPECTED_ENTRIES.map(async (entry) => ({
        entry,
        actualKind: await this.fileSystem.inspectPath(
          this.fileSystem.joinPath(rootPath, entry.path),
        ),
      })),
    );

    const hasWorkspaceMarkers = entryStates.some(({ actualKind }) => actualKind !== "missing");

    if (!hasWorkspaceMarkers) {
      return {
        isValid: false,
        hasWorkspaceMarkers: false,
        issues: [],
      };
    }

    const issues: WorkspaceIntegrityIssue[] = [];

    for (const { entry, actualKind } of entryStates) {
      if (actualKind === "missing") {
        issues.push(
          createWorkspaceIntegrityIssue({
            code: "missing_path",
            path: entry.path,
            expectedKind: entry.kind,
            actualKind,
            detail: `Expected ${entry.kind} is missing.`,
            repairable: true,
          }),
        );
        continue;
      }

      if (actualKind !== entry.kind) {
        issues.push(
          createWorkspaceIntegrityIssue({
            code: "path_type_mismatch",
            path: entry.path,
            expectedKind: entry.kind,
            actualKind,
            detail: `Expected ${entry.kind} but found ${actualKind}.`,
            repairable: false,
          }),
        );
        continue;
      }

      if (entry.kind === "file" && entry.contentKind !== "text") {
        const validationIssue = await this.validateStructuredFile(rootPath, entry);

        if (validationIssue) {
          issues.push(validationIssue);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      hasWorkspaceMarkers,
      issues,
    };
  }

  private async validateStructuredFile(
    rootPath: string,
    entry: WorkspaceExpectedEntry,
  ): Promise<WorkspaceIntegrityIssue | null> {
    const absolutePath = this.fileSystem.joinPath(rootPath, entry.path);
    const content = await this.fileSystem.readTextFile(absolutePath);

    if (entry.contentKind === "yaml") {
      try {
        const parsed = parse(content);

        if (!isWorkspaceManifest(parsed)) {
          return createWorkspaceIntegrityIssue({
            code: "invalid_yaml",
            path: entry.path,
            expectedKind: entry.kind,
            actualKind: "file",
            detail: "YAML content does not satisfy the workspace manifest contract.",
            repairable: true,
          });
        }

        return null;
      } catch (error) {
        return createWorkspaceIntegrityIssue({
          code: "invalid_yaml",
          path: entry.path,
          expectedKind: entry.kind,
          actualKind: "file",
          detail: `YAML parse error: ${toMessage(error)}`,
          repairable: true,
        });
      }
    }

    try {
      const parsed = JSON.parse(content) as unknown;

      const isValid =
        entry.path === ".workspace/settings.json"
          ? isWorkspaceSettings(parsed)
          : isWorkspaceSyncState(parsed);

      if (isValid) {
        return null;
      }

      return createWorkspaceIntegrityIssue({
        code: "invalid_json",
        path: entry.path,
        expectedKind: entry.kind,
        actualKind: "file",
        detail: "JSON content does not satisfy the expected workspace contract.",
        repairable: true,
      });
    } catch (error) {
      return createWorkspaceIntegrityIssue({
        code: "invalid_json",
        path: entry.path,
        expectedKind: entry.kind,
        actualKind: "file",
        detail: `JSON parse error: ${toMessage(error)}`,
        repairable: true,
      });
    }
  }
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
