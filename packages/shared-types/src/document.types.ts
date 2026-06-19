// ─── Document Types ──────────────────────────────────────────────────────────

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface DocumentDto {
  id: string;
  workspaceId: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  pageCount?: number;
  chunkCount: number;
  errorMessage?: string | null;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunkDto {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
}
