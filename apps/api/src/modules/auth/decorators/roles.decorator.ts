import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to enforce specific WorkspaceRoles on a route.
 * Target route must also use RolesGuard.
 */
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);
