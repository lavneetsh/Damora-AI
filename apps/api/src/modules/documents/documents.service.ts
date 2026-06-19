import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ProcessingService } from '../processing/processing.service';
import { TextExtractorService } from '../processing/text-extractor.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { EmbeddingsService } from '../ai/services/embeddings.service';
import { AnalyticsService } from '../analytics/analytics.service';

// Maximum file size: 25 MB
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const COLLECTION_PREFIX = 'damora-docs';

export interface SearchResultItem {
  documentId: string;
  documentName: string;
  pageNumber: number;   // 1-indexed, derived from chunkIndex
  chunkIndex: number;
  snippet: string;
  score: number;        // 0–1 cosine similarity score from Qdrant
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly processing: ProcessingService,
    private readonly vectorStore: VectorStoreService,
    private readonly embeddings: EmbeddingsService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ─── Upload Document ──────────────────────────────────────────────────────

  async uploadDocument(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
      );
    }

    // 2. Validate MIME type
    if (!TextExtractorService.isSupportedType(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Supported: PDF, DOCX, TXT, MD`,
      );
    }

    // 3. Verify user is a member of the workspace
    await this.assertWorkspaceMember(workspaceId, userId);

    // 4. Generate storage key
    const ext = this.getExtension(file.originalname, file.mimetype);
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const s3Key = `workspaces/${workspaceId}/docs/${docId}${ext}`;

    // 5. Upload to MinIO
    this.logger.log(`⬆️  Uploading ${file.originalname} to MinIO: ${s3Key}`);
    await this.storage.uploadFile(s3Key, file.buffer, file.mimetype);

    // 6. Create Document record in PostgreSQL (status = PENDING)
    const cleanName = file.originalname.replace(/\.[^.]+$/, ''); // strip extension
    const document = await this.prisma.document.create({
      data: {
        id: docId,
        workspaceId,
        name: cleanName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        s3Key,
        status: 'PENDING',
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 7. Enqueue background processing job (async — returns immediately)
    await this.processing.enqueueDocument({
      documentId: docId,
      workspaceId,
      s3Key,
      mimeType: file.mimetype,
      documentName: cleanName,
    });

    this.logger.log(
      `✅ Document uploaded and queued: ${cleanName} (${docId})`,
    );

    // Log upload analytics event in the background (async)
    this.analytics.logEvent({
      workspaceId,
      userId,
      type: 'UPLOAD',
      queryText: file.originalname,
      isSuccess: true,
    }).catch((err) => this.logger.error(`Failed to log upload analytics: ${err}`));

    return document;
  }

  // ─── List Documents ───────────────────────────────────────────────────────

  async getDocuments(workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);

    const documents = await this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        pageCount: true,
        errorMessage: true,
        uploadedById: true,
        extractionMethod: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { chunks: true } },
        // Join uploader info for the "Uploaded by" display
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return documents.map((doc) => ({
      ...doc,
      chunkCount: doc._count.chunks,
      _count: undefined,
    }));
  }

  // ─── Get Document Download URL ──────────────────────────────────────────────────

  /**
   * Generates a short-lived (1 hour) pre-signed URL for downloading or
   * previewing the original document file from MinIO/S3.
   * Separate from getDocument() so the list view can request URLs on-demand
   * without fetching full document details every time.
   */
  async getDocumentDownloadUrl(
    documentId: string,
    workspaceId: string,
    userId: string,
    download?: boolean,
  ): Promise<{ url: string; originalName: string; mimeType: string }> {
    await this.assertWorkspaceMember(workspaceId, userId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, workspaceId },
      select: { s3Key: true, originalName: true, mimeType: true },
    });

    if (!doc) throw new NotFoundException('Document not found');

    const url = await this.storage.getSignedUrl(
      doc.s3Key,
      3600,
      download ? doc.originalName : undefined,
    );
    return { url, originalName: doc.originalName, mimeType: doc.mimeType };
  }

  // ─── Get Single Document ───────────────────────────────────────────────────────

  async getDocument(documentId: string, workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, workspaceId },
      include: {
        _count: { select: { chunks: true } },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!doc) throw new NotFoundException('Document not found');

    // Generate a temporary signed URL for downloading the original file
    const signedUrl = await this.storage.getSignedUrl(doc.s3Key, 3600);

    return {
      ...doc,
      chunkCount: doc._count?.chunks ?? 0,
      signedUrl,
      _count: undefined,
    };
  }

  // ─── Delete Document ──────────────────────────────────────────────────────

  async deleteDocument(
    documentId: string,
    workspaceId: string,
    userId: string,
  ) {
    await this.assertWorkspaceMember(workspaceId, userId);

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, workspaceId },
      include: { chunks: { select: { qdrantId: true } } },
    });

    if (!doc) throw new NotFoundException('Document not found');

    // 1. Delete chunk vectors from Qdrant
    const collectionName = `${COLLECTION_PREFIX}-${workspaceId}`;
    const collectionExists = await this.vectorStore.collectionExists(collectionName);

    if (collectionExists && doc.chunks.length > 0) {
      const qdrantIds = doc.chunks.map((c) => c.qdrantId);
      await this.vectorStore.deletePoints(collectionName, qdrantIds);
      this.logger.debug(`Deleted ${qdrantIds.length} Qdrant points for doc ${documentId}`);
    }

    // 2. Delete chunks + document from PostgreSQL (cascade handles chunks)
    await this.prisma.document.delete({ where: { id: documentId } });

    // 3. Delete file from MinIO
    try {
      await this.storage.deleteFile(doc.s3Key);
    } catch (err) {
      // Log but don't fail if MinIO deletion has issues — DB is source of truth
      this.logger.warn(`MinIO deletion failed for ${doc.s3Key}: ${err}`);
    }

    this.logger.log(`🗑️  Deleted document: ${doc.name} (${documentId})`);

    // Log delete analytics event in the background (async)
    this.analytics.logEvent({
      workspaceId,
      userId,
      type: 'DELETE',
      queryText: doc.name,
      isSuccess: true,
    }).catch((err) => this.logger.error(`Failed to log delete analytics: ${err}`));

    return { success: true, message: 'Document deleted successfully' };
  }

  // ─── Semantic Search ─────────────────────────────────────────────────────

  async searchDocuments(
    workspaceId: string,
    userId: string,
    queryText: string,
    topK = 10,
  ): Promise<SearchResultItem[]> {
    await this.assertWorkspaceMember(workspaceId, userId);

    if (!queryText || queryText.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    const collectionName = `${COLLECTION_PREFIX}-${workspaceId}`;
    const collectionExists = await this.vectorStore.collectionExists(collectionName);

    if (!collectionExists) {
      this.logger.debug('No Qdrant collection exists yet for workspace — returning empty results');
      return [];
    }

    this.logger.debug(`Semantic search: "${queryText.slice(0, 60)}" in ${collectionName}`);

    // Embed the user query
    const queryVector = await this.embeddings.embed(queryText, { workspaceId });

    // Retrieve top K most similar chunks from Qdrant
    const rawResults = await this.vectorStore.search(collectionName, queryVector, topK);
    const bestScore = rawResults.length > 0 ? rawResults[0].score : 0;

    // Log search analytics event in the background (async)
    this.analytics.logEvent({
      workspaceId,
      userId,
      type: 'SEARCH',
      queryText,
      matchScore: bestScore,
      isSuccess: bestScore >= 0.65,
    }).catch((err) => this.logger.error(`Failed to log search analytics: ${err}`));

    // Collect unique document references for usage analytics
    const referencedDocs = rawResults
      .map((r) => ({
        documentId: (r.payload?.documentId as string) ?? '',
        documentName: (r.payload?.documentName as string) ?? '',
      }))
      .filter((ref) => ref.documentId && ref.documentName);

    const uniqueReferencedDocs = Array.from(
      new Map(referencedDocs.map((doc) => [doc.documentId, doc])).values()
    );

    if (uniqueReferencedDocs.length > 0) {
      this.analytics.logDocumentReferences({
        workspaceId,
        userId,
        references: uniqueReferencedDocs,
      }).catch((err) => this.logger.error(`Failed to log search document references: ${err}`));
    }

    // Map Qdrant results to structured search result items
    const results: SearchResultItem[] = rawResults.map((r) => {
      const chunkIndex = (r.payload?.chunkIndex as number) ?? 0;
      // Use actual stored pageNumber from Qdrant payload (set during ingestion).
      // Fall back to chunkIndex+1 for legacy points indexed before this feature.
      const pageNumber =
        typeof r.payload?.pageNumber === 'number'
          ? (r.payload.pageNumber as number)
          : chunkIndex + 1;
      return {
        documentId: (r.payload?.documentId as string) ?? '',
        documentName: (r.payload?.documentName as string) ?? 'Unknown Document',
        pageNumber,
        chunkIndex,
        snippet: (r.payload?.content as string) ?? '',
        // Clamp score to 0–1 and round to 4 decimal places
        score: Math.min(1, Math.max(0, Math.round(r.score * 10000) / 10000)),
      };
    });

    this.logger.log(
      `🔍 Search "${queryText.slice(0, 40)}..." returned ${results.length} results`,
    );

    return results;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertWorkspaceMember(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
  }

  private getExtension(filename: string, mimeType: string): string {
    // Try from filename first
    const extMatch = filename.match(/\.[^.]+$/);
    if (extMatch) return extMatch[0].toLowerCase();

    // Fallback from MIME type
    const mimeExtMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/msword': '.doc',
      'text/plain': '.txt',
      'text/markdown': '.md',
      'text/x-markdown': '.md',
    };
    return mimeExtMap[mimeType] ?? '.bin';
  }
}
