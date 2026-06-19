import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ILlmProvider,
  ChatMessage,
  LlmResponse,
  LlmOptions,
} from '../interfaces/llm.interface';

@Injectable()
export class GeminiProvider implements ILlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  readonly name = 'gemini';
  readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.model = this.config.get<string>('GEMINI_CHAT_MODEL') || 'gemini-3.1-flash-lite';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log(`✅ GeminiProvider initialized successfully (model: ${this.model})`);
    } else {
      this.logger.warn(
        '⚠️  GEMINI_API_KEY is not set. GeminiProvider will not be available.',
      );
    }
  }

  isAvailable(): boolean {
    return this.genAI !== null;
  }

  async chat(messages: ChatMessage[], options?: LlmOptions): Promise<LlmResponse> {
    const genAI = options?.apiKey ? new GoogleGenerativeAI(options.apiKey) : this.genAI;
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      this.logger.debug(`chat() — processing ${messages.length} messages`);
      const { contents, systemInstruction } = this.prepareRequest(messages, options);

      const model = genAI.getGenerativeModel({
        model: this.model,
        ...(systemInstruction ? { systemInstruction } : {}),
      });

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
        },
      });

      const text = result.response.text();
      const usage = result.response.usageMetadata;

      return {
        content: text || '',
        usage: usage
          ? {
              promptTokens: usage.promptTokenCount,
              completionTokens: usage.candidatesTokenCount,
              totalTokens: usage.totalTokenCount,
            }
          : undefined,
        provider: this.name,
        model: this.model,
      };
    } catch (err) {
      this.logger.error(`Failed Gemini chat generation: ${err}`);
      throw err;
    }
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): AsyncIterable<string> {
    const genAI = options?.apiKey ? new GoogleGenerativeAI(options.apiKey) : this.genAI;
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      this.logger.debug(`chatStream() — starting stream for ${messages.length} messages`);
      const { contents, systemInstruction } = this.prepareRequest(messages, options);

      const model = genAI.getGenerativeModel({
        model: this.model,
        ...(systemInstruction ? { systemInstruction } : {}),
      });

      const resultStream = await model.generateContentStream({
        contents,
        generationConfig: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxTokens,
          topP: options?.topP,
        },
      });

      for await (const chunk of resultStream.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (err) {
      this.logger.error(`Failed Gemini chat stream generation: ${err}`);
      throw err;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private prepareRequest(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): { contents: any[]; systemInstruction?: string } {
    let systemInstruction = options?.systemPrompt || '';
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = systemInstruction
          ? `${systemInstruction}\n${msg.content}`
          : msg.content;
      } else {
        // Convert 'assistant' role to Gemini's expected 'model' role
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Safety fallback: if no user message exists or roles are malformed,
    // ensure Gemini receives a valid content list.
    return {
      contents,
      ...(systemInstruction ? { systemInstruction } : {}),
    };
  }
}
