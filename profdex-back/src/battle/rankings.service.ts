import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tierOf } from './elo';

export const PAGE_SIZE = 25;

export interface RankingEntry {
  position: number;
  id: string;
  name: string;
  rating: number;
  tier: string;
  wins: number;
  losses: number;
  draws: number;
}

// Só entra no ladder quem já jogou — 1000 alunos parados em 1000 pontos não
// são ranking, são cadastro.
const PLAYED = {
  OR: [
    { battleWins: { gt: 0 } },
    { battleLosses: { gt: 0 } },
    { battleDraws: { gt: 0 } },
  ],
};

/**
 * Leaderboard global de batalha. Paginado (a tela pede mais páginas conforme
 * rola) e sempre acompanhado da posição do próprio usuário — quem está em 400º
 * não se acha na lista, mas se vê no rodapé.
 */
@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async battleLeaderboard(userId: string, page: number) {
    const skip = (page - 1) * PAGE_SIZE;

    const [rows, total, self] = await Promise.all([
      this.prisma.user.findMany({
        where: PLAYED,
        // Desempate estável: mesma pontuação → mais vitórias primeiro; depois
        // ordem de cadastro, para a lista não "dançar" entre reloads.
        orderBy: [
          { battleRating: 'desc' },
          { battleWins: 'desc' },
          { createdAt: 'asc' },
        ],
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          battleRating: true,
          battleWins: true,
          battleLosses: true,
          battleDraws: true,
        },
      }),
      this.prisma.user.count({ where: PLAYED }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          battleRating: true,
          battleWins: true,
          battleLosses: true,
          battleDraws: true,
        },
      }),
    ]);

    const entries: RankingEntry[] = rows.map((u, i) => ({
      position: skip + i + 1,
      id: u.id,
      name: u.name,
      rating: u.battleRating,
      tier: tierOf(u.battleRating),
      wins: u.battleWins,
      losses: u.battleLosses,
      draws: u.battleDraws,
    }));

    // Posição do usuário (competition ranking): 1 + quantos têm rating maior.
    // Fora do ladder (nunca jogou) → position null.
    let me: (RankingEntry & { played: boolean }) | null = null;
    if (self) {
      const played = self.battleWins + self.battleLosses + self.battleDraws > 0;
      const ahead = played
        ? await this.prisma.user.count({
            where: {
              AND: [PLAYED, { battleRating: { gt: self.battleRating } }],
            },
          })
        : 0;
      me = {
        position: played ? ahead + 1 : 0,
        played,
        id: self.id,
        name: self.name,
        rating: self.battleRating,
        tier: tierOf(self.battleRating),
        wins: self.battleWins,
        losses: self.battleLosses,
        draws: self.battleDraws,
      };
    }

    return { entries, me, page, pageSize: PAGE_SIZE, total };
  }
}
