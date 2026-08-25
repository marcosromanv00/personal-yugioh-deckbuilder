import { KNOWN_STAPLES_CATALOG } from '@/lib/collectionSuggestions';
import { CardRole, SynergyRationale, ExtraDeckSummonCheckResult, DeckValidationReport } from '@/types/mechanics';

export interface CardBasicInfo {
  id: number;
  name: string;
  type?: string;
  desc?: string | null;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  race?: string | null;
  attribute?: string | null;
  archetype?: string | null;
  count?: number;
}

/**
 * Normaliza y extrae de forma unificada CardBasicInfo desde cualquier estructura de carta
 * (DeckCard, UserCard, CollectionDeckCardItem o filas directas de Supabase).
 */
export function extractCardBasicInfo(c: Record<string, unknown>): CardBasicInfo {
  const details = (c.card_details && typeof c.card_details === 'object' ? c.card_details : undefined) as Record<string, unknown> | undefined;
  const id = Number(c.card_id || c.id || details?.id || 0);

  return {
    id,
    name: String(c.name || details?.name || `Carta #${id}`),
    type: (c.type || details?.type || 'Monster') as string,
    desc: (c.desc || details?.desc || '') as string,
    atk: (c.atk !== undefined && c.atk !== null ? Number(c.atk) : (details?.atk !== undefined && details?.atk !== null ? Number(details.atk) : null)),
    def: (c.def !== undefined && c.def !== null ? Number(c.def) : (details?.def !== undefined && details?.def !== null ? Number(details.def) : null)),
    level: (c.level !== undefined && c.level !== null ? Number(c.level) : (details?.level !== undefined && details?.level !== null ? Number(details.level) : null)),
    race: (c.race || details?.race || null) as string | null,
    attribute: (c.attribute || details?.attribute || null) as string | null,
    archetype: (c.archetype || details?.archetype || null) as string | null,
    count: Number(c.count || c.quantity || 1),
  };
}

/**
 * Catálogo de buscadores conocidos y requisitos de objetivos en el mazo.
 */
const SEARCHER_REQUIREMENTS: Record<string, { requiredRace?: string; requiredArchetype?: string; maxLevel?: number; minTargets: number; desc: string }> = {
  'Fossil Dig': { requiredRace: 'Dinosaur', maxLevel: 6, minTargets: 2, desc: 'Requiere monstruos Dinosaurio de Nivel 6 o menor' },
  'Reinforcement of the Army': { requiredRace: 'Warrior', maxLevel: 4, minTargets: 2, desc: 'Requiere monstruos Guerrero de Nivel 4 o menor' },
  'Emergency Teleport': { requiredRace: 'Psychic', maxLevel: 3, minTargets: 2, desc: 'Requiere monstruos Psíquico de Nivel 3 o menor' },
  'Fire Formation - Tenki': { requiredRace: 'Beast-Warrior', maxLevel: 4, minTargets: 2, desc: 'Requiere monstruos Guerrero-Bestia de Nivel 4 o menor' },
  'Bonfire': { requiredRace: 'Pyro', maxLevel: 4, minTargets: 2, desc: 'Requiere monstruos Piro de Nivel 4 o menor' },
  'Cynet Mining': { requiredRace: 'Cyberse', maxLevel: 4, minTargets: 2, desc: 'Requiere monstruos Ciberso de Nivel 4 o menor' },
  'Resonator Call': { requiredArchetype: 'Resonator', minTargets: 2, desc: 'Requiere monstruos Resonator' },
  'E - Emergency Call': { requiredArchetype: 'HERO', minTargets: 2, desc: 'Requiere monstruos HERO' },
  'Charge of the Light Brigade': { requiredArchetype: 'Lightsworn', minTargets: 2, desc: 'Requiere monstruos Lightsworn' },
  'Medallion of the Ice Barrier': { requiredArchetype: 'Ice Barrier', minTargets: 2, desc: 'Requiere monstruos Ice Barrier' },
  'Nadir Servant': { requiredArchetype: 'Dogmatika', minTargets: 1, desc: 'Requiere cartas Dogmatika o objetivos de Extra Deck' },
};

/**
 * Comprueba si una carta del Extra Deck es invocable con los monstruos y magias del Main Deck.
 */
