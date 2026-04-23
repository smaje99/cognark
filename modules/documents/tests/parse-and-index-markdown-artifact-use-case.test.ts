import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { SqliteDocumentIndex } from "@cognark/module-documents/adapters/outbound/sqlite-document-index";
import { ParseAndIndexMarkdownArtifactUseCase } from "@cognark/module-documents/application/parse-and-index-markdown-artifact-use-case";
import {
  BASE_FRONTMATTER_VALIDATION_CATALOG,
  parseMarkdownArtifact,
} from "@cognark/module-documents/domain/frontmatter-model";
import { NodeSqliteWorkspaceDatabaseFactory } from "@cognark/module-persistence/adapters/outbound/node-sqlite-workspace-database";
import { BootstrapSqliteWorkspaceUseCase } from "@cognark/module-persistence/application/bootstrap-sqlite-workspace-use-case";
import { NodeWorkspaceFileSystem } from "@cognark/module-workspace/adapters/outbound/node-workspace-file-system";
import { InitializeWorkspaceUseCase } from "@cognark/module-workspace/application/initialize-workspace-use-case";

const createdRoots: string[] = [];

describe("parseMarkdownArtifact", () => {
  it("parses valid mandatory YAML frontmatter into a structured representation", () => {
    const result = parseMarkdownArtifact({
      path: "requirements/REQ-001.md",
      fileHash: "hash-valid",
      parsedAt: "2026-04-23T10:00:00.000Z",
      content: buildValidMarkdown(),
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      expect.fail("Expected a valid parsed artifact.");
    }

    expect(result.artifact.frontmatter).toEqual(
      expect.objectContaining({
        id: "REQ-001",
        uuid: "11111111-1111-4111-8111-111111111111",
        type: "requirement",
        title: "Initialize workspace",
        lifecycle_phase: "discovery",
      }),
    );
    expect(result.artifact.body.trim()).toBe("# Requirement body");
  });

  it("returns actionable validation issues when mandatory frontmatter is missing", () => {
    const result = parseMarkdownArtifact({
      path: "requirements/REQ-002.md",
      fileHash: "hash-missing",
      content: "# Missing frontmatter",
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      expect.fail("Expected an invalid parsed artifact.");
    }

    expect(result.artifact.issues).toEqual([
      expect.objectContaining({
        code: "missing_frontmatter",
      }),
    ]);
  });

  it("uses an explicit validation catalog for the base frontmatter contract", () => {
    expect(BASE_FRONTMATTER_VALIDATION_CATALOG.map((rule) => rule.field)).toEqual([
      "id",
      "uuid",
      "type",
      "title",
      "status",
      "lifecycle_phase",
      "owner",
      "created_at",
      "updated_at",
      "links",
    ]);
  });
});

describe("ParseAndIndexMarkdownArtifactUseCase", () => {
  afterEach(async () => {
    await Promise.all(
      createdRoots.splice(0).map(async (directory) => {
        await rm(directory, { recursive: true, force: true });
      }),
    );
  });

  it("syncs valid frontmatter to nodes, artifact_files, and file_index", async () => {
    const workspace = await createInitializedWorkspace();
    const databaseFactory = new NodeSqliteWorkspaceDatabaseFactory();
    const useCase = new ParseAndIndexMarkdownArtifactUseCase(
      new SqliteDocumentIndex(databaseFactory),
    );

    const result = await useCase.execute({
      workspaceRootPath: workspace.rootPath,
      projectId: workspace.projectId,
      path: "requirements/REQ-001.md",
      fileHash: "hash-valid",
      parsedAt: "2026-04-23T10:00:00.000Z",
      content: buildValidMarkdown(),
    });

    expect(result.indexStatus).toBe("parsed");

    const database = databaseFactory.openWorkspaceDatabase(workspace.rootPath);
    try {
      const node = database.get<{
        id: string;
        human_id: string;
        type: string;
        title: string;
        lifecycle_phase: string;
        source_path: string;
      }>(
        "SELECT id, human_id, type, title, lifecycle_phase, source_path FROM nodes WHERE id = :id",
        {
          id: "11111111-1111-4111-8111-111111111111",
        },
      );
      const artifactFile = database.get<{
        node_id: string;
        path: string;
        format: string;
        file_hash: string;
        frontmatter_json: string;
      }>(
        "SELECT node_id, path, format, file_hash, frontmatter_json FROM artifact_files WHERE path = :path",
        {
          path: "requirements/REQ-001.md",
        },
      );
      const fileIndex = database.get<{
        parser_type: string;
        parse_status: string;
        last_error: string | null;
      }>("SELECT parser_type, parse_status, last_error FROM file_index WHERE path = :path", {
        path: "requirements/REQ-001.md",
      });

      expect(node).toEqual({
        id: "11111111-1111-4111-8111-111111111111",
        human_id: "REQ-001",
        type: "requirement",
        title: "Initialize workspace",
        lifecycle_phase: "discovery",
        source_path: "requirements/REQ-001.md",
      });
      expect(artifactFile).toEqual(
        expect.objectContaining({
          node_id: "11111111-1111-4111-8111-111111111111",
          path: "requirements/REQ-001.md",
          format: "markdown",
          file_hash: "hash-valid",
        }),
      );
      expect(JSON.parse(artifactFile?.frontmatter_json ?? "{}")).toEqual(
        expect.objectContaining({
          id: "REQ-001",
          links: {
            depends_on: [],
          },
        }),
      );
      expect(fileIndex).toEqual({
        parser_type: "markdown-frontmatter",
        parse_status: "parsed",
        last_error: null,
      });
    } finally {
      database.close();
    }
  });

  it("marks invalid artifacts as parse errors without creating graph nodes", async () => {
    const workspace = await createInitializedWorkspace();
    const databaseFactory = new NodeSqliteWorkspaceDatabaseFactory();
    const useCase = new ParseAndIndexMarkdownArtifactUseCase(
      new SqliteDocumentIndex(databaseFactory),
    );

    const result = await useCase.execute({
      workspaceRootPath: workspace.rootPath,
      projectId: workspace.projectId,
      path: "requirements/REQ-INVALID.md",
      fileHash: "hash-invalid",
      parsedAt: "2026-04-23T11:00:00.000Z",
      content: `---
id: REQ-INVALID
uuid: not-a-uuid
type: requirement
title: Invalid artifact
status: draft
lifecycle_phase: discovery
owner: product
created_at: 2026-04-23T00:00:00.000Z
updated_at: 2026-04-23T00:00:00.000Z
links: []
---
# Invalid`,
    });

    expect(result.indexStatus).toBe("error-recorded");

    const database = databaseFactory.openWorkspaceDatabase(workspace.rootPath);
    try {
      const nodeCount = database.get<{ count: number }>(
        "SELECT COUNT(*) AS count FROM nodes WHERE source_path = :path",
        {
          path: "requirements/REQ-INVALID.md",
        },
      );
      const artifactFile = database.get<{
        node_id: string | null;
        frontmatter_json: string | null;
      }>("SELECT node_id, frontmatter_json FROM artifact_files WHERE path = :path", {
        path: "requirements/REQ-INVALID.md",
      });
      const fileIndex = database.get<{ parse_status: string; last_error: string }>(
        "SELECT parse_status, last_error FROM file_index WHERE path = :path",
        {
          path: "requirements/REQ-INVALID.md",
        },
      );

      expect(nodeCount?.count).toBe(0);
      expect(artifactFile).toEqual({
        node_id: null,
        frontmatter_json: null,
      });
      expect(fileIndex?.parse_status).toBe("error");
      expect(JSON.parse(fileIndex?.last_error ?? "[]")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "invalid_uuid",
            field: "uuid",
          }),
          expect.objectContaining({
            code: "invalid_links",
            field: "links",
          }),
        ]),
      );
    } finally {
      database.close();
    }
  });
});

