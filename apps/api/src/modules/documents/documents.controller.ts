import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

@ApiTags('documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ─── Upload Document ──────────────────────────────────────────────────────

  @Post()
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Upload a document to the workspace knowledge base' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiParam({ name: 'workspaceId', type: String })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // keep file in memory as Buffer (not written to disk)
      limits: { fileSize: MAX_SIZE_BYTES },
    }),
  )
  uploadDocument(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_SIZE_BYTES })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.documentsService.uploadDocument(workspaceId, userId, file);
  }

  // ─── Semantic Search ─────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({ summary: 'Semantic search across workspace knowledge base' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiQuery({ name: 'q', type: String, description: 'Natural language search query' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Max results (default 10)' })
  searchDocuments(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.documentsService.searchDocuments(
      workspaceId,
      userId,
      query,
      limit ? Number(limit) : 10,
    );
  }

  // ─── List Documents ───────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all documents in a workspace' })
  @ApiParam({ name: 'workspaceId', type: String })
  getDocuments(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.getDocuments(workspaceId, userId);
  }

  // ─── Get Document Download / Preview URL ─────────────────────────────────

  @Get(':documentId/download-url')
  @ApiOperation({ summary: 'Get a short-lived pre-signed URL to download or preview a document' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'documentId', type: String })
  @ApiQuery({ name: 'download', type: Boolean, required: false, description: 'Force direct attachment download' })
  getDocumentDownloadUrl(
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
    @Query('download') download?: boolean,
  ) {
    return this.documentsService.getDocumentDownloadUrl(
      documentId,
      workspaceId,
      userId,
      download,
    );
  }

  // ─── Get Single Document ──────────────────────────────────────────────────

  @Get(':documentId')
  @ApiOperation({ summary: 'Get document details including download URL' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'documentId', type: String })
  getDocument(
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.getDocument(documentId, workspaceId, userId);
  }

  // ─── Delete Document ──────────────────────────────────────────────────────

  @Delete(':documentId')
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a document (removes file, chunks, and vectors)' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'documentId', type: String })
  deleteDocument(
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.deleteDocument(documentId, workspaceId, userId);
  }
}
