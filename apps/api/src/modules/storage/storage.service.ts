import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>(
      'STORAGE_ENDPOINT',
      'http://localhost:9000',
    );
    const accessKeyId = this.config.get<string>('STORAGE_ACCESS_KEY', 'damora');
    const secretAccessKey = this.config.get<string>(
      'STORAGE_SECRET_KEY',
      'damora123',
    );
    const region = this.config.get<string>('STORAGE_REGION', 'us-east-1');
    this.bucket = this.config.get<string>(
      'STORAGE_BUCKET',
      'damora-docs',
    );

    this.s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      // MinIO requires path-style addressing (not virtual-hosted-style)
      forcePathStyle: true,
    });
  }

  // ─── Lifecycle: Ensure bucket exists on startup ───────────────────────────

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`✅ MinIO bucket "${this.bucket}" already exists`);
    } catch {
      // Bucket does not exist — create it
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`✅ MinIO bucket "${this.bucket}" created`);
      } catch (createErr) {
        this.logger.error(`❌ Failed to create MinIO bucket: ${createErr}`);
      }
    }
  }

  // ─── Upload File ──────────────────────────────────────────────────────────

  /**
   * Uploads a file buffer to MinIO.
   * @param key  - Storage key / path (e.g. "workspaces/ws_abc/docs/doc_xyz.pdf")
   * @param buffer - File content as Buffer
   * @param mimeType - MIME type (e.g. "application/pdf")
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    this.logger.debug(`Uploaded file to MinIO: ${key}`);
  }

  // ─── Download File ────────────────────────────────────────────────────────

  /**
   * Downloads a file from MinIO and returns it as a Buffer.
   */
  async downloadFile(key: string): Promise<Buffer> {
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    const stream = response.Body as Readable;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  // ─── Delete File ──────────────────────────────────────────────────────────

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.debug(`Deleted file from MinIO: ${key}`);
  }

  // ─── Pre-signed URL ───────────────────────────────────────────────────────

  /**
   * Generates a pre-signed URL for temporary secure access to a file.
   * @param key - Storage key
   * @param expiresIn - Seconds until expiry (default 1 hour)
   * @param filename - If provided, overrides content disposition to force attachment download
   */
  async getSignedUrl(key: string, expiresIn = 3600, filename?: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(filename && {
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
      }),
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
