import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/services/ai.service';
import { EmbeddingsService } from '../ai/services/embeddings.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatMessage as LlmChatMessage } from '../ai/interfaces/llm.interface';
import { AnalyticsService } from '../analytics/analytics.service';

const COLLECTION_PREFIX = 'damora-docs';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly embeddings: EmbeddingsService,
    private readonly vectorStore: VectorStoreService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ─── Session Management ───────────────────────────────────────────────────

  async createSession(workspaceId: string, userId: string, dto: CreateChatDto) {
    await this.assertWorkspaceMember(workspaceId, userId);

    return this.prisma.chatSession.create({
      data: {
        workspaceId,
        userId,
        title: dto.title || 'New Chat',
      },
    });
  }

  /**
   * Legacy: returns only the caller's own sessions (private + shared they created).
   * Kept for backwards compatibility. New UI uses listPrivateSessions / listSharedSessions.
   */
  async listSessions(workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);

    return this.prisma.chatSession.findMany({
      where: { workspaceId, userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Returns caller's own PRIVATE sessions only. */
  async listPrivateSessions(workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);

    return this.prisma.chatSession.findMany({
      where: { workspaceId, userId, visibility: 'PRIVATE' },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Returns ALL sessions shared across the workspace (any member can see). */
  async listSharedSessions(workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);

    return this.prisma.chatSession.findMany({
      where: { workspaceId, visibility: 'SHARED' },
      orderBy: { sharedAt: 'desc' },
      include: {
        sharedBy: { select: { id: true, name: true } },
        user:     { select: { id: true, name: true } },
      },
    });
  }

  async getSession(sessionId: string, workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);

    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, workspaceId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
        user:    { select: { id: true, name: true } },
        sharedBy: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // PRIVATE sessions are only accessible to their owner
    if (session.visibility === 'PRIVATE' && session.userId !== userId) {
      throw new ForbiddenException('This chat session is private');
    }

    return session;
  }

  async deleteSession(sessionId: string, workspaceId: string, userId: string) {
    const member = await this.assertWorkspaceMember(workspaceId, userId);

    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, workspaceId },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Members can only delete their own sessions; Owner/Admin can delete any
    const canDeleteOthers = member.role === 'OWNER' || member.role === 'ADMIN';
    if (session.userId !== userId && !canDeleteOthers) {
      throw new ForbiddenException(
        'You do not have permission to delete this chat session',
      );
    }

    await this.prisma.chatSession.delete({ where: { id: sessionId } });

    return { success: true, message: 'Chat session deleted successfully' };
  }

  // ─── Visibility Management ────────────────────────────────────────────────

  /**
   * Share a session with the entire workspace.
   * Permission matrix:
   *   - Owner / Admin  → can share anyone's chat
   *   - Member          → can only share their own chat
   */
  async shareSession(sessionId: string, workspaceId: string, requesterId: string) {
    const member = await this.assertWorkspaceMember(workspaceId, requesterId);

    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, workspaceId },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    const canShareOthers = member.role === 'OWNER' || member.role === 'ADMIN';
    if (session.userId !== requesterId && !canShareOthers) {
      throw new ForbiddenException(
        'Members can only share their own chat sessions',
      );
    }

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        visibility: 'SHARED',
        sharedAt:   new Date(),
        sharedById: requesterId,
      },
    });
  }

  /**
   * Unshare a session — move it back to PRIVATE.
   * Permission matrix:
   *   - Owner / Admin  → can unshare anyone's chat
   *   - Member          → can only unshare their own chat
   */
  async unshareSession(sessionId: string, workspaceId: string, requesterId: string) {
    const member = await this.assertWorkspaceMember(workspaceId, requesterId);

    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, workspaceId },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    const canUnshareOthers = member.role === 'OWNER' || member.role === 'ADMIN';
    if (session.userId !== requesterId && !canUnshareOthers) {
      throw new ForbiddenException(
        'Members can only unshare their own chat sessions',
      );
    }

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        visibility: 'PRIVATE',
        sharedAt:   null,
        sharedById: null,
      },
    });
  }

  // ─── RAG Orchestration & Streaming ────────────────────────────────────────

  async sendMessageStream(
    workspaceId: string,
    userId: string,
    sessionId: string,
    content: string,
  ): Promise<AsyncIterable<string>> {
    // 1. Verify access
    await this.assertWorkspaceMember(workspaceId, userId);

    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, workspaceId },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    // Only the session owner can send messages (shared sessions are read-only for others)
    if (session.userId !== userId) {
      throw new ForbiddenException(
        'Only the session owner can send messages. Shared sessions are read-only for other members.',
      );
    }

    // 2. Perform Semantic Search on Qdrant
    const collectionName = `${COLLECTION_PREFIX}-${workspaceId}`;
    const collectionExists = await this.vectorStore.collectionExists(collectionName);

    let retrievedChunks: any[] = [];
    let retrievedFrom: string[] = [];
    let uniqueReferencedDocs: { documentId: string; documentName: string }[] = [];
    let bestScore = 0;

    if (collectionExists) {
      try {
        this.logger.debug(`Retrieving context for query: "${content.slice(0, 40)}..."`);
        const queryVector = await this.embeddings.embed(content, { workspaceId });
        const searchResults = await this.vectorStore.search(
          collectionName,
          queryVector,
          5, // Retrieve top 5 matches
        );
        retrievedChunks = searchResults;
        bestScore = searchResults.length > 0 ? searchResults[0].score : 0;

        const sources = searchResults
          .map((r) => r.payload?.documentName as string)
          .filter(Boolean);
        retrievedFrom = [...new Set(sources)];

        const referencedDocs = searchResults
          .map((r) => ({
            documentId:   (r.payload?.documentId as string) ?? '',
            documentName: (r.payload?.documentName as string) ?? '',
          }))
          .filter((ref) => ref.documentId && ref.documentName);

        uniqueReferencedDocs = Array.from(
          new Map(referencedDocs.map((doc) => [doc.documentId, doc])).values(),
        );

        this.logger.log(
          `🔍 Retrieved ${searchResults.length} chunks from ${retrievedFrom.length} files`,
        );
      } catch (err) {
        this.logger.warn(`Embedding/Vector search failed, continuing without context: ${err}`);
      }
    } else {
      this.logger.debug('Qdrant collection does not exist yet (no files uploaded). skipping retrieval.');
    }

    // Log chat analytics event in the background (async)
    this.analytics.logEvent({
      workspaceId,
      userId,
      type: 'CHAT',
      queryText:  content,
      matchScore: bestScore,
      isSuccess:  bestScore >= 0.65,
    }).catch((err) => this.logger.error(`Failed to log chat analytics: ${err}`));

    // Log document references in the background (async)
    if (uniqueReferencedDocs.length > 0) {
      this.analytics.logDocumentReferences({
        workspaceId,
        userId,
        sessionId,
        references: uniqueReferencedDocs,
      }).catch((err) => this.logger.error(`Failed to log chat document references: ${err}`));
    }

    // 3. Save the USER message to the database (with senderId for sender tracking)
    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role:          'USER',
        content,
        retrievedFrom,
        senderId:      userId,   // ★ Sender tracking — critical for shared discussions
      },
    });

    // Update session timestamp
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data:  { updatedAt: new Date() },
    });

    // 4. Fetch previous chat history for LLM conversation context
    const dbMessages = await this.prisma.chatMessage.findMany({
      where:   { sessionId },
      orderBy: { createdAt: 'asc' },
      take:    20,
    });

    const chatHistory: LlmChatMessage[] = dbMessages
      .filter((m) => m.content !== content || m.role !== 'USER')
      .map((m) => ({
        role:    m.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

    // 5. Construct RAG Context Prompt
    let contextBlock = 'No document context available. Answer using your general knowledge.';
    if (retrievedChunks.length > 0) {
      contextBlock = retrievedChunks
        .map((chunk) => {
          const docName = chunk.payload?.documentName || 'Unknown file';
          return `[Source: ${docName}]\n${chunk.payload?.content || ''}`;
        })
        .join('\n\n---\n\n');
    }

    const systemPrompt = `You are Damora AI, an advanced AI corporate assistant.
Your goal is to answer questions grounded in company documents.

CRITICAL INSTRUCTIONS:
- You MUST answer the query using ONLY the provided document context below.
- If the answer cannot be found or inferred from the document context, state: "I'm sorry, but I cannot find that information in the uploaded documents."
- Do NOT make up information or use general knowledge beyond what is in the document context.
- Keep responses professional, clear, and structured (use bullet points if helpful).
- Cite your sources using the exact document names mentioned in the context (e.g. "[Source: DocumentName.pdf]").

---
DOCUMENT CONTEXT:
${contextBlock}
`;

    // 6. Append active user message to LLM payload
    const llmMessages: LlmChatMessage[] = [
      ...chatHistory,
      { role: 'user', content },
    ];

    // 7. Get the streaming LLM generator
    const llmStream = await this.aiService.chatStream(llmMessages, {
      systemPrompt,
      temperature: 0.1,
      workspaceId,
    });

    // 8. Return wrapped async generator to capture completion and save to PostgreSQL
    const self = this;
    return {
      async *[Symbol.asyncIterator]() {
        let fullResponseText = '';
        try {
          for await (const chunk of llmStream) {
            fullResponseText += chunk;
            yield chunk;
          }

          // Once streaming finishes successfully, create ASSISTANT record in DB
          if (fullResponseText.trim().length > 0) {
            await self.prisma.chatMessage.create({
              data: {
                sessionId,
                role:     'ASSISTANT',
                content:  fullResponseText,
                provider: self.aiService.getActiveProviderName(),
                // senderId intentionally null — the sender is the AI, not a user
              },
            });
            self.logger.log(`💾 Saved streamed assistant message for session: ${sessionId}`);
          }
        } catch (err) {
          self.logger.error(`Error inside streaming handler for session ${sessionId}: ${err}`);
          yield `[ERROR]: ${err.message || err}`;
        }
      },
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Asserts the user is a workspace member and returns their membership record
   * (which contains the role, used for permission checks).
   */
  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
    return member;
  }
}
