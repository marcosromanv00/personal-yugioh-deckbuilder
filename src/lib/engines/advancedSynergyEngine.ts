import { CardBasicInfo, canSummonExtraDeckCard, isSearcherUsefulInDeck } from './mechanicsValidator';
import { KNOWN_STAPLES_CATALOG } from '@/lib/collectionSuggestions';
import { getImplicitSynergiesForArchetype } from '@/lib/constants/archetypeSynergies';

export type TacticalCategory =
  | 'archetype_and_techs'
  | 'handtraps'
  | 'board_breakers'
  | 'consistency_spells'
  | 'extra_deck';

export interface CardSynergyEvaluation {
  cardId: number;
  name: string;
  category: TacticalCategory;
  role: string;
  badgeLabel: string;
  badgeColor: string;
  shortReason: string;
  detailedRationale: string;
  confidenceScore: number; // 0 a 100
  isDirectArchetype: boolean;
  isTechEnabler: boolean;
  searchSource?: string;
}

export interface DeckDnaAnalysisResult {
  inferredArchetype: string;
  secondaryEngines: string[];
  gameplan: 'going_2nd_otk' | 'control_trap' | 'midrange_fusion' | 'combo_board';
  dna: {
    dominantAttributes: { attribute: string; count: number }[];
    dominantRaces: { race: string; count: number }[];
    monsterSpellTrapRatio: { monsters: number; spells: number; traps: number; extra: number };
    rankAndLevelDistribution: Record<number, number>;
  };
  activeEnablers: {
    hasMachineDuplicationTargets: boolean;
    hasLightMachineSearchTargets: boolean;
    hasContactFusionCapability: boolean;
    hasRank5Enablers: boolean;
    hasTherionEquipTargets: boolean;
    hasSuperPolyTargets: boolean;
    hasDiscardSynergy: boolean;
  };
  compatibleEngines: {
    archetype: string;
    affinityScore: number;
    strategicRationale: string;
    cardCountOwned?: number;
  }[];
}

/**
 * Catálogo Maestro de Reglas de Hibridación Estratégica de Motores.
 */
