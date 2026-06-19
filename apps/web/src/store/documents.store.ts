import { create } from 'zustand';
import apiClient from '@/lib/api-client';

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  pageCount: number | null;
  chunkCount: number;
  errorMessage: string | null;
  uploadedById: string;
  extractionMethod?: string | null;
  uploadedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentsState {
  documents: Document[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  // Actions
  fetchDocuments: (workspaceId: string) => Promise<void>;
  uploadDocument: (workspaceId: string, file: File) => Promise<void>;
  deleteDocument: (workspaceId: string, documentId: string) => Promise<void>;
  startPolling: (workspaceId: string) => void;
  stopPolling: () => void;
  reset: () => void;
}

export const useDocumentsStore = create<DocumentsState>()((set, get) => ({
  documents: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  pollingIntervalId: null,

  fetchDocuments: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<Document[]>(
        `/workspaces/${workspaceId}/documents`,
      );
      set({ documents: data, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: 'Failed to load documents. Please try again.',
      });
      console.error('fetchDocuments error:', err);
    }
  },

  uploadDocument: async (workspaceId: string, file: File) => {
    set({ isUploading: true, uploadProgress: 0, error: null });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post<Document>(
        `/workspaces/${workspaceId}/documents`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100,
              );
              set({ uploadProgress: pct });
            }
          },
        },
      );

      // Immediately add the new document to the list (status = PENDING)
      set((state) => ({
        documents: [data, ...state.documents],
        isUploading: false,
        uploadProgress: 0,
      }));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Upload failed. Please try again.';
      set({ isUploading: false, uploadProgress: 0, error: message });
      throw err;
    }
  },

  deleteDocument: async (workspaceId: string, documentId: string) => {
    // Optimistic removal from UI
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== documentId),
    }));

    try {
      await apiClient.delete(
        `/workspaces/${workspaceId}/documents/${documentId}`,
      );
    } catch (err) {
      // On error, re-fetch to restore accurate state
      await get().fetchDocuments(workspaceId);
      throw err;
    }
  },

  /**
   * Polls for document status updates every 3 seconds.
   * Stops automatically when no documents are in a non-terminal state.
   */
  startPolling: (workspaceId: string) => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) return; // already polling

    const intervalId = setInterval(async () => {
      const { documents } = get();
      const hasNonTerminal = documents.some(
        (d) => d.status === 'PENDING' || d.status === 'PROCESSING',
      );

      if (!hasNonTerminal) {
        // All documents are in terminal state — stop polling
        get().stopPolling();
        return;
      }

      // Silently refresh the list
      try {
        const { data } = await apiClient.get<Document[]>(
          `/workspaces/${workspaceId}/documents`,
        );
        set({ documents: data });
      } catch {
        // Silent fail — polling errors shouldn't disrupt the UI
      }
    }, 3000);

    set({ pollingIntervalId: intervalId });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  reset: () => {
    get().stopPolling();
    set({
      documents: [],
      isLoading: false,
      isUploading: false,
      uploadProgress: 0,
      error: null,
    });
  },
}));
