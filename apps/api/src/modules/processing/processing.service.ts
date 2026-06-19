import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export const DOCUMENT_PROCESSING_QUEUE = 'document-processing';

export interface DocumentProcessingJob {
  documentId: string;
  workspaceId: string;
  s3Key: string;
  mimeType: string;
  documentName: string;
}

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  constructor(
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE)
    private readonly queue: Queue<DocumentProcessingJob>,
  ) {}

  /**
   * Adds a document to the Bull queue for async text extraction and embedding.
   * Returns immediately — the consumer handles processing in the background.
   */
  async enqueueDocument(job: DocumentProcessingJob): Promise<void> {
    await this.queue.add(job, {
      attempts: 3,           // retry up to 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 5000,         // 5s, 10s, 20s between retries
      },
      removeOnComplete: 50,  // keep last 50 completed jobs in Redis for debugging
      removeOnFail: 100,     // keep last 100 failed jobs
    });
    this.logger.log(
      `📥 Enqueued document processing job: ${job.documentId} (${job.documentName})`,
    );
  }

  /**
   * Returns queue metrics for health dashboard (Phase 4).
   */
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}
