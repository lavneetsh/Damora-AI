// ─── Embeddings Interface ─────────────────────────────────────────────────────

export interface EmbeddingOptions {
  apiKey?: string;
}

export interface IEmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(text: string, options?: EmbeddingOptions): Promise<number[]>;
  embedBatch(texts: string[], options?: EmbeddingOptions): Promise<number[][]>;
}
