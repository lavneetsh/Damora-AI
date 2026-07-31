import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter.
 * Ensures every error response follows a consistent envelope:
 *   { success: false, statusCode, message, path, timestamp }
 *
 * This replaces the default NestJS error format (which leaks internals).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        // class-validator returns { message: string[] }
        const body = res as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log 5xx errors so we see them in Render logs
    if (statusCode >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
