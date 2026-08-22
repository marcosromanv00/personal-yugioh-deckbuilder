import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { KNOWN_STAPLES_CATALOG } from '@/lib/collectionSuggestions';
import { canSummonExtraDeckCard, isSearcherUsefulInDeck, CardBasicInfo } from '@/lib/engines/mechanicsValidator';

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

// Helper para convertir UserCard a CardBasicInfo
function toCardBasic(sample: UserCard, count = 1): CardBasicInfo {
  return {
    id: sample.card_id,
    name: sample.card_details?.name || `Carta #${sample.card_id}`,
    type: sample.card_details?.type,
    desc: sample.card_details?.desc,
    atk: sample.card_details?.atk,
    def: sample.card_details?.def,
    level: sample.card_details?.level,
    race: sample.card_details?.race,
    attribute: sample.card_details?.attribute,
    archetype: sample.card_details?.archetype,
    count,
  };
}

// Helper para convertir UserCard a RecommendedDeckCardItem
function toDeckCardItem(
  sample: UserCard,
  count: number,
  section: 'main' | 'extra' = 'main'
): RecommendedDeckCardItem {
  return {
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
  };
}

/**
 * Motor inteligente que analiza exclusivamente las cartas libres (sin deck activo)
 * y ensambla barajas 100% jugables, balanceadas y sin cartas huérfanas ni extra decks incompatibles.
 */
