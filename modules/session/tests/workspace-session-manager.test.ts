import { describe, expect, it } from "vitest";

import { InMemorySessionContextCache } from "@cognark/module-session/adapters/outbound/in-memory-session-context-cache";
import { WorkspaceSessionManager } from "@cognark/module-session/application/workspace-session-manager";
import type { WorkspaceDescriptor, WorkspaceManifest } from "@cognark/module-workspace";

describe("WorkspaceSessionManager", () => {
  it("opens one active workspace for the current session", async () => {
    const manager = new WorkspaceSessionManager();
    const workspace = createWorkspaceDescriptor("/workspaces/acme", "PROJ-001");

    const opened = await manager.openWorkspace({
      workspace,
      sessionId: "session-1",
      openedAt: "2026-04-23T00:00:00.000Z",
    });

    expect(opened.status).toBe("opened");
    expect(opened.activeSession.workspace).toBe(workspace);
    expect(opened.previousSession).toBeNull();
    expect(opened.cacheCleared).toBe(false);
    expect(manager.getActiveSession()?.id).toBe("session-1");
  });

  it("reuses the active session when the same workspace is opened again", async () => {
    const manager = new WorkspaceSessionManager();
    const workspace = createWorkspaceDescriptor("/workspaces/acme", "PROJ-001");

    const first = await manager.openWorkspace({ workspace, sessionId: "session-1" });
    const second = await manager.openWorkspace({ workspace, sessionId: "session-2" });

    expect(second.status).toBe("reused");
    expect(second.activeSession).toBe(first.activeSession);
    expect(second.cacheCleared).toBe(false);
    expect(manager.getActiveSession()?.id).toBe("session-1");
  });

  it("switches workspaces by closing the previous context and clearing caches", async () => {
    const cache = new InMemorySessionContextCache();
    const manager = new WorkspaceSessionManager(cache);
    const acme = createWorkspaceDescriptor("/workspaces/acme", "PROJ-001");
    const globex = createWorkspaceDescriptor("/workspaces/globex", "PROJ-002");

    const first = await manager.openWorkspace({ workspace: acme, sessionId: "session-1" });
    const second = await manager.openWorkspace({ workspace: globex, sessionId: "session-2" });

    expect(second.status).toBe("switched");
    expect(second.previousSession).toBe(first.activeSession);
    expect(second.activeSession.workspace).toBe(globex);
    expect(second.cacheCleared).toBe(true);
    expect(cache.getClearRecords()).toEqual([
      {
        previousSession: first.activeSession,
        activeSession: second.activeSession,
        reason: "switched",
      },
    ]);
  });

  it("can reject a second workspace when the caller forbids switching", async () => {
    const cache = new InMemorySessionContextCache();
    const manager = new WorkspaceSessionManager(cache);
    const acme = createWorkspaceDescriptor("/workspaces/acme", "PROJ-001");
    const globex = createWorkspaceDescriptor("/workspaces/globex", "PROJ-002");

    const first = await manager.openWorkspace({ workspace: acme, sessionId: "session-1" });
    const rejected = await manager.openWorkspace({
      workspace: globex,
      sessionId: "session-2",
      mode: "reject-if-active",
    });

    expect(rejected.status).toBe("rejected");
    expect(rejected.activeSession).toBe(first.activeSession);
    expect(manager.getActiveSession()).toBe(first.activeSession);
    expect(cache.getClearRecords()).toHaveLength(0);
  });

  it("authorizes operations only for the active workspace root and project id", async () => {
    const manager = new WorkspaceSessionManager();
    const workspace = createWorkspaceDescriptor("/workspaces/acme", "PROJ-001");

    await manager.openWorkspace({ workspace, sessionId: "session-1" });

    expect(
      manager.authorizeWorkspaceOperation({
        rootPath: "/workspaces/acme",
        projectId: "PROJ-001",
      }),
    ).toEqual({
      authorized: true,
      session: manager.getActiveSession(),
    });

    expect(
      manager.authorizeWorkspaceOperation({
        rootPath: "/workspaces/globex",
        projectId: "PROJ-001",
      }),
    ).toEqual({
      authorized: false,
      reason: "workspace-root-mismatch",
      activeSession: manager.getActiveSession(),
    });

    expect(
      manager.authorizeWorkspaceOperation({
        rootPath: "/workspaces/acme",
        projectId: "PROJ-002",
      }),
    ).toEqual({
      authorized: false,
      reason: "project-id-mismatch",
      activeSession: manager.getActiveSession(),
    });
  });

  it("clears contextual caches when the active workspace is closed", async () => {
    const cache = new InMemorySessionContextCache();
    const manager = new WorkspaceSessionManager(cache);
    const workspace = createWorkspaceDescriptor("/workspaces/acme", "PROJ-001");

    const opened = await manager.openWorkspace({ workspace, sessionId: "session-1" });
    const closed = await manager.closeActiveWorkspace();

    expect(closed.status).toBe("closed");
    expect(closed.closedSession).toBe(opened.activeSession);
    expect(closed.cacheCleared).toBe(true);
    expect(manager.getActiveSession()).toBeNull();
    expect(cache.getClearRecords()).toEqual([
      {
        previousSession: opened.activeSession,
        activeSession: null,
        reason: "closed",
      },
    ]);
  });
});

function createWorkspaceDescriptor(rootPath: string, projectId: string): WorkspaceDescriptor {
  return {
    rootPath,
    manifest: createWorkspaceManifest(projectId),
  };
}

function createWorkspaceManifest(projectId: string): WorkspaceManifest {
  return {
    project: {
      id: projectId,
      uuid: `${projectId}-uuid`,
      name: `${projectId} Workspace`,
      slug: projectId.toLowerCase(),
      default_currency: "COP",
      secondary_currencies: ["USD"],
      methodology_profile: "hybrid-consulting",
      owner: "owner",
      created_at: "2026-04-23",
      modules: ["requirements"],
    },
  };
}
