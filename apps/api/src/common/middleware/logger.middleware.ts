import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware.
 * Logs: METHOD /path → STATUS_CODE (Xms)
 *
 * Output example:
 *   POST /api/auth/login → 200 (43ms)
 *   GET  /api/health     → 200 (2ms)
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const elapsed = Date.now() - startTime;

      // Choose log level based on status code
      const logLine = `${method.padEnd(7)} ${originalUrl} → ${statusCode} (${elapsed}ms)`;

      if (statusCode >= 500) {
        this.logger.error(logLine);
      } else if (statusCode >= 400) {
        this.logger.warn(logLine);
      } else {
        this.logger.log(logLine);
      }
    });

    next();
  }
}
