import type { WorkspaceDatabaseFactoryPort } from "@cognark/module-persistence";
import type { ParsedMarkdownArtifact } from "@cognark/module-documents/domain/frontmatter-model";
import type {
  IndexParsedMarkdownArtifactInput,
  RecordMarkdownParseErrorInput,
  DocumentIndexPort,
} from "@cognark/module-documents/ports/outbound/document-index-port";

export class SqliteDocumentIndex implements DocumentIndexPort {
  public constructor(private readonly databaseFactory: WorkspaceDatabaseFactoryPort) {}

  public async upsertParsedArtifact(input: IndexParsedMarkdownArtifactInput): Promise<void> {
    const database = this.databaseFactory.openWorkspaceDatabase(input.workspaceRootPath);

    try {
      const { artifact } = input;
      const { frontmatter } = artifact;

      database.exec("BEGIN;");

      try {
        database.run(
          `INSERT INTO nodes (
             id,
             project_id,
             human_id,
             type,
             title,
             status,
             priority,
             severity,
             lifecycle_phase,
             owner,
             source_path,
             hash,
             metadata_json,
             created_at,
             updated_at
           )
           VALUES (
             :id,
             :project_id,
             :human_id,
             :type,
             :title,
             :status,
             :priority,
             :severity,
             :lifecycle_phase,
             :owner,
             :source_path,
             :hash,
             :metadata_json,
             :created_at,
             :updated_at
           )
           ON CONFLICT(id) DO UPDATE SET
             human_id = excluded.human_id,
             type = excluded.type,
             title = excluded.title,
             status = excluded.status,
             priority = excluded.priority,
             severity = excluded.severity,
             lifecycle_phase = excluded.lifecycle_phase,
             owner = excluded.owner,
             source_path = excluded.source_path,
             hash = excluded.hash,
             metadata_json = excluded.metadata_json,
             updated_at = excluded.updated_at`,
          {
            id: frontmatter.uuid,
            project_id: input.projectId,
            human_id: frontmatter.id,
            type: frontmatter.type,
            title: frontmatter.title,
            status: frontmatter.status,
            priority: frontmatter.priority ?? null,
            severity: frontmatter.severity ?? null,
            lifecycle_phase: frontmatter.lifecycle_phase,
            owner: frontmatter.owner,
            source_path: artifact.path,
            hash: artifact.fileHash,
            metadata_json: JSON.stringify(frontmatter),
            created_at: frontmatter.created_at,
            updated_at: frontmatter.updated_at,
          },
        );

        upsertArtifactFile(database, input.projectId, artifact);
        upsertFileIndex(database, {
          projectId: input.projectId,
          path: artifact.path,
          fileHash: artifact.fileHash,
          parsedAt: artifact.parsedAt,
          parseStatus: "parsed",
          lastError: null,
        });

        database.exec("COMMIT;");
      } catch (error) {
        database.exec("ROLLBACK;");
        throw error;
      }
    } finally {
      database.close();
    }
  }

  public async recordParseError(input: RecordMarkdownParseErrorInput): Promise<void> {
    const database = this.databaseFactory.openWorkspaceDatabase(input.workspaceRootPath);
    const { artifact } = input;

    try {
      database.exec("BEGIN;");

      try {
        database.run(
          `INSERT INTO artifact_files (
             id,
             project_id,
             node_id,
             path,
             format,
             role,
             file_hash,
             frontmatter_json,
             created_at,
             updated_at
           )
           VALUES (
             :id,
             :project_id,
             NULL,
             :path,
             'markdown',
             NULL,
             :file_hash,
             NULL,
             :created_at,
             :updated_at
           )
           ON CONFLICT(project_id, path) DO UPDATE SET
             node_id = NULL,
             file_hash = excluded.file_hash,
             frontmatter_json = NULL,
             updated_at = excluded.updated_at`,
          {
            id: buildArtifactFileId(input.projectId, artifact.path),
            project_id: input.projectId,
            path: artifact.path,
            file_hash: artifact.fileHash,
            created_at: artifact.parsedAt,
            updated_at: artifact.parsedAt,
          },
        );

        upsertFileIndex(database, {
          projectId: input.projectId,
          path: artifact.path,
          fileHash: artifact.fileHash,
          parsedAt: artifact.parsedAt,
          parseStatus: "error",
          lastError: JSON.stringify(artifact.issues),
        });

        database.exec("COMMIT;");
      } catch (error) {
        database.exec("ROLLBACK;");
        throw error;
      }
    } finally {
      database.close();
    }
  }
}

interface DatabaseRunner {
  run(
    sql: string,
    parameters?: Record<string, null | number | bigint | string | NodeJS.ArrayBufferView>,
  ): void;
}

interface UpsertFileIndexInput {
  readonly projectId: string;
  readonly path: string;
  readonly fileHash: string;
  readonly parsedAt: string;
  readonly parseStatus: "parsed" | "error";
  readonly lastError: string | null;
}

function upsertArtifactFile(
  database: DatabaseRunner,
  projectId: string,
  artifact: ParsedMarkdownArtifact,
): void {
  database.run(
    `INSERT INTO artifact_files (
       id,
       project_id,
       node_id,
       path,
       format,
       role,
       file_hash,
       frontmatter_json,
       created_at,
       updated_at
     )
     VALUES (
       :id,
       :project_id,
       :node_id,
       :path,
       'markdown',
       :role,
       :file_hash,
       :frontmatter_json,
       :created_at,
       :updated_at
     )
     ON CONFLICT(project_id, path) DO UPDATE SET
       node_id = excluded.node_id,
       role = excluded.role,
       file_hash = excluded.file_hash,
       frontmatter_json = excluded.frontmatter_json,
       updated_at = excluded.updated_at`,
    {
      id: buildArtifactFileId(projectId, artifact.path),
      project_id: projectId,
      node_id: artifact.frontmatter.uuid,
      path: artifact.path,
      role: artifact.frontmatter.role ?? null,
      file_hash: artifact.fileHash,
      frontmatter_json: JSON.stringify(artifact.frontmatter),
      created_at: artifact.frontmatter.created_at,
      updated_at: artifact.parsedAt,
    },
  );
}

function upsertFileIndex(database: DatabaseRunner, input: UpsertFileIndexInput): void {
  database.run(
    `INSERT INTO file_index (
       id,
       project_id,
       path,
       file_hash,
       last_modified_local,
       parser_type,
       parse_status,
       last_error,
       created_at,
       updated_at
     )
     VALUES (
       :id,
       :project_id,
       :path,
       :file_hash,
       :last_modified_local,
       'markdown-frontmatter',
       :parse_status,
       :last_error,
       :created_at,
       :updated_at
     )
     ON CONFLICT(project_id, path) DO UPDATE SET
       file_hash = excluded.file_hash,
       last_modified_local = excluded.last_modified_local,
       parser_type = excluded.parser_type,
       parse_status = excluded.parse_status,
       last_error = excluded.last_error,
       updated_at = excluded.updated_at`,
    {
      id: buildFileIndexId(input.projectId, input.path),
      project_id: input.projectId,
      path: input.path,
      file_hash: input.fileHash,
      last_modified_local: input.parsedAt,
      parse_status: input.parseStatus,
      last_error: input.lastError,
      created_at: input.parsedAt,
      updated_at: input.parsedAt,
    },
  );
}

function buildArtifactFileId(projectId: string, path: string): string {
  return `artifact-file:${projectId}:${path}`;
}

function buildFileIndexId(projectId: string, path: string): string {
  return `file-index:${projectId}:${path}`;
}
