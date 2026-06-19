import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IEmbeddingProvider } from '../interfaces/embeddings.interface';

@Injectable()
export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(GeminiEmbeddingProvider.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  readonly name = 'gemini';
  readonly dimensions = 768; // text-embedding-004 dimensions

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('✅ GeminiEmbeddingProvider initialized successfully');
    } else {
      this.logger.warn(
        '⚠️  GEMINI_API_KEY is not set. GeminiEmbeddingProvider will not be available.',
      );
    }
  }

  async embed(text: string, options?: { apiKey?: string }): Promise<number[]> {
    const genAI = options?.apiKey ? new GoogleGenerativeAI(options.apiKey) : this.genAI;
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      this.logger.debug(`Generating embedding for text length: ${text.length}`);
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text }] },
        outputDimensionality: 768,
      } as any);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('Failed to retrieve embedding values from Gemini API response');
      }

      return result.embedding.values;
    } catch (err) {
      this.logger.error(`Failed to generate Gemini embedding: ${err}`);
      throw err;
    }
  }

  async embedBatch(texts: string[], options?: { apiKey?: string }): Promise<number[][]> {
    const genAI = options?.apiKey ? new GoogleGenerativeAI(options.apiKey) : this.genAI;
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    if (texts.length === 0) return [];

    try {
      this.logger.debug(`Generating batch embeddings for ${texts.length} texts`);
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      
      const result = await model.batchEmbedContents({
        requests: texts.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          model: 'models/gemini-embedding-001',
          outputDimensionality: 768,
        }) as any),
      });

      if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error('Failed to retrieve batch embeddings from Gemini API response');
      }

      return result.embeddings.map((e) => e.values);
    } catch (err) {
      this.logger.error(`Failed to generate Gemini batch embeddings: ${err}`);
      throw err;
    }
  }
}
