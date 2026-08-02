import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscoveriesService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, professorId: string) {
    return this.prisma.discovery.upsert({
      where: { userId_professorId: { userId, professorId } },
      update: {},
      create: { userId, professorId },
      include: { professor: true },
    });
  }

  findAll(userId: string) {
    return this.prisma.discovery.findMany({
      where: { userId },
      include: { professor: true },
      orderBy: { discoveredAt: 'desc' },
    });
  }
}
