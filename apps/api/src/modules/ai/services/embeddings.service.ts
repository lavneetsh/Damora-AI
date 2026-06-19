import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { EncryptionService } from './encryption.service';
import { IEmbeddingProvider } from '../interfaces/embeddings.interface';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    @Inject('EMBEDDING_PROVIDERS')
    private readonly providers: Map<string, IEmbeddingProvider>,
  ) {}

  getProvider(workspaceOverride?: string): IEmbeddingProvider {
    const providerName =
      workspaceOverride ?? this.config.get<string>('EMBEDDING_PROVIDER', 'mock');
    const provider = this.providers.get(providerName);

    if (!provider) {
      this.logger.warn(
        `Embedding provider "${providerName}" not found — falling back to mock`,
      );
      return this.providers.get('mock')!;
    }

    return provider;
  }

  async embed(text: string, options?: { workspaceId?: string }): Promise<number[]> {
    const resolved = await this.resolveWorkspaceSettings(options);
    const provider = this.getProvider(resolved.workspaceProvider);
    return provider.embed(text, resolved);
  }

  async embedBatch(texts: string[], options?: { workspaceId?: string }): Promise<number[][]> {
    const resolved = await this.resolveWorkspaceSettings(options);
    const provider = this.getProvider(resolved.workspaceProvider);
    return provider.embedBatch(texts, resolved);
  }

  getDimensions(): number {
    return this.getProvider().dimensions;
  }

  private async resolveWorkspaceSettings(
    options?: { workspaceId?: string },
  ): Promise<{ workspaceProvider?: string; apiKey?: string }> {
    const { workspaceId } = options || {};
    if (!workspaceId) return {};

    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          embeddingProvider: true,
          embeddingApiKey: true,
          aiProvider: true,
          aiApiKey: true,
        },
      });

      if (!workspace) return {};

      // If embedding key is explicitly set, use it
      if (workspace.embeddingApiKey) {
        const decryptedKey = this.encryptionService.decrypt(workspace.embeddingApiKey);
        return {
          workspaceProvider: workspace.embeddingProvider || 'gemini',
          apiKey: decryptedKey,
        };
      }

      // Fallback: tie embeddings to the same AI provider/key for Gemini
      if (workspace.aiApiKey && workspace.aiProvider === 'gemini') {
        const decryptedKey = this.encryptionService.decrypt(workspace.aiApiKey);
        return {
          workspaceProvider: 'gemini',
          apiKey: decryptedKey,
        };
      }

      return {};
    } catch (err) {
      this.logger.error(`Error resolving workspace embedding settings for ${workspaceId}: ${err.message}`);
      return {};
    }
  }
}