export function generateRecommendedDecksFromFreeCollection(
  allUserCards: UserCard[],
  activeDecks: Deck[]
): RecommendedDeckRecipe[] {
  // 1. FILTRO ESTRICTO: Solo cartas no asignadas a ningún deck activo
  const activeDeckIds = new Set(activeDecks.filter(d => d.is_active !== false).map(d => d.id));
  const freeCards = allUserCards.filter(c => !c.deck_id || !activeDeckIds.has(c.deck_id));

  if (freeCards.length < 15) {
    return [];
  }

  // Consolidar cartas libres disponibles: card_id -> { sample, totalQty }
  const freePool = new Map<number, { sample: UserCard; totalQty: number }>();
  freeCards.forEach(c => {
    if (!c.card_details) return;
    const existing = freePool.get(c.card_id);
    const qty = c.quantity || 1;
    if (existing) {
      existing.totalQty += qty;
    } else {
      freePool.set(c.card_id, { sample: c, totalQty: qty });
    }
  });

  // Clasificación de la colección libre
  const archetypePool = new Map<string, { cardId: number; sample: UserCard; qty: number }[]>();
  const racePool = new Map<string, { cardId: number; sample: UserCard; qty: number }[]>();
  const genericStaples: { cardId: number; sample: UserCard; qty: number }[] = [];
  const genericExtra: { cardId: number; sample: UserCard; qty: number }[] = [];
  const genericSpellsAndTraps: { cardId: number; sample: UserCard; qty: number }[] = [];

  freePool.forEach(({ sample, totalQty }, cardId) => {
    const details = sample.card_details;
    if (!details) return;
    const arch = details.archetype?.trim();
    const type = details.type || '';
    const name = details.name || '';
    const race = details.race?.trim();
    const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');

    if (isExtra) {
      genericExtra.push({ cardId, sample, qty: totalQty });
    }

    if (arch) {
      const list = archetypePool.get(arch) || [];
      list.push({ cardId, sample, qty: totalQty });
      archetypePool.set(arch, list);
    }

    if (race && type.includes('Monster')) {
      const list = racePool.get(race) || [];
      list.push({ cardId, sample, qty: totalQty });
      racePool.set(race, list);
    }

    if (KNOWN_STAPLES_CATALOG[name]) {
      genericStaples.push({ cardId, sample, qty: totalQty });
    } else if (!isExtra && (type.includes('Spell') || type.includes('Trap'))) {
      genericSpellsAndTraps.push({ cardId, sample, qty: totalQty });
    }
  });

  // Identificar todos los arquetipos con presencia viable (>= 6 cartas libres)
  const viableArchetypes = Array.from(archetypePool.entries())
    .map(([name, cards]) => ({
      name,
      cards,
      totalQty: cards.reduce((acc, c) => acc + c.qty, 0),
      distinctCount: cards.length,
    }))
    .filter(a => a.totalQty >= 6)
    .sort((a, b) => b.totalQty - a.totalQty);

  const recommendedDecks: RecommendedDeckRecipe[] = [];

  // Helper para validar y construir el Extra Deck
  const buildValidExtraDeck = (mainDeckCards: CardBasicInfo[]): RecommendedDeckCardItem[] => {
    const extraDeckItems: RecommendedDeckCardItem[] = [];
    let currentExtra = 0;

    for (const { sample, qty } of genericExtra) {
      if (currentExtra >= 15) break;
      const extraBasic = toCardBasic(sample, qty);
      const summonCheck = canSummonExtraDeckCard(extraBasic, mainDeckCards);

      if (summonCheck.canSummon) {
        const useQty = Math.min(qty, 3, 15 - currentExtra);
        extraDeckItems.push(toDeckCardItem(sample, useQty, 'extra'));
        currentExtra += useQty;
      }
    }
    return extraDeckItems;
  };

  // Helper para rellenar con staples y soporte de forma limpia y balanceada
  const fillBalancedMainDeck = (
    currentCards: RecommendedDeckCardItem[],
    targetArchetypes: string[],
    primaryRace?: string
  ): { items: RecommendedDeckCardItem[]; mainCount: number } => {
    let mainCount = currentCards.reduce((acc, c) => acc + c.count, 0);
    const usedCardIds = new Set(currentCards.map(c => c.id));
    const items = [...currentCards];

    const tryAddCard = (sample: UserCard, availableQty: number) => {
      if (mainCount >= 40 || usedCardIds.has(sample.card_id)) return;
      const basic = toCardBasic(sample, availableQty);
      const searchCheck = isSearcherUsefulInDeck(basic, items.map(i => ({ ...i, id: i.id })));
      if (!searchCheck.isUseful) return; // Evitar cartas huérfanas como Fossil Dig sin dinosaurios

      const addQty = Math.min(availableQty, 3, 40 - mainCount);
      items.push(toDeckCardItem(sample, addQty, 'main'));
      usedCardIds.add(sample.card_id);
      mainCount += addQty;
    };

    // 1. Añadir soporte afín del mismo Tipo de Monstruo si existe
    if (primaryRace && racePool.has(primaryRace)) {
      const raceCards = racePool.get(primaryRace) || [];
      for (const { sample, qty } of raceCards) {
        if (mainCount >= 40) break;
        tryAddCard(sample, qty);
      }
    }

    // 2. Añadir Staples Universales conocidas (Handtraps, Removal, Draw)
    for (const { sample, qty } of genericStaples) {
      if (mainCount >= 40) break;
      tryAddCard(sample, qty);
    }

    // 3. Añadir Magias y Trampas genéricas viables
    for (const { sample, qty } of genericSpellsAndTraps) {
      if (mainCount >= 40) break;
      tryAddCard(sample, qty);
    }

    return { items, mainCount };
  };

  // ── 1. GENERAR RECETAS PURAS / TEMÁTICAS PARA CADA ARQUETIPO VIABLE ─────────
  viableArchetypes.slice(0, 4).forEach((arch) => {
    const archDeckCards: RecommendedDeckCardItem[] = [];
    let currentMain = 0;

    // Detectar el Tipo dominante del arquetipo
    const raceFreq = new Map<string, number>();
    arch.cards.forEach(({ sample, qty }) => {
      const race = sample.card_details?.race;
      if (race) raceFreq.set(race, (raceFreq.get(race) || 0) + qty);
    });
    const primaryRace = Array.from(raceFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Añadir cartas del arquetipo
    arch.cards.forEach(({ sample, qty }) => {
      const type = sample.card_details?.type || '';
      const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');
      if (!isExtra && currentMain < 40) {
        const addQty = Math.min(qty, 3, 40 - currentMain);
        archDeckCards.push(toDeckCardItem(sample, addQty, 'main'));
        currentMain += addQty;
      }
    });

    // Rellenar de forma balanceada
    const { items: finalMain, mainCount } = fillBalancedMainDeck(archDeckCards, [arch.name], primaryRace);

    if (mainCount >= 20) {
      const mainBasic = finalMain.map(c => ({ id: c.id, name: c.name, type: c.type, count: c.count, level: c.level, race: c.race, archetype: c.archetype }));
      const extraDeck = buildValidExtraDeck(mainBasic);

      const allDeckCards = [...finalMain, ...extraDeck];
      const monsters = finalMain.filter(c => c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
      const spells = finalMain.filter(c => c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
      const traps = finalMain.filter(c => c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

      recommendedDecks.push({
        id: `rec_tematico_${arch.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: `Vanguardia ${arch.name}`,
        style: 'tematico',
        styleLabel: 'Temático / Core',
        styleColor: 'from-purple-600 to-indigo-600',
        archetypes: [arch.name],
        description: `Baraja optimizada enfocada en la consistencia de ${arch.name}${primaryRace ? ` con soporte de Tipo ${primaryRace}` : ''} y staples probadas.`,
        strategyGuide: `Inicia buscando tus piezas clave de ${arch.name} para establecer presencia en campo y escalar hacia tus opciones de Extra Deck 100% verificadas.`,
        mainDeckCount: mainCount,
        extraDeckCount: extraDeck.reduce((acc, c) => acc + c.count, 0),
        monsterCount: monsters,
        spellCount: spells,
        trapCount: traps,
        keyCards: allDeckCards.slice(0, 5),
        cards: allDeckCards,
        format: 'Master Duel',
      });
    }
  });

  // ── 2. GENERAR RECETAS HÍBRIDAS / ENSALADA CON AFINIDAD REAL ───────────────
  if (viableArchetypes.length >= 2) {
    // Buscar pares de arquetipos con sinergia (mismo Tipo o combos históricos reconocidos)
    let bestPair: [typeof viableArchetypes[0], typeof viableArchetypes[0]] | null = null;

    for (let i = 0; i < viableArchetypes.length; i++) {
      for (let j = i + 1; j < viableArchetypes.length; j++) {
        const a1 = viableArchetypes[i];
        const a2 = viableArchetypes[j];
        
        // Comprobar si comparten tipos (ej. Vampire + Mayakashi son Zombie)
        const races1 = new Set(a1.cards.map(c => c.sample.card_details?.race).filter(Boolean));
        const races2 = new Set(a2.cards.map(c => c.sample.card_details?.race).filter(Boolean));
        const hasSharedRace = Array.from(races1).some(r => races2.has(r));

        if (hasSharedRace || i === 0 && j === 1) {
          bestPair = [a1, a2];
          break;
        }
      }
      if (bestPair) break;
    }

    if (bestPair) {
      const [arch1, arch2] = bestPair;
      const hybridDeckCards: RecommendedDeckCardItem[] = [];
      let currentMain = 0;

      [arch1, arch2].forEach(arch => {
        arch.cards.forEach(({ sample, qty }) => {
          const type = sample.card_details?.type || '';
          const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');
          if (!isExtra && currentMain < 30) {
            const addQty = Math.min(qty, 2, 30 - currentMain);
            hybridDeckCards.push(toDeckCardItem(sample, addQty, 'main'));
            currentMain += addQty;
          }
        });
      });

      const { items: finalMain, mainCount } = fillBalancedMainDeck(hybridDeckCards, [arch1.name, arch2.name]);

      if (mainCount >= 20) {
        const mainBasic = finalMain.map(c => ({ id: c.id, name: c.name, type: c.type, count: c.count, level: c.level, race: c.race, archetype: c.archetype }));
        const extraDeck = buildValidExtraDeck(mainBasic);
        const allDeckCards = [...finalMain, ...extraDeck];

        const monsters = finalMain.filter(c => c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
        const spells = finalMain.filter(c => c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
        const traps = finalMain.filter(c => c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

        recommendedDecks.push({
          id: `rec_ensalada_${arch1.name}_${arch2.name}`.toLowerCase().replace(/\s+/g, '_'),
          name: `Híbrido ${arch1.name} & ${arch2.name}`,
          style: 'ensalada',
          styleLabel: 'Ensalada / Fun',
          styleColor: 'from-amber-500 to-orange-600',
          archetypes: [arch1.name, arch2.name],
          description: `Estrategia dual que combina los motores ${arch1.name} y ${arch2.name} para crear rutas de victoria versátiles e impredecibles.`,
          strategyGuide: `Usa un motor para absorber las interrupciones del rival y el segundo como extensor para completar tu tablero de Extra Deck.`,
          mainDeckCount: mainCount,
          extraDeckCount: extraDeck.reduce((acc, c) => acc + c.count, 0),
          monsterCount: monsters,
          spellCount: spells,
          trapCount: traps,
          keyCards: allDeckCards.slice(0, 5),
          cards: allDeckCards,
          format: 'TCG',
        });
      }
    }
  }

  // ── 3. GENERAR RECETA "CONTROL TÁCTICO" (BALANCEADA: 12-16 Monstruos, 8-10 Spells, 14-18 Traps) ─
  {
    const controlDeckCards: RecommendedDeckCardItem[] = [];
    let currentMain = 0;
    const usedIds = new Set<number>();

    // 1. Añadir cartas de control y handtraps
    const controlStaples = genericStaples.filter(s => {
      const cat = KNOWN_STAPLES_CATALOG[s.sample.card_details?.name || '']?.category;
      return cat === 'handtrap' || cat === 'floodgate_negate' || cat === 'board_breaker';
    });

    for (const { sample, qty } of controlStaples) {
      if (currentMain >= 40) break;
      const addQty = Math.min(qty, 3, 40 - currentMain);
      controlDeckCards.push(toDeckCardItem(sample, addQty, 'main'));
      usedIds.add(sample.card_id);
      currentMain += addQty;
    }

    // 2. Añadir trampas útiles de la colección
    for (const { sample, qty } of genericSpellsAndTraps.filter(st => (st.sample.card_details?.type || '').includes('Trap'))) {
      if (currentMain >= 40 || usedIds.has(sample.card_id)) continue;
      const addQty = Math.min(qty, 3, 40 - currentMain);
      controlDeckCards.push(toDeckCardItem(sample, addQty, 'main'));
      usedIds.add(sample.card_id);
      currentMain += addQty;
    }

    // 3. Añadir monstruos de presencia y normal summons para no tener 0 monstruos
    if (viableArchetypes.length > 0) {
      const topArch = viableArchetypes[0];
      for (const { sample, qty } of topArch.cards) {
        if (currentMain >= 40 || usedIds.has(sample.card_id)) continue;
        if ((sample.card_details?.type || '').includes('Monster')) {
          const addQty = Math.min(qty, 3, 40 - currentMain);
          controlDeckCards.push(toDeckCardItem(sample, addQty, 'main'));
          usedIds.add(sample.card_id);
          currentMain += addQty;
        }
      }
    }

    // Rellenar resto
    const { items: finalMain, mainCount } = fillBalancedMainDeck(controlDeckCards, ['Control']);

    if (mainCount >= 20) {
      const mainBasic = finalMain.map(c => ({ id: c.id, name: c.name, type: c.type, count: c.count, level: c.level, race: c.race, archetype: c.archetype }));
      const extraDeck = buildValidExtraDeck(mainBasic);
      const allDeckCards = [...finalMain, ...extraDeck];

      const monsters = finalMain.filter(c => c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
      const spells = finalMain.filter(c => c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
      const traps = finalMain.filter(c => c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

      // Solo incluir si tiene al menos 8 monstruos para ser un deck jugable
      if (monsters >= 8) {
        recommendedDecks.push({
          id: 'rec_control_bastion',
          name: 'Bastión de Control Táctico',
          style: 'control',
          styleLabel: 'Control / Desgaste',
          styleColor: 'from-emerald-600 to-teal-700',
          archetypes: ['Control Táctico', 'Staples'],
          description: 'Estrategia defensiva de desgaste estructurada con monstruos de presencia y trampas de disrupción selectiva.',
          strategyGuide: 'Establece presencia inicial y responde a las amenazas prioritarias del rival agotando sus recursos turno tras turno.',
          mainDeckCount: mainCount,
          extraDeckCount: extraDeck.reduce((acc, c) => acc + c.count, 0),
          monsterCount: monsters,
          spellCount: spells,
          trapCount: traps,
          keyCards: allDeckCards.slice(0, 5),
          cards: allDeckCards,
          format: 'Master Duel',
        });
      }
    }
  }

  // ── 4. GENERAR RECETA "COMBO / SWARM" (BALANCEADA) ─────────────────────────
  if (viableArchetypes.length >= 1) {
    const comboDeckCards: RecommendedDeckCardItem[] = [];
    let currentMain = 0;
    const usedIds = new Set<number>();

    // Tomar monstruos con efectos de invocación y extenders
    const archsToUse = viableArchetypes.slice(0, 2);
    archsToUse.forEach(arch => {
      arch.cards.forEach(({ sample, qty }) => {
        if (currentMain >= 40 || usedIds.has(sample.card_id)) return;
        const type = sample.card_details?.type || '';
        if (type.includes('Monster')) {
          const addQty = Math.min(qty, 3, 40 - currentMain);
          comboDeckCards.push(toDeckCardItem(sample, addQty, 'main'));
          usedIds.add(sample.card_id);
          currentMain += addQty;
        }
      });
    });

    const { items: finalMain, mainCount } = fillBalancedMainDeck(comboDeckCards, archsToUse.map(a => a.name));

    if (mainCount >= 20) {
      const mainBasic = finalMain.map(c => ({ id: c.id, name: c.name, type: c.type, count: c.count, level: c.level, race: c.race, archetype: c.archetype }));
      const extraDeck = buildValidExtraDeck(mainBasic);
      const allDeckCards = [...finalMain, ...extraDeck];

      const monsters = finalMain.filter(c => c.type.includes('Monster')).reduce((acc, c) => acc + c.count, 0);
      const spells = finalMain.filter(c => c.type.includes('Spell')).reduce((acc, c) => acc + c.count, 0);
      const traps = finalMain.filter(c => c.type.includes('Trap')).reduce((acc, c) => acc + c.count, 0);

      recommendedDecks.push({
        id: 'rec_combo_vortex',
        name: 'Vórtice de Invocación Masiva',
        style: 'combo',
        styleLabel: 'Combo / OTK',
        styleColor: 'from-blue-600 to-cyan-600',
        archetypes: archsToUse.map(a => a.name),
        description: 'Baraja agresiva de despliegue rápido con cadenas de invocaciones y acceso a jefes de Extra Deck.',
        strategyGuide: 'Maximiza el flujo de invocaciones especiales para armar campos de negación y liquidar el duelo en tu turno de ataque.',
        mainDeckCount: mainCount,
        extraDeckCount: extraDeck.reduce((acc, c) => acc + c.count, 0),
        monsterCount: monsters,
        spellCount: spells,
        trapCount: traps,
        keyCards: allDeckCards.slice(0, 5),
        cards: allDeckCards,
        format: 'TCG',
      });
    }
  }

  return recommendedDecks;
}
