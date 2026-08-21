import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { DeckCard } from '@/components/deckbuilder/types';
import { KNOWN_STAPLES_CATALOG } from '@/lib/collectionSuggestions';

export type RecommendedDeckStyle = 'all' | 'control' | 'combo' | 'ensalada' | 'tematico';

export interface RecommendedDeckCardItem {
  id: number;
  name: string;
  count: number;
  section: 'main' | 'extra' | 'side';
  type: string;
  archetype?: string;
  image_url?: string;
  image_url_small?: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
}

export interface RecommendedDeckRecipe {
  id: string;
  name: string;
  style: 'control' | 'combo' | 'ensalada' | 'tematico';
  styleLabel: string;
  styleColor: string;
  archetypes: string[];
  description: string;
  strategyGuide: string;
  mainDeckCount: number;
  extraDeckCount: number;
  monsterCount: number;
  spellCount: number;
  trapCount: number;
  keyCards: RecommendedDeckCardItem[];
  cards: RecommendedDeckCardItem[];
  format: 'Master Duel' | 'TCG' | 'Duel Links';
}

/**
 * Motor inteligente que analiza exclusivamente las cartas libres (sin deck activo)
 * y ensambla barajas 100% jugables listas para el taller.
 */
export function generateRecommendedDecksFromFreeCollection(
  allUserCards: UserCard[],
  activeDecks: Deck[]
): RecommendedDeckRecipe[] {
  // 1. FILTRO ESTRICTO: Solo cartas no registradas a ningún deck activo (las cartas de decks inactivos o sin deck están disponibles)
  const activeDeckIds = new Set(activeDecks.filter(d => d.is_active !== false).map(d => d.id));
  const freeCards = allUserCards.filter(c => !c.deck_id || !activeDeckIds.has(c.deck_id));

  if (freeCards.length < 15) {
    return [];
  }

  // Mapa consolidado de cartas libres disponibles: card_id -> { card, availableQuantity }
  const freePool = new Map<number, { sample: UserCard; totalQty: number }>();
  freeCards.forEach(c => {
    const existing = freePool.get(c.card_id);
    const qty = c.quantity || 1;
    if (existing) {
      existing.totalQty += qty;
    } else {
      freePool.set(c.card_id, { sample: c, totalQty: qty });
    }
  });

  // Clasificación por arquetipos en el pool libre
  const archetypePool = new Map<string, { cardId: number; sample: UserCard; qty: number }[]>();
  const genericMonsters: { cardId: number; sample: UserCard; qty: number }[] = [];
  const genericSpells: { cardId: number; sample: UserCard; qty: number }[] = [];
  const genericTraps: { cardId: number; sample: UserCard; qty: number }[] = [];
  const genericExtra: { cardId: number; sample: UserCard; qty: number }[] = [];

  freePool.forEach(({ sample, totalQty }, cardId) => {
    const arch = sample.card_details?.archetype?.trim();
    const type = sample.card_details?.type || '';
    const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');

    if (arch) {
      const list = archetypePool.get(arch) || [];
      list.push({ cardId, sample, qty: totalQty });
      archetypePool.set(arch, list);
    } else {
      if (isExtra) {
        genericExtra.push({ cardId, sample, qty: totalQty });
      } else if (type.includes('Monster')) {
        genericMonsters.push({ cardId, sample, qty: totalQty });
      } else if (type.includes('Spell')) {
        genericSpells.push({ cardId, sample, qty: totalQty });
      } else if (type.includes('Trap')) {
        genericTraps.push({ cardId, sample, qty: totalQty });
      }
    }
  });

  const recommendedDecks: RecommendedDeckRecipe[] = [];

  // Helper para convertir entrada a RecommendedDeckCardItem
  const toCardItem = (
    sample: UserCard,
    count: number,
    section: 'main' | 'extra' = 'main'
  ): RecommendedDeckCardItem => ({
    id: sample.card_id,
    name: sample.card_details?.name || `Carta #${sample.card_id}`,
    count,
    section,
    type: sample.card_details?.type || 'Monster',
    archetype: sample.card_details?.archetype,
    image_url: sample.card_details?.image_url || sample.card_details?.image_url_small,
    image_url_small: sample.card_details?.image_url_small || sample.card_details?.image_url,
    atk: sample.card_details?.atk,
    def: sample.card_details?.def,
    level: sample.card_details?.level,
    race: sample.card_details?.race,
    attribute: sample.card_details?.attribute,
  });

  // Identificar los 4 arquetipos con mayor presencia de cartas libres
  const sortedArchetypes = Array.from(archetypePool.entries())
    .map(([name, cards]) => ({
      name,
      cards,
      totalQty: cards.reduce((acc, c) => acc + c.qty, 0),
      distinctCount: cards.length,
    }))
    .sort((a, b) => b.totalQty - a.totalQty);

  // ── 1. GENERAR RECETA TEMÁTICA / ARQUETIPO PURO ───────────────────────
  if (sortedArchetypes.length > 0) {
    const topArch = sortedArchetypes[0];
    const deckCardsList: RecommendedDeckCardItem[] = [];
    let currentMainCount = 0;
    let currentExtraCount = 0;

    // Cartas del arquetipo
    topArch.cards.forEach(({ sample, qty }) => {
      const type = sample.card_details?.type || '';
      const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');
      const useQty = Math.min(qty, 3);

      if (isExtra) {
        if (currentExtraCount < 15) {
          const addQty = Math.min(useQty, 15 - currentExtraCount);
          deckCardsList.push(toCardItem(sample, addQty, 'extra'));
          currentExtraCount += addQty;
        }
      } else {
        if (currentMainCount < 40) {
          const addQty = Math.min(useQty, 40 - currentMainCount);
          deckCardsList.push(toCardItem(sample, addQty, 'main'));
          currentMainCount += addQty;
        }
      }
    });

    // Rellenar con staples y genéricas hasta mínimo 40
    const fillers = [...genericSpells, ...genericMonsters, ...genericTraps];
    for (const { sample, qty } of fillers) {
      if (currentMainCount >= 40) break;
      const addQty = Math.min(qty, 3, 40 - currentMainCount);
      deckCardsList.push(toCardItem(sample, addQty, 'main'));
      currentMainCount += addQty;
    }

    // Extra deck genérico
    for (const { sample, qty } of genericExtra) {
      if (currentExtraCount >= 15) break;
      const addQty = Math.min(qty, 15 - currentExtraCount);
      deckCardsList.push(toCardItem(sample, addQty, 'extra'));
      currentExtraCount += addQty;
    }

    if (currentMainCount >= 20) {
      const monsters = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
      const spells = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
      const traps = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

      recommendedDecks.push({
        id: `rec_tematico_${topArch.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: `Vanguardia ${topArch.name}`,
        style: 'tematico',
        styleLabel: 'Temático / Core',
        styleColor: 'from-purple-600 to-indigo-600',
        archetypes: [topArch.name],
        description: `Baraja optimizada enfocada en la consistencia del motor ${topArch.name} utilizando exclusivamente piezas libres de tu inventario.`,
        strategyGuide: `Inicia buscando tus piezas clave de ${topArch.name} para establecer tu presencia en campo y complementa con tus cartas de soporte genéricas.`,
        mainDeckCount: currentMainCount,
        extraDeckCount: currentExtraCount,
        monsterCount: monsters,
        spellCount: spells,
        trapCount: traps,
        keyCards: deckCardsList.slice(0, 5),
        cards: deckCardsList,
        format: 'Master Duel',
      });
    }
  }

  // ── 2. GENERAR RECETA "ENSALADA / FUN" (HÍBRIDO DE 2 ARQUETIPOS / MOTORES) ─
  if (sortedArchetypes.length >= 2) {
    const arch1 = sortedArchetypes[0];
    const arch2 = sortedArchetypes[1];
    const deckCardsList: RecommendedDeckCardItem[] = [];
    let currentMainCount = 0;
    let currentExtraCount = 0;

    // Repartir cartas de ambos motores
    [arch1, arch2].forEach(arch => {
      arch.cards.forEach(({ sample, qty }) => {
        const type = sample.card_details?.type || '';
        const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');
        const useQty = Math.min(qty, 3);

        if (isExtra && currentExtraCount < 15) {
          const addQty = Math.min(useQty, 15 - currentExtraCount);
          deckCardsList.push(toCardItem(sample, addQty, 'extra'));
          currentExtraCount += addQty;
        } else if (!isExtra && currentMainCount < 40) {
          const addQty = Math.min(useQty, 40 - currentMainCount);
          deckCardsList.push(toCardItem(sample, addQty, 'main'));
          currentMainCount += addQty;
        }
      });
    });

    // Rellenar con staples
    const fillers = [...genericSpells, ...genericTraps, ...genericMonsters];
    for (const { sample, qty } of fillers) {
      if (currentMainCount >= 40) break;
      const addQty = Math.min(qty, 3, 40 - currentMainCount);
      deckCardsList.push(toCardItem(sample, addQty, 'main'));
      currentMainCount += addQty;
    }

    if (currentMainCount >= 20) {
      const monsters = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
      const spells = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
      const traps = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

      recommendedDecks.push({
        id: `rec_ensalada_${arch1.name}_${arch2.name}`.toLowerCase().replace(/\s+/g, '_'),
        name: `Híbrido ${arch1.name} & ${arch2.name}`,
        style: 'ensalada',
        styleLabel: 'Ensalada / Fun',
        styleColor: 'from-amber-500 to-orange-600',
        archetypes: [arch1.name, arch2.name],
        description: `Estrategia creativa que fusiona la versatilidad de ${arch1.name} con los recursos de ${arch2.name} para sorprender en partidas casuales y locales.`,
        strategyGuide: `Aprovecha las aperturas duales. Si un motor es interrumpido, utiliza el segundo arquetipo como extensor para no ceder el turno.`,
        mainDeckCount: currentMainCount,
        extraDeckCount: currentExtraCount,
        monsterCount: monsters,
        spellCount: spells,
        trapCount: traps,
        keyCards: deckCardsList.slice(0, 5),
        cards: deckCardsList,
        format: 'TCG',
      });
    }
  }

  // ── 3. GENERAR RECETA "CONTROL" (TRAMPAS, INTERRUPCIONES Y HANDTRAPS) ──
  {
    const deckCardsList: RecommendedDeckCardItem[] = [];
    let currentMainCount = 0;
    let currentExtraCount = 0;

    // Priorizar trampas y magias de control
    const controlTraps = [...genericTraps];
    const controlSpells = [...genericSpells];
    const handtrapsAndStaples = freeCards.filter(c => KNOWN_STAPLES_CATALOG[c.card_details?.name || '']);

    // Añadir Handtraps / Staples
    const seenStapleIds = new Set<number>();
    handtrapsAndStaples.forEach(c => {
      if (!seenStapleIds.has(c.card_id) && currentMainCount < 40) {
        seenStapleIds.add(c.card_id);
        const freeEntry = freePool.get(c.card_id);
        const qty = freeEntry ? Math.min(freeEntry.totalQty, 3) : 1;
        const addQty = Math.min(qty, 40 - currentMainCount);
        deckCardsList.push(toCardItem(c, addQty, 'main'));
        currentMainCount += addQty;
      }
    });

    // Añadir Trampas
    for (const { sample, qty } of controlTraps) {
      if (currentMainCount >= 40) break;
      const addQty = Math.min(qty, 3, 40 - currentMainCount);
      deckCardsList.push(toCardItem(sample, addQty, 'main'));
      currentMainCount += addQty;
    }

    // Añadir Magias y Monstruos de soporte
    for (const { sample, qty } of [...controlSpells, ...genericMonsters]) {
      if (currentMainCount >= 40) break;
      const addQty = Math.min(qty, 3, 40 - currentMainCount);
      deckCardsList.push(toCardItem(sample, addQty, 'main'));
      currentMainCount += addQty;
    }

    // Extra deck genérico
    for (const { sample, qty } of genericExtra) {
      if (currentExtraCount >= 15) break;
      const addQty = Math.min(qty, 15 - currentExtraCount);
      deckCardsList.push(toCardItem(sample, addQty, 'extra'));
      currentExtraCount += addQty;
    }

    if (currentMainCount >= 20) {
      const monsters = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
      const spells = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
      const traps = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

      recommendedDecks.push({
        id: 'rec_control_bastion',
        name: 'Bastión de Control & Interrupción',
        style: 'control',
        styleLabel: 'Control / Desgaste',
        styleColor: 'from-emerald-600 to-teal-700',
        archetypes: ['Genérico', 'Staples'],
        description: 'Baraja defensiva de alto impacto basada en mitigación con trampas, negaciones y juego táctico de desgaste de recursos.',
        strategyGuide: 'Juega a paso lento, interrumpe las jugadas clave del oponente en momentos de compromiso alto y gana ventaja acumulativa.',
        mainDeckCount: currentMainCount,
        extraDeckCount: currentExtraCount,
        monsterCount: monsters,
        spellCount: spells,
        trapCount: traps,
        keyCards: deckCardsList.slice(0, 5),
        cards: deckCardsList,
        format: 'Master Duel',
      });
    }
  }

  // ── 4. GENERAR RECETA "COMBO" (SWARM / INVOCACIÓN ESPECIAL & EXTENSORES) ──
  {
    const deckCardsList: RecommendedDeckCardItem[] = [];
    let currentMainCount = 0;
    let currentExtraCount = 0;

    // Priorizar Monstruos con efectos de búsqueda / invocación especial y Magias de aceleración
    const comboMonsters = [...genericMonsters];
    if (sortedArchetypes.length > 0) {
      sortedArchetypes[0].cards.forEach(c => comboMonsters.push(c));
    }

    for (const { sample, qty } of comboMonsters) {
      if (currentMainCount >= 40) break;
      const addQty = Math.min(qty, 3, 40 - currentMainCount);
      deckCardsList.push(toCardItem(sample, addQty, 'main'));
      currentMainCount += addQty;
    }

    for (const { sample, qty } of genericSpells) {
      if (currentMainCount >= 40) break;
      const addQty = Math.min(qty, 3, 40 - currentMainCount);
      deckCardsList.push(toCardItem(sample, addQty, 'main'));
      currentMainCount += addQty;
    }

    // Extra deck prioritario
    for (const { sample, qty } of genericExtra) {
      if (currentExtraCount >= 15) break;
      const addQty = Math.min(qty, 15 - currentExtraCount);
      deckCardsList.push(toCardItem(sample, addQty, 'extra'));
      currentExtraCount += addQty;
    }

    if (currentMainCount >= 20) {
      const monsters = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
      const spells = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
      const traps = deckCardsList.filter(c => c.section === 'main' && c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

      recommendedDecks.push({
        id: 'rec_combo_vortex',
        name: 'Vórtice de Invocación Masiva',
        style: 'combo',
        styleLabel: 'Combo / OTK',
        styleColor: 'from-blue-600 to-cyan-600',
        archetypes: ['Swarm', 'Invocación Especial'],
        description: 'Baraja explosiva diseñada para inundar el campo en pocos turnos y acceder rápidamente a monstruos del Extra Deck.',
        strategyGuide: 'Prioriza tus invocaciones especiales iniciales para escalar hacia monstruos jefes de Extra Deck y cerrar el duelo por daño de combate.',
        mainDeckCount: currentMainCount,
        extraDeckCount: currentExtraCount,
        monsterCount: monsters,
        spellCount: spells,
        trapCount: traps,
        keyCards: deckCardsList.slice(0, 5),
        cards: deckCardsList,
        format: 'TCG',
      });
    }
  }

  return recommendedDecks;
}
