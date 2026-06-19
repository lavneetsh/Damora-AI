import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { v5 as uuidv5 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmbeddingsService } from '../ai/services/embeddings.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { TextExtractorService } from './text-extractor.service';
import { DOCUMENT_PROCESSING_QUEUE, DocumentProcessingJob } from './processing.service';

// Qdrant collection prefix — one collection per workspace
const COLLECTION_PREFIX = 'damora-docs';

@Processor(DOCUMENT_PROCESSING_QUEUE)
export class DocumentProcessorConsumer {
  private readonly logger = new Logger(DocumentProcessorConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly textExtractor: TextExtractorService,
    private readonly embeddings: EmbeddingsService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  // ─── Main Job Handler ─────────────────────────────────────────────────────

  @Process()
  async handleDocumentProcessing(
    job: Job<DocumentProcessingJob>,
  ): Promise<void> {
    const { documentId, workspaceId, s3Key, mimeType, documentName } = job.data;
    const collectionName = `${COLLECTION_PREFIX}-${workspaceId}`;

    this.logger.log(
      `🔄 Processing document: ${documentName} (${documentId})`,
    );

    try {
      // ── Step 1: Mark as PROCESSING ────────────────────────────────────────
      await this.updateStatus(documentId, 'PROCESSING');
      await job.progress(10);

      // ── Step 2: Download file from MinIO ──────────────────────────────────
      this.logger.debug(`⬇️  Downloading from MinIO: ${s3Key}`);
      const fileBuffer = await this.storage.downloadFile(s3Key);
      await job.progress(20);

      // ── Step 3: Extract text (page-by-page for PDF, single-page for DOCX/TXT) ──────
      this.logger.debug(`📄 Extracting text (mimeType: ${mimeType})`);
      let { fullText, pageTexts } = await this.textExtractor.extractWithPages(fileBuffer, mimeType);
      let extractionMethod = 'TEXT_EXTRACTION';

      // If PDF yields low characters (scanned / image PDF), trigger OCR fallback.
      // Use 300 characters as the threshold as requested by the user.
      const MIN_TEXT_THRESHOLD = 300;
      if (mimeType === 'application/pdf' && (!fullText || fullText.trim().length < MIN_TEXT_THRESHOLD)) {
        this.logger.log(
          `⚠️ PDF yielded low characters (${fullText?.trim().length ?? 0}). Triggering OCR fallback...`
        );
        const ocrResult = await this.textExtractor.extractOcrWithPages(fileBuffer);
        fullText = ocrResult.fullText;
        pageTexts = ocrResult.pageTexts;
        extractionMethod = 'OCR';
      }

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text could be extracted from document (even with OCR)');
      }
      this.logger.debug(`📝 Extracted ${fullText.length} characters from ${pageTexts.length} page(s) via ${extractionMethod}`);
      await job.progress(35);

      // ── Step 4: Chunk the text per page (200 words, 30-word overlap for precise semantics) ──
      const chunks = this.textExtractor.chunkWithPages(pageTexts, 200, 30);
      this.logger.log(
        `✂️  Split into ${chunks.length} chunks across ${pageTexts.length} pages (doc: ${documentName})`,
      );
      await job.progress(45);

      if (chunks.length === 0) {
        throw new Error('Document produced zero chunks after splitting');
      }

      // ── Step 5: Ensure Qdrant collection exists ────────────────────────────
      const vectorDimensions = this.embeddings.getDimensions();
      await this.vectorStore.ensureCollection(collectionName, vectorDimensions);
      await job.progress(50);

      // ── Step 6 & 7: Embed each chunk + upsert into Qdrant ─────────────────
      // Process in batches of 100 (Gemini API max batch size) to minimize API requests and avoid rate limits
      const BATCH_SIZE = 100;
      const allChunkRecords: {
        documentId: string;
        chunkIndex: number;
        content: string;
        tokenCount: number;
        pageNumber: number;
        qdrantId: string;
      }[] = [];

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchTexts = batch.map((c) => c.content);

        // Embed all chunks in this batch at once
        const batchVectors = await this.embeddings.embedBatch(batchTexts, { workspaceId });

        // Build Qdrant points
        const points = batch.map((chunk, batchIdx) => {
          const NAMESPACE_UUID = '1b671a64-40d5-491e-99b0-da01ff1f3341';
          const qdrantId = uuidv5(`${documentId}-${chunk.index}`, NAMESPACE_UUID);

          allChunkRecords.push({
            documentId,
            chunkIndex: chunk.index,
            content: chunk.content,
            tokenCount: chunk.tokenCount,
            pageNumber: chunk.pageNumber,
            qdrantId,
          });

          return {
            id: qdrantId,
            vector: batchVectors[batchIdx],
            payload: {
              documentId,
              documentName,
              workspaceId,
              chunkIndex: chunk.index,
              pageNumber: chunk.pageNumber,
              content: chunk.content,
              tokenCount: chunk.tokenCount,
            },
          };
        });

        await this.vectorStore.upsertPoints(collectionName, points);

        // Update progress (50% to 85% over all chunks)
        const progressPct = 50 + Math.round(((i + batch.length) / chunks.length) * 35);
        await job.progress(progressPct);
      }

      this.logger.log(
        `🧠 Embedded and indexed ${chunks.length} chunks into Qdrant (${collectionName})`,
      );

      // ── Step 8: Save DocumentChunk records to PostgreSQL (with pageNumber) ──────
      await this.prisma.documentChunk.createMany({
        data: allChunkRecords.map((r) => ({
          documentId: r.documentId,
          chunkIndex: r.chunkIndex,
          content: r.content,
          tokenCount: r.tokenCount,
          pageNumber: r.pageNumber,
          qdrantId: r.qdrantId,
        })),
        skipDuplicates: true,
      });
      await job.progress(95);

      // ── Step 9: Mark document as READY ────────────────────────────────────
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'READY',
          pageCount: chunks.length, // store chunk count as proxy for "pages"
          extractionMethod,
        },
      });
      await job.progress(100);

      this.logger.log(
        `✅ Document READY: ${documentName} — ${chunks.length} chunks across ${pageTexts.length} pages, ${fullText.length} chars`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to process document ${documentId}: ${error}`,
      );

      // Mark as FAILED with error message so UI can show it
      await this.updateStatus(documentId, 'FAILED', String(error));
      throw error; // Re-throw so Bull can handle retry logic
    }
  }

  // ─── Queue Lifecycle Hooks ────────────────────────────────────────────────

  @OnQueueCompleted()
  onCompleted(job: Job<DocumentProcessingJob>) {
    this.logger.log(
      `✅ Job ${job.id} completed for document: ${job.data.documentName}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<DocumentProcessingJob>, error: Error) {
    this.logger.error(
      `❌ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}): ${error.message}`,
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async updateStatus(
    documentId: string,
    status: 'PROCESSING' | 'READY' | 'FAILED',
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status, ...(errorMessage ? { errorMessage } : {}) },
    });
  }
}
