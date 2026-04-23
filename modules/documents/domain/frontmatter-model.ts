import { parseDocument } from "yaml";

export type DocumentParseIssueCode =
  | "missing_frontmatter"
  | "unterminated_frontmatter"
  | "invalid_yaml"
  | "frontmatter_not_mapping"
  | "missing_required_field"
  | "invalid_field_type"
  | "invalid_uuid"
  | "invalid_timestamp"
  | "invalid_links";

export interface DocumentParseIssue {
  readonly code: DocumentParseIssueCode;
  readonly message: string;
  readonly field?: string;
}

export interface FrontmatterValidationRule {
  readonly field: string;
  readonly description: string;
  readonly required: boolean;
}

export const BASE_FRONTMATTER_VALIDATION_CATALOG: readonly FrontmatterValidationRule[] = [
  {
    field: "id",
    description: "Stable human-readable artifact ID.",
    required: true,
  },
  {
    field: "uuid",
    description: "Durable internal UUID for graph and SQLite node identity.",
    required: true,
  },
  {
    field: "type",
    description: "Artifact type such as requirement, meeting, adr, or note.",
    required: true,
  },
  {
    field: "title",
    description: "Human-readable title synced to the semantic node.",
    required: true,
  },
  {
    field: "status",
    description: "Current workflow status.",
    required: true,
  },
  {
    field: "lifecycle_phase",
    description: "Current lifecycle or methodology phase.",
    required: true,
  },
  {
    field: "owner",
    description: "Responsible person, team, or agent.",
    required: true,
  },
  {
    field: "created_at",
    description: "Creation timestamp.",
    required: true,
  },
  {
    field: "updated_at",
    description: "Last semantic update timestamp.",
    required: true,
  },
  {
    field: "links",
    description: "Structured relation map used by graph extraction.",
    required: true,
  },
] as const;

export interface ArtifactFrontmatter extends Record<string, unknown> {
  readonly id: string;
  readonly uuid: string;
  readonly type: string;
  readonly title: string;
  readonly status: string;
  readonly lifecycle_phase: string;
  readonly owner: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly links: Record<string, unknown>;
  readonly priority?: string;
  readonly severity?: string;
  readonly role?: string;
}

export interface ParsedMarkdownArtifact {
  readonly path: string;
  readonly fileHash: string;
  readonly rawFrontmatter: string;
  readonly frontmatter: ArtifactFrontmatter;
  readonly body: string;
  readonly parsedAt: string;
}

export interface InvalidMarkdownArtifact {
  readonly path: string;
  readonly fileHash: string;
  readonly issues: readonly DocumentParseIssue[];
  readonly parsedAt: string;
}

export interface ParseMarkdownArtifactInput {
  readonly path: string;
  readonly content: string;
  readonly fileHash: string;
  readonly parsedAt?: string;
}

export type ParseMarkdownArtifactResult =
  | {
      readonly ok: true;
      readonly artifact: ParsedMarkdownArtifact;
    }
  | {
      readonly ok: false;
      readonly artifact: InvalidMarkdownArtifact;
    };

interface ExtractedFrontmatter {
  readonly rawFrontmatter: string;
  readonly body: string;
}

export function parseMarkdownArtifact(
  input: ParseMarkdownArtifactInput,
): ParseMarkdownArtifactResult {
  const parsedAt = input.parsedAt ?? new Date().toISOString();
  const extracted = extractFrontmatter(input.content);

  if (isIssue(extracted)) {
    return invalidArtifact(input, parsedAt, [extracted]);
  }

  const parsed = parseFrontmatterYaml(extracted.rawFrontmatter);

  if (isIssueList(parsed)) {
    return invalidArtifact(input, parsedAt, parsed);
  }

  return {
    ok: true,
    artifact: {
      path: input.path,
      fileHash: input.fileHash,
      rawFrontmatter: extracted.rawFrontmatter,
      frontmatter: parsed,
      body: extracted.body,
      parsedAt,
    },
  };
}

function extractFrontmatter(content: string): ExtractedFrontmatter | DocumentParseIssue {
  const normalizedContent = content.replace(/^\uFEFF/, "");
  const lines = normalizedContent.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    return {
      code: "missing_frontmatter",
      message: "Markdown artifact must start with YAML frontmatter delimited by ---.",
    };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");

  if (closingIndex === -1) {
    return {
      code: "unterminated_frontmatter",
      message: "Markdown artifact frontmatter must close with a standalone --- delimiter.",
    };
  }

  return {
    rawFrontmatter: lines.slice(1, closingIndex).join("\n"),
    body: lines.slice(closingIndex + 1).join("\n"),
  };
}

