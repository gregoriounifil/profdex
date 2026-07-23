import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_PROFESSOR_SELECT } from '../professors/public-professor.select';
import { hashCaptureToken } from './capture-token';

@Injectable()
export class CapturesService {
  constructor(private prisma: PrismaService) {}

  async captureByToken(userId: string, token: string) {
    const professor = await this.prisma.professor.findUnique({
      where: { captureTokenHash: hashCaptureToken(token) },
      select: PUBLIC_PROFESSOR_SELECT,
    });

    if (!professor) {
      throw new NotFoundException('Token inválido');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.discovery.upsert({
        where: {
          userId_professorId: { userId, professorId: professor.id },
        },
        update: {},
        create: { userId, professorId: professor.id },
      });

      return transaction.capture.upsert({
        where: {
          userId_professorId: { userId, professorId: professor.id },
        },
        update: {},
        create: { userId, professorId: professor.id },
        include: {
          professor: { select: PUBLIC_PROFESSOR_SELECT },
        },
      });
    });
  }

  findAll(userId: string) {
    return this.prisma.capture.findMany({
      where: { userId },
      include: {
        professor: { select: PUBLIC_PROFESSOR_SELECT },
      },
      orderBy: { capturedAt: 'desc' },
    });
  }
}
