import { PrismaService } from '../prisma/prisma.service';
import { K_PROVISIONAL } from './elo';
import { RatingService } from './rating.service';

describe('RatingService', () => {
  const findUniqueOrThrow = jest.fn();
  const userUpdate = jest.fn().mockResolvedValue({});
  const battleUpdate = jest.fn().mockResolvedValue({});

  const tx = {
    user: { findUniqueOrThrow, update: userUpdate },
    battle: { update: battleUpdate },
  };
  const prisma = {
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  } as unknown as PrismaService;

  const service = new RatingService(prisma);

  const freshUser = {
    battleRating: 1000,
    battleWins: 0,
    battleLosses: 0,
    battleDraws: 0,
  };

  beforeEach(() => {
    findUniqueOrThrow.mockReset();
    userUpdate.mockClear();
    battleUpdate.mockClear();
  });

  it('applies a provisional win/loss between fresh players with the floor', async () => {
    findUniqueOrThrow.mockResolvedValue(freshUser);

    const result = await service.applyResult('battle-1', 'ana', 'bia', 'ana');

    // Iguais e provisional: vencedor +20; perdedor ficaria -20 mas o piso segura em 1000.
    expect(result).toMatchObject({
      deltaA: K_PROVISIONAL / 2,
      deltaB: 0,
      ratingA: 1000 + K_PROVISIONAL / 2,
      ratingB: 1000,
      tierA: 'Bronze',
    });

    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ana' },
        data: expect.objectContaining({
          battleRating: { increment: K_PROVISIONAL / 2 },
          battleWins: { increment: 1 },
        }),
      }),
    );
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bia' },
        data: expect.objectContaining({
          battleRating: { increment: 0 },
          battleLosses: { increment: 1 },
        }),
      }),
    );
    expect(battleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'battle-1' },
        data: { ratingDeltaA: K_PROVISIONAL / 2, ratingDeltaB: 0 },
      }),
    );
  });

  it('records a draw with 0.5 score for both', async () => {
    findUniqueOrThrow.mockResolvedValue(freshUser);

    const result = await service.applyResult('battle-2', 'ana', 'bia', null);

    expect(result.deltaA).toBe(0); // iguais: empate não move
    expect(result.deltaB).toBe(0);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ana' },
        data: expect.objectContaining({ battleDraws: { increment: 1 } }),
      }),
    );
  });

  it('promotes tier when crossing a cutoff', async () => {
    findUniqueOrThrow
      .mockResolvedValueOnce({
        ...freshUser,
        battleRating: 1090,
        battleWins: 10,
      })
      .mockResolvedValueOnce({
        ...freshUser,
        battleRating: 1090,
        battleWins: 10,
      });

    const result = await service.applyResult('battle-3', 'ana', 'bia', 'ana');

    expect(result.ratingA).toBeGreaterThanOrEqual(1100);
    expect(result.tierA).toBe('Prata');
  });
});
