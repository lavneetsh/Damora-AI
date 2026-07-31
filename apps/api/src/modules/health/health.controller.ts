import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { StorageService } from '../storage/storage.service';
import { DOCUMENT_PROCESSING_QUEUE } from '../processing/processing.service';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum ms to wait for any single service check before declaring it down. */
const HEALTH_CHECK_TIMEOUT_MS = 3000;

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = 'connected' | 'disconnected';
type OverallStatus = 'ok' | 'degraded' | 'down';

interface ServiceDetail {
  status: ServiceStatus;
  latencyMs: number | null;
  error?: string;
}

interface HealthResponse {
  status: OverallStatus;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  services: {
    database: ServiceDetail;
    redis: ServiceDetail;
    qdrant: ServiceDetail;
    storage: ServiceDetail;
  };
}

interface VersionResponse {
  name: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wraps a promise with a hard timeout.
 * If the promise does not resolve within `timeoutMs`, it rejects with a
 * descriptive error instead of hanging indefinitely.
 *
 * This is critical for health checks: a stalled Qdrant or storage connection
 * should not block the health response for 30+ seconds.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} check timed out after ${timeoutMs}ms`)), timeoutMs),
  );
  return Promise.race([promise, timeout]);
}

/**
 * Runs a check function and returns { status, latencyMs, error }.
 * Never throws — on failure, returns disconnected with null latency and error message.
 */
async function runCheck(
  fn: () => Promise<void>,
  timeoutMs: number,
  label: string,
): Promise<ServiceDetail> {
  const start = Date.now();
  try {
    await withTimeout(fn(), timeoutMs, label);
    return { status: 'connected', latencyMs: Date.now() - start };
  } catch (err: any) {
    const cause = err?.cause?.message || (typeof err?.cause === 'string' ? err.cause : '');
    const mainMsg = err instanceof Error ? err.message : String(err);
    const errorMsg = cause ? `${mainMsg} (${cause})` : mainMsg;
    return { status: 'disconnected', latencyMs: null, error: errorMsg };
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorStore: VectorStoreService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    @InjectQueue(DOCUMENT_PROCESSING_QUEUE)
    private readonly queue: Queue,
  ) {}

  // ─── GET /api/health ────────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Checks all dependent services in parallel with a 3-second timeout per service. ' +
      'Status: "ok" = all connected, "degraded" = database up but optional service down, "down" = database unavailable.',
  })
  async check(): Promise<HealthResponse> {
    // ── All checks run in parallel, each with an independent timeout ──────────
    const [db, redis, qdrant, storage] = await Promise.all([
      runCheck(() => this.checkDatabase(), HEALTH_CHECK_TIMEOUT_MS, 'Database'),
      runCheck(() => this.checkRedis(), HEALTH_CHECK_TIMEOUT_MS, 'Redis'),
      runCheck(() => this.checkQdrant(), HEALTH_CHECK_TIMEOUT_MS, 'Qdrant'),
      runCheck(() => this.checkStorage(), HEALTH_CHECK_TIMEOUT_MS, 'Storage'),
    ]);

    // ── Log any failures to Render's log stream ───────────────────────────────
    if (db.status === 'disconnected') this.logger.warn('Database health check failed or timed out');
    if (redis.status === 'disconnected') this.logger.warn('Redis health check failed or timed out');
    if (qdrant.status === 'disconnected') this.logger.warn('Qdrant health check failed or timed out');
    if (storage.status === 'disconnected') this.logger.warn('Storage health check failed or timed out');

    // ── Determine overall status ──────────────────────────────────────────────
    // "down"     = database is unavailable (app is non-functional)
    // "degraded" = database up but an optional service is unreachable
    // "ok"       = all services reachable
    let overall: OverallStatus = 'ok';
    if (db.status === 'disconnected') {
      overall = 'down';
    } else if (
      redis.status === 'disconnected' ||
      qdrant.status === 'disconnected' ||
      storage.status === 'disconnected'
    ) {
      overall = 'degraded';
    }

    return {
      status: overall,
      version: process.env.npm_package_version ?? '1.0.0',
      environment: this.config.get<string>('NODE_ENV', 'development'),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: { database: db, redis, qdrant, storage },
    };
  }

  // ─── GET /api/version ───────────────────────────────────────────────────────

  @Get('version')
  @Public()
  @ApiOperation({
    summary: 'Version info',
    description: 'Returns the API version, environment, and uptime. No dependency checks — instant response.',
  })
  version(): VersionResponse {
    return {
      name: 'Damora AI API',
      version: process.env.npm_package_version ?? '1.0.0',
      environment: this.config.get<string>('NODE_ENV', 'development'),
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Individual Connectivity Checks ─────────────────────────────────────────

  private async checkDatabase(): Promise<void> {
    // Lightweight SELECT 1 — confirms connection pool is alive
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis(): Promise<void> {
    // ioredis exposes a .status property: 'ready' means connected and accepting commands
    const client = await this.queue.client;
    if ((client as { status: string }).status !== 'ready') {
      throw new Error('Redis client not in ready state');
    }
  }

  private async checkQdrant(): Promise<void> {
    // getCollections() is the lightest Qdrant API call
    await this.vectorStore.ping();
  }

  private async checkStorage(): Promise<void> {
    // HeadBucket is the cheapest S3-compatible call (no data transfer)
    await this.storage.ping();
  }
}
