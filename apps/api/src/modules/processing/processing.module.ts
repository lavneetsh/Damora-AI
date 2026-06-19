import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiModule } from '../ai/ai.module';
import { TextExtractorService } from './text-extractor.service';
import { ProcessingService, DOCUMENT_PROCESSING_QUEUE } from './processing.service';
import { DocumentProcessorConsumer } from './document-processor.consumer';

@Module({
  imports: [
    // Register the Bull queue with Redis connection from env
    BullModule.registerQueueAsync({
      name: DOCUMENT_PROCESSING_QUEUE,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      }),
      inject: [ConfigService],
    }),
    // AiModule exports EmbeddingsService which the consumer needs
    AiModule,
  ],
  providers: [
    TextExtractorService,
    ProcessingService,
    DocumentProcessorConsumer,
  ],
  exports: [ProcessingService],
})
export class ProcessingModule {}