const KNOWN_HYBRID_ENGINES: Array<{
  name: string;
  checkAffinity: (dna: DeckDnaAnalysisResult['dna'], enablers: DeckDnaAnalysisResult['activeEnablers'], archs: string[]) => {
    isCompatible: boolean;
    affinityScore: number;
    rationale: string;
  };
}> = [
  {
    name: 'Cyberdark',
    checkAffinity: (dna, enablers, archs) => {
      const isCydra = archs.some((a) => a.includes('cyber'));
      const hasMachines = (dna.dominantRaces.find((r) => r.race.toLowerCase() === 'machine')?.count || 0) >= 6;
      if (isCydra || hasMachines) {
        return {
          isCompatible: true,
          affinityScore: 98,
          rationale:
            'Aporta a "Cyberdark Realm" y "Cyberdark Chimera", permitiendo buscar "Power Bond" sin restricciones y fusionar usando materiales del cementerio para invocar a Rampage Dragon con 4200 ATK o Cyberdark End Dragon.',
        };
      }
      return { isCompatible: false, affinityScore: 0, rationale: '' };
    },
  },
  {
    name: 'Therion',
    checkAffinity: (dna) => {
      const machineCount = dna.dominantRaces.find((r) => r.race.toLowerCase() === 'machine')?.count || 0;
      if (machineCount >= 6) {
        return {
          isCompatible: true,
          affinityScore: 95,
          rationale:
            '"Therion \'King\' Regulus" se invoca de modo especial gratis equipando cualquier monstruo Máquina de tu cementerio, aportando una omni-negación de 2800 ATK para proteger tus combos de OTK.',
        };
      }
      return { isCompatible: false, affinityScore: 0, rationale: '' };
    },
  },
  {
    name: 'Branded',
    checkAffinity: (dna) => {
      const lightCount = dna.dominantAttributes.find((a) => a.attribute.toLowerCase() === 'light')?.count || 0;
      const darkCount = dna.dominantAttributes.find((a) => a.attribute.toLowerCase() === 'dark')?.count || 0;
      if (lightCount >= 6 || darkCount >= 6) {
        return {
          isCompatible: true,
          affinityScore: 92,
          rationale:
            '"Branded Fusion" envía monstruos de LUZ/OSCURIDAD (como Cyber Dragon Herz/Core) directo del Deck al Cementerio para activar sus efectos de búsqueda mientras invoca a Albion/Lubellion hacia Mirrorjade.',
        };
      }
      return { isCompatible: false, affinityScore: 0, rationale: '' };
    },
  },
  {
    name: 'Horus',
    checkAffinity: (dna, enablers) => {
      if (enablers.hasDiscardSynergy || dna.monsterSpellTrapRatio.monsters >= 15) {
        return {
          isCompatible: true,
          affinityScore: 90,
          rationale:
            '"King\'s Sarcophagus" actúa como disparador de descarte en mano (activando efectos de cementerio) y genera monstruos de Nivel 8 gratis para jugadas masivas de Rango 8 (The Zombie Vampire / Photon Lord).',
        };
      }
      return { isCompatible: false, affinityScore: 0, rationale: '' };
    },
  },
  {
    name: 'Kashtira',
    checkAffinity: (dna) => {
      return {
        isCompatible: true,
        affinityScore: 88,
        rationale:
          '"Kashtira Fenrir" se invoca gratis sin consumir la Invocación Normal, busca otra copia y destierra cartas del oponente boca abajo cuando activa un efecto.',
      };
    },
  },
  {
    name: 'Bystial',
    checkAffinity: (dna) => {
      const lightDarkCount =
        (dna.dominantAttributes.find((a) => a.attribute.toLowerCase() === 'light')?.count || 0) +
        (dna.dominantAttributes.find((a) => a.attribute.toLowerCase() === 'dark')?.count || 0);
      if (lightDarkCount >= 6) {
        return {
          isCompatible: true,
          affinityScore: 93,
          rationale:
            'Disrupción rápida en Turno 0 desterrando monstruos de LUZ u OSCURIDAD en cementerios rivales, generando presencia de monstruos Dragón de Nivel 6 en campo.',
        };
      }
      return { isCompatible: false, affinityScore: 0, rationale: '' };
    },
  },
  {
    name: 'Fiendsmith',
    checkAffinity: (dna) => {
      const lightFiend =
        (dna.dominantAttributes.find((a) => a.attribute.toLowerCase() === 'light')?.count || 0) >= 4 &&
        (dna.dominantRaces.find((r) => r.race.toLowerCase() === 'fiend')?.count || 0) >= 2;
      if (lightFiend) {
        return {
          isCompatible: true,
          affinityScore: 96,
          rationale:
            'Motor de enlace y fusiones de Demonios de LUZ con 1 sola carta que genera negaciones masivas e inmunidad.',
        };
      }
      return { isCompatible: false, affinityScore: 0, rationale: '' };
    },
  },
];

/**
 * Analiza el ADN integral del mazo (Atributos, Tipos, Ratios, Habilitadores y Motores).
 */
