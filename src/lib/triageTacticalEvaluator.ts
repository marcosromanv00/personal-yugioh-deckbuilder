import { UserCard } from '@/types/collection';
import { TriageCompetitiveMatch, TriageThematicIncubator, TacticalVerdict } from '@/types/triage';

/**
 * Evalúa las estadísticas y rol en combate de una carta.
 */
function analyzeStats(card: UserCard): string {
  const d = card.card_details;
  if (!d) return 'Sin datos de estadísticas.';

  if (d.type?.includes('Monster')) {
    const atk = d.atk ?? 0;
    const lvl = d.level ?? 4;
    if (lvl <= 4) {
      return atk >= 1900
        ? `${atk} ATK en Nivel ${lvl} es un atacante fuerte sin tributo (beatstick clásico de combate).`
        : atk >= 1600
        ? `${atk} ATK en Nivel ${lvl}: ataque decente para nivel bajo, pero requiere efecto relevante.`
        : `${atk} ATK en Nivel ${lvl}: estadísticas bajas, depende totalmente del impacto de su efecto.`;
    }
    if (lvl <= 6) {
      return atk < 2400
        ? `Nivel ${lvl} con ${atk} ATK requiere 1 tributo y tiene estadísticas por debajo del estándar.`
        : `Nivel ${lvl} con ${atk} ATK: estadísticas sólidas de rango medio.`;
    }
    return `Monstruo de Nivel ${lvl} (${atk} ATK): monstruo jefe o pesado; necesita invocación especial para no ser un brick.`;
  }

  if (d.type?.includes('Spell')) {
    return `Carta Mágica (${d.race || 'Normal'}): se activa de inmediato en tu turno para generar ventaja.`;
  }
  return `Carta Trampa (${d.race || 'Normal'}): requiere colocarse 1 turno antes; su velocidad depende de ser activada en el turno rival.`;
}

/**
 * Evalúa la velocidad, proactividad o lentitud del efecto.
 */
function analyzeEffectSpeed(card: UserCard): string {
  const d = card.card_details;
  if (!d) return 'Sin efecto analizable.';
  if (d.type === 'Normal Monster') {
    return 'Monstruo Vainilla: sin efecto de texto. No sufre de negaciones de efecto pero no genera ventaja automática.';
  }

  const desc = (d.desc || '').toLowerCase();
  const isPassive =
    desc.includes("opponent's card effect") ||
    desc.includes('during the end phase') ||
    desc.includes('destroyed by battle') ||
    desc.includes('when this card is destroyed') ||
    desc.includes('flip:');

  if (isPassive) {
    return 'Efecto Lento y Pasivo: depende de que el oponente lo destruya/active o se resuelve hasta la End Phase. Inviable en Yu-Gi-Oh! moderno.';
  }

  const isProactive =
    desc.includes('quick effect') ||
    desc.includes("during either player's turn") ||
    desc.includes('special summon this card') ||
    desc.includes('you can discard this card') ||
    desc.includes('negate the activation');

  if (isProactive) {
    return 'Efecto Proactivo / Rápido: permite responder, extender o generar presencia en campo en el mismo turno.';
  }
  return 'Efecto estándar: activación en tu turno con utilidad moderada si no es interrumpido.';
}

/**
 * Evalúa la viabilidad de armar un proyecto temático alrededor de la carta.
 */
function analyzeThemeViability(card: UserCard): string {
  const d = card.card_details;
  if (!d) return 'Sin arquetipo ni sinergia identificable.';
  if (d.archetype) {
    return `Arquetipo oficial "${d.archetype}". Puede ser pieza de soporte o motor temático si tienes más cartas de su arquetipo.`;
  }
  const race = d.race || 'Desconocida';
  return `Raza ${race} genérica sin arquetipo. No forma parte de los combos ni motores de ${race} modernos. NO justifica armar una baraja temática.`;
}

/**
 * Genera el veredicto táctico definitivo respondiendo:
 * "¿Me recomiendas armar algo temático o la desecho a bulk? ¿Qué hacer con ella?"
 */
