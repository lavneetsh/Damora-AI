import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  role?: string;
  memberCount?: number;
  aiProvider?: string | null;
  hasAiApiKey?: boolean;
  aiConnectionStatus?: 'CONNECTED' | 'FAILED' | 'NOT_CONFIGURED' | null;
  aiLastTested?: string | null;
  createdAt: string;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
  workspace: { id: string; name: string; slug: string };
  invitedBy: { id: string; name: string; email: string };
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isLoading: boolean;
  invites: WorkspaceInvite[];
  invitesLoading: boolean;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  fetchInvites: () => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  updateAiSettings: (workspaceId: string, provider: string | null, key?: string | null) => Promise<any>;
  testAiConnection: (workspaceId: string, provider: string, key?: string | null) => Promise<any>;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      isLoading: false,
      invites: [],
      invitesLoading: false,

      fetchWorkspaces: async () => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.get<Workspace[]>('/workspaces');
          const workspaces = data;
          set({ workspaces, isLoading: false });

          // Auto-select the first workspace if none is active or active one no longer exists
          const { activeWorkspaceId } = get();
          const stillExists = workspaces.some((w) => w.id === activeWorkspaceId);
          if (!activeWorkspaceId || !stillExists) {
            if (workspaces.length > 0) {
              set({ activeWorkspaceId: workspaces[0].id });
            }
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to fetch workspaces:', error);
        }
      },

      setActiveWorkspace: (id: string) => {
        set({ activeWorkspaceId: id });
      },

      fetchInvites: async () => {
        set({ invitesLoading: true });
        try {
          const { data } = await apiClient.get<WorkspaceInvite[]>('/invitations');
          set({ invites: data, invitesLoading: false });
        } catch {
          set({ invitesLoading: false });
        }
      },

      acceptInvite: async (inviteId: string) => {
        await apiClient.post(`/invitations/${inviteId}/accept`);
        // Re-fetch both invites and workspaces
        await Promise.all([get().fetchInvites(), get().fetchWorkspaces()]);
      },

      declineInvite: async (inviteId: string) => {
        await apiClient.post(`/invitations/${inviteId}/decline`);
        set((state) => ({ invites: state.invites.filter((i) => i.id !== inviteId) }));
      },

      updateAiSettings: async (workspaceId: string, provider: string | null, key?: string | null) => {
        const { data } = await apiClient.patch(`/workspaces/${workspaceId}/ai-settings`, {
          aiProvider: provider,
          aiApiKey: key,
        });
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, ...data } : w
          ),
        }));
        return data;
      },

      testAiConnection: async (workspaceId: string, provider: string, key?: string | null) => {
        const { data } = await apiClient.post(`/workspaces/${workspaceId}/test-key`, {
          aiProvider: provider,
          aiApiKey: key,
        });
        return data;
      },

      reset: () => {
        set({ workspaces: [], activeWorkspaceId: null, isLoading: false, invites: [] });
      },
    }),
    {
      name: 'damora-workspace',
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    },
  ),
);
