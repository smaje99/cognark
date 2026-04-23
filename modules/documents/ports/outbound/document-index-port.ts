import type {
  InvalidMarkdownArtifact,
  ParsedMarkdownArtifact,
} from "@cognark/module-documents/domain/frontmatter-model";

export interface IndexParsedMarkdownArtifactInput {
  readonly workspaceRootPath: string;
  readonly projectId: string;
  readonly artifact: ParsedMarkdownArtifact;
}

export interface RecordMarkdownParseErrorInput {
  readonly workspaceRootPath: string;
  readonly projectId: string;
  readonly artifact: InvalidMarkdownArtifact;
}

export interface DocumentIndexPort {
  upsertParsedArtifact(input: IndexParsedMarkdownArtifactInput): Promise<void>;
  recordParseError(input: RecordMarkdownParseErrorInput): Promise<void>;
}
