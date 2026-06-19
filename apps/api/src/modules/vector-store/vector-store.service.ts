import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly client: QdrantClient;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('QDRANT_URL', 'http://localhost:6333');
    this.client = new QdrantClient({ url });
  }

  async onModuleInit() {
    try {
      // getCollections() is a lightweight call that confirms connectivity
      await this.client.getCollections();
      this.logger.log(`✅ Qdrant connected`);
    } catch (err) {
      this.logger.warn(
        `⚠️  Qdrant not reachable at startup — ${err}. Will retry on first use.`,
      );
    }
  }

  // ─── Collection Management ────────────────────────────────────────────────

  /**
   * Creates a Qdrant collection if it does not already exist.
   * @param collectionName - e.g. "damora-docs-ws_abc123"
   * @param vectorSize     - Number of dimensions (e.g. 768 for Gemini text-embedding-004)
   */
  async ensureCollection(
    collectionName: string,
    vectorSize: number,
  ): Promise<void> {
    try {
      await this.client.getCollection(collectionName);
      this.logger.debug(`Collection "${collectionName}" already exists`);
    } catch {
      // Collection doesn't exist — create it
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine', // cosine similarity is best for text embeddings
        },
      });
      this.logger.log(`✅ Created Qdrant collection "${collectionName}"`);
    }
  }

  // ─── Upsert Points ────────────────────────────────────────────────────────

  /**
   * Batch-upserts embedding vectors with payload into a collection.
   */
  async upsertPoints(
    collectionName: string,
    points: VectorPoint[],
  ): Promise<void> {
    await this.client.upsert(collectionName, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
    this.logger.debug(
      `Upserted ${points.length} points into "${collectionName}"`,
    );
  }

  // ─── Semantic Search ──────────────────────────────────────────────────────

  /**
   * Finds the topK most similar vectors to the query vector.
   * Used in Phase 3 RAG chat.
   */
  async search(
    collectionName: string,
    queryVector: number[],
    topK = 5,
    filter?: Record<string, unknown>,
  ): Promise<SearchResult[]> {
    const results = await this.client.search(collectionName, {
      vector: queryVector,
      limit: topK,
      with_payload: true,
      filter,
    });

    return results.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: (r.payload as Record<string, unknown>) ?? {},
    }));
  }

  // ─── Delete Points ────────────────────────────────────────────────────────

  /**
   * Removes specific points by ID — used when deleting a document.
   */
  async deletePoints(collectionName: string, ids: string[]): Promise<void> {
    await this.client.delete(collectionName, {
      wait: true,
      points: ids,
    });
    this.logger.debug(
      `Deleted ${ids.length} points from "${collectionName}"`,
    );
  }

  /**
   * Deletes all points matching a filter — e.g. all chunks for a document.
   */
  async deleteByFilter(
    collectionName: string,
    filter: Record<string, unknown>,
  ): Promise<void> {
    await this.client.delete(collectionName, {
      wait: true,
      filter,
    });
  }

  /**
   * Checks whether a collection exists.
   */
  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      await this.client.getCollection(collectionName);
      return true;
    } catch {
      return false;
    }
  }
}
