import {
  type ParseMarkdownArtifactResult,
  parseMarkdownArtifact,
} from "@cognark/module-documents/domain/frontmatter-model";
import type { DocumentIndexPort } from "@cognark/module-documents/ports/outbound/document-index-port";

export interface ParseAndIndexMarkdownArtifactInput {
  readonly workspaceRootPath: string;
  readonly projectId: string;
  readonly path: string;
  readonly content: string;
  readonly fileHash: string;
  readonly parsedAt?: string;
}

export interface ParseAndIndexMarkdownArtifactResult {
  readonly parseResult: ParseMarkdownArtifactResult;
  readonly indexStatus: "parsed" | "error-recorded";
}

export class ParseAndIndexMarkdownArtifactUseCase {
  public constructor(private readonly documentIndex: DocumentIndexPort) {}

  public async execute(
    input: ParseAndIndexMarkdownArtifactInput,
  ): Promise<ParseAndIndexMarkdownArtifactResult> {
    const parseResult = parseMarkdownArtifact(input);

    if (parseResult.ok) {
      await this.documentIndex.upsertParsedArtifact({
        workspaceRootPath: input.workspaceRootPath,
        projectId: input.projectId,
        artifact: parseResult.artifact,
      });

      return {
        parseResult,
        indexStatus: "parsed",
      };
    }

    await this.documentIndex.recordParseError({
      workspaceRootPath: input.workspaceRootPath,
      projectId: input.projectId,
      artifact: parseResult.artifact,
    });

    return {
      parseResult,
      indexStatus: "error-recorded",
    };
  }
}
