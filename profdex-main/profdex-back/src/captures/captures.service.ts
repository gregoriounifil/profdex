import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CapturesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, professorId: string) {
    const discovered = await this.prisma.discovery.findUnique({
      where: { userId_professorId: { userId, professorId } },
    });
    if (!discovered) {
      throw new BadRequestException('Professor não foi descoberto ainda');
    }

    return this.prisma.capture.upsert({
      where: { userId_professorId: { userId, professorId } },
      update: {},
      create: { userId, professorId },
      include: { professor: true },
    });
  }

  async captureByToken(userId: string, token: string) {
    // Usa query raw para não depender do tipo captureToken no Prisma client gerado
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM professors WHERE capture_token = ${token} LIMIT 1
    `;

    if (!rows.length) {
      throw new NotFoundException('Token inválido');
    }

    const professorId = rows[0].id;

    // Garante que o professor está descoberto antes de capturar
    await this.prisma.discovery.upsert({
      where: { userId_professorId: { userId, professorId } },
      update: {},
      create: { userId, professorId },
    });

    return this.prisma.capture.upsert({
      where: { userId_professorId: { userId, professorId } },
      update: {},
      create: { userId, professorId },
      include: { professor: true },
    });
  }

  findAll(userId: string) {
    return this.prisma.capture.findMany({
      where: { userId },
      include: { professor: true },
      orderBy: { capturedAt: 'desc' },
    });
  }
}
