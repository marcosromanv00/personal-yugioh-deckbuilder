/**
 * Tipos para la Base de Conocimiento y Cerebro del Agente (Yu-Gi-Oh! Knowledge Hub)
 */

export type FormatType = 'TCG' | 'OCG' | 'Master Duel';

export interface ArchetypeRatioBreakdown {
  archetypeName: string;
  archetypeBadgeImage?: string;
  ratio_3x_pct: number; // Porcentaje de mazos que llevan 3 copias (0 - 100)
  ratio_2x_pct: number; // Porcentaje de mazos que llevan 2 copias (0 - 100)
  ratio_1x_pct: number; // Porcentaje de mazos que llevan 1 copia (0 - 100)
  ratio_0x_pct: number; // Porcentaje de mazos del arquetipo que no la llevan (0 - 100)
  sampleDeckCount?: number;
  is_user_verified?: boolean;
  notes?: string;
}

export interface PopularityRanking {
  overallRank: number; // ej. 51st
  categoryRank: number; // ej. 39th
  categoryName: string; // ej. "Among Monsters" | "Among Spells" | "Among Traps"
  overallUsagePercent: number;
}

export interface CardRuling {
  id: string;
  topic: string; // ej. "Damage Step", "Missing Timing", "Fusion Material Substitutes"
  rulingText: string;
  source: 'Konami Official' | 'Judge Program' | 'User Override';
  is_user_verified?: boolean;
}

export interface RecentTournamentDeck {
  id: string;
  deckName: string;
  tournamentName: string;
  player: string;
  placement: string; // ej. "1st Place", "Top 4", "Top 8"
  date: string;
  copiesUsed: number;
  decklistUrl?: string;
}

export interface CardMarketInfo {
  tcgplayerPrice?: number;
  cardmarketPrice?: number;
  releaseDates: {
    tcg?: string;
    ocg?: string;
    masterDuel?: string;
  };
}

export interface FormatKnowledgeStats {
  format: FormatType;
  ranking: PopularityRanking;
  archetypeBreakdowns: ArchetypeRatioBreakdown[];
  recentDecks: RecentTournamentDeck[];
}

export interface CardKnowledgeData {
  cardId: number;
  cardName: string;
  type: string;
  attribute?: string;
  race?: string;
  level?: number;
  atk?: number;
  def?: number;
  desc?: string;
  archetype?: string;
  imageUrl: string;
  imageUrlSmall: string;
  marketInfo: CardMarketInfo;
  rulings: CardRuling[];
  formats: Record<FormatType, FormatKnowledgeStats>;
  is_user_verified?: boolean;
  userVerificationNotes?: string;
  lastUpdated: string;
}

export interface KnowledgeAuditLog {
  id: string;
  cardId: number;
  cardName: string;
  format: FormatType;
  action: 'archetype_ratio_updated' | 'archetype_added' | 'ruling_added' | 'ranking_adjusted' | 'reset_to_meta';
  summary: string;
  reason?: string;
  timestamp: string;
}
