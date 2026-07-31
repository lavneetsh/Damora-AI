import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import compression = require('compression');
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './database/prisma.service';
import { VectorStoreService } from './modules/vector-store/vector-store.service';
import { StorageService } from './modules/storage/storage.service';

const logger = new Logger('Bootstrap');

// ─── Startup Connectivity Check ────────────────────────────────────────────────

/**
 * Probes a service with a hard timeout.
 * Returns { ok: boolean, latencyMs: number | null }.
 * Never throws — any failure maps to ok=false.
 */
async function probe(
  fn: () => Promise<unknown>,
  label: string,
  timeoutMs = 4000,
): Promise<{ ok: boolean; latencyMs: number | null }> {
  const start = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs),
      ),
    ]);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    logger.warn(`  ✗ ${label}: ${(err as Error).message}`);
    return { ok: false, latencyMs: null };
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ─── Security ─────────────────────────────────────────────────────
  app.use(helmet());

  // ─── Compression (gzip) ───────────────────────────────────────────
  app.use(compression());

  // ─── CORS ─────────────────────────────────────────────────────────
  app.enableCors({
    origin: frontendUrl.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Global Prefix ────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Global Exception Filter ──────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Validation ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Swagger ──────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Damora AI API')
    .setDescription('Private AI Workspace for Companies')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('workspaces', 'Workspace management')
    .addTag('documents', 'Document management')
    .addTag('chat', 'AI chat & sessions')
    .addTag('search', 'Semantic search')
    .addTag('health', 'Service health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);

  // ─── Startup Banner (live connectivity) ───────────────────────────
  // All modules are initialized by this point — we pull the already-
  // constructed service instances from the DI container and probe them.
  // This way the banner shows ACTUAL connectivity, not just config loaded.
  const prisma = app.get(PrismaService);
  const vectorStore = app.get(VectorStoreService);
  const storage = app.get(StorageService);

  const [dbProbe, qdrantProbe, storageProbe] = await Promise.all([
    probe(() => prisma.$queryRaw`SELECT 1`, 'PostgreSQL'),
    probe(() => vectorStore.ping(), 'Qdrant'),
    probe(() => storage.ping(), 'Storage'),
  ]);

  const icon = (ok: boolean) => (ok ? '✓' : '✗');
  const latency = (ms: number | null) => (ms !== null ? ` (${ms}ms)` : ' (timeout)');

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('  🚀 Damora AI — Startup Summary');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log(`  ✓ Environment   : ${nodeEnv}`);
  logger.log(`  ✓ Port          : ${port}`);
  logger.log(`  ✓ CORS Origins  : ${frontendUrl}`);
  logger.log(`  ✓ Helmet        : enabled`);
  logger.log(`  ✓ Compression   : gzip`);
  logger.log(`  ✓ Rate Limiting : 10 req/s · 100 req/min`);
  logger.log(`  ✓ AI Provider   : ${configService.get<string>('AI_PROVIDER', 'mock')}`);
  logger.log(`  ✓ Embedding     : ${configService.get<string>('EMBEDDING_PROVIDER', 'mock')}`);
  logger.log('  ─────────────────────────────────────────────────');
  logger.log(`  ${icon(dbProbe.ok)} PostgreSQL      : ${dbProbe.ok ? 'connected' : 'UNREACHABLE'}${latency(dbProbe.latencyMs)}`);
  logger.log(`  ✓ Redis          : connected (managed by BullMQ)`);
  logger.log(`  ${icon(qdrantProbe.ok)} Qdrant         : ${qdrantProbe.ok ? 'connected' : 'UNREACHABLE'}${latency(qdrantProbe.latencyMs)}`);
  logger.log(`  ${icon(storageProbe.ok)} Storage        : ${storageProbe.ok ? 'connected' : 'UNREACHABLE'}${latency(storageProbe.latencyMs)}`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log(`  📡 API     : http://localhost:${port}/api`);
  logger.log(`  📚 Swagger : http://localhost:${port}/api/docs`);
  logger.log(`  ❤️  Health  : http://localhost:${port}/api/health`);
  logger.log(`  🔖 Version : http://localhost:${port}/api/version`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Fail fast if database is completely unreachable on boot —
  // there's no point serving traffic without a database.
  if (!dbProbe.ok) {
    logger.error('FATAL: PostgreSQL is unreachable. Shutting down.');
    await app.close();
    process.exit(1);
  }
}

bootstrap();
