import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import { EncryptionService } from '../ai/services/encryption.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // ─── Get all workspaces for a user ────────────────────────────────────────

  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            createdAt: true,
            _count: {
              select: { members: true, documents: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      memberCount: m.workspace._count.members,
      joinedAt: m.joinedAt,
    }));
  }

  // ─── Get single workspace (with auth check) ────────────────────────────────

  async getWorkspace(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
            aiSettings: true,
            _count: { select: { documents: true, chatSessions: true } },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    const ws = membership.workspace;
    return {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      plan: ws.plan,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      aiProvider: ws.aiProvider,
      hasAiApiKey: !!ws.aiApiKey,
      aiLastTested: ws.aiLastTested,
      aiConnectionStatus: ws.aiConnectionStatus,
      members: ws.members,
      aiSettings: ws.aiSettings,
      _count: ws._count,
      currentUserRole: membership.role,
    };
  }

  // ─── Create workspace ──────────────────────────────────────────────────────

  async createWorkspace(userId: string, name: string) {
    const slug = await this.generateUniqueSlug(name, userId);

    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name, slug } });
      await tx.workspaceMember.create({
        data: { userId, workspaceId: ws.id, role: 'OWNER' },
      });
      return ws;
    });

    return workspace;
  }

  // ─── Update workspace name ─────────────────────────────────────────────────

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: { name?: string },
  ) {
    await this.requireRole(workspaceId, userId, ['OWNER', 'ADMIN']);
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data,
      select: { id: true, name: true, slug: true, plan: true },
    });
  }

  // ─── Get workspace members + pending invites ───────────────────────────────

  async getWorkspaceMembers(workspaceId: string, userId: string) {
    await this.requireRole(workspaceId, userId, ['OWNER', 'ADMIN']);

    const [members, invites] = await Promise.all([
      this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.workspaceInvite.findMany({
        where: { workspaceId },
        include: {
          invitedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { members, invites };
  }

  // ─── Invite member ─────────────────────────────────────────────────────────

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    email: string,
    role: 'ADMIN' | 'MEMBER',
  ) {
    await this.requireRole(workspaceId, inviterId, ['OWNER', 'ADMIN']);

    // Check if there's already a member with this email in the workspace
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: existingUser.id, workspaceId } },
      });
      if (existingMember) {
        throw new ConflictException('This user is already a member of the workspace');
      }
    }

    // Check if an invite already exists for this email
    const existingInvite = await this.prisma.workspaceInvite.findUnique({
      where: { email_workspaceId: { email, workspaceId } },
    });
    if (existingInvite) {
      throw new ConflictException('An invitation has already been sent to this email');
    }

    // Create the invite
    return this.prisma.workspaceInvite.create({
      data: { email, workspaceId, role, invitedById: inviterId },
      include: {
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Get pending invitations for a user (by email) ────────────────────────

  async getPendingInvites(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.workspaceInvite.findMany({
      where: { email: user.email },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Accept invitation ─────────────────────────────────────────────────────

  async acceptInvite(inviteId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
      include: { workspace: true },
    });

    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.email !== user.email) throw new ForbiddenException('This invitation is not for you');

    // Check not already a member
    const existing = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
    });
    if (existing) {
      // Clean up stale invite and return
      await this.prisma.workspaceInvite.delete({ where: { id: inviteId } });
      throw new ConflictException('You are already a member of this workspace');
    }

    // Create membership and delete invite atomically
    const [member] = await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: { userId, workspaceId: invite.workspaceId, role: invite.role },
        include: {
          workspace: { select: { id: true, name: true, slug: true, plan: true } },
        },
      }),
      this.prisma.workspaceInvite.delete({ where: { id: inviteId } }),
    ]);

    return member;
  }

  // ─── Decline invitation ────────────────────────────────────────────────────

  async declineInvite(inviteId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const invite = await this.prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.email !== user.email) throw new ForbiddenException('This invitation is not for you');

    await this.prisma.workspaceInvite.delete({ where: { id: inviteId } });
    return { message: 'Invitation declined' };
  }

  // ─── Cancel pending invite (by workspace owner/admin) ─────────────────────

  async cancelInvite(workspaceId: string, actorId: string, inviteId: string) {
    await this.requireRole(workspaceId, actorId, ['OWNER', 'ADMIN']);

    const invite = await this.prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.workspaceId !== workspaceId) {
      throw new NotFoundException('Invitation not found in this workspace');
    }

    await this.prisma.workspaceInvite.delete({ where: { id: inviteId } });
    return { message: 'Invitation cancelled' };
  }

  // ─── Update member role ────────────────────────────────────────────────────

  async updateMemberRole(
    workspaceId: string,
    actorId: string,
    memberId: string,
    newRole: 'ADMIN' | 'MEMBER',
  ) {
    await this.requireRole(workspaceId, actorId, ['OWNER']);

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }
    if (targetMember.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the role of the workspace owner');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole as WorkspaceRole },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ─── Remove member ─────────────────────────────────────────────────────────

  async removeMember(workspaceId: string, actorId: string, memberId: string) {
    await this.requireRole(workspaceId, actorId, ['OWNER']);

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }
    if (targetMember.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }
    if (targetMember.userId === actorId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
    return { message: 'Member removed successfully' };
  }

  // ─── Update BYOK AI settings (OWNER only) ───────────────────────────────

  async testAiConnection(
    workspaceId: string,
    userId: string,
    data: { aiProvider: string; aiApiKey?: string | null },
  ) {
    await this.requireRole(workspaceId, userId, ['OWNER']);

    let apiKey = data.aiApiKey;
    let isNewKey = true;

    if (!apiKey) {
      // Retrieve and decrypt the existing key from the database
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { aiApiKey: true },
      });
      if (!workspace || !workspace.aiApiKey) {
        throw new BadRequestException('No API key configured to test');
      }
      apiKey = this.encryptionService.decrypt(workspace.aiApiKey);
      isNewKey = false;
    }

    let success = false;
    let errorMessage: string | null = null;

    if (data.aiProvider === 'gemini') {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 5 },
        });
        const text = result.response.text();
        if (!text) {
          throw new Error('Empty response received from Gemini API');
        }
        success = true;
      } catch (err: any) {
        errorMessage = err.message || String(err);
      }
    } else if (data.aiProvider === 'openai') {
      try {
        const { OpenAI } = require('openai');
        const client = new OpenAI({ apiKey });
        const result = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        });
        const text = result.choices[0]?.message?.content;
        if (!text) {
          throw new Error('Empty response received from OpenAI API');
        }
        success = true;
      } catch (err: any) {
        errorMessage = err.message || String(err);
      }
    } else if (data.aiProvider === 'claude') {
      try {
        const { Anthropic } = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const result = await client.messages.create({
          model: 'claude-3-5-sonnet-latest',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        });
        const contentBlock = result.content[0];
        const text = contentBlock && contentBlock.type === 'text' ? contentBlock.text : '';
        if (!text) {
          throw new Error('Empty response received from Anthropic API');
        }
        success = true;
      } catch (err: any) {
        errorMessage = err.message || String(err);
      }
    } else if (data.aiProvider === 'mock') {
      success = true;
    } else {
      throw new BadRequestException(`Unsupported provider for connection test: ${data.aiProvider}`);
    }

    const status = success ? 'CONNECTED' : 'FAILED';
    const lastTested = new Date();

    // Only update DB status if we tested the existing key
    if (!isNewKey) {
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          aiConnectionStatus: status,
          aiLastTested: lastTested,
        },
      });
    }

    if (!success) {
      throw new BadRequestException(`Connection test failed: ${errorMessage}`);
    }

    return {
      success: true,
      message: 'Connection successful',
      lastTested,
    };
  }

  async updateAiSettings(
    workspaceId: string,
    userId: string,
    data: { aiProvider?: string | null; aiApiKey?: string | null },
  ) {
    await this.requireRole(workspaceId, userId, ['OWNER']);

    const updateData: any = {};

    if (data.aiProvider !== undefined) {
      updateData.aiProvider = data.aiProvider || null;
    }

    if (data.aiApiKey !== undefined) {
      if (data.aiApiKey) {
        // Validate the new key before saving it
        try {
          await this.testAiConnection(workspaceId, userId, {
            aiProvider: data.aiProvider || 'gemini',
            aiApiKey: data.aiApiKey,
          });
          // Save and encrypt
          updateData.aiApiKey = this.encryptionService.encrypt(data.aiApiKey);
          updateData.aiConnectionStatus = 'CONNECTED';
          updateData.aiLastTested = new Date();
        } catch (err: any) {
          // Save status as FAILED in DB and re-throw
          await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
              aiConnectionStatus: 'FAILED',
              aiLastTested: new Date(),
            },
          });
          throw new BadRequestException(`Failed to save settings: ${err.message}`);
        }
      } else {
        updateData.aiApiKey = null;
        updateData.aiConnectionStatus = 'NOT_CONFIGURED';
        updateData.aiLastTested = null;
      }
    } else {
      if (data.aiProvider === null || data.aiProvider === '') {
        updateData.aiApiKey = null;
        updateData.aiConnectionStatus = null;
        updateData.aiLastTested = null;
      }
    }

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      aiProvider: updated.aiProvider,
      hasAiApiKey: !!updated.aiApiKey,
      aiConnectionStatus: updated.aiConnectionStatus,
      aiLastTested: updated.aiLastTested,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async requireRole(
    workspaceId: string,
    userId: string,
    roles: string[],
  ) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership || !roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }

    return membership;
  }

  private async generateUniqueSlug(name: string, userId: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 30);

    const candidate = `${base}-${userId.slice(-6)}`;
    return candidate;
  }
}
