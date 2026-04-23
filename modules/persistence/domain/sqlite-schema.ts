import type { SqliteMigration } from "@cognark/module-persistence/domain/persistence-model";

export const SQLITE_BOOTSTRAP_MIGRATIONS: readonly SqliteMigration[] = [
  {
    id: "0001_initial_operational_schema",
    description: "Create the initial local operational schema for a Cognark workspace.",
    sql: `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  human_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  default_currency TEXT NOT NULL,
  methodology_profile TEXT,
  root_path TEXT NOT NULL,
  owner TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  human_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT,
  priority TEXT,
  severity TEXT,
  lifecycle_phase TEXT,
  owner TEXT,
  source_path TEXT,
  hash TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_nodes_project_type ON nodes(project_id, type);
CREATE INDEX IF NOT EXISTS idx_nodes_project_status ON nodes(project_id, status);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  from_node_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(from_node_id) REFERENCES nodes(id),
  FOREIGN KEY(to_node_id) REFERENCES nodes(id)
);

CREATE INDEX IF NOT EXISTS idx_edges_from ON edges(project_id, from_node_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_edges_to ON edges(project_id, to_node_id, relation_type);

CREATE TABLE IF NOT EXISTS artifact_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  node_id TEXT,
  path TEXT NOT NULL,
  format TEXT NOT NULL,
  role TEXT,
  file_hash TEXT NOT NULL,
  frontmatter_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(node_id) REFERENCES nodes(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artifact_path ON artifact_files(project_id, path);

CREATE TABLE IF NOT EXISTS methodology_profiles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  source_path TEXT NOT NULL,
  config_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS statuses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  status_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_terminal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS file_index (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  last_modified_local TEXT NOT NULL,
  parser_type TEXT,
  parse_status TEXT NOT NULL,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_file_index_path ON file_index(project_id, path);

CREATE TABLE IF NOT EXISTS sync_targets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  http_base_url TEXT,
  sftp_host TEXT,
  sftp_port INTEGER,
  username TEXT,
  remote_root TEXT,
  sync_mode TEXT NOT NULL,
  sync_interval_minutes INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS sync_sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  sync_target_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  summary_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(sync_target_id) REFERENCES sync_targets(id)
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  path TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  retries INTEGER NOT NULL DEFAULT 0,
  session_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(session_id) REFERENCES sync_sessions(id)
);

CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  path TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  base_hash TEXT,
  local_hash TEXT,
  remote_hash TEXT,
  resolution_status TEXT NOT NULL,
  resolution_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS git_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  branch_name TEXT,
  commit_hash TEXT,
  related_node_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(related_node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  human_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS cost_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  human_id TEXT,
  title TEXT NOT NULL,
  cost_center_id TEXT,
  related_node_id TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  cost_type TEXT NOT NULL,
  analytical_dimension TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(cost_center_id) REFERENCES cost_centers(id),
  FOREIGN KEY(related_node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  related_node_id TEXT NOT NULL,
  estimate_points REAL,
  estimate_hours REAL,
  estimation_method TEXT,
  confidence_level TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(related_node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS meeting_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  related_node_id TEXT,
  meeting_date TEXT NOT NULL,
  title TEXT NOT NULL,
  participants_json TEXT,
  outcomes_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(related_node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  dashboard_key TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);
`,
  },
];

export const REQUIRED_SQLITE_TABLES = [
  "artifact_files",
  "conflicts",
  "cost_centers",
  "cost_items",
  "dashboard_snapshots",
  "edges",
  "estimates",
  "file_index",
  "git_events",
  "meeting_events",
  "methodology_profiles",
  "nodes",
  "projects",
  "schema_migrations",
  "statuses",
  "sync_queue",
  "sync_sessions",
  "sync_targets",
] as const;
