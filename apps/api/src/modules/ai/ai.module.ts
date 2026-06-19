import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockProvider } from './providers/mock.provider';
import { MockEmbeddingProvider } from './providers/mock-embedding.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GeminiEmbeddingProvider } from './providers/gemini-embedding.provider';
import { OpenaiProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { AiService } from './services/ai.service';
import { EmbeddingsService } from './services/embeddings.service';
import { EncryptionService } from './services/encryption.service';
import { ILlmProvider } from './interfaces/llm.interface';
import { IEmbeddingProvider } from './interfaces/embeddings.interface';

@Module({
  providers: [
    // ─── Individual Providers ──────────────────────────────────────
    MockProvider,
    MockEmbeddingProvider,
    GeminiProvider,
    GeminiEmbeddingProvider,
    OpenaiProvider,
    ClaudeProvider,

    // ─── LLM Provider Map ─────────────────────────────────────────
    {
      provide: 'LLM_PROVIDERS',
      useFactory: (
        mockProvider: MockProvider,
        geminiProvider: GeminiProvider,
        openaiProvider: OpenaiProvider,
        claudeProvider: ClaudeProvider,
      ): Map<string, ILlmProvider> => {
        const map = new Map<string, ILlmProvider>();
        map.set('mock', mockProvider);
        map.set('gemini', geminiProvider);
        map.set('openai', openaiProvider);
        map.set('claude', claudeProvider);
        return map;
      },
      inject: [MockProvider, GeminiProvider, OpenaiProvider, ClaudeProvider],
    },

    // ─── Embedding Provider Map ────────────────────────────────────
    {
      provide: 'EMBEDDING_PROVIDERS',
      useFactory: (
        mockEmbeddingProvider: MockEmbeddingProvider,
        geminiEmbeddingProvider: GeminiEmbeddingProvider,
      ): Map<string, IEmbeddingProvider> => {
        const map = new Map<string, IEmbeddingProvider>();
        map.set('mock', mockEmbeddingProvider);
        map.set('gemini', geminiEmbeddingProvider);
        return map;
      },
      inject: [MockEmbeddingProvider, GeminiEmbeddingProvider],
    },

    // ─── Services ─────────────────────────────────────────────────
    AiService,
    EmbeddingsService,
    EncryptionService,
  ],
  exports: [AiService, EmbeddingsService, EncryptionService],
})
export class AiModule {}