function parseFrontmatterYaml(
  rawFrontmatter: string,
): ArtifactFrontmatter | readonly DocumentParseIssue[] {
  const document = parseDocument(rawFrontmatter, {
    prettyErrors: false,
  });

  if (document.errors.length > 0) {
    return document.errors.map((error) => ({
      code: "invalid_yaml",
      message: error.message,
    }));
  }

  const value = document.toJSON();

  if (!isRecord(value)) {
    return [
      {
        code: "frontmatter_not_mapping",
        message: "Markdown frontmatter must be a YAML mapping.",
      },
    ];
  }

  return validateBaseFrontmatter(value);
}

function validateBaseFrontmatter(
  value: Record<string, unknown>,
): ArtifactFrontmatter | readonly DocumentParseIssue[] {
  const issues: DocumentParseIssue[] = [];

  for (const rule of BASE_FRONTMATTER_VALIDATION_CATALOG) {
    if (rule.required && !(rule.field in value)) {
      issues.push({
        code: "missing_required_field",
        field: rule.field,
        message: `Missing required frontmatter field: ${rule.field}.`,
      });
    }
  }

  issues.push(
    ...validateStringField(value, "id"),
    ...validateStringField(value, "uuid"),
    ...validateStringField(value, "type"),
    ...validateStringField(value, "title"),
    ...validateStringField(value, "status"),
    ...validateStringField(value, "lifecycle_phase"),
    ...validateStringField(value, "owner"),
    ...validateStringField(value, "created_at"),
    ...validateStringField(value, "updated_at"),
    ...validateOptionalStringField(value, "priority"),
    ...validateOptionalStringField(value, "severity"),
    ...validateOptionalStringField(value, "role"),
  );

  if (typeof value.uuid === "string" && !isUuid(value.uuid)) {
    issues.push({
      code: "invalid_uuid",
      field: "uuid",
      message: "Frontmatter field uuid must be a valid UUID.",
    });
  }

  if (typeof value.created_at === "string" && !isParseableTimestamp(value.created_at)) {
    issues.push({
      code: "invalid_timestamp",
      field: "created_at",
      message: "Frontmatter field created_at must be a parseable timestamp.",
    });
  }

  if (typeof value.updated_at === "string" && !isParseableTimestamp(value.updated_at)) {
    issues.push({
      code: "invalid_timestamp",
      field: "updated_at",
      message: "Frontmatter field updated_at must be a parseable timestamp.",
    });
  }

  if ("links" in value && !isRecord(value.links)) {
    issues.push({
      code: "invalid_links",
      field: "links",
      message: "Frontmatter field links must be a YAML mapping.",
    });
  }

  if (issues.length > 0) {
    return issues;
  }

  return value as ArtifactFrontmatter;
}

function validateStringField(
  value: Record<string, unknown>,
  field: string,
): readonly DocumentParseIssue[] {
  if (!(field in value)) {
    return [];
  }

  if (typeof value[field] !== "string" || value[field].trim().length === 0) {
    return [
      {
        code: "invalid_field_type",
        field,
        message: `Frontmatter field ${field} must be a non-empty string.`,
      },
    ];
  }

  return [];
}

function validateOptionalStringField(
  value: Record<string, unknown>,
  field: string,
): readonly DocumentParseIssue[] {
  if (!(field in value) || value[field] === null) {
    return [];
  }

  return validateStringField(value, field);
}

function invalidArtifact(
  input: ParseMarkdownArtifactInput,
  parsedAt: string,
  issues: readonly DocumentParseIssue[],
): ParseMarkdownArtifactResult {
  return {
    ok: false,
    artifact: {
      path: input.path,
      fileHash: input.fileHash,
      issues,
      parsedAt,
    },
  };
}

function isIssue(value: ExtractedFrontmatter | DocumentParseIssue): value is DocumentParseIssue {
  return "code" in value;
}

function isIssueList(
  value: ArtifactFrontmatter | readonly DocumentParseIssue[],
): value is readonly DocumentParseIssue[] {
  return Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isParseableTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}
