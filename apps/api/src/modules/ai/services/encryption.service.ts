import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey: Buffer;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('BYOK_ENCRYPTION_KEY') || 'default-dev-byok-encryption-key-32chars';
    // Hash key to secure a 32-byte key for AES-256
    this.secretKey = crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Encrypts plaintext string using AES-256-CBC.
   * Returns "iv:encryptedText" in hex format.
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext in "iv:encryptedText" format.
   */
  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