export function canSummonExtraDeckCard(
  extraCard: CardBasicInfo,
  mainDeckCards: CardBasicInfo[]
): ExtraDeckSummonCheckResult {
  const type = extraCard.type || '';
  const mainMonsters = mainDeckCards.filter(c => (c.type || '').includes('Monster') && !(c.type || '').includes('Fusion') && !(c.type || '').includes('Synchro') && !(c.type || '').includes('XYZ') && !(c.type || '').includes('Link'));
  const mainSpellsAndTraps = mainDeckCards.filter(c => (c.type || '').includes('Spell') || (c.type || '').includes('Trap'));

  // 1. FUSIÓN
  if (type.includes('Fusion')) {
    const isGenericContactOrArchetype = (extraCard.archetype && mainMonsters.some(m => m.archetype?.toLowerCase() === extraCard.archetype?.toLowerCase())) ||
      (extraCard.desc?.toLowerCase().includes('must first be special summoned') || false);

    const hasFusionSpell = mainSpellsAndTraps.some(st => {
      const name = st.name.toLowerCase();
      const desc = (st.desc || '').toLowerCase();
      return name.includes('fusion') || name.includes('polymerization') || desc.includes('fusion summon') || desc.includes('invocación por fusión');
    });

    const hasFusionMonsterEnabler = mainMonsters.some(m => {
      const desc = (m.desc || '').toLowerCase();
      return desc.includes('fusion summon') || desc.includes('as a fusion material') || desc.includes('fusión');
    });

    if (hasFusionSpell || hasFusionMonsterEnabler || isGenericContactOrArchetype) {
      return { canSummon: true, summonType: 'Fusion' };
    }

    return {
      canSummon: false,
      reason: 'No hay cartas de Polimerización/Fusión ni enablers de fusión en el mazo principal.',
      summonType: 'Fusion',
    };
  }

  // 2. SYNCHRO
  if (type.includes('Synchro')) {
    const targetLevel = extraCard.level || 0;
    const tuners = mainMonsters.filter(m => (m.type || '').includes('Tuner') || (m.desc || '').toLowerCase().includes('tuner') || (m.desc || '').toLowerCase().includes('cantante'));
    const nonTuners = mainMonsters.filter(m => !(m.type || '').includes('Tuner'));

    if (tuners.length === 0) {
      return {
        canSummon: false,
        reason: 'El mazo no contiene ningún monstruo Cantante (Tuner) para invocar por Sincronía.',
        summonType: 'Synchro',
      };
    }

    // Verificar si existe alguna combinación de niveles que sume el nivel objetivo
    let canSumLevels = false;
    for (const t of tuners) {
      const tLvl = t.level || 0;
      if (tLvl >= targetLevel) continue;
      for (const nt of nonTuners) {
        const ntLvl = nt.level || 0;
        if (tLvl + ntLvl === targetLevel) {
          canSumLevels = true;
          break;
        }
      }
      if (canSumLevels) break;
    }

    // Si el mazo tiene tuners y monstruos suficientes, dar flexibilidad en arquetipos sincronía
    const hasArchetypeMatch = extraCard.archetype && mainMonsters.some(m => m.archetype?.toLowerCase() === extraCard.archetype?.toLowerCase());
    if (canSumLevels || (tuners.length >= 2 && mainMonsters.length >= 8) || hasArchetypeMatch) {
      return { canSummon: true, summonType: 'Synchro' };
    }

    return {
      canSummon: false,
      reason: `Los niveles de tus monstruos y cantantes no coinciden para sumar Nivel ${targetLevel}.`,
      summonType: 'Synchro',
    };
  }

  // 3. XYZ
  if (type.includes('XYZ') || type.includes('Xyz')) {
    const rank = extraCard.level || 0; // YGOPRODeck guarda el rango de XYZ en el campo level
    const matchingLevelMonsters = mainMonsters.filter(m => (m.level || 0) === rank);
    const totalMatchingCopies = matchingLevelMonsters.reduce((acc, m) => acc + (m.count || 1), 0);

    const hasArchetypeMatch = extraCard.archetype && mainMonsters.some(m => m.archetype?.toLowerCase() === extraCard.archetype?.toLowerCase());

    if (totalMatchingCopies >= 2 || hasArchetypeMatch) {
      return { canSummon: true, summonType: 'XYZ' };
    }

    return {
      canSummon: false,
      reason: `Requiere al menos 2 monstruos de Nivel ${rank} para superponer, pero tu mazo tiene ${totalMatchingCopies}.`,
      summonType: 'XYZ',
    };
  }

  // 4. LINK
  if (type.includes('Link')) {
    // Si requiere arquetipo o tipo específico
    const reqRace = extraCard.race;
    const reqArch = extraCard.archetype;

    if (reqArch && !mainMonsters.some(m => m.archetype?.toLowerCase() === reqArch.toLowerCase())) {
      // Si es un link de arquetipo estricto y no tenemos dicho arquetipo
      if ((extraCard.desc || '').toLowerCase().includes(reqArch.toLowerCase())) {
        return {
          canSummon: false,
          reason: `Monstruo Link específico del arquetipo ${reqArch}.`,
          summonType: 'Link',
        };
      }
    }

    if (reqRace && !mainMonsters.some(m => m.race?.toLowerCase() === reqRace.toLowerCase())) {
      if ((extraCard.desc || '').toLowerCase().includes(`${reqRace.toLowerCase()} monster`)) {
        return {
          canSummon: false,
          reason: `Requiere monstruos de Tipo ${reqRace}.`,
          summonType: 'Link',
        };
      }
    }

    // Si el mazo principal tiene al menos 5 monstruos, la mayoría de Links genéricos son viables
    if (mainMonsters.length >= 4) {
      return { canSummon: true, summonType: 'Link' };
    }

    return {
      canSummon: false,
      reason: 'Cantidad insuficiente de monstruos en el mazo para invocar este monstruo Link.',
      summonType: 'Link',
    };
  }

  return { canSummon: true, summonType: 'Unknown' };
}

