import { stringify } from "yaml";

import type {
  WorkspaceExpectedEntry,
  WorkspaceManifest,
  WorkspaceSettings,
  WorkspaceSyncState,
} from "@cognark/module-workspace/domain/workspace-model";

export function serializeWorkspaceManifest(manifest: WorkspaceManifest): string {
  return stringify(manifest, {
    defaultStringType: "PLAIN",
  });
}

export function serializeWorkspaceSettings(settings: WorkspaceSettings): string {
  return `${JSON.stringify(settings, null, 2)}\n`;
}

export function serializeWorkspaceSyncState(syncState: WorkspaceSyncState): string {
  return `${JSON.stringify(syncState, null, 2)}\n`;
}

export function isWorkspaceManifest(value: unknown): value is WorkspaceManifest {
  if (typeof value !== "object" || value === null || !("project" in value)) {
    return false;
  }

  const { project } = value as WorkspaceManifest;

  return (
    typeof project?.id === "string" &&
    typeof project?.uuid === "string" &&
    typeof project?.name === "string" &&
    typeof project?.slug === "string" &&
    typeof project?.default_currency === "string" &&
    Array.isArray(project?.secondary_currencies) &&
    project.secondary_currencies.every((entry) => typeof entry === "string") &&
    typeof project?.methodology_profile === "string" &&
    typeof project?.owner === "string" &&
    typeof project?.created_at === "string" &&
    Array.isArray(project?.modules) &&
    project.modules.every((entry) => typeof entry === "string")
  );
}

export function isWorkspaceSettings(value: unknown): value is WorkspaceSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as WorkspaceSettings;

  return (
    (candidate.theme === "dark" || candidate.theme === "light") &&
    typeof candidate.autosave === "boolean" &&
    typeof candidate.git_auto_snapshot === "boolean" &&
    (candidate.sync_mode === "manual" || candidate.sync_mode === "interval") &&
    (typeof candidate.sync_interval_minutes === "number" ||
      candidate.sync_interval_minutes === null) &&
    candidate.keyboard_profile === "vscode" &&
    Array.isArray(candidate.enabled_plugins) &&
    candidate.enabled_plugins.every((entry) => typeof entry === "string")
  );
}

export function isWorkspaceSyncState(value: unknown): value is WorkspaceSyncState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as WorkspaceSyncState;

  return (
    candidate.version === 1 &&
    candidate.status === "idle" &&
    (typeof candidate.last_sync_at === "string" || candidate.last_sync_at === null) &&
    (typeof candidate.last_successful_sync_at === "string" ||
      candidate.last_successful_sync_at === null) &&
    (typeof candidate.manifest_hash === "string" || candidate.manifest_hash === null) &&
    typeof candidate.pending_operations === "number" &&
    Array.isArray(candidate.conflicts) &&
    candidate.conflicts.every((entry) => typeof entry === "string")
  );
}

export function isTextEntry(entry: WorkspaceExpectedEntry): boolean {
  return entry.contentKind === "text";
}
