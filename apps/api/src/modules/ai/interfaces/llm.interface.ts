// ─── Core LLM Interfaces ─────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model?: string;
}

export interface LlmOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  topP?: number;
  apiKey?: string;
}

export interface ILlmProvider {
  readonly name: string;
  readonly model: string;
  chat(messages: ChatMessage[], options?: LlmOptions): Promise<LlmResponse>;
  chatStream(
    messages: ChatMessage[],
    options?: LlmOptions,
  ): AsyncIterable<string>;
  isAvailable(): boolean;
}
