import { NotFoundException } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { PUBLIC_PROFESSOR_SELECT } from '../professors/public-professor.select';
import { hashCaptureToken } from './capture-token';
import { CapturesService } from './captures.service';

/** Métrica é efeito colateral: aqui só precisa não explodir. */
const metricsStub = () =>
  ({ record: jest.fn().mockReturnValue(0) }) as unknown as MetricsService;

describe('CapturesService', () => {
  type UpsertArguments = {
    where: {
      userId_professorId: {
        userId: string;
        professorId: string;
      };
    };
  };

  const token = 'secure_capture_token_1234567890ab';
  const professor = {
    id: 'prof-1',
    name: 'Professor',
    slug: 'professor',
    modelUrl: null,
    marker1Index: 0,
    marker2Index: 1,
  };

  it('rejects a token that has no matching proof', async () => {
    const prisma = {
      professor: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new CapturesService(prisma as unknown as PrismaService, metricsStub());

    await expect(service.captureByToken('user-1', token)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.professor.findUnique).toHaveBeenCalledWith({
      where: { captureTokenHash: hashCaptureToken(token) },
      select: PUBLIC_PROFESSOR_SELECT,
    });
  });

  it('redeems a valid proof atomically and returns no secret fields', async () => {
    const capture = {
      id: 'capture-1',
      userId: 'user-1',
      professorId: professor.id,
      professor,
    };
    const transaction = {
      discovery: {
        // null = ainda não existia, então a métrica conta como novidade
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'discovery-1' }),
      },
      capture: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(capture),
      },
    };
    const prisma = {
      professor: {
        findUnique: jest.fn().mockResolvedValue(professor),
        count: jest.fn().mockResolvedValue(10),
      },
      capture: { count: jest.fn().mockResolvedValue(1) },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const service = new CapturesService(
      prisma as unknown as PrismaService,
      metricsStub(),
    );

    const result = await service.captureByToken('user-1', token);

    expect(transaction.discovery.upsert).toHaveBeenCalledWith({
      where: {
        userId_professorId: {
          userId: 'user-1',
          professorId: professor.id,
        },
      },
      update: {},
      create: { userId: 'user-1', professorId: professor.id },
    });
    expect(transaction.capture.upsert).toHaveBeenCalledWith({
      where: {
        userId_professorId: {
          userId: 'user-1',
          professorId: professor.id,
        },
      },
      update: {},
      create: { userId: 'user-1', professorId: professor.id },
      include: {
        professor: { select: PUBLIC_PROFESSOR_SELECT },
      },
    });
    expect(result).toEqual(capture);
    expect(JSON.stringify(result)).not.toContain('captureToken');
  });

  it('keeps concurrent redemptions idempotent for one user and proof', async () => {
    const discoveries = new Map<string, { id: string }>();
    const captures = new Map<
      string,
      { id: string; professor: typeof professor }
    >();
    const transaction = {
      discovery: {
        findUnique: jest.fn(({ where }: UpsertArguments) =>
          discoveries.get(JSON.stringify(where.userId_professorId)) ?? null,
        ),
        upsert: jest.fn(({ where }: UpsertArguments) => {
          const key = JSON.stringify(where.userId_professorId);
          const record = discoveries.get(key) ?? { id: 'discovery-1' };
          discoveries.set(key, record);
          return record;
        }),
      },
      capture: {
        findUnique: jest.fn(
          ({ where }: UpsertArguments) =>
            captures.get(JSON.stringify(where.userId_professorId)) ?? null,
        ),
        upsert: jest.fn(({ where }: UpsertArguments) => {
          const key = JSON.stringify(where.userId_professorId);
          const record = captures.get(key) ?? {
            id: 'capture-1',
            professor,
          };
          captures.set(key, record);
          return record;
        }),
      },
    };
    const prisma = {
      professor: {
        findUnique: jest.fn().mockResolvedValue(professor),
        count: jest.fn().mockResolvedValue(10),
      },
      capture: { count: jest.fn().mockResolvedValue(1) },
      $transaction: jest.fn(
        (callback: (client: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const service = new CapturesService(
      prisma as unknown as PrismaService,
      metricsStub(),
    );

    const results = await Promise.all([
      service.captureByToken('user-1', token),
      service.captureByToken('user-1', token),
    ]);

    expect(new Set(results.map((result) => result.id))).toEqual(
      new Set(['capture-1']),
    );
    expect(discoveries).toHaveProperty('size', 1);
    expect(captures).toHaveProperty('size', 1);
  });

  it('filters nested professors when listing captures', async () => {
    const records = [{ id: 'capture-1' }];
    const prisma = {
      capture: {
        findMany: jest.fn().mockResolvedValue(records),
      },
    };
    const service = new CapturesService(prisma as unknown as PrismaService, metricsStub());

    await expect(service.findAll('user-1')).resolves.toEqual(records);
    expect(prisma.capture.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: {
        professor: { select: PUBLIC_PROFESSOR_SELECT },
      },
      orderBy: { capturedAt: 'desc' },
    });
  });
});
