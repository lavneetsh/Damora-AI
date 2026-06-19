import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { EncryptionService } from './encryption.service';
import {
  ILlmProvider,
  ChatMessage,
  LlmResponse,
  LlmOptions,
} from '../interfaces/llm.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    @Inject('LLM_PROVIDERS')
    private readonly providers: Map<string, ILlmProvider>,
  ) {}

  /**
   * Resolves the active provider.
   * Priority: workspace BYOK key > env config > mock fallback
   */
  getProvider(workspaceOverride?: string, hasApiKeyOverride?: boolean): ILlmProvider {
    const providerName =
      workspaceOverride ?? this.config.get<string>('AI_PROVIDER', 'mock');
    const provider = this.providers.get(providerName);

    if (!provider) {
      this.logger.warn(
        `Provider "${providerName}" not found — falling back to mock`,
      );
      return this.providers.get('mock')!;
    }

    if (!hasApiKeyOverride && !provider.isAvailable()) {
      this.logger.warn(
        `Provider "${providerName}" is not available — falling back to mock`,
      );
      return this.providers.get('mock')!;
    }

    return provider;
  }

  /**
   * Single-shot chat completion.
   * Business modules call THIS, never individual provider SDKs.
   */
  async chat(
    messages: ChatMessage[],
    options?: LlmOptions & { workspaceId?: string; workspaceProvider?: string },
  ): Promise<LlmResponse> {
    const resolvedOptions = await this.resolveWorkspaceSettings(options);
    const provider = this.getProvider(resolvedOptions.workspaceProvider, !!resolvedOptions.apiKey);
    this.logger.debug(`chat() via provider: ${provider.name}`);
    return provider.chat(messages, resolvedOptions);
  }

  /**
   * Streaming chat — returns an AsyncIterable of token strings.
   */
  async chatStream(
    messages: ChatMessage[],
    options?: LlmOptions & { workspaceId?: string; workspaceProvider?: string },
  ): Promise<AsyncIterable<string>> {
    const resolvedOptions = await this.resolveWorkspaceSettings(options);
    const provider = this.getProvider(resolvedOptions.workspaceProvider, !!resolvedOptions.apiKey);
    this.logger.debug(`chatStream() via provider: ${provider.name}`);
    return provider.chatStream(messages, resolvedOptions);
  }

  getActiveProviderName(): string {
    return this.config.get<string>('AI_PROVIDER', 'mock');
  }

  /**
   * Helper to load workspace-level provider configurations and decrypt credentials.
   */
  private async resolveWorkspaceSettings(
    options?: LlmOptions & { workspaceId?: string; workspaceProvider?: string },
  ): Promise<LlmOptions & { workspaceProvider?: string }> {
    const { workspaceId, ...rest } = options || {};

    if (!workspaceId) {
      return rest;
    }

    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { aiProvider: true, aiApiKey: true },
      });

      if (!workspace || !workspace.aiProvider) {
        return rest;
      }

      if (!workspace.aiApiKey) {
        throw new Error(
          `Workspace AI provider is set to "${workspace.aiProvider}" but no API key is configured.`,
        );
      }

      // Decrypt the API key
      let decryptedKey: string | undefined = undefined;
      try {
        decryptedKey = this.encryptionService.decrypt(workspace.aiApiKey);
      } catch (decryptErr) {
        this.logger.error(
          `Failed to decrypt BYOK key for workspace ${workspaceId}: ${decryptErr}`,
        );
        throw new Error(
          'Invalid workspace AI credentials (failed to decrypt API key). Please re-configure your key in settings.',
        );
      }

      return {
        ...rest,
        workspaceProvider: workspace.aiProvider,
        apiKey: decryptedKey,
      };
    } catch (err) {
      this.logger.error(
        `Error resolving workspace settings for ${workspaceId}: ${err.message}`,
      );
      throw err;
    }
  }
}
