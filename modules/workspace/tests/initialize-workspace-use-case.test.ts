import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { parse } from "yaml";
import { afterEach, describe, expect, it } from "vitest";

import { NodeWorkspaceFileSystem } from "@cognark/module-workspace/adapters/outbound/node-workspace-file-system";
import { InitializeWorkspaceUseCase } from "@cognark/module-workspace/application/initialize-workspace-use-case";
import type { WorkspaceManifest } from "@cognark/module-workspace/domain/workspace-model";

const createdRoots: string[] = [];

describe("InitializeWorkspaceUseCase", () => {
  afterEach(async () => {
    await Promise.all(
      createdRoots.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
      }),
    );
  });

  it("creates the full workspace structure for a new path", async () => {
    const rootPath = await createWorkspaceRoot();
    const workspacePath = join(rootPath, "acme-workspace");
    const useCase = new InitializeWorkspaceUseCase(new NodeWorkspaceFileSystem());

    const result = await useCase.execute({
      rootPath: workspacePath,
      projectName: "ACME Delivery Workspace",
    });

    expect(result.status).toBe("initialized");
    expect(result.workspace?.rootPath).toBe(workspacePath);

    const manifestContent = await readFile(join(workspacePath, "project.yaml"), "utf8");
    const manifest = parse(manifestContent) as WorkspaceManifest;
    expect(manifest.project.name).toBe("ACME Delivery Workspace");
    expect(manifest.project.slug).toBe("acme-delivery-workspace");

    await expect(stat(join(workspacePath, ".workspace/workspace.db"))).resolves.toBeDefined();
    await expect(stat(join(workspacePath, "requirements/user-stories"))).resolves.toBeDefined();
    await expect(stat(join(workspacePath, "architecture/decisions"))).resolves.toBeDefined();
    await expect(stat(join(workspacePath, "templates/dynamic"))).resolves.toBeDefined();
  });

  it("opens an existing valid workspace without overwriting files", async () => {
    const workspacePath = join(await createWorkspaceRoot(), "existing-workspace");
    const useCase = new InitializeWorkspaceUseCase(new NodeWorkspaceFileSystem());

    const initial = await useCase.execute({
      rootPath: workspacePath,
      projectName: "Existing Workspace",
    });
    expect(initial.status).toBe("initialized");

    const customizedReadme = "# Existing Workspace\n\nPreserve this file.\n";
    await writeFile(join(workspacePath, "README.md"), customizedReadme, "utf8");

    const reopened = await useCase.execute({
      rootPath: workspacePath,
    });

    expect(reopened.status).toBe("opened");
    expect(await readFile(join(workspacePath, "README.md"), "utf8")).toBe(customizedReadme);
  });

  it("reports partial workspaces and exposes repairable issues", async () => {
    const workspacePath = join(await createWorkspaceRoot(), "partial-workspace");
    const fileSystem = new NodeWorkspaceFileSystem();

    await fileSystem.ensureDirectory(workspacePath);
    await fileSystem.writeTextFile(
      join(workspacePath, "project.yaml"),
      "project:\n  id: PROJ-001\n  uuid: invalid\n",
    );

    const useCase = new InitializeWorkspaceUseCase(fileSystem);
    const result = await useCase.execute({
      rootPath: workspacePath,
    });

    expect(result.status).toBe("repair-required");
    expect(result.workspace).toBeNull();
    expect(result.integrity.hasWorkspaceMarkers).toBe(true);
    expect(result.integrity.issues.some((issue) => issue.path === ".workspace/settings.json")).toBe(
      true,
    );
    expect(result.integrity.issues.some((issue) => issue.code === "invalid_yaml")).toBe(true);
  });

  it("repairs a partial workspace when requested", async () => {
    const workspacePath = join(await createWorkspaceRoot(), "repairable-workspace");
    const fileSystem = new NodeWorkspaceFileSystem();

    await fileSystem.ensureDirectory(join(workspacePath, ".workspace"));
    await fileSystem.writeTextFile(
      join(workspacePath, "project.yaml"),
      [
        "project:",
        "  id: PROJ-777",
        "  uuid: 11111111-1111-4111-8111-111111111111",
        "  name: Repairable Workspace",
        "  slug: repairable-workspace",
        "  default_currency: COP",
        "  secondary_currencies:",
        "    - USD",
        "  methodology_profile: hybrid-consulting",
        "  owner: owner",
        "  created_at: 2026-04-23",
        "  modules:",
        "    - requirements",
      ].join("\n"),
    );
    await fileSystem.writeTextFile(join(workspacePath, ".workspace/settings.json"), "{invalid");

    const useCase = new InitializeWorkspaceUseCase(fileSystem);
    const result = await useCase.execute({
      rootPath: workspacePath,
      repairMode: "apply",
    });

    expect(result.status).toBe("repaired");
    expect(result.repairedPaths).toContain(".workspace/settings.json");
    expect(result.repairedPaths).toContain(".workspace/sync-state.json");
    expect(result.workspace?.manifest.project.id).toBe("PROJ-777");
    await expect(stat(join(workspacePath, "templates/static"))).resolves.toBeDefined();
  });

  it("refuses automatic repair when a required directory is a file", async () => {
    const workspacePath = join(await createWorkspaceRoot(), "non-repairable-workspace");
    const fileSystem = new NodeWorkspaceFileSystem();

    await fileSystem.ensureDirectory(workspacePath);
    await fileSystem.writeTextFile(join(workspacePath, "requirements"), "collision");

    const useCase = new InitializeWorkspaceUseCase(fileSystem);
    const result = await useCase.execute({
      rootPath: workspacePath,
      repairMode: "apply",
    });

    expect(result.status).toBe("repair-required");
    expect(result.integrity.issues).toContainEqual(
      expect.objectContaining({
        path: "requirements",
        code: "path_type_mismatch",
        repairable: false,
      }),
    );
    expect(result.repairedPaths).toHaveLength(0);
  });
});

async function createWorkspaceRoot(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "cognark-workspace-"));
  createdRoots.push(directory);
  return directory;
}
