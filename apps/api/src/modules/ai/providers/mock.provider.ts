import { Injectable, Logger } from '@nestjs/common';
import {
  ILlmProvider,
  ChatMessage,
  LlmResponse,
  LlmOptions,
} from '../interfaces/llm.interface';

/**
 * MockProvider — returns static, deterministic responses.
 * No API calls. Use this for local dev (AI_PROVIDER=mock).
 */
@Injectable()
export class MockProvider implements ILlmProvider {
  private readonly logger = new Logger(MockProvider.name);
  readonly name = 'mock';
  readonly model = 'mock-v1';

  chat(messages: ChatMessage[], _options?: LlmOptions): Promise<LlmResponse> {
    const lastMessage = messages[messages.length - 1];
    this.logger.debug(`[MOCK] chat() — "${lastMessage?.content?.slice(0, 50)}..."`);

    const response: LlmResponse = {
      content: this.generateMockResponse(lastMessage?.content ?? ''),
      usage: { promptTokens: 42, completionTokens: 128, totalTokens: 170 },
      provider: this.name,
      model: this.model,
    };

    return Promise.resolve(response);
  }

  async *chatStream(
    messages: ChatMessage[],
    _options?: LlmOptions,
  ): AsyncIterable<string> {
    const fullResponse = this.generateMockResponse(
      messages[messages.length - 1]?.content ?? '',
    );
    const words = fullResponse.split(' ');

    for (const word of words) {
      yield word + ' ';
      // Simulate streaming delay
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  isAvailable(): boolean {
    return true; // Always available — no API keys needed
  }

  private generateMockResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi')) {
      return 'Hello! I\'m Damora AI (running in mock mode). I\'m here to help you explore your knowledge base. Try asking me something about your uploaded documents!';
    }

    if (lower.includes('what') && lower.includes('you')) {
      return 'I\'m Damora AI — a private AI workspace for companies. I can answer questions grounded in your documents, find relevant information through semantic search, and help your team work smarter. (Currently running in mock mode — connect a real AI provider in .env to enable full capabilities.)';
    }

    if (lower.includes('document') || lower.includes('file')) {
      return 'To use documents with Damora AI, upload them through the Documents section. I\'ll process them, extract text, create embeddings, and store them in the vector database. Then you can ask me questions and I\'ll ground my answers in your actual content. (Mock mode — no real processing is happening yet.)';
    }

    return `[MOCK RESPONSE] You asked: "${userMessage}"\n\nThis is a deterministic mock response from Damora AI. In production, this will be powered by Gemini (or your configured AI provider) with responses grounded in your uploaded documents via RAG. Set AI_PROVIDER=gemini in your .env file and add your GEMINI_API_KEY to enable real AI responses.`;
  }
}
