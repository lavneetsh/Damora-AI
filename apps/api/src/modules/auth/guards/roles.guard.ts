import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';

const ROLE_HIERARCHY: WorkspaceRole[] = ['MEMBER', 'ADMIN', 'OWNER'];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get required roles for this endpoint
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow by default (anyone with workspace membership can access)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId;

    if (!user || !workspaceId) {
      throw new ForbiddenException('Authentication or workspace context missing');
    }

    // 2. Fetch the user's role in the target workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // 3. Verify role hierarchy satisfies the required roles
    const userRoleIndex = ROLE_HIERARCHY.indexOf(member.role);
    const isAuthorized = requiredRoles.some(
      (requiredRole) => userRoleIndex >= ROLE_HIERARCHY.indexOf(requiredRole),
    );

    if (!isAuthorized) {
      throw new ForbiddenException('Insufficient permissions inside this workspace');
    }

    return true;
  }
}
