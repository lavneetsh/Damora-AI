import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/services/ai.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Logs an analytics event and classifies topic tag asynchronously.
   */
  async logEvent(params: {
    workspaceId: string;
    userId: string;
    type: 'CHAT' | 'SEARCH' | 'UPLOAD' | 'DELETE';
    queryText?: string;
    matchScore?: number;
    isSuccess?: boolean;
  }) {
    const { workspaceId, userId, type, queryText, matchScore, isSuccess } = params;

    let topicTag: string | undefined = undefined;

    // Classify topic tag for all searches/chats using AI
    if (queryText && (type === 'CHAT' || type === 'SEARCH')) {
      try {
        // 1. Try to find a previous classification cache for this exact query
        const cachedEvent = await this.prisma.analyticsEvent.findFirst({
          where: {
            queryText: { equals: queryText.trim() },
            topicTag: { not: null },
          },
          select: { topicTag: true },
        });

        if (cachedEvent?.topicTag) {
          topicTag = cachedEvent.topicTag;
        } else {
          // 2. No cache found, run LLM classification
          topicTag = await this.classifyQueryTopic(queryText, workspaceId);
        }
      } catch (err) {
        this.logger.warn(`Failed to classify query topic: ${err}`);
        topicTag = 'Other';
      }
    }

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          workspaceId,
          userId,
          type,
          queryText,
          topicTag,
          matchScore,
          isSuccess: isSuccess ?? true,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to log analytics event: ${err}`);
    }
  }

  /**
   * Logs a batch of document reference events inside a single transaction.
   */
  async logDocumentReferences(params: {
    workspaceId: string;
    userId: string;
    sessionId?: string;
    references: { documentId: string; documentName: string }[];
  }) {
    const { workspaceId, userId, sessionId, references } = params;
    if (!references || references.length === 0) return;

    try {
      await this.prisma.analyticsEvent.createMany({
        data: references.map((ref) => ({
          workspaceId,
          userId,
          sessionId,
          type: 'DOCUMENT_REFERENCE',
          documentId: ref.documentId,
          documentName: ref.documentName,
        })),
      });
    } catch (err) {
      this.logger.error(`Failed to log document references: ${err}`);
    }
  }

  /**
   * Fetches statistics and aggregated tables for the Workspace Admin Dashboard.
   */
  async getWorkspaceStats(workspaceId: string) {
    // 1. Core KPIs
    const [totalDocs, uniqueUsers] = await Promise.all([
      this.prisma.document.count({ where: { workspaceId } }),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { workspaceId },
      }),
    ]);

    const totalQuestions = await this.prisma.analyticsEvent.count({
      where: { workspaceId, type: { in: ['CHAT', 'SEARCH'] } },
    });

    const failedQueriesCount = await this.prisma.analyticsEvent.count({
      where: { workspaceId, isSuccess: false },
    });

    // 2. Most Searched Topics (Successful or all search queries aggregated by topicTag)
    const topSearches = await this.prisma.analyticsEvent.groupBy({
      by: ['topicTag'],
      where: {
        workspaceId,
        type: { in: ['CHAT', 'SEARCH'] },
        topicTag: { not: null },
      },
      _count: { topicTag: true },
      orderBy: { _count: { topicTag: 'desc' } },
      take: 10,
    });

    const popularQueries = topSearches.map((item) => ({
      query: item.topicTag ?? 'Other',
      count: item._count.topicTag,
    }));

    // 3. Failed Search Analytics (Missing Knowledge grouped by AI topic tags)
    const rawMissing = await this.prisma.analyticsEvent.findMany({
      where: { workspaceId, isSuccess: false },
      select: { topicTag: true, queryText: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // Cluster by topicTag in memory
    const missingKnowledgeMap = new Map<
      string,
      { topic: string; count: number; examples: string[]; lastAsked: Date }
    >();

    for (const item of rawMissing) {
      const topic = item.topicTag || item.queryText || 'General Queries';
      const normalizedTopic = topic.trim().replace(/[".]/g, '');
      const existing = missingKnowledgeMap.get(normalizedTopic);

      if (existing) {
        existing.count += 1;
        if (item.queryText && !existing.examples.includes(item.queryText)) {
          existing.examples.push(item.queryText);
        }
        if (item.createdAt > existing.lastAsked) {
          existing.lastAsked = item.createdAt;
        }
      } else {
        missingKnowledgeMap.set(normalizedTopic, {
          topic: normalizedTopic,
          count: 1,
          examples: item.queryText ? [item.queryText] : [],
          lastAsked: item.createdAt,
        });
      }
    }

    const missingKnowledge = Array.from(missingKnowledgeMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. Most Referenced Documents
    const topDocuments = await this.prisma.analyticsEvent.groupBy({
      by: ['documentId', 'documentName'],
      where: {
        workspaceId,
        type: 'DOCUMENT_REFERENCE',
        documentId: { not: null },
      },
      _count: { documentId: true },
      _max: { createdAt: true },
      orderBy: { _count: { documentId: 'desc' } },
      take: 10,
    });

    const referencedDocuments = topDocuments.map((item) => ({
      documentId: item.documentId!,
      documentName: item.documentName ?? 'Unknown Document',
      count: item._count.documentId,
      lastReferencedAt: item._max.createdAt,
    }));

    return {
      kpis: {
        totalDocuments: totalDocs,
        totalQuestions,
        activeUsers: uniqueUsers.length,
        failedQueries: failedQueriesCount,
      },
      popularQueries,
      missingKnowledge,
      referencedDocuments,
    };
  }

  /**
   * Helper utilizing Gemini/LLM to categorize query text.
   */
  private async classifyQueryTopic(queryText: string, workspaceId: string): Promise<string> {
    const prompt = `You are an AI data analyst categorizing failed search queries inside a company's internal search tool.
Analyze this user query and categorize it under a high-level, human-readable, unified topic name (e.g., "Dental Insurance", "Maternity Leave", "Travel Expense Policy", "VPN Configuration").

CRITICAL RULES:
- Output ONLY the topic name.
- Do NOT add any extra explanation, markdown formatting, quotes, or text.
- Be concise (1 to 3 words maximum).
- Group similar phrasings into identical topic tags.

User Query: "${queryText}"
Core Topic Tag:`;

    try {
      const response = await this.aiService.chat([
        { role: 'user', content: prompt },
      ], { workspaceId });

      let text = response.content.trim();

      // Safety check: if classification failed or returned empty, clean up
      if (!text || text.length > 50 || text.includes('\n')) {
        text = 'Other';
      }

      return text;
    } catch {
      // Return a basic fallback if LLM errors or is unavailable
      return 'Other';
    }
  }
}
