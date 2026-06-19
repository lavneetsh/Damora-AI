import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';

class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

class UpdateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

class UpdateAiSettingsDto {
  @IsEnum(['gemini', 'openai', 'claude', ''])
  @IsOptional()
  aiProvider?: string | null;

  @IsString()
  @IsOptional()
  aiApiKey?: string | null;
}class TestAiSettingsDto {
  @IsEnum(['gemini', 'openai', 'claude', ''])
  aiProvider: string;

  @IsString()
  @IsOptional()
  aiApiKey?: string | null;
}

class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['ADMIN', 'MEMBER'])
  role: 'ADMIN' | 'MEMBER';
}

class UpdateMemberRoleDto {
  @IsEnum(['ADMIN', 'MEMBER'])
  role: 'ADMIN' | 'MEMBER';
}

@ApiTags('workspaces')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // ─── User Workspaces ───────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  getMyWorkspaces(@CurrentUser('id') userId: string) {
    return this.workspacesService.getUserWorkspaces(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  createWorkspace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createWorkspace(userId, dto.name);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get workspace details with members' })
  @ApiParam({ name: 'workspaceId', type: String })
  getWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.getWorkspace(workspaceId, userId);
  }

  @Patch(':workspaceId')
  @ApiOperation({ summary: 'Update workspace name (OWNER/ADMIN only)' })
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateWorkspace(workspaceId, userId, dto);
  }

  @Patch(':workspaceId/ai-settings')
  @ApiOperation({ summary: 'Update BYOK AI Settings (OWNER only)' })
  @Roles(WorkspaceRole.OWNER)
  updateAiSettings(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAiSettingsDto,
  ) {
    return this.workspacesService.updateAiSettings(workspaceId, userId, dto);
  }  @Post(':workspaceId/test-key')
  @ApiOperation({ summary: 'Test BYOK connection before saving (OWNER only)' })
  @Roles(WorkspaceRole.OWNER)
  testAiConnection(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TestAiSettingsDto,
  ) {
    return this.workspacesService.testAiConnection(workspaceId, userId, dto);
  }

  // ─── Member Management ─────────────────────────────────────────────────────

  @Get(':workspaceId/members')
  @ApiOperation({ summary: 'List workspace members and pending invites (OWNER/ADMIN only)' })
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  getWorkspaceMembers(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.getWorkspaceMembers(workspaceId, userId);
  }

  @Patch(':workspaceId/members/:memberId/role')
  @ApiOperation({ summary: 'Update a member role (OWNER only)' })
  @Roles(WorkspaceRole.OWNER)
  updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, userId, memberId, dto.role);
  }

  @Delete(':workspaceId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from workspace (OWNER only)' })
  @Roles(WorkspaceRole.OWNER)
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.removeMember(workspaceId, userId, memberId);
  }

  // ─── Invitations (workspace-scoped) ───────────────────────────────────────

  @Post(':workspaceId/invites')
  @ApiOperation({ summary: 'Invite a user to the workspace (OWNER/ADMIN only)' })
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  inviteMember(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspacesService.inviteMember(workspaceId, userId, dto.email, dto.role);
  }

  @Delete(':workspaceId/invites/:inviteId')
  @ApiOperation({ summary: 'Cancel a pending invite (OWNER/ADMIN only)' })
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  cancelInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.cancelInvite(workspaceId, userId, inviteId);
  }
}