/**
 * Comprueba si una carta de búsqueda tiene objetivos válidos en el mazo.
 */
export function isSearcherUsefulInDeck(
  card: CardBasicInfo,
  mainDeckCards: CardBasicInfo[]
): { isUseful: boolean; reason?: string } {
  const name = card.name;
  const req = SEARCHER_REQUIREMENTS[name];

  if (req) {
    let validTargets = 0;
    mainDeckCards.forEach(c => {
      if (c.id === card.id) return;
      const isMonster = (c.type || '').includes('Monster');
      if (!isMonster) return;

      let matches = true;
      if (req.requiredRace && c.race?.toLowerCase() !== req.requiredRace.toLowerCase()) {
        matches = false;
      }
      if (req.requiredArchetype && !(c.archetype?.toLowerCase().includes(req.requiredArchetype.toLowerCase()) || c.name.toLowerCase().includes(req.requiredArchetype.toLowerCase()))) {
        matches = false;
      }
      if (req.maxLevel && (c.level || 0) > req.maxLevel) {
        matches = false;
      }

      if (matches) {
        validTargets += c.count || 1;
      }
    });

    if (validTargets < req.minTargets) {
      return {
        isUseful: false,
        reason: `${name} no tiene suficientes objetivos en el mazo (${validTargets} encontrados, mínimo requerido: ${req.minTargets}). ${req.desc}.`,
      };
    }
  }

  // Verificación genérica de cartas que buscan por arquetipo en su texto
  const cardDesc = (card.desc || '').toLowerCase();
  const cardArch = card.archetype;
  if (cardArch && (cardDesc.includes('add 1') || cardDesc.includes('añade 1')) && cardDesc.includes(cardArch.toLowerCase())) {
    const targets = mainDeckCards.filter(c => c.id !== card.id && c.archetype?.toLowerCase() === cardArch.toLowerCase());
    if (targets.length === 0) {
      return {
        isUseful: false,
        reason: `Buscador de ${cardArch} sin objetivos de su arquetipo en el mazo.`,
      };
    }
  }

  return { isUseful: true };
}

/**
 * Infiere la justificación de valor táctico de una carta sugerida para el mazo actual.
 */
