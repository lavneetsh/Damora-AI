import { Injectable, Logger } from '@nestjs/common';
import { IEmbeddingProvider } from '../interfaces/embeddings.interface';

/**
 * MockEmbeddingProvider — returns deterministic fake embeddings.
 * No API calls. Use this for local dev (EMBEDDING_PROVIDER=mock).
 */
@Injectable()
export class MockEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(MockEmbeddingProvider.name);
  readonly name = 'mock';
  readonly dimensions = 768;

  embed(text: string, _options?: any): Promise<number[]> {
    this.logger.debug(`[MOCK] embed() — "${text.slice(0, 40)}..."`);
    return Promise.resolve(this.deterministicVector(text));
  }

  embedBatch(texts: string[], _options?: any): Promise<number[][]> {
    this.logger.debug(`[MOCK] embedBatch() — ${texts.length} texts`);
    return Promise.resolve(texts.map((t) => this.deterministicVector(t)));
  }

  /**
   * Generates a deterministic unit vector from text.
   * Same text always produces the same vector — good for testing.
   */
  private deterministicVector(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const idx = (text.charCodeAt(i) * (i + 1)) % this.dimensions;
      vector[idx] = (vector[idx] + text.charCodeAt(i) / 255) % 1;
    }
    // Normalize to unit vector
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / magnitude);
  }
}
