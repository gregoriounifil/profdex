import { Injectable, NotFoundException } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_PROFESSOR_SELECT } from '../professors/public-professor.select';
import { hashCaptureToken } from './capture-token';

@Injectable()
export class CapturesService {
  constructor(
    private prisma: PrismaService,
    private metrics: MetricsService,
  ) {}

  async captureByToken(userId: string, token: string) {
    const professor = await this.prisma.professor.findUnique({
      where: { captureTokenHash: hashCaptureToken(token) },
      select: PUBLIC_PROFESSOR_SELECT,
    });

    if (!professor) {
      throw new NotFoundException('Token inválido');
    }

    const { capture, novaDescoberta, novaCaptura } =
      await this.prisma.$transaction(async (transaction) => {
        // O upsert não diz se criou ou apenas encontrou, e a diferença importa:
        // re-escanear o mesmo QR não pode pontuar de novo.
        const [descobertaExistente, capturaExistente] = await Promise.all([
          transaction.discovery.findUnique({
            where: { userId_professorId: { userId, professorId: professor.id } },
            select: { id: true },
          }),
          transaction.capture.findUnique({
            where: { userId_professorId: { userId, professorId: professor.id } },
            select: { id: true },
          }),
        ]);

        await transaction.discovery.upsert({
          where: {
            userId_professorId: { userId, professorId: professor.id },
          },
          update: {},
          create: { userId, professorId: professor.id },
        });

        const criada = await transaction.capture.upsert({
          where: {
            userId_professorId: { userId, professorId: professor.id },
          },
          update: {},
          create: { userId, professorId: professor.id },
          include: {
            professor: { select: PUBLIC_PROFESSOR_SELECT },
          },
        });

        return {
          capture: criada,
          novaDescoberta: !descobertaExistente,
          novaCaptura: !capturaExistente,
        };
      });

    // Registrado no SERVIDOR, não pelo cliente: captura vale muitos pontos e o
    // front não é fonte confiável para isso.
    if (novaCaptura || novaDescoberta) {
      void this.registrarMetricas(userId, professor.id, {
        novaDescoberta,
        novaCaptura,
      });
    }

    return capture;
  }

  /** Nunca deixa a métrica quebrar a captura — o aluno já escaneou o QR. */
  private async registrarMetricas(
    userId: string,
    professorId: string,
    { novaDescoberta, novaCaptura }: { novaDescoberta: boolean; novaCaptura: boolean },
  ): Promise<void> {
    try {
      const occurredAt = new Date();
      const eventos: Parameters<MetricsService['record']>[2] = [];
      if (novaDescoberta) {
        eventos.push({
          type: 'professor_discovered',
          occurredAt,
          metadata: { professorId },
        });
      }
      if (novaCaptura) {
        eventos.push({
          type: 'professor_captured',
          occurredAt,
          metadata: { professorId },
        });

        const [capturados, total] = await Promise.all([
          this.prisma.capture.count({ where: { userId } }),
          this.prisma.professor.count(),
        ]);
        if (total > 0 && capturados >= total) {
          eventos.push({ type: 'collection_completed', occurredAt });
        }
      }
      this.metrics.record(userId, null, eventos);
    } catch {
      // silencioso de propósito: métrica não pode derrubar a captura
    }
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
