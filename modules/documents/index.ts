export { SqliteDocumentIndex } from "@cognark/module-documents/adapters/outbound/sqlite-document-index";
export { ParseAndIndexMarkdownArtifactUseCase } from "@cognark/module-documents/application/parse-and-index-markdown-artifact-use-case";
export type {
  ParseAndIndexMarkdownArtifactInput,
  ParseAndIndexMarkdownArtifactResult,
} from "@cognark/module-documents/application/parse-and-index-markdown-artifact-use-case";
export type {
  ArtifactFrontmatter,
  DocumentParseIssue,
  DocumentParseIssueCode,
  FrontmatterValidationRule,
  InvalidMarkdownArtifact,
  ParsedMarkdownArtifact,
  ParseMarkdownArtifactInput,
  ParseMarkdownArtifactResult,
} from "@cognark/module-documents/domain/frontmatter-model";
export {
  BASE_FRONTMATTER_VALIDATION_CATALOG,
  parseMarkdownArtifact,
} from "@cognark/module-documents/domain/frontmatter-model";
export type {
  DocumentIndexPort,
  IndexParsedMarkdownArtifactInput,
  RecordMarkdownParseErrorInput,
} from "@cognark/module-documents/ports/outbound/document-index-port";

export interface DocumentsModuleDescriptor {
  readonly name: "documents";
  readonly responsibility: "parse-required-markdown-frontmatter-and-index-document-artifacts";
  readonly architecture: "hexagonal-vertical-slice";
  readonly status: "ready-for-req-005";
}

export const documentsModule: DocumentsModuleDescriptor = {
  name: "documents",
  responsibility: "parse-required-markdown-frontmatter-and-index-document-artifacts",
  architecture: "hexagonal-vertical-slice",
  status: "ready-for-req-005",
};
