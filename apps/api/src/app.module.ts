import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import * as Joi from 'joi';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { AiModule } from './modules/ai/ai.module';
import { StorageModule } from './modules/storage/storage.module';
import { VectorStoreModule } from './modules/vector-store/vector-store.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ProcessingModule } from './modules/processing/processing.module';
import { ChatModule } from './modules/chat/chat.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        API_PORT: Joi.number().default(3001),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
        DATABASE_URL: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
        AI_PROVIDER: Joi.string()
          .valid('mock', 'gemini', 'openai', 'claude')
          .default('mock'),
        EMBEDDING_PROVIDER: Joi.string()
          .valid('mock', 'gemini', 'openai', 'huggingface')
          .default('mock'),
        STORAGE_ENDPOINT: Joi.string().default('http://localhost:9000'),
        STORAGE_ACCESS_KEY: Joi.string().default('damora'),
        STORAGE_SECRET_KEY: Joi.string().default('damora123'),
        STORAGE_BUCKET: Joi.string().default('damora-docs'),
        STORAGE_USE_SSL: Joi.boolean().default(false),
        STORAGE_REGION: Joi.string().default('us-east-1'),
        REDIS_URL: Joi.string().default('redis://localhost:6379'),
        QDRANT_URL: Joi.string().default('http://localhost:6333'),
      }),
    }),

    // ─── Rate Limiting ───────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),

    // ─── Bull Queue (Redis) — Root config for all queues ────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      }),
      inject: [ConfigService],
    }),

    // ─── Core Infrastructure Modules (all @Global) ───────────────────
    DatabaseModule,
    StorageModule,
    VectorStoreModule,

    // ─── Feature Modules ────────────────────────────────────────────
    AuthModule,
    UsersModule,
    WorkspacesModule,
    AiModule,
    ProcessingModule,
    DocumentsModule,
    ChatModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
