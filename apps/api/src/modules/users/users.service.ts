import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        memberships: {
          include: {
            workspace: {
              select: { id: true, name: true, slug: true, plan: true },
            },
          },
        },
      },
    });
  }

  async updateProfile(
    id: string,
    data: { name?: string; avatarUrl?: string },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }
}
