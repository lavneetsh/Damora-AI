// ─── Chat Types ──────────────────────────────────────────────────────────────

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface ChatMessageDto {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  provider?: string;
  retrievedFrom: string[];
  createdAt: string;
}

export interface ChatSessionDto {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessageDto[];
}

export interface CreateChatSessionDto {
  workspaceId: string;
  title?: string;
}

export interface SendMessageDto {
  content: string;
  sessionId: string;
}
