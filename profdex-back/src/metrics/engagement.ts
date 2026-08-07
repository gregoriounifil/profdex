/**
 * Catálogo de interações e quanto cada uma vale.
 *
 * A régua é deliberadamente "inflada" em relação a uma rede social: aqui uma
 * interação não é um clique de curtida — capturar um professor exige estar
 * fisicamente diante do QR, e uma batalha consome minutos dos dois jogadores.
 * Os pesos refletem esse custo, senão o placar viraria contagem de logins.
 */

export const EVENT_TYPES = [
  'screen_view',
  'scan_open',
  'professor_discovered',
  'professor_captured',
  'battle_invite_sent',
  'battle_started',
  'battle_finished',
  'battle_won',
  'ranking_viewed',
  'guide_opened',
  'collection_completed',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

const EVENT_TYPE_SET: ReadonlySet<string> = new Set(EVENT_TYPES);

export function isEventType(value: string): value is EventType {
  return EVENT_TYPE_SET.has(value);
}

/** Pontos por evento. Zero = registrado para análise, mas não pontua. */
export const ENGAGEMENT_POINTS: Record<EventType, number> = {
  screen_view: 0, // volume alto demais para pontuar; serve para navegação
  scan_open: 0, // abrir a câmera é intenção, não conquista
  professor_discovered: 20,
  professor_captured: 50,
  battle_invite_sent: 5,
  battle_started: 0, // a conclusão é que vale (evita farm de convite aceito)
  battle_finished: 80,
  battle_won: 30, // somado ao battle_finished
  ranking_viewed: 0,
  guide_opened: 0,
  collection_completed: 200,
};

/** Bônus por iniciar a primeira sessão do dia. */
export const DAILY_SESSION_POINTS = 5;

/** Ponto por minuto ativo, com teto diário — ver TIME_POINTS_DAILY_CAP. */
export const POINTS_PER_ACTIVE_MINUTE = 1;

/**
 * Teto de pontos por tempo em um dia. Sem ele, deixar a aba aberta renderia
 * mais que jogar — e o ranking de engajamento mediria paciência, não uso.
 */
export const TIME_POINTS_DAILY_CAP = 60;

export function pointsFor(type: EventType): number {
  return ENGAGEMENT_POINTS[type];
}
