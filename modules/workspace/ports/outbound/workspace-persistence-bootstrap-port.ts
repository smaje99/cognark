import type { WorkspaceDescriptor } from "@cognark/module-workspace/domain/workspace-model";

export interface WorkspacePersistenceBootstrapPort {
  bootstrapWorkspacePersistence(workspace: WorkspaceDescriptor): Promise<unknown>;
}

export class NoopWorkspacePersistenceBootstrap implements WorkspacePersistenceBootstrapPort {
  public async bootstrapWorkspacePersistence(_workspace: WorkspaceDescriptor): Promise<unknown> {
    return;
  }
}