export function analyzeDeckDnaAndEngines(
  deckCards: CardBasicInfo[],
  inferredArchetypeOverride?: string
): DeckDnaAnalysisResult {
  const archetypeCounts = new Map<string, number>();
  const attributeCounts = new Map<string, number>();
  const raceCounts = new Map<string, number>();
  const rankLevelCounts: Record<number, number> = {};

  let monsters = 0;
  let spells = 0;
  let traps = 0;
  let extra = 0;

  deckCards.forEach((c) => {
    const qty = c.count || 1;
    const type = c.type || '';
    const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');

    if (isExtra) extra += qty;
    else if (type.includes('Monster')) monsters += qty;
    else if (type.includes('Spell')) spells += qty;
    else if (type.includes('Trap')) traps += qty;

    if (c.archetype) {
      archetypeCounts.set(c.archetype, (archetypeCounts.get(c.archetype) || 0) + qty);
    }
    if (c.attribute) {
      attributeCounts.set(c.attribute, (attributeCounts.get(c.attribute) || 0) + qty);
    }
    if (c.race) {
      raceCounts.set(c.race, (raceCounts.get(c.race) || 0) + qty);
    }
    if (c.level) {
      rankLevelCounts[c.level] = (rankLevelCounts[c.level] || 0) + qty;
    }
  });

  const dominantAttributes = Array.from(attributeCounts.entries())
    .map(([attribute, count]) => ({ attribute, count }))
    .sort((a, b) => b.count - a.count);

  const dominantRaces = Array.from(raceCounts.entries())
    .map(([race, count]) => ({ race, count }))
    .sort((a, b) => b.count - a.count);

  const sortedArchetypes = Array.from(archetypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const inferredArchetype = inferredArchetypeOverride || sortedArchetypes[0] || 'Genérico / Híbrido';
  const secondaryEngines = sortedArchetypes.slice(1, 4);

  // Detectar Enablers
  const hasMachineDuplicationTargets = deckCards.some(
    (c) =>
      (c.race || '').toLowerCase() === 'machine' &&
      c.atk !== undefined &&
      c.atk !== null &&
      c.atk <= 500 &&
      (c.type || '').includes('Monster')
  );

  const hasLightMachineSearchTargets = deckCards.some(
    (c) =>
      (c.race || '').toLowerCase() === 'machine' &&
      (c.attribute || '').toLowerCase() === 'light'
  );

  const hasContactFusionCapability = deckCards.some(
    (c) =>
      c.name.includes('Chimeratech Fortress') ||
      c.name.includes('Chimeratech Megafleet') ||
      c.name.includes('Cyber Dragon') ||
      c.name.includes('Fallen of Albaz')
  );

  const hasRank5Enablers =
    (rankLevelCounts[5] || 0) >= 3 ||
    deckCards.some((c) => c.name.includes('Galaxy Soldier') || c.name.includes('Cyber Dragon Nova'));

  const hasTherionEquipTargets = (raceCounts.get('Machine') || 0) >= 4;

  const hasSuperPolyTargets =
    deckCards.some((c) => c.name.includes('Super Polymerization')) ||
    (attributeCounts.get('LIGHT') || 0) >= 5 ||
    (attributeCounts.get('DARK') || 0) >= 5;

  const hasDiscardSynergy = deckCards.some((c) => {
    const desc = (c.desc || '').toLowerCase();
    return (
      desc.includes('sent to the graveyard') ||
      desc.includes('enviada al cementerio') ||
      c.name.includes('Herz') ||
      c.name.includes('Shadow Mist')
    );
  });

  // Inferir Gameplan
  let gameplan: DeckDnaAnalysisResult['gameplan'] = 'midrange_fusion';
  const archLower = inferredArchetype.toLowerCase();

  if (
    archLower.includes('cyber dragon') ||
    archLower.includes('tenpai') ||
    archLower.includes('mikanko') ||
    archLower.includes('ancient gear') ||
    archLower.includes('numeron')
  ) {
    gameplan = 'going_2nd_otk';
  } else if (
    archLower.includes('labrynth') ||
    archLower.includes('traptrix') ||
    archLower.includes('dinomorphia') ||
    archLower.includes('eldlich') ||
    traps >= 10
  ) {
    gameplan = 'control_trap';
  } else if (
    archLower.includes('snake-eye') ||
    archLower.includes('mathmech') ||
    archLower.includes('hero') ||
    archLower.includes('infernoble') ||
    archLower.includes('synchro')
  ) {
    gameplan = 'combo_board';
  }

  const dna = {
    dominantAttributes,
    dominantRaces,
    monsterSpellTrapRatio: { monsters, spells, traps, extra },
    rankAndLevelDistribution: rankLevelCounts,
  };

  const activeEnablers = {
    hasMachineDuplicationTargets,
    hasLightMachineSearchTargets,
    hasContactFusionCapability,
    hasRank5Enablers,
    hasTherionEquipTargets,
    hasSuperPolyTargets,
    hasDiscardSynergy,
  };

  // Calcular compatibilidad real de motores
  const compatibleEngines: DeckDnaAnalysisResult['compatibleEngines'] = [];
  KNOWN_HYBRID_ENGINES.forEach((engine) => {
    const check = engine.checkAffinity(dna, activeEnablers, sortedArchetypes.map((s) => s.toLowerCase()));
    if (check.isCompatible) {
      compatibleEngines.push({
        archetype: engine.name,
        affinityScore: check.affinityScore,
        strategicRationale: check.rationale,
      });
    }
  });

  return {
    inferredArchetype,
    secondaryEngines,
    gameplan,
    dna,
    activeEnablers,
    compatibleEngines,
  };
}

/**
 * Evalúa con inteligencia táctica profunda si una carta de la colección aporta valor real al mazo.
 */
export function evaluateCardSynergy(
  candidate: CardBasicInfo,
  deckCards: CardBasicInfo[],
  dnaResult: DeckDnaAnalysisResult
): CardSynergyEvaluation | null {
  const name = candidate.name;
  const type = candidate.type || '';
  const desc = (candidate.desc || '').toLowerCase();
  const race = candidate.race || '';
  const attribute = candidate.attribute || '';
  const isExtra = type.includes('Fusion') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Link');
  const isMonster = type.includes('Monster');

  const deckArchetypeList = [
    dnaResult.inferredArchetype.toLowerCase(),
    ...dnaResult.secondaryEngines.map((s) => s.toLowerCase()),
  ];

  // 1. EXTRA DECK: Validación estricta de invocación
  if (isExtra) {
    const summonCheck = canSummonExtraDeckCard(candidate, deckCards);
    if (!summonCheck.canSummon) return null;

    // Contact Fusions de Cyber Dragon / Albaz
    if (name === 'Chimeratech Fortress Dragon') {
      return {
        cardId: candidate.id,
        name,
        category: 'extra_deck',
        role: 'contact_fusion',
        badgeLabel: 'Contacto Fusión (Máquinas)',
        badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        shortReason: 'Limpia cualquier monstruo Máquina del oponente en campo sin usar Polimerización.',
        detailedRationale:
          'Utiliza tu Cyber Dragon y TODOS los monstruos Máquina en cualquier campo como materiales de fusión de contacto, desmantelando campos rivales de forma no respondible.',
        confidenceScore: 99,
        isDirectArchetype: true,
        isTechEnabler: true,
      };
    }

    if (name === 'Chimeratech Megafleet Dragon') {
      return {
        cardId: candidate.id,
        name,
        category: 'extra_deck',
        role: 'contact_fusion',
        badgeLabel: 'Remoción Extra Monster Zone',
        badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        shortReason: 'Elimina monstruos problemáticos del rival ubicados en la Extra Monster Zone.',
        detailedRationale:
          'Fusión de contacto instantánea que tributa cualquier monstruo en la Zona de Monstruos Extra del oponente junto con tu Cyber Dragon sin activar efectos.',
        confidenceScore: 99,
        isDirectArchetype: true,
        isTechEnabler: true,
      };
    }

    if (name === 'Cyber Dragon Nova' || name === 'Cyber Dragon Infinity') {
      return {
        cardId: candidate.id,
        name,
        category: 'extra_deck',
        role: 'boss_xyz',
        badgeLabel: 'Boss XYZ Rango 5',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        shortReason: 'Omni-negación de efectos y absorción de monstruos rivales en posición de ataque.',
        detailedRationale:
          'Sobreponiendo Infinity encima de Nova, obtienes una negación universal de efectos, incremento de ATK y absorción continua de recursos del rival como material XYZ.',
        confidenceScore: 99,
        isDirectArchetype: true,
        isTechEnabler: true,
      };
    }

    if (name === 'Mudragon of the Swamp' || name === 'Garura, Wings of Resonant Life') {
      return {
        cardId: candidate.id,
        name,
        category: 'extra_deck',
        role: 'super_poly_target',
        badgeLabel: 'Blanco Super Poly',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        shortReason: 'Blanco ideal para Super Polymerization con atributos LUZ/OSCURIDAD del meta.',
        detailedRationale:
          'Aprovecha atributos comunes del oponente para fusionar en Turno 2 sin que puedan encadenar respuestas.',
        confidenceScore: 94,
        isDirectArchetype: false,
        isTechEnabler: true,
      };
    }

    return {
      cardId: candidate.id,
      name,
      category: 'extra_deck',
      role: 'extra_generic',
      badgeLabel: `Extra Deck ${summonCheck.summonType}`,
      badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
      shortReason: `Monstruo ${summonCheck.summonType} 100% invocable con tus materiales actuales.`,
      detailedRationale: `Compatible con los niveles, atributos y requerimientos de invocación de tu baraja.`,
      confidenceScore: 88,
      isDirectArchetype: Boolean(candidate.archetype && deckArchetypeList.includes(candidate.archetype.toLowerCase())),
      isTechEnabler: false,
    };
  }

  // 2. TECHS MECÁNICAS ESPECÍFICAS (Cartas de Colección sin arquetipo nominal)
  if (name === 'Machine Duplication' && dnaResult.activeEnablers.hasMachineDuplicationTargets) {
    return {
      cardId: candidate.id,
      name,
      category: 'archetype_and_techs',
      role: 'tech_combo',
      badgeLabel: '⚡ Tech Duplicación de Máquinas',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      shortReason: 'Invoca 2 "Cyber Dragon" originales del mazo gratis usando Core o Herz en campo.',
      detailedRationale:
        'Al seleccionar monstruos Máquina de ≤ 500 ATK (cuyo nombre se trata como "Cyber Dragon" en campo), invoca hasta 2 copias adicionales del Deck sin costo, habilitando jugadas instantáneas de Rango 5 o Fusión.',
      confidenceScore: 99,
      isDirectArchetype: false,
      isTechEnabler: true,
    };
  }

  if (name === 'Galaxy Soldier' && (dnaResult.activeEnablers.hasRank5Enablers || dnaResult.dna.dominantAttributes.some(a => a.attribute === 'LIGHT'))) {
    return {
      cardId: candidate.id,
      name,
      category: 'archetype_and_techs',
      role: 'tech_extender',
      badgeLabel: '⭐ Extender Rango 5 (Luz)',
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      shortReason: 'Descarta un monstruo de LUZ (Herz) para invocarse especial y buscar otra copia.',
      detailedRationale:
        'Descartando un monstruo de LUZ como Cyber Dragon Herz (que se auto-recupera buscando otro Cyber Dragon), se invoca de modo especial y busca otro Galaxy Soldier para hacer Cyber Dragon Nova / Infinity directamente.',
      confidenceScore: 98,
      isDirectArchetype: false,
      isTechEnabler: true,
    };
  }

  if (name === 'Clockwork Night' && dnaResult.activeEnablers.hasContactFusionCapability) {
    return {
      cardId: candidate.id,
      name,
      category: 'archetype_and_techs',
      role: 'tech_board_wipe',
      badgeLabel: '⚙️ Sinergia Clockwork Night',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      shortReason: 'Convierte todos los monstruos del rival en Máquinas para fusionarlos con Chimeratech Fortress.',
      detailedRationale:
        'Al cambiar la raza de todo el campo rival a Máquina, te permite tributar todos los monstruos del oponente para invocar a Chimeratech Fortress Dragon desde el Extra Deck sin gastar Polimerización.',
      confidenceScore: 98,
      isDirectArchetype: false,
      isTechEnabler: true,
    };
  }

  if (name === 'Jizukiru, the Star Destroying Kaiju' && dnaResult.activeEnablers.hasLightMachineSearchTargets) {
    return {
      cardId: candidate.id,
      name,
      category: 'board_breakers',
      role: 'tech_kaiju',
      badgeLabel: '🦖 Kaiju Máquina de LUZ',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      shortReason: 'Remueve un monstruo rival y es 100% buscable por Cyber Repair Plant.',
      detailedRationale:
        'Al ser de Tipo Máquina y Atributo LUZ, puede ser buscado con "Cyber Repair Plant" y posteriormente fusionado en tu turno con un Cyber Dragon para invocar a Chimeratech Fortress Dragon.',
      confidenceScore: 96,
      isDirectArchetype: false,
      isTechEnabler: true,
    };
  }

  if (name === 'Therion "King" Regulus' && dnaResult.activeEnablers.hasTherionEquipTargets) {
    return {
      cardId: candidate.id,
      name,
      category: 'archetype_and_techs',
      role: 'boss_negate',
      badgeLabel: '🛡️ Omni-Negación Máquina',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      shortReason: 'Se invoca gratis equipando una Máquina del GY y aporta una omni-negación.',
      detailedRationale:
        'Aprovecha los Cyber Dragons en el cementerio para invocarse de modo especial desde la mano, otorgando una negación universal de 2800 ATK que protege tus jugadas agresivas de OTK.',
      confidenceScore: 97,
      isDirectArchetype: false,
      isTechEnabler: true,
    };
  }

  // 3. COINCIDENCIA DE ARQUETIPO O SINERGIA IMPLÍCITA CONOCIDA
  const implicitSynergies = getImplicitSynergiesForArchetype(dnaResult.inferredArchetype);
  const implicitMatch = implicitSynergies.find((s) => s.cardName.toLowerCase() === name.toLowerCase());

  if (implicitMatch) {
    return {
      cardId: candidate.id,
      name,
      category: 'archetype_and_techs',
      role: implicitMatch.role,
      badgeLabel: `Sinergia ${dnaResult.inferredArchetype}`,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      shortReason: implicitMatch.reason,
      detailedRationale: `Pieza no nominal clave para maximizar la consistencia y tech de ${dnaResult.inferredArchetype}.`,
      confidenceScore: Math.round(implicitMatch.weight * 100),
      isDirectArchetype: true,
      isTechEnabler: true,
    };
  }

  // Coincidencia directa de arquetipo
  if (candidate.archetype && deckArchetypeList.includes(candidate.archetype.toLowerCase())) {
    const arch = candidate.archetype;
    if (desc.includes('add 1') || desc.includes('search') || desc.includes('añade 1')) {
      return {
        cardId: candidate.id,
        name,
        category: 'archetype_and_techs',
        role: 'searcher',
        badgeLabel: `Buscador ${arch}`,
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        shortReason: `Aumenta la consistencia buscando piezas clave del arquetipo ${arch}.`,
        detailedRationale: `Iniciador fundamental para acelerar y asegurar los combos principales de ${arch}.`,
        confidenceScore: 96,
        isDirectArchetype: true,
        isTechEnabler: false,
      };
    }
    if (desc.includes('special summon') || desc.includes('invoca de modo especial')) {
      return {
        cardId: candidate.id,
        name,
        category: 'archetype_and_techs',
        role: 'extender',
        badgeLabel: `Extender ${arch}`,
        badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        shortReason: `Genera presencia en campo para extender combos de ${arch}.`,
        detailedRationale: `Extiende jugadas y materializa invocaciones adicionales sin gastar la Invocación Normal.`,
        confidenceScore: 94,
        isDirectArchetype: true,
        isTechEnabler: false,
      };
    }
    return {
      cardId: candidate.id,
      name,
      category: 'archetype_and_techs',
      role: 'engine_core',
      badgeLabel: `Core ${arch}`,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      shortReason: `Pieza nativa fundamental para la estrategia del motor ${arch}.`,
      detailedRationale: `Carta de arquetipo imprescindible para la estabilidad de ${arch}.`,
      confidenceScore: 92,
      isDirectArchetype: true,
      isTechEnabler: false,
    };
  }

  // 4. STAPLES GLOBALES CON JUSTIFICACIÓN CONTEXTUAL
  const staple = KNOWN_STAPLES_CATALOG[name];
  if (staple) {
    if (staple.category === 'handtrap') {
      const isGoing2nd = dnaResult.gameplan === 'going_2nd_otk';
      return {
        cardId: candidate.id,
        name,
        category: 'handtraps',
        role: 'handtrap',
        badgeLabel: `Handtrap ${staple.tier}-Tier`,
        badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        shortReason: isGoing2nd
          ? 'Interrupción en Turno 0 para limitar el campo rival y facilitar tu OTK en Turno 2.'
          : 'Interrupción rápida desde la mano para frenar los combos del oponente.',
        detailedRationale:
          'Detiene iniciadores o búsquedas clave del oponente antes de que consolide un campo inquebrantable.',
        confidenceScore: staple.tier === 'S' ? 98 : 88,
        isDirectArchetype: false,
        isTechEnabler: false,
      };
    }

    if (staple.category === 'board_breaker') {
      const isOTK = dnaResult.gameplan === 'going_2nd_otk';
      return {
        cardId: candidate.id,
        name,
        category: 'board_breakers',
        role: 'board_breaker',
        badgeLabel: 'Board Breaker',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        shortReason: isOTK
          ? 'Desmantela campos rivales para asegurar el paso libre de tu combo de daño letal.'
          : 'Anula o destruye amenazas establecidas del oponente.',
        detailedRationale:
          name === 'Forbidden Droplet'
            ? 'Envía cartas al GY (disparando efectos de cementerio como Herz) mientras anula monstruos rivales a velocidad rápida sin que puedan responder.'
            : name === 'Super Polymerization'
            ? 'Fusión ininterrumpible que usa los monstruos del rival como materiales para tus propios monstruos de Extra Deck.'
            : 'Herramienta de alto impacto para romper campos interactivos en Turno 2.',
        confidenceScore: 95,
        isDirectArchetype: false,
        isTechEnabler: true,
      };
    }

    if (staple.category === 'draw_engine') {
      return {
        cardId: candidate.id,
        name,
        category: 'consistency_spells',
        role: 'draw_engine',
        badgeLabel: 'Acelerador / Consistencia',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        shortReason: 'Excava o roba piezas clave sin interferir con tus condiciones de victoria.',
        detailedRationale:
          'Maximiza la probabilidad matemática de abrir tus iniciadores de combo en mano inicial.',
        confidenceScore: 92,
        isDirectArchetype: false,
        isTechEnabler: false,
      };
    }
  }

  // 5. VALIDACIÓN DE BUSCADORES GENÉRICOS (Fossil Dig, Tenki, Bonfire, etc.)
  const searchCheck = isSearcherUsefulInDeck(candidate, deckCards);
  if (!searchCheck.isUseful) {
    return null; // Descartar buscadores huérfanos sin objetivos
  }

  return null;
}
