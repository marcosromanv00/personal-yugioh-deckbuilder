import { UserCard, StorageLocation, Deck, CardCondition } from '@/types/collection';

export type CurrencyType = 'USD' | 'EUR';
export type PriceSourceType = 'tcgplayer' | 'cardmarket' | 'ebay';

export interface CardMarketPrices {
  card_id: number;
  name: string;
  tcgplayer_price: number;
  cardmarket_price: number;
  ebay_price: number;
  common_price?: number;
  rare_price?: number;
  super_rare_price?: number;
  ultra_rare_price?: number;
  secret_rare_price?: number;
  sets_count?: number;
}

export interface CardValuationItem {
  userCardId: string;
  cardId: number;
  name: string;
  type: string;
  archetype: string | null;
  imageUrl: string;
  rarity: string;
  condition: CardCondition;
  quantity: number;
  isProxy: boolean;
  statusFlag: string;
  locationId: string | null;
  locationName: string;
  deckId: string | null;
  deckName: string | null;
  salePriceCustom: number | null; // Precio personalizado si el usuario lo asignó
  unitMarketPrice: number; // Precio unitario de mercado estimado (USD o EUR)
  totalMarketValue: number; // unitMarketPrice * quantity (0 si es proxy)
  proxyAcquisitionCost: number; // Costo estimado para comprar la carta original si es proxy
  isHighRarityManual: boolean; // Si tiene una rareza premium asignada manualmente
  isSellCandidate: boolean; // Si es candidata para venta (en trade_sale, gema en bulk o excedente de playset)
  sellReason?: string;
}

export interface ArchetypeValuation {
  archetype: string;
  totalCards: number;
  uniqueCards: number;
  totalValue: number;
  avgCardValue: number;
  topCard: {
    name: string;
    cardId: number;
    rarity: string;
    value: number;
    imageUrl: string;
  } | null;
  monsterCount: number;
  spellCount: number;
  trapCount: number;
  extraCount: number;
}

export interface ContainerValuation {
  containerId: string;
  name: string;
  type: string;
  subType?: string;
  colorCode: string;
  cardCount: number;
  totalValue: number;
  avgCardValue: number;
  topCardName?: string;
  topCardValue?: number;
}

export interface DeckValuation {
  deckId: string;
  name: string;
  format: string;
  totalCards: number;
  totalValue: number;
  realCardsValue: number;
  proxyCardsCount: number;
  proxyReplacementCost: number; // Cuánto cuesta comprar las proxies para jugarlo físico
  topCardName?: string;
  topCardValue?: number;
}

export interface SellOpportunity {
  category: 'trade_sale' | 'hidden_gem_bulk' | 'playset_surplus';
  categoryLabel: string;
  card: CardValuationItem;
  recommendedPrice: number;
  reason: string;
}

export interface ValuationSummary {
  currency: CurrencyType;
  totalPortfolioValue: number;
  totalTradeSaleValue: number;
  totalDeckCardsValue: number;
  totalContainerCardsValue: number;
  totalInboxCardsValue: number;
  totalProxyReplacementCost: number;
  totalCardsCount: number;
  totalOriginalCardsCount: number;
  totalProxiesCount: number;
  averageCardValue: number;
  topValuedCards: CardValuationItem[];
  sellOpportunities: SellOpportunity[];
  archetypeValuations: ArchetypeValuation[];
  containerValuations: ContainerValuation[];
  deckValuations: DeckValuation[];
  rarityDistribution: {
    rarity: string;
    count: number;
    totalValue: number;
    percentage: number;
  }[];
  typeDistribution: {
    typeGroup: 'Monstruos' | 'Mágicas' | 'Trampas' | 'Extra Deck';
    count: number;
    totalValue: number;
    percentage: number;
  }[];
  conditionDistribution: {
    condition: CardCondition;
    count: number;
    totalValue: number;
  }[];
}

// Multiplicadores según la condición física de la carta
export const CONDITION_MULTIPLIERS: Record<CardCondition, number> = {
  'Near Mint': 1.0,
  'Lightly Played': 0.85,
  'Moderately Played': 0.70,
  'Heavily Played': 0.50,
  'Damaged': 0.30,
};

