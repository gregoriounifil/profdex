import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ratingDelta, Score, tierOf } from './elo';

export interface RatingOutcome {
  deltaA: number;
  deltaB: number;
  ratingA: number;
  ratingB: number;
  tierA: string;
  tierB: string;
}

/**
 * Aplica o resultado de uma batalha no Elo dos dois jogadores, numa transação:
 * ratings + contadores (W/L/D) + deltas gravados na própria batalha (auditoria).
 */
@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}

  /** `winnerId` null = empate. Retorna os novos ratings para o battle:end. */
  async applyResult(
    battleId: string,
    playerAId: string,
    playerBId: string,
    winnerId: string | null,
  ): Promise<RatingOutcome> {
    return this.prisma.$transaction(async (tx) => {
      const [a, b] = await Promise.all([
        tx.user.findUniqueOrThrow({
          where: { id: playerAId },
          select: {
            battleRating: true,
            battleWins: true,
            battleLosses: true,
            battleDraws: true,
          },
        }),
        tx.user.findUniqueOrThrow({
          where: { id: playerBId },
          select: {
            battleRating: true,
            battleWins: true,
            battleLosses: true,
            battleDraws: true,
          },
        }),
      ]);

      const games = (u: typeof a) =>
        u.battleWins + u.battleLosses + u.battleDraws;
      const scoreA: Score =
        winnerId === null ? 0.5 : winnerId === playerAId ? 1 : 0;
      const scoreB: Score =
        winnerId === null ? 0.5 : winnerId === playerBId ? 1 : 0;

      const deltaA = ratingDelta(
        a.battleRating,
        b.battleRating,
        scoreA,
        games(a),
      );
      const deltaB = ratingDelta(
        b.battleRating,
        a.battleRating,
        scoreB,
        games(b),
      );

      const counters = (score: Score) =>
        score === 1
          ? { battleWins: { increment: 1 } }
          : score === 0
            ? { battleLosses: { increment: 1 } }
            : { battleDraws: { increment: 1 } };

      await Promise.all([
        tx.user.update({
          where: { id: playerAId },
          data: { battleRating: { increment: deltaA }, ...counters(scoreA) },
        }),
        tx.user.update({
          where: { id: playerBId },
          data: { battleRating: { increment: deltaB }, ...counters(scoreB) },
        }),
        tx.battle.update({
          where: { id: battleId },
          data: { ratingDeltaA: deltaA, ratingDeltaB: deltaB },
        }),
      ]);

      const ratingA = a.battleRating + deltaA;
      const ratingB = b.battleRating + deltaB;
      return {
        deltaA,
        deltaB,
        ratingA,
        ratingB,
        tierA: tierOf(ratingA),
        tierB: tierOf(ratingB),
      };
    });
  }
}
