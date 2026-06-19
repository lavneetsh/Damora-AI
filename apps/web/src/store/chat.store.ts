import { create } from 'zustand';
import apiClient from '@/lib/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface ChatSession {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  visibility: 'PRIVATE' | 'SHARED';
  sharedAt: string | null;
  sharedById: string | null;
  sharedBy?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  tokenCount: number | null;
  provider: string | null;
  retrievedFrom: string[];
  senderId: string | null;
  sender?: { id: string; name: string } | null;
  createdAt: string;
}

interface ChatState {
  // Legacy (backwards compat)
  sessions: ChatSession[];
  // Split lists
  privateSessions: ChatSession[];
  sharedSessions: ChatSession[];
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;

  // Actions
  fetchSessions: (workspaceId: string) => Promise<void>;
  fetchPrivateSessions: (workspaceId: string) => Promise<void>;
  fetchSharedSessions: (workspaceId: string) => Promise<void>;
  createSession: (workspaceId: string, title?: string) => Promise<string>;
  fetchSessionMessages: (workspaceId: string, sessionId: string) => Promise<void>;
  deleteSession: (workspaceId: string, sessionId: string) => Promise<void>;
  shareSession: (workspaceId: string, sessionId: string) => Promise<void>;
  unshareSession: (workspaceId: string, sessionId: string) => Promise<void>;
  sendMessage: (workspaceId: string, sessionId: string, content: string) => Promise<void>;
  setCurrentSessionId: (sessionId: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  sessions: [],
  privateSessions: [],
  sharedSessions: [],
  currentSessionId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingText: '',
  error: null,

  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),

  // ─── Legacy fetch (own sessions) ────────────────────────────────────────
  fetchSessions: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<ChatSession[]>(
        `/workspaces/${workspaceId}/chats`,
      );
      set({ sessions: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load chat history' });
      console.error('fetchSessions error:', err);
    }
  },

  // ─── Private sessions ───────────────────────────────────────────────────
  fetchPrivateSessions: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<ChatSession[]>(
        `/workspaces/${workspaceId}/chats/private`,
      );
      set({ privateSessions: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load private chats' });
      console.error('fetchPrivateSessions error:', err);
    }
  },

  // ─── Shared sessions ────────────────────────────────────────────────────
  fetchSharedSessions: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<ChatSession[]>(
        `/workspaces/${workspaceId}/chats/shared`,
      );
      set({ sharedSessions: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load shared discussions' });
      console.error('fetchSharedSessions error:', err);
    }
  },

