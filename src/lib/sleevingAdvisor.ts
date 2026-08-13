import { UserCard } from '@/types/collection';

export interface SleeveRecommendation {
  cardId: string;
  cardName: string;
  rarity: string;
  currentSleeve: string;
  recommendedSleeve: 'none' | 'single' | 'double';
  recommendedBrand?: string;
  recommendedColor?: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface SleevingAdvisorReport {
  recommendations: SleeveRecommendation[];
  summary: {
    doubleSleeveNeededCount: number;
    tournamentComplianceIssues: number;
    bulkSavingsCount: number;
  };
}

const HIGH_PROTECTION_RARITIES = [
  'Starlight Rare',
  'Quarter Century Secret Rare',
  'Ghost Rare',
  'Ultimate Rare',
  'Secret Rare',
  'Collector\'s Rare',
];

export function analyzeCardSleeving(userCards: UserCard[]): SleevingAdvisorReport {
  const recommendations: SleeveRecommendation[] = [];
  let doubleSleeveNeededCount = 0;
  let tournamentComplianceIssues = 0;
  let bulkSavingsCount = 0;

  for (const card of userCards) {
    const cardName = card.card_details?.name || `Carta #${card.card_id}`;
    const rarity = card.rarity || 'Common';
    const isHighRarity = HIGH_PROTECTION_RARITIES.some(r => rarity.toLowerCase().includes(r.toLowerCase()));
    const currentSleeve = card.sleeve_type || 'none';

    // 1. Cartas de Alta Rareza -> Requieren Doble Funda
    if (isHighRarity && currentSleeve !== 'double' && currentSleeve !== 'triple') {
      doubleSleeveNeededCount++;
      recommendations.push({
        cardId: card.id,
        cardName,
        rarity,
        currentSleeve,
        recommendedSleeve: 'double',
        recommendedBrand: 'KMC Perfect Fit + Dragon Shield Matte',
        recommendedColor: 'Inner Clear + Outer Matte Black',
        priority: 'high',
        reason: `Carta de alta rareza (${rarity}): Se recomienda Doble Funda (Inner Perfect Fit + Outer) para proteger contra desgaste y humedad.`,
      });
    }
    // 2. Cartas en Decks Activos -> Requieren uniformidad
    else if (card.status_flag === 'in_deck' && currentSleeve === 'none') {
      tournamentComplianceIssues++;
      recommendations.push({
        cardId: card.id,
        cardName,
        rarity,
        currentSleeve,
        recommendedSleeve: 'single',
        recommendedBrand: 'Dragon Shield Japanese Size',
        recommendedColor: 'Matte Black',
        priority: 'high',
        reason: 'Carta en Deck Activo sin funda: Es obligatorio enfundar con color uniforme para torneos TCG.',
      });
    }
    // 3. Cartas Bulk en Funda Cara -> Sugerencia de ahorro
    else if (card.status_flag === 'bulk' && (currentSleeve === 'single' || currentSleeve === 'double')) {
      bulkSavingsCount++;
      recommendations.push({
        cardId: card.id,
        cardName,
        rarity,
        currentSleeve,
        recommendedSleeve: 'none',
        priority: 'low',
        reason: 'Carta Bulk/Común en funda: Puedes retirar la funda para reutilizarla en cartas de mayor valor.',
      });
    }
  }

  return {
    recommendations,
    summary: {
      doubleSleeveNeededCount,
      tournamentComplianceIssues,
      bulkSavingsCount,
    },
  };
}
