import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Anthropic } from '@anthropic-ai/sdk';
import {
  ILlmProvider,
  ChatMessage,
  LlmResponse,
  LlmOptions,
} from '../interfaces/llm.interface';

@Injectable()
export class ClaudeProvider implements ILlmProvider {
  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly client: Anthropic | null = null;
  readonly name = 'claude';
  readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.model = this.config.get<string>('ANTHROPIC_CHAT_MODEL') || 'claude-3-5-sonnet-latest';
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log(`✅ ClaudeProvider initialized successfully (model: ${this.model})`);
    } else {
      this.logger.warn(
        '⚠️  ANTHROPIC_API_KEY is not set. ClaudeProvider will not be available.',
      );
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(messages: ChatMessage[], options?: LlmOptions): Promise<LlmResponse> {
    const client = options?.apiKey ? new Anthropic({ apiKey: options.apiKey }) : this.client;
    if (!client) {
      throw new Error('Claude API key is not configured');
    }

    try {
      this.logger.debug(`chat() — processing ${messages.length} messages`);
      const { formattedMessages, system } = this.formatMessages(messages, options?.systemPrompt);

      const response = await client.messages.create({
        model: this.model,
        messages: formattedMessages,
        system,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens || 2048,
        top_p: options?.topP,
      });

      const contentBlock = response.content[0];
      const content = contentBlock && contentBlock.type === 'text' ? contentBlock.text : '';
      const usage = response.usage;

      return {
        content,
        usage: usage
          ? {
              promptTokens: usage.input_tokens,
              completionTokens: usage.output_tokens,
              totalTokens: usage.input_tokens + usage.output_tokens,
            }
          : undefined,
        provider: this.name,
        model: this.model,
      };
    } catch (err) {
      this.logger.error(`Failed Claude chat generation: ${err}`);
      throw err;
    }
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): AsyncIterable<string> {
    const client = options?.apiKey ? new Anthropic({ apiKey: options.apiKey }) : this.client;
    if (!client) {
      throw new Error('Claude API key is not configured');
    }

    try {
      this.logger.debug(`chatStream() — starting stream for ${messages.length} messages`);
      const { formattedMessages, system } = this.formatMessages(messages, options?.systemPrompt);

      const stream = await client.messages.create({
        model: this.model,
        messages: formattedMessages,
        system,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens || 2048,
        top_p: options?.topP,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } catch (err) {
      this.logger.error(`Failed Claude chat stream generation: ${err}`);
      throw err;
    }
  }

  private formatMessages(messages: ChatMessage[], systemPrompt?: string) {
    let system = systemPrompt || '';
    const formattedMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = system ? `${system}\n${msg.content}` : msg.content;
      } else {
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return {
      formattedMessages,
      system: system || undefined,
    };
  }
}
