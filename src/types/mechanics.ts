export type CardRole = 
  | 'starter' 
  | 'extender' 
  | 'searcher' 
  | 'payoff' 
  | 'handtrap' 
  | 'board_breaker' 
  | 'protection' 
  | 'engine_core'
  | 'staple_generic'
  | 'extra_enabler';

export interface SynergyRationale {
  role: CardRole;
  badgeLabel: string;
  badgeColor: string;
  shortReason: string;
  detailedImpact?: string;
  confidenceScore: number; // 0 a 100
}

export interface DeckValidationReport {
  isValid: boolean;
  unsummonableExtraDeckCards: { cardId: number; name: string; reason: string }[];
  orphanSearchers: { cardId: number; name: string; reason: string }[];
  missingCoreComponents: string[];
  recommendations: string[];
}

export interface ExtraDeckSummonCheckResult {
  canSummon: boolean;
  reason?: string;
  summonType: 'Fusion' | 'Synchro' | 'XYZ' | 'Link' | 'Unknown';
}