function buildValidMarkdown(): string {
  return `---
id: REQ-001
uuid: 11111111-1111-4111-8111-111111111111
type: requirement
title: Initialize workspace
status: draft
lifecycle_phase: discovery
owner: product
created_at: 2026-04-23T00:00:00.000Z
updated_at: 2026-04-23T00:00:00.000Z
links:
  depends_on: []
---
# Requirement body`;
}

async function createInitializedWorkspace(): Promise<{
  readonly rootPath: string;
  readonly projectId: string;
}> {
  const workspacePath = join(await createWorkspaceRoot(), "documents-workspace");
  const databaseFactory = new NodeSqliteWorkspaceDatabaseFactory();
  const bootstrap = new BootstrapSqliteWorkspaceUseCase(databaseFactory);
  const initializer = new InitializeWorkspaceUseCase(new NodeWorkspaceFileSystem(), bootstrap);

  const initialized = await initializer.execute({
    rootPath: workspacePath,
    projectName: "Documents Workspace",
    projectId: "PROJ-DOCS",
  });

  const workspace = initialized.workspace ?? expect.fail("Workspace should be initialized.");

  return {
    rootPath: workspace.rootPath,
    projectId: workspace.manifest.project.uuid,
  };
}

async function createWorkspaceRoot(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "cognark-documents-"));
  createdRoots.push(directory);
  return directory;
}
