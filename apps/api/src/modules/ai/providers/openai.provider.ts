import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import {
  ILlmProvider,
  ChatMessage,
  LlmResponse,
  LlmOptions,
} from '../interfaces/llm.interface';

@Injectable()
export class OpenaiProvider implements ILlmProvider {
  private readonly logger = new Logger(OpenaiProvider.name);
  private readonly client: OpenAI | null = null;
  readonly name = 'openai';
  readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.model = this.config.get<string>('OPENAI_CHAT_MODEL') || 'gpt-4o-mini';
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log(`✅ OpenaiProvider initialized successfully (model: ${this.model})`);
    } else {
      this.logger.warn(
        '⚠️  OPENAI_API_KEY is not set. OpenaiProvider will not be available.',
      );
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(messages: ChatMessage[], options?: LlmOptions): Promise<LlmResponse> {
    const client = options?.apiKey ? new OpenAI({ apiKey: options.apiKey }) : this.client;
    if (!client) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      this.logger.debug(`chat() — processing ${messages.length} messages`);
      const formattedMessages = this.formatMessages(messages, options?.systemPrompt);

      const response = await client.chat.completions.create({
        model: this.model,
        messages: formattedMessages as any,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      return {
        content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        provider: this.name,
        model: this.model,
      };
    } catch (err) {
      this.logger.error(`Failed OpenAI chat generation: ${err}`);
      throw err;
    }
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): AsyncIterable<string> {
    const client = options?.apiKey ? new OpenAI({ apiKey: options.apiKey }) : this.client;
    if (!client) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      this.logger.debug(`chatStream() — starting stream for ${messages.length} messages`);
      const formattedMessages = this.formatMessages(messages, options?.systemPrompt);

      const stream = await client.chat.completions.create({
        model: this.model,
        messages: formattedMessages as any,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (err) {
      this.logger.error(`Failed OpenAI chat stream generation: ${err}`);
      throw err;
    }
  }

  private formatMessages(messages: ChatMessage[], systemPrompt?: string) {
    const list: any[] = [];
    if (systemPrompt) {
      list.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      list.push({
        role: msg.role,
        content: msg.content,
      });
    }
    return list;
  }
}