  createSession: async (workspaceId, title) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<ChatSession>(
        `/workspaces/${workspaceId}/chats`,
        { title },
      );
      set((state) => ({
        sessions: [data, ...state.sessions],
        privateSessions: [data, ...state.privateSessions],
        currentSessionId: data.id,
        messages: [],
        isLoading: false,
      }));
      return data.id;
    } catch (err) {
      set({ isLoading: false, error: 'Failed to create chat session' });
      console.error('createSession error:', err);
      throw err;
    }
  },

  fetchSessionMessages: async (workspaceId, sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<ChatSession & { messages: ChatMessage[] }>(
        `/workspaces/${workspaceId}/chats/${sessionId}`,
      );
      set({
        messages: data.messages,
        currentSessionId: sessionId,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: 'Failed to load messages' });
      console.error('fetchSessionMessages error:', err);
    }
  },

  deleteSession: async (workspaceId, sessionId) => {
    // Optimistic remove from all lists
    set((state) => {
      const filter = (arr: ChatSession[]) => arr.filter((s) => s.id !== sessionId);
      const nextPrivate = filter(state.privateSessions);
      const nextShared  = filter(state.sharedSessions);
      const nextAll     = filter(state.sessions);
      const isDeletingCurrent = state.currentSessionId === sessionId;
      const nextCurrent =
        isDeletingCurrent ? (nextPrivate[0]?.id ?? nextShared[0]?.id ?? null) : state.currentSessionId;
      return {
        sessions: nextAll,
        privateSessions: nextPrivate,
        sharedSessions:  nextShared,
        currentSessionId: nextCurrent,
        messages: isDeletingCurrent ? [] : state.messages,
      };
    });

    try {
      await apiClient.delete(`/workspaces/${workspaceId}/chats/${sessionId}`);
      const { currentSessionId } = get();
      if (currentSessionId) {
        await get().fetchSessionMessages(workspaceId, currentSessionId);
      }
    } catch (err) {
      set({ error: 'Failed to delete chat session' });
      console.error('deleteSession error:', err);
      // Restore from server
      await get().fetchPrivateSessions(workspaceId);
      await get().fetchSharedSessions(workspaceId);
    }
  },

  // ─── Share / Unshare ────────────────────────────────────────────────────
  shareSession: async (workspaceId, sessionId) => {
    try {
      const { data } = await apiClient.patch<ChatSession>(
        `/workspaces/${workspaceId}/chats/${sessionId}/share`,
      );
      // Move from privateSessions → sharedSessions in the store
      set((state) => ({
        privateSessions: state.privateSessions.filter((s) => s.id !== sessionId),
        sharedSessions: [data, ...state.sharedSessions.filter((s) => s.id !== sessionId)],
        sessions: state.sessions.map((s) => (s.id === sessionId ? data : s)),
      }));
    } catch (err) {
      set({ error: 'Failed to share session' });
      console.error('shareSession error:', err);
      throw err;
    }
  },

  unshareSession: async (workspaceId, sessionId) => {
    try {
      const { data } = await apiClient.patch<ChatSession>(
        `/workspaces/${workspaceId}/chats/${sessionId}/unshare`,
      );
      // Move from sharedSessions → privateSessions
      set((state) => ({
        sharedSessions:  state.sharedSessions.filter((s) => s.id !== sessionId),
        privateSessions: [data, ...state.privateSessions.filter((s) => s.id !== sessionId)],
        sessions: state.sessions.map((s) => (s.id === sessionId ? data : s)),
      }));
    } catch (err) {
      set({ error: 'Failed to unshare session' });
      console.error('unshareSession error:', err);
      throw err;
    }
  },

  sendMessage: async (workspaceId, sessionId, content) => {
    if (get().isStreaming) return;

    const tempUserMsgId = `temp_user_${Date.now()}`;
    const optimisticUserMsg: ChatMessage = {
      id: tempUserMsgId,
      sessionId,
      role: 'USER',
      content,
      tokenCount: null,
      provider: null,
      retrievedFrom: [],
      senderId: null,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticUserMsg],
      isStreaming: true,
      streamingText: '',
      error: null,
    }));

    try {
      const token = localStorage.getItem('accessToken');
      const streamUrl = `${API_BASE_URL}/workspaces/${workspaceId}/chats/${sessionId}/stream?content=${encodeURIComponent(content)}`;

      const response = await fetch(streamUrl, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader is not available');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.done) {
              set({ isStreaming: false, streamingText: '' });
              await get().fetchSessionMessages(workspaceId, sessionId);
              // Refresh private list so updatedAt bubbles up
              await get().fetchPrivateSessions(workspaceId);
              return;
            } else if (data.text) {
              if (data.text.startsWith('[ERROR]:')) {
                set({
                  isStreaming: false,
                  streamingText: '',
                  error: data.text.slice(8).trim(),
                });
                return;
              }
              set((state) => ({
                streamingText: state.streamingText + data.text,
              }));
            }
          } catch (e) {
            console.error('Failed to parse SSE payload:', e, jsonStr);
          }
        }
      }
    } catch (err) {
      set({
        isStreaming: false,
        streamingText: '',
        error: 'Failed to generate response. Please try again.',
      });
      console.error('sendMessage stream error:', err);
      await get().fetchSessionMessages(workspaceId, sessionId);
    }
  },

  reset: () => {
    set({
      sessions: [],
      privateSessions: [],
      sharedSessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingText: '',
      error: null,
    });
  },
}));