// Rarezas premium de colección (solo se consideran si el usuario las agregó manualmente)
export const HIGH_END_RARITIES = new Set([
  'Secret Rare',
  'Prismatic Secret Rare',
  'Prismatic Ultimate Rare',
  'Prismatic Platinum Rare',
  'Platinum Secret Rare',
  'Starlight Rare',
  "Collector's Rare",
  'Quarter Century Secret Rare',
  'Ghost Rare',
  'Ultimate Rare',
  'Gold Secret Rare',
]);

// Rarezas accesibles y estándar
export const STANDARD_RARITIES = new Set([
  'Common',
  'Short Print',
  'Super Short Print',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Gold Rare',
  'Duel Terminal',
  'Duel Terminal Normal Parallel Rare',
  'Duel Terminal Rare Parallel Rare',
  'Duel Terminal Super Parallel Rare',
  'Duel Terminal Ultra Parallel Rare',
  'Mosaic Rare',
  'Starfoil Rare',
  'Shatterfoil Rare',
]);

/**
 * Resuelve el precio unitario base de una carta considerando el requerimiento:
 * - Si no tiene rareza registrada o es estándar (Común, Rare, Super, Ultra): se usa el precio de mercado estándar accesible.
 * - Si el usuario registró manualmente una rareza Secret o superior: se aplica la cotización especial si está disponible o un multiplicador de rareza premium.
 */
export function resolveCardUnitPrice(
  rarity: string | undefined,
  condition: CardCondition = 'Near Mint',
  marketData?: CardMarketPrices,
  currency: CurrencyType = 'USD'
): { unitPrice: number; isHighRarity: boolean } {
  // Precio base de mercado (TCGPlayer en USD o Cardmarket en EUR)
  let basePrice = 0.25; // fallback razonable por defecto

  if (marketData) {
    basePrice = currency === 'USD' 
      ? (marketData.tcgplayer_price > 0 ? marketData.tcgplayer_price : 0.25)
      : (marketData.cardmarket_price > 0 ? marketData.cardmarket_price : 0.20);
  }

  const cleanRarity = (rarity || 'Common').trim();
  const isHighRarity = HIGH_END_RARITIES.has(cleanRarity);

  // Ajuste por rareza registrada
  let rarityMultiplier = 1.0;
  if (isHighRarity) {
    if (cleanRarity.includes('Starlight') || cleanRarity.includes('Quarter Century')) {
      rarityMultiplier = 15.0; // Ediciones especiales de lujo
    } else if (cleanRarity.includes("Collector's") || cleanRarity.includes('Ghost') || cleanRarity.includes('Ultimate')) {
      rarityMultiplier = 8.0;
    } else if (cleanRarity.includes('Secret')) {
      rarityMultiplier = 2.5; // Versión Secret Rare
    }
  } else {
    // Para versiones estándar (Común, Rare, Super, Ultra):
    // Se mantiene el precio base de mercado estándar que refleja las versiones en circulación accesible
    rarityMultiplier = 1.0;
  }

  // Ajuste por condición física
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition] || 1.0;

  const finalUnitPrice = Math.max(0.05, parseFloat((basePrice * rarityMultiplier * conditionMultiplier).toFixed(2)));

  return {
    unitPrice: finalUnitPrice,
    isHighRarity,
  };
}

/**
 * Calcula la valoración completa de una colección de cartas de usuario.
 */
