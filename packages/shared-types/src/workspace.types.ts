// ─── Workspace Types ─────────────────────────────────────────────────────────

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  createdAt: string;
}

export interface WorkspaceMemberDto {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  joinedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
}
