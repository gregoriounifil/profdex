import {
  expectedScore,
  FLOOR_RATING,
  K_PROVISIONAL,
  K_STANDARD,
  kFactor,
  PROVISIONAL_GAMES,
  ratingDelta,
  tierOf,
} from './elo';

describe('elo', () => {
  it('uses provisional K on the first games only', () => {
    expect(kFactor(0)).toBe(K_PROVISIONAL);
    expect(kFactor(PROVISIONAL_GAMES - 1)).toBe(K_PROVISIONAL);
    expect(kFactor(PROVISIONAL_GAMES)).toBe(K_STANDARD);
  });

  it('expected score: iguais 0.5; favorito perto de 1', () => {
    expect(expectedScore(1000, 1000)).toBe(0.5);
    expect(expectedScore(1400, 1000)).toBeGreaterThan(0.9);
    expect(expectedScore(1000, 1400)).toBeLessThan(0.1);
  });

  it('win between equals: +K/2 · loss floored at 1000', () => {
    expect(ratingDelta(1000, 1000, 1, 0)).toBe(K_PROVISIONAL / 2);
    // derrota em cima do piso não desce abaixo de 1000
    expect(ratingDelta(1000, 1000, 0, 0)).toBe(0);
    expect(ratingDelta(1010, 1000, 0, 10)).toBe(-10); // só até o piso
    expect(ratingDelta(1200, 1200, 0, 10)).toBe(-K_STANDARD / 2);
  });

  it('draws move ratings toward each other', () => {
    expect(ratingDelta(1300, 1000, 0.5, 10)).toBeLessThan(0);
    expect(ratingDelta(1000, 1300, 0.5, 10)).toBeGreaterThan(0);
  });

  it('zero-sum acima do piso (mesmo K)', () => {
    const dWinner = ratingDelta(1250, 1180, 1, 20);
    const dLoser = ratingDelta(1180, 1250, 0, 20);
    expect(dWinner + dLoser).toBe(0);
  });

  it('maps ratings to metal tiers', () => {
    expect(tierOf(FLOOR_RATING)).toBe('Bronze');
    expect(tierOf(1099)).toBe('Bronze');
    expect(tierOf(1100)).toBe('Prata');
    expect(tierOf(1200)).toBe('Ouro');
    expect(tierOf(1300)).toBe('Platina');
    expect(tierOf(1400)).toBe('Diamante');
    expect(tierOf(1500)).toBe('Mestre');
    expect(tierOf(2000)).toBe('Mestre');
  });
});
