import { z } from 'zod';

export const triageScopeSchema = z.object({
  scopeType: z.enum(['all', 'location', 'compartment', 'theme']),
  locationId: z.string().uuid().nullable().optional(),
  compartmentIndex: z.number().int().min(0).nullable().optional(),
  themeTag: z.string().trim().max(100).nullable().optional(),
  onlyUnclassified: z.boolean().default(true),
  sortOrder: z.enum(['physical', 'rarity_desc', 'name_asc']).default('physical'),
});

export type TriageScopeConfig = z.infer<typeof triageScopeSchema>;

export const triageDestinationActionSchema = z.object({
  userCardId: z.string().uuid(),
  destinationType: z.enum([
    'active_deck',
    'thematic_pool',
    'workshop_salad',
    'collection_binder',
    'trade_sale',
    'bulk_discard',
  ]),
  deckId: z.string().uuid().nullable().optional(),
  deckSection: z.enum(['main', 'extra', 'side']).nullable().optional(),
  themeTag: z.string().trim().max(100).nullable().optional(),
  targetLocationId: z.string().uuid().nullable().optional(),
  targetCompartmentIndex: z.number().int().min(0).nullable().optional(),
  rarity: z.string().trim().min(1).max(100),
  salePrice: z.number().min(0).nullable().optional(),
  condition: z.enum(['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged']).default('Near Mint'),
});

export type TriageCardActionPayload = z.infer<typeof triageDestinationActionSchema>;

export interface CardSetPrinting {
  setName: string;
  setCode: string;
  setRarity: string;
  setRarityCode: string;
  setPrice: number;
}

export type RarityAlertLevel = 'none' | 'info' | 'warning' | 'critical';

export interface RarityAlertEvaluation {
  hasDisparity: boolean;
  alertLevel: RarityAlertLevel;
  minPrice: number;
  maxPrice: number;
  priceDifference: number;
  priceMultiplier: number;
  hasCollectorRarity: boolean;
  collectorRaritiesFound: string[];
  highestPricedPrinting: CardSetPrinting | null;
  lowestPricedPrinting: CardSetPrinting | null;
  alertTitle: string;
  alertMessage: string;
  badgeLabel: string;
  badgeColor: 'zinc' | 'blue' | 'amber' | 'red';
  isSafeSamePrice: boolean;
}

export interface CardSetPrintingsResponse {
  cardId: number;
  name: string;
  defaultRarity: string;
  highValueWarning: boolean;
  printings: CardSetPrinting[];
  marketPriceTcg: number;
  marketPriceCardmarket: number;
  rarityAlert?: RarityAlertEvaluation;
}

export interface TriageCompetitiveMatch {
  deckId: string;
  deckName: string;
  section: 'main' | 'extra' | 'side';
  neededCopies: number;
  currentInDeck: number;
  format: string;
}

export interface TriageThematicIncubator {
  themeName: string;
  themeCategory: 'archetype' | 'race' | 'attribute';
  totalCardsInCollection: number;
  uniqueCardsInCollection: number;
  hasEnoughForCore: boolean;
}

export interface TriageWorkshopHeuristic {
  isCandidateForWorkshop: boolean;
  score: number;
  reasons: string[];
}

export interface TacticalVerdict {
  action: TriageCardActionPayload['destinationType'];
  actionLabel: string;
  actionNumber: number; // 1 a 6
  badgeColor: 'emerald' | 'amber' | 'blue' | 'purple' | 'zinc' | 'red';
  headline: string;
  statsAnalysis: string;
  effectSpeedAnalysis: string;
  themeViability: string;
  recommendationDecision: string;
  aiDetailedAdvice?: string;
  powerScore: number;
  tacticalRole: string;
  metaTier: string;
  cardEconomy: string;
  isLearnedOverride?: boolean;
  learnedReason?: string;
}

export interface TriageLearnedRule {
  cardId: number;
  destinationType: TriageCardActionPayload['destinationType'];
  themeTag?: string;
  reason: string;
  rating?: number;
  timestamp: number;
}

export interface TriageDiagnosis {
  cardId: number;
  userCardId: string;
  isStaple: boolean;
  stapleTier: 'Tier 1' | 'Tier 2' | null;
  competitiveMatches: TriageCompetitiveMatch[];
  thematicIncubators: TriageThematicIncubator[];
  workshopHeuristic: TriageWorkshopHeuristic;
  playsetCount: number;
  isSurplus: boolean;
  suggestedPrimaryAction: 'active_deck' | 'thematic_pool' | 'workshop_salad' | 'collection_binder' | 'trade_sale' | 'bulk_discard';
  tacticalVerdict: TacticalVerdict;
}

export interface TriageUndoAction {
  userCardId: string;
  previousCardState: {
    status_flag: string;
    deck_id?: string | null;
    deck_section?: string | null;
    storage_location_id?: string | null;
    compartment_index: number;
    rarity: string;
    sale_price?: number | null;
    notes?: string;
  };
  cardName: string;
  timestamp: number;
}
