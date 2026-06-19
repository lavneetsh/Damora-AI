import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { InvitationsController } from './invitations.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [WorkspacesService],
  controllers: [WorkspacesController, InvitationsController],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}

