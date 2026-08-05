// Sistema de pontos do PvP — Elo clássico, como Showdown/chess.com,
// simplificado para o evento de uma semana (ver docs/BATALHA-PVP.md).
//
//   R' = R + K × (S − E)   ·   E = 1 / (1 + 10^((Radv − R) / 400))
//
// - Todo mundo começa em 1000 e NUNCA cai abaixo de 1000 (piso do Showdown):
//   quem perde muito continua motivado a jogar o evento inteiro.
// - K alto nas primeiras batalhas (provisional) espalha o ladder rápido.

export const START_RATING = 1000;
export const FLOOR_RATING = 1000;
export const PROVISIONAL_GAMES = 5;
export const K_PROVISIONAL = 40;
export const K_STANDARD = 24;

/** Score de uma batalha: vitória 1 · empate 0.5 · derrota 0. */
export type Score = 0 | 0.5 | 1;

// Cortes dos tiers — a fonte única; o front recebe o nome já resolvido.
export const TIERS: { name: string; min: number }[] = [
  { name: 'Mestre', min: 1500 },
  { name: 'Diamante', min: 1400 },
  { name: 'Platina', min: 1300 },
  { name: 'Ouro', min: 1200 },
  { name: 'Prata', min: 1100 },
  { name: 'Bronze', min: 0 },
];

export function tierOf(rating: number): string {
  return TIERS.find((t) => rating >= t.min)!.name;
}

export function kFactor(gamesPlayed: number): number {
  return gamesPlayed < PROVISIONAL_GAMES ? K_PROVISIONAL : K_STANDARD;
}

export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

/**
 * Delta de rating de UM jogador para um resultado, já com piso aplicado
 * (o delta nunca derruba o rating abaixo de FLOOR_RATING).
 */
export function ratingDelta(
  rating: number,
  opponentRating: number,
  score: Score,
  gamesPlayed: number,
): number {
  const raw = Math.round(
    kFactor(gamesPlayed) * (score - expectedScore(rating, opponentRating)),
  );
  return Math.max(raw, FLOOR_RATING - rating);
}
