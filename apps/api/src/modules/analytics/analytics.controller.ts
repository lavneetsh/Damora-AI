import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';

@ApiTags('analytics')
@ApiBearerAuth('JWT')
@Controller('workspaces/:workspaceId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Get workspace analytics and statistics' })
  @ApiParam({ name: 'workspaceId', type: String })
  getWorkspaceStats(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getWorkspaceStats(workspaceId);
  }
}
