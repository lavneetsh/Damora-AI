import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('invitations')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all pending workspace invitations for the current user' })
  getPendingInvites(@CurrentUser('id') userId: string) {
    return this.workspacesService.getPendingInvites(userId);
  }

  @Post(':inviteId/accept')
  @ApiOperation({ summary: 'Accept a workspace invitation' })
  @ApiParam({ name: 'inviteId', type: String })
  acceptInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.acceptInvite(inviteId, userId);
  }

  @Post(':inviteId/decline')
  @ApiOperation({ summary: 'Decline a workspace invitation' })
  @ApiParam({ name: 'inviteId', type: String })
  declineInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.declineInvite(inviteId, userId);
  }
}
