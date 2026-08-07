import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const PAIR_COOLDOWN_MS = 12 * 60 * 60 * 1000;

/**
 * Identificador canônico de uma dupla: os dois ids em ordem lexicográfica.
 * Gravado em `battles.pair_key`, permite achar a última batalha da dupla com
 * um índice simples em vez de OR nas duas ordens de coluna.
 */
export function pairKeyOf(a: string, b: string): string {
  return [a, b].sort().join(':');
}

/**
 * Cooldown anti win-trading: cada dupla tem 1 batalha ranqueada a cada 12h.
 * Contam batalhas `finished` e `abandoned` (abandono consome o cooldown, senão
 * abandonar viraria truque para resetar o matchup); `annulled` (crash/deploy
 * no meio) não conta — a dupla não teve batalha de verdade.
 */
@Injectable()
export class CooldownService {
  constructor(private prisma: PrismaService) {}

  /** Retorna quando a dupla estará liberada, ou null se já pode batalhar. */
  async availableAt(userA: string, userB: string): Promise<Date | null> {
    const since = new Date(Date.now() - PAIR_COOLDOWN_MS);
    const last = await this.prisma.battle.findFirst({
      where: {
        pairKey: pairKeyOf(userA, userB),
        status: { in: ['finished', 'abandoned'] },
        finishedAt: { gt: since },
      },
      orderBy: { finishedAt: 'desc' },
      select: { finishedAt: true },
    });

    if (!last?.finishedAt) return null;
    return new Date(last.finishedAt.getTime() + PAIR_COOLDOWN_MS);
  }
}