export function evaluateTacticalVerdict(
  card: UserCard,
  isStaple: boolean,
  competitiveMatches: TriageCompetitiveMatch[],
  thematicIncubators: TriageThematicIncubator[],
  marketPrice?: number,
  workshopCandidate?: boolean
): TacticalVerdict {
  const d = card.card_details;
  const statsAnalysis = analyzeStats(card);
  const effectSpeedAnalysis = analyzeEffectSpeed(card);
  const themeViability = analyzeThemeViability(card);
  const effectivePrice = card.sale_price ?? marketPrice ?? 0;

  // 1. Prioridad: Mazo Activo del usuario
  if (competitiveMatches.length > 0) {
    const match = competitiveMatches[0];
    return {
      action: 'active_deck',
      actionLabel: 'Mazo Activo',
      actionNumber: 1,
      badgeColor: 'emerald',
      headline: `Asignar a ${match.deckName}`,
      statsAnalysis,
      effectSpeedAnalysis,
      themeViability,
      recommendationDecision: `¡Pieza necesaria! Tu mazo activo "${match.deckName}" requiere ${match.neededCopies} copia(s) física(s) en la sección ${match.section.toUpperCase()}.`,
    };
  }

  // 2. Prioridad: Staple de Formato o Carta de Colección Cara (>= $3.00)
  if (isStaple || effectivePrice >= 3.0) {
    return {
      action: 'collection_binder',
      actionLabel: 'Binder Colección',
      actionNumber: 4,
      badgeColor: 'blue',
      headline: isStaple ? 'Staple Universal / Proteger' : 'Joya de Colección / Proteger',
      statsAnalysis,
      effectSpeedAnalysis,
      themeViability,
      recommendationDecision: isStaple
        ? 'Staple universal de alta demanda en torneos. Consérvala en binder o en tu reserva competitiva.'
        : `Carta de alto valor estimado ($${effectivePrice.toFixed(2)}). Archívala en binder protegido [4].`,
    };
  }

  // 3. Prioridad: Monetizar / Venta (Inútil para ti pero con Valor Comercial >= $0.50)
  if (effectivePrice >= 0.5) {
    return {
      action: 'trade_sale',
      actionLabel: 'Poner en Venta',
      actionNumber: 5,
      badgeColor: 'amber',
      headline: `Monetizar: Poner en Venta ($${effectivePrice.toFixed(2)})`,
      statsAnalysis,
      effectSpeedAnalysis,
      themeViability,
      recommendationDecision: `Sin uso en tus mazos activos pero tiene cotización de mercado ($${effectivePrice.toFixed(2)}). Deshazte de ella vendiéndola o cambiándola por singles útiles [5].`,
    };
  }

  // 4. Prioridad: Arquetipo Oficial Cohesivo con Masa Crítica Real
  const hasRealArchetypeCore = Boolean(
    d?.archetype &&
      thematicIncubators.some(i => i.themeCategory === 'archetype' && i.hasEnoughForCore)
  );

  if (hasRealArchetypeCore && d?.archetype) {
    return {
      action: 'thematic_pool',
      actionLabel: 'Proyecto Temático',
      actionNumber: 2,
      badgeColor: 'purple',
      headline: `Guardar para Proyecto: ${d.archetype}`,
      statsAnalysis,
      effectSpeedAnalysis,
      themeViability,
      recommendationDecision: `Posees una base sólida de cartas de "${d.archetype}". Vale la pena conservarla en este lote temático para armar el mazo.`,
    };
  }

  // 5. Prioridad: Ensalada Didáctica de Taller / Fun
  if (workshopCandidate) {
    return {
      action: 'workshop_salad',
      actionLabel: 'Ensalada Didáctica',
      actionNumber: 3,
      badgeColor: 'emerald',
      headline: 'Conservar para Ensalada Didáctica',
      statsAnalysis,
      effectSpeedAnalysis,
      themeViability,
      recommendationDecision: 'Mecánicas accesibles de invocación, combate o interacción limpia sin candados xenófobos. Excelente para barajas didácticas y talleres [3].',
    };
  }

  // 6. Prioridad: Inútil y con Valor Nulo / Despreciable (< $0.50) -> ¡DESECHAR A BULK [6]!
  return {
    action: 'bulk_discard',
    actionLabel: 'Desechar a Bulk',
    actionNumber: 6,
    badgeColor: 'zinc',
    headline: 'Desechar a Bulk (Valor Nulo)',
    statsAnalysis,
    effectSpeedAnalysis,
    themeViability,
    recommendationDecision: `Efecto lento o irrelevante en el meta actual y valor comercial nulo ($${effectivePrice.toFixed(2)}). No acumules cartas inútiles; deséchala a Bulk [6].`,
  };
}