export function generateCollectionValuation(
  userCards: UserCard[],
  locations: StorageLocation[],
  decks: Deck[],
  marketPricesMap: Map<number, CardMarketPrices> = new Map(),
  currency: CurrencyType = 'USD'
): ValuationSummary {
  const locationMap = new Map<string, StorageLocation>();
  locations.forEach((loc) => locationMap.set(loc.id, loc));

  const deckMap = new Map<string, Deck>();
  decks.forEach((d) => deckMap.set(d.id, d));

  // Mapa de recuento total de copias físicas por ID de carta para detectar excedentes de playset (> 3 copias)
  const totalCopiesPerCardId = new Map<number, number>();
  userCards.forEach((c) => {
    if (!c.is_proxy) {
      const current = totalCopiesPerCardId.get(c.card_id) || 0;
      totalCopiesPerCardId.set(c.card_id, current + (c.quantity || 1));
    }
  });

  const evaluatedItems: CardValuationItem[] = [];
  let totalPortfolioValue = 0;
  let totalTradeSaleValue = 0;
  let totalDeckCardsValue = 0;
  let totalContainerCardsValue = 0;
  let totalInboxCardsValue = 0;
  let totalProxyReplacementCost = 0;
  let totalCardsCount = 0;
  let totalOriginalCardsCount = 0;
  let totalProxiesCount = 0;

  const rarityMap = new Map<string, { count: number; totalValue: number }>();
  const typeMap = new Map<'Monstruos' | 'Mágicas' | 'Trampas' | 'Extra Deck', { count: number; totalValue: number }>([
    ['Monstruos', { count: 0, totalValue: 0 }],
    ['Mágicas', { count: 0, totalValue: 0 }],
    ['Trampas', { count: 0, totalValue: 0 }],
    ['Extra Deck', { count: 0, totalValue: 0 }],
  ]);
  const conditionMap = new Map<CardCondition, { count: number; totalValue: number }>();

  // Contenedores acumuladores
  const containerSums = new Map<string, { count: number; totalValue: number; topCard: { name: string; value: number } | null }>();
  locations.forEach((l) => containerSums.set(l.id, { count: 0, totalValue: 0, topCard: null }));

  // Decks acumuladores
  const deckSums = new Map<string, { totalCards: number; totalValue: number; realValue: number; proxyCount: number; proxyCost: number; topCard: { name: string; value: number } | null }>();
  decks.forEach((d) => deckSums.set(d.id, { totalCards: 0, totalValue: 0, realValue: 0, proxyCount: 0, proxyCost: 0, topCard: null }));

  // Arquetipos acumuladores
  const archetypeSums = new Map<string, {
    totalCards: number;
    uniqueCards: Set<number>;
    totalValue: number;
    topCard: { name: string; cardId: number; rarity: string; value: number; imageUrl: string } | null;
    monsterCount: number;
    spellCount: number;
    trapCount: number;
    extraCount: number;
  }>();

  // Procesar cada carta de usuario
  for (const card of userCards) {
    const qty = card.quantity || 1;
    totalCardsCount += qty;

    const marketData = marketPricesMap.get(card.card_id);
    const { unitPrice, isHighRarity } = resolveCardUnitPrice(
      card.rarity,
      card.condition,
      marketData,
      currency
    );

    const isProxy = !!card.is_proxy;
    const cardName = card.card_details?.name || `Carta #${card.card_id}`;
    const cardType = card.card_details?.type || 'Monster';
    const archetype = card.card_details?.archetype || null;
    const imageUrl = card.card_details?.image_url || card.card_details?.image_url_small || 'https://images.ygoprodeck.com/images/cards/placeholder.jpg';

    // Determinar nombre de contenedor y deck
    const loc = card.storage_location_id ? locationMap.get(card.storage_location_id) : null;
    const locationName = loc ? loc.name : card.deck_id ? 'En Deck' : 'Bandeja Sin Clasificar (Inbox)';
    const deck = card.deck_id ? deckMap.get(card.deck_id) : null;
    const deckName = deck ? deck.name : null;

    let itemMarketValue = 0;
    let proxyCost = 0;

    if (isProxy) {
      totalProxiesCount += qty;
      proxyCost = unitPrice * qty;
      totalProxyReplacementCost += proxyCost;
    } else {
      totalOriginalCardsCount += qty;
      itemMarketValue = unitPrice * qty;
      totalPortfolioValue += itemMarketValue;

      // Desglose por ubicación
      if (card.deck_id) {
        totalDeckCardsValue += itemMarketValue;
      } else if (card.storage_location_id) {
        totalContainerCardsValue += itemMarketValue;
      } else {
        totalInboxCardsValue += itemMarketValue;
      }

      if (card.status_flag === 'trade_sale') {
        const effectiveSalePrice = card.sale_price !== undefined && card.sale_price !== null && card.sale_price > 0
          ? card.sale_price * qty
          : itemMarketValue;
        totalTradeSaleValue += effectiveSalePrice;
      }

      // Distribución por rareza
      const currentRarity = card.rarity || 'Common';
      const rEntry = rarityMap.get(currentRarity) || { count: 0, totalValue: 0 };
      rEntry.count += qty;
      rEntry.totalValue += itemMarketValue;
      rarityMap.set(currentRarity, rEntry);

      // Distribución por tipo de carta
      const typeLower = cardType.toLowerCase();
      const isExtra = ['fusion', 'synchro', 'xyz', 'link'].some((t) => typeLower.includes(t));
      const typeGroup: 'Monstruos' | 'Mágicas' | 'Trampas' | 'Extra Deck' = isExtra
        ? 'Extra Deck'
        : typeLower.includes('spell')
        ? 'Mágicas'
        : typeLower.includes('trap')
        ? 'Trampas'
        : 'Monstruos';

      const tEntry = typeMap.get(typeGroup)!;
      tEntry.count += qty;
      tEntry.totalValue += itemMarketValue;

      // Distribución por condición
      const cEntry = conditionMap.get(card.condition) || { count: 0, totalValue: 0 };
      cEntry.count += qty;
      cEntry.totalValue += itemMarketValue;
      conditionMap.set(card.condition, cEntry);
    }

    // Contenedores acumuladores
    if (card.storage_location_id && containerSums.has(card.storage_location_id)) {
      const cSum = containerSums.get(card.storage_location_id)!;
      cSum.count += qty;
      if (!isProxy) {
        cSum.totalValue += itemMarketValue;
        if (!cSum.topCard || unitPrice > cSum.topCard.value) {
          cSum.topCard = { name: cardName, value: unitPrice };
        }
      }
    }

    // Decks acumuladores
    if (card.deck_id && deckSums.has(card.deck_id)) {
      const dSum = deckSums.get(card.deck_id)!;
      dSum.totalCards += qty;
      if (isProxy) {
        dSum.proxyCount += qty;
        dSum.proxyCost += proxyCost;
      } else {
        dSum.realValue += itemMarketValue;
        dSum.totalValue += itemMarketValue;
        if (!dSum.topCard || unitPrice > dSum.topCard.value) {
          dSum.topCard = { name: cardName, value: unitPrice };
        }
      }
    }

    // Arquetipos acumuladores
    if (archetype && !isProxy) {
      if (!archetypeSums.has(archetype)) {
        archetypeSums.set(archetype, {
          totalCards: 0,
          uniqueCards: new Set(),
          totalValue: 0,
          topCard: null,
          monsterCount: 0,
          spellCount: 0,
          trapCount: 0,
          extraCount: 0,
        });
      }
      const aSum = archetypeSums.get(archetype)!;
      aSum.totalCards += qty;
      aSum.uniqueCards.add(card.card_id);
      aSum.totalValue += itemMarketValue;

      const typeLower = cardType.toLowerCase();
      if (['fusion', 'synchro', 'xyz', 'link'].some((t) => typeLower.includes(t))) {
        aSum.extraCount += qty;
      } else if (typeLower.includes('spell')) {
        aSum.spellCount += qty;
      } else if (typeLower.includes('trap')) {
        aSum.trapCount += qty;
      } else {
        aSum.monsterCount += qty;
      }

      if (!aSum.topCard || unitPrice > aSum.topCard.value) {
        aSum.topCard = {
          name: cardName,
          cardId: card.card_id,
          rarity: card.rarity || 'Common',
          value: unitPrice,
          imageUrl,
        };
      }
    }

    // Comprobación de candidatas a venta
    let isSellCandidate = false;
    let sellReason: string | undefined;

    if (!isProxy) {
      if (card.status_flag === 'trade_sale') {
        isSellCandidate = true;
        sellReason = 'Marcada para Trade / Venta';
      } else if (card.status_flag === 'bulk' && unitPrice >= 1.50) {
        isSellCandidate = true;
        sellReason = 'Gema Oculta en Bulk (Valor ≥ $1.50)';
      } else if (!card.deck_id && (totalCopiesPerCardId.get(card.card_id) || 0) > 3 && unitPrice >= 1.00) {
        isSellCandidate = true;
        sellReason = 'Excedente de Playset (> 3 copias físicas)';
      }
    }

    evaluatedItems.push({
      userCardId: card.id,
      cardId: card.card_id,
      name: cardName,
      type: cardType,
      archetype,
      imageUrl,
      rarity: card.rarity || 'Common',
      condition: card.condition,
      quantity: qty,
      isProxy,
      statusFlag: card.status_flag,
      locationId: card.storage_location_id,
      locationName,
      deckId: card.deck_id || null,
      deckName,
      salePriceCustom: card.sale_price || null,
      unitMarketPrice: unitPrice,
      totalMarketValue: itemMarketValue,
      proxyAcquisitionCost: proxyCost,
      isHighRarityManual: isHighRarity,
      isSellCandidate,
      sellReason,
    });
  }

  // Top cartas más valiosas (excluyendo proxies) ordenadas de mayor a menor valor total
  const topValuedCards = [...evaluatedItems]
    .filter((c) => !c.isProxy && c.unitMarketPrice > 0)
    .sort((a, b) => b.unitMarketPrice - a.unitMarketPrice)
    .slice(0, 30);

  // Oportunidades de venta estructuradas
  const sellOpportunities: SellOpportunity[] = [];
  evaluatedItems
    .filter((c) => c.isSellCandidate)
    .forEach((item) => {
      let cat: 'trade_sale' | 'hidden_gem_bulk' | 'playset_surplus' = 'trade_sale';
      let catLabel = 'Para Venta';
      if (item.statusFlag === 'bulk') {
        cat = 'hidden_gem_bulk';
        catLabel = 'Gema en Bulk';
      } else if ((totalCopiesPerCardId.get(item.cardId) || 0) > 3) {
        cat = 'playset_surplus';
        catLabel = 'Excedente';
      }

      sellOpportunities.push({
        category: cat,
        categoryLabel: catLabel,
        card: item,
        recommendedPrice: item.salePriceCustom || item.unitMarketPrice,
        reason: item.sellReason || 'Oportunidad de monetización',
      });
    });

  // Arquetipos procesados y ordenados por valor invertido
  const archetypeValuations: ArchetypeValuation[] = Array.from(archetypeSums.entries())
    .map(([archName, data]) => ({
      archetype: archName,
      totalCards: data.totalCards,
      uniqueCards: data.uniqueCards.size,
      totalValue: parseFloat(data.totalValue.toFixed(2)),
      avgCardValue: parseFloat((data.totalValue / (data.totalCards || 1)).toFixed(2)),
      topCard: data.topCard,
      monsterCount: data.monsterCount,
      spellCount: data.spellCount,
      trapCount: data.trapCount,
      extraCount: data.extraCount,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  // Contenedores procesados
  const containerValuations: ContainerValuation[] = locations
    .map((loc) => {
      const data = containerSums.get(loc.id) || { count: 0, totalValue: 0, topCard: null };
      return {
        containerId: loc.id,
        name: loc.name,
        type: loc.type,
        subType: loc.sub_type,
        colorCode: loc.color_code || '#8b5cf6',
        cardCount: data.count,
        totalValue: parseFloat(data.totalValue.toFixed(2)),
        avgCardValue: parseFloat((data.totalValue / (data.count || 1)).toFixed(2)),
        topCardName: data.topCard?.name,
        topCardValue: data.topCard?.value,
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  // Decks procesados
  const deckValuations: DeckValuation[] = decks
    .map((d) => {
      const data = deckSums.get(d.id) || { totalCards: 0, totalValue: 0, realValue: 0, proxyCount: 0, proxyCost: 0, topCard: null };
      return {
        deckId: d.id,
        name: d.name,
        format: d.format || 'Master Duel',
        totalCards: data.totalCards,
        totalValue: parseFloat(data.totalValue.toFixed(2)),
        realCardsValue: parseFloat(data.realValue.toFixed(2)),
        proxyCardsCount: data.proxyCount,
        proxyReplacementCost: parseFloat(data.proxyCost.toFixed(2)),
        topCardName: data.topCard?.name,
        topCardValue: data.topCard?.value,
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  // Distribución de rarezas con porcentajes
  const rarityDistribution = Array.from(rarityMap.entries())
    .map(([rarity, data]) => ({
      rarity,
      count: data.count,
      totalValue: parseFloat(data.totalValue.toFixed(2)),
      percentage: totalPortfolioValue > 0 ? parseFloat(((data.totalValue / totalPortfolioValue) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  // Distribución de tipos
  const typeDistribution = Array.from(typeMap.entries()).map(([typeGroup, data]) => ({
    typeGroup,
    count: data.count,
    totalValue: parseFloat(data.totalValue.toFixed(2)),
    percentage: totalPortfolioValue > 0 ? parseFloat(((data.totalValue / totalPortfolioValue) * 100).toFixed(1)) : 0,
  }));

  // Distribución de condición
  const conditionDistribution = Array.from(conditionMap.entries()).map(([condition, data]) => ({
    condition,
    count: data.count,
    totalValue: parseFloat(data.totalValue.toFixed(2)),
  }));

  const avgCardValue = totalOriginalCardsCount > 0 ? parseFloat((totalPortfolioValue / totalOriginalCardsCount).toFixed(2)) : 0;

  return {
    currency,
    totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
    totalTradeSaleValue: parseFloat(totalTradeSaleValue.toFixed(2)),
    totalDeckCardsValue: parseFloat(totalDeckCardsValue.toFixed(2)),
    totalContainerCardsValue: parseFloat(totalContainerCardsValue.toFixed(2)),
    totalInboxCardsValue: parseFloat(totalInboxCardsValue.toFixed(2)),
    totalProxyReplacementCost: parseFloat(totalProxyReplacementCost.toFixed(2)),
    totalCardsCount,
    totalOriginalCardsCount,
    totalProxiesCount,
    averageCardValue: avgCardValue,
    topValuedCards,
    sellOpportunities,
    archetypeValuations,
    containerValuations,
    deckValuations,
    rarityDistribution,
    typeDistribution,
    conditionDistribution,
  };
}

/**
 * Exporta el reporte de valoración a un archivo CSV estructurado listo para descargar.
 */
export function exportValuationReportToCSV(summary: ValuationSummary, items: CardValuationItem[]): string {
  const headers = [
    'ID Carta',
    'Nombre',
    'Tipo',
    'Arquetipo',
    'Rareza',
    'Condicion',
    'Cantidad',
    'Es Proxy',
    'Estado',
    'Ubicacion',
    'Deck Asignado',
    `Precio Unitario (${summary.currency})`,
    `Valor Total (${summary.currency})`,
    `Precio Venta Personalizado (${summary.currency})`,
  ];

  const escapeCSV = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = items.map((item) => [
    escapeCSV(item.cardId),
    escapeCSV(item.name),
    escapeCSV(item.type),
    escapeCSV(item.archetype || 'N/A'),
    escapeCSV(item.rarity),
    escapeCSV(item.condition),
    escapeCSV(item.quantity),
    escapeCSV(item.isProxy ? 'SI' : 'NO'),
    escapeCSV(item.statusFlag),
    escapeCSV(item.locationName),
    escapeCSV(item.deckName || 'Sin Asignar'),
    escapeCSV(item.unitMarketPrice.toFixed(2)),
    escapeCSV(item.totalMarketValue.toFixed(2)),
    escapeCSV(item.salePriceCustom ? item.salePriceCustom.toFixed(2) : ''),
  ]);

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n');

  return csvContent;
}
