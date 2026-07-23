import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_PROFESSOR_SELECT } from '../professors/public-professor.select';

@Injectable()
export class DiscoveriesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.discovery.findMany({
      where: { userId },
      include: {
        professor: { select: PUBLIC_PROFESSOR_SELECT },
      },
      orderBy: { discoveredAt: 'desc' },
    });
  }
}
