import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Sse,
  MessageEvent,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('chats')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── Session CRUD ─────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiParam({ name: 'workspaceId', type: String })
  createSession(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChatDto,
  ) {
    return this.chatService.createSession(workspaceId, userId, dto);
  }

  /**
   * Legacy endpoint — returns the caller's own sessions.
   * Kept for backwards compatibility.
   */
  @Get()
  @ApiOperation({ summary: 'List all chat sessions owned by the caller' })
  @ApiParam({ name: 'workspaceId', type: String })
  listSessions(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.listSessions(workspaceId, userId);
  }

  // ─── Visibility Split Endpoints ───────────────────────────────────────────

  @Get('private')
  @ApiOperation({ summary: "List the caller's own PRIVATE chat sessions" })
  @ApiParam({ name: 'workspaceId', type: String })
  listPrivateSessions(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.listPrivateSessions(workspaceId, userId);
  }

  @Get('shared')
  @ApiOperation({ summary: 'List all SHARED discussions in the workspace' })
  @ApiParam({ name: 'workspaceId', type: String })
  listSharedSessions(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.listSharedSessions(workspaceId, userId);
  }

  // ─── Share / Unshare ──────────────────────────────────────────────────────

  @Patch(':sessionId/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Share a chat session with the workspace' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'sessionId', type: String })
  shareSession(
    @Param('workspaceId') workspaceId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.shareSession(sessionId, workspaceId, userId);
  }

  @Patch(':sessionId/unshare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unshare a chat session — move back to PRIVATE' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'sessionId', type: String })
  unshareSession(
    @Param('workspaceId') workspaceId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.unshareSession(sessionId, workspaceId, userId);
  }

  // ─── Session Detail & Delete ──────────────────────────────────────────────

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get a chat session details and message history' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'sessionId', type: String })
  getSession(
    @Param('workspaceId') workspaceId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getSession(sessionId, workspaceId, userId);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'sessionId', type: String })
  deleteSession(
    @Param('workspaceId') workspaceId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.deleteSession(sessionId, workspaceId, userId);
  }

  // ─── SSE Streaming ────────────────────────────────────────────────────────

  @Sse(':sessionId/stream')
  @ApiOperation({ summary: 'Send a message and stream back AI response via SSE' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiQuery({ name: 'content', type: String, description: 'The user message prompt' })
  async streamMessage(
    @Param('workspaceId') workspaceId: string,
    @Param('sessionId') sessionId: string,
    @Query('content') content: string,
    @CurrentUser('id') userId: string,
  ): Promise<Observable<MessageEvent>> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Content query parameter is required');
    }

    const generator = await this.chatService.sendMessageStream(
      workspaceId,
      userId,
      sessionId,
      content,
    );

    return new Observable((subscriber) => {
      (async () => {
        try {
          for await (const chunk of generator) {
            subscriber.next({ data: { text: chunk } });
          }
          subscriber.next({ data: { done: true } });
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }
}