export function inferCardValueProposition(
  card: CardBasicInfo,
  currentDeckCards: CardBasicInfo[],
  currentArchetypes: string[] = []
): SynergyRationale {
  const name = card.name;
  const type = card.type || '';
  const desc = (card.desc || '').toLowerCase();
  const race = card.race || '';
  const arch = card.archetype;
  const isMonster = type.includes('Monster');
  const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');

  // 1. STAPLE CONOCIDA (Handtrap / Board Breaker)
  const stapleInfo = KNOWN_STAPLES_CATALOG[name];
  if (stapleInfo) {
    if (stapleInfo.category === 'handtrap') {
      return {
        role: 'handtrap',
        badgeLabel: `Handtrap ${stapleInfo.tier}-Tier`,
        badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        shortReason: 'Interrupción rápida desde la mano contra las jugadas del oponente en Turno 0.',
        confidenceScore: stapleInfo.tier === 'S' ? 98 : 88,
      };
    }
    if (stapleInfo.category === 'board_breaker') {
      return {
        role: 'board_breaker',
        badgeLabel: 'Board Breaker',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        shortReason: 'Desmantela campos establecidos y anula monstruos clave del rival.',
        confidenceScore: 92,
      };
    }
    if (stapleInfo.category === 'draw_engine') {
      return {
        role: 'starter',
        badgeLabel: 'Motor de Robo',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        shortReason: 'Acelera el mazo y aumenta la probabilidad de robar iniciadores de combo.',
        confidenceScore: 90,
      };
    }
  }

  // 2. COINCIDENCIA DIRECTA DE ARQUETIPO (Core del motor)
  if (arch && currentArchetypes.some(a => a.toLowerCase() === arch.toLowerCase())) {
    if (desc.includes('add 1') || desc.includes('añade 1') || desc.includes('search') || desc.includes('busca')) {
      return {
        role: 'searcher',
        badgeLabel: `Buscador ${arch}`,
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        shortReason: `Aumenta la consistencia buscando piezas clave del arquetipo ${arch}.`,
        confidenceScore: 95,
      };
    }
    if (desc.includes('special summon') || desc.includes('invoca de modo especial')) {
      return {
        role: 'extender',
        badgeLabel: `Extender ${arch}`,
        badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        shortReason: `Genera presencia adicional en campo para extender combos de ${arch}.`,
        confidenceScore: 94,
      };
    }
    return {
      role: 'engine_core',
      badgeLabel: `Core ${arch}`,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      shortReason: `Pieza nativa fundamental para la estrategia del motor ${arch}.`,
      confidenceScore: 92,
    };
  }

  // 3. SINERGIA DE TIPO (Zombie, Máquina, Dragón, Guerrero, etc.)
  const matchingRaceCount = currentDeckCards.filter(c => c.race?.toLowerCase() === race.toLowerCase()).length;
  if (race && matchingRaceCount >= 4) {
    if (type.includes('Tuner') || desc.includes('tuner') || desc.includes('cantante')) {
      return {
        role: 'extra_enabler',
        badgeLabel: `Cantante ${race}`,
        badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        shortReason: `Habilita invocaciones de Sincronía afines al soporte de Tipo ${race}.`,
        confidenceScore: 86,
      };
    }
    if (desc.includes('graveyard') || desc.includes('cementerio') || desc.includes('gy')) {
      return {
        role: 'extender',
        badgeLabel: `Sinergia ${race}`,
        badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        shortReason: `Aprovecha recursos en el cementerio compatibles con tus ${matchingRaceCount} cartas ${race}.`,
        confidenceScore: 88,
      };
    }
    return {
      role: 'engine_core',
      badgeLabel: `Soporte ${race}`,
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      shortReason: `Comparte sinergias de soporte con los monstruos ${race} del mazo.`,
      confidenceScore: 82,
    };
  }

  // 4. EXTRA DECK GENÉRICO INVOCABLE
  if (isExtra) {
    const check = canSummonExtraDeckCard(card, currentDeckCards);
    if (check.canSummon) {
      return {
        role: 'payoff',
        badgeLabel: `Extra Deck ${check.summonType}`,
        badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
        shortReason: `Monstruo ${check.summonType} 100% invocable con los niveles y materiales de tu baraja.`,
        confidenceScore: 89,
      };
    }
  }

  // 5. GENÉRICA / STAPLE MENOR
  return {
    role: 'staple_generic',
    badgeLabel: 'Soporte Genérico',
    badgeColor: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    shortReason: 'Opción complementaria versátil para redondear ratios y consistencia.',
    confidenceScore: 70,
  };
}
