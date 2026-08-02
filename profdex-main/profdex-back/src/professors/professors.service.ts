import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfessorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const [professors, discoveries, captures] = await Promise.all([
      this.prisma.professor.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.discovery.findMany({ where: { userId }, select: { professorId: true } }),
      this.prisma.capture.findMany({ where: { userId }, select: { professorId: true } }),
    ]);

    const discoveredIds = new Set(discoveries.map((d) => d.professorId));
    const capturedIds = new Set(captures.map((c) => c.professorId));

    return professors.map((p) => ({
      ...p,
      discovered: discoveredIds.has(p.id),
      captured: capturedIds.has(p.id),
    }));
  }

  findOne(id: string) {
    return this.prisma.professor.findUniqueOrThrow({ where: { id } });
  }
}
