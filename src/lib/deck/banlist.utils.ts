import { BanlistAlert, DeckCard } from '@/components/deckbuilder/types';

export type BanlistFormat = 'Master Duel' | 'TCG' | 'Duel Links';
export type BanlistStatus = 'Forbidden' | 'Limited' | 'Semi-Limited' | 'Unlimited';

export interface BanlistLimitInfo {
  limit: number;
  status: BanlistStatus;
  currentCopies: number;
  isViolated: boolean;
}

/**
 * Obtiene el límite oficial de copias permitidas y el estatus para un formato dado.
 */
export function getCardBanlistLimit(
  card: { ban_tcg?: string; ban_master_duel?: string; ban_duel_links?: string },
  format: BanlistFormat = 'TCG'
): { limit: number; status: BanlistStatus } {
  const rawStatus =
    format === 'TCG'
      ? card.ban_tcg
      : format === 'Master Duel'
      ? card.ban_master_duel
      : card.ban_duel_links;

  if (!rawStatus || rawStatus === 'Unlimited') {
    return { limit: 3, status: 'Unlimited' };
  }

  const normalized = rawStatus.trim().toLowerCase();
  if (normalized === 'forbidden' || normalized === 'banned') {
    return { limit: 0, status: 'Forbidden' };
  }
  if (normalized === 'limited') {
    return { limit: 1, status: 'Limited' };
  }
  if (normalized === 'semi-limited') {
    return { limit: 2, status: 'Semi-Limited' };
  }

  return { limit: 3, status: 'Unlimited' };
}

/**
 * Cuenta cuántas copias de una carta existen en el mazo activo (Main + Extra + Side).
 */
export function getCardCopiesInDeck(deckCards: DeckCard[], cardId: number): number {
  return deckCards
    .filter((c) => c.id === cardId && c.section !== 'extras')
    .reduce((sum, c) => sum + (c.count || 0), 0);
}

/**
 * Verifica si agregar una copia adicional de la carta infringiría la banlist del formato.
 */
export function checkBanlistViolationOnAdd(
  card: { id: number; ban_tcg?: string; ban_master_duel?: string; ban_duel_links?: string },
  deckCards: DeckCard[],
  format: BanlistFormat = 'TCG'
): BanlistLimitInfo {
  const { limit, status } = getCardBanlistLimit(card, format);
  const currentCopies = getCardCopiesInDeck(deckCards, card.id);

  // Si el límite es menor a 3 (es decir, está restringida) y ya alcanzamos o superamos el límite:
  const isViolated = limit < 3 && currentCopies >= limit;

  return {
    limit,
    status,
    currentCopies,
    isViolated,
  };
}

/**
 * Computa de forma pura todas las infracciones de banlist presentes en el mazo.
 * Compatible con el Mandamiento 3 Zero-Effect (para uso en useMemo).
 */
export function computeBanlistAlerts(
  deckCards: DeckCard[],
  format: BanlistFormat = 'TCG'
): BanlistAlert[] {
  const cardMap = new Map<number, { card: DeckCard; total: number }>();

  for (const c of deckCards) {
    if (c.section === 'extras') continue;
    const existing = cardMap.get(c.id);
    if (existing) {
      existing.total += c.count || 0;
    } else {
      cardMap.set(c.id, { card: c, total: c.count || 0 });
    }
  }

  const alerts: BanlistAlert[] = [];

  for (const { card, total } of cardMap.values()) {
    const { limit, status } = getCardBanlistLimit(card, format);
    if (status !== 'Unlimited' && total > limit) {
      alerts.push({
        cardId: card.id,
        cardName: card.name,
        status: status as 'Forbidden' | 'Limited' | 'Semi-Limited',
        message: `${card.name} excede el límite de ${limit} ${
          limit === 1 ? 'copia' : 'copias'
        } en formato ${format} (actual: ${total}).`,
      });
    }
  }

  return alerts;
}
