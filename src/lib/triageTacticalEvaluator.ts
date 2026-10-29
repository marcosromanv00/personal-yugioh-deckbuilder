import { UserCard } from '@/types/collection';
import { TriageCompetitiveMatch, TriageThematicIncubator, TacticalVerdict } from '@/types/triage';

function determineTacticalRole(card: UserCard): { role: string; economy: string } {
  const d = card.card_details;
  if (!d) return { role: 'Desconocido', economy: 'Sin datos' };
  const desc = (d.desc || '').toLowerCase();
  const type = d.type || '';

  if (type.includes('Link') || type.includes('Synchro') || type.includes('XYZ') || type.includes('Fusion')) {
    const isNeg = desc.includes('negate') || desc.includes('destroy');
    return {
      role: isNeg ? 'Boss / Interrupción de Extra Deck' : 'Extender / Puente de Extra Deck',
      economy: isNeg ? 'Control / Negación de Campo' : 'Presencia en Campo (+1)',
    };
  }
  if (desc.includes('add 1') && (desc.includes('from your deck to your hand') || desc.includes('to your hand'))) {
    return { role: 'Starter / Buscador de Consistencia', economy: 'Genera Ventaja Neta (+1)' };
  }
  if (desc.includes('special summon this card') || desc.includes('if you control')) {
    return { role: 'Extender de Invocación Especial', economy: 'Despliegue de Campo Neutro' };
  }
  if (desc.includes('during either player') || desc.includes('quick effect')) {
    return { role: 'Interrupción Rápida / Disrupción', economy: 'Intercambio en Turno Rival (1x1)' };
  }
  if (type.includes('Trap')) {
    return { role: 'Trampa Reactiva', economy: 'Pérdida de Tempo en Turno 1 (-1 inicial)' };
  }
  if (d.level && d.level >= 5 && !desc.includes('special summon')) {
    return { role: 'Monstruo Pesado de Main Deck (Potencial Brick)', economy: 'Pérdida de Mano / Consumo de Normal (-1)' };
  }
  if (type === 'Normal Monster') {
    return { role: 'Vainilla / Beatstick Didáctico', economy: 'Combate Puro (Sin Ventaja)' };
  }
  return { role: 'Soporte Casual / Genérico', economy: 'Sin Generación de Ventaja' };
}

function analyzeStats(card: UserCard): string {
  const d = card.card_details;
  if (!d) return 'Sin datos de estadísticas.';
  if (d.type?.includes('Monster')) {
    const atk = d.atk ?? 0;
    const lvl = d.level ?? 4;
    if (lvl <= 4) {
      return `${atk} ATK en Nivel ${lvl}: ${atk >= 1800 ? 'combatiente fuerte sin tributo.' : 'combate bajo; valor depende 100% del efecto.'}`;
    }
    return `Nivel ${lvl} con ${atk} ATK: requiere tributo o invocación especial para no atascar la mano.`;
  }
  return `${d.type} (${d.race || 'Normal'}): utilidad condicionada al ritmo de activación.`;
}

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
  const { role: tacticalRole, economy: cardEconomy } = determineTacticalRole(card);
  const effectivePrice = card.sale_price ?? marketPrice ?? 0;
  const desc = (d?.desc || '').toLowerCase();

  // 1. Prioridad: Mazo Activo
  if (competitiveMatches.length > 0) {
    const match = competitiveMatches[0];
    return {
      action: 'active_deck',
      actionLabel: 'Mazo Activo',
      actionNumber: 1,
      badgeColor: 'emerald',
      headline: `Asignar a ${match.deckName}`,
      statsAnalysis,
      effectSpeedAnalysis: 'Sinergia confirmada con las líneas de juego de tu baraja registrada.',
      themeViability: `Requerida en sección ${match.section.toUpperCase()} (${match.neededCopies} copia(s) faltante(s)).`,
      recommendationDecision: `¡Pieza necesaria! Tu mazo "${match.deckName}" la solicita explícitamente. Asigna copia física a la caja del mazo [1].`,
      powerScore: 8.8,
      tacticalRole,
      metaTier: `Pieza de Lista Activa (${match.format})`,
      cardEconomy,
    };
  }

  // 2. Prioridad: Staple de Formato o Carta Cara (>= $3.00)
  if (isStaple || effectivePrice >= 3.0) {
    const score = isStaple ? 9.5 : Math.min(9.0, 7.5 + effectivePrice / 10);
    return {
      action: 'collection_binder',
      actionLabel: 'Binder Colección',
      actionNumber: 4,
      badgeColor: 'blue',
      headline: isStaple ? 'Staple Competitiva / Proteger' : 'Joya de Colección / Proteger',
      statsAnalysis,
      effectSpeedAnalysis: isStaple ? 'Interrupción / disrupción de alto impacto en el metajuego.' : 'Preservación de valor coleccionable.',
      themeViability: isStaple ? 'Universal: encaja en múltiples motores competitivos.' : 'Carta de alto valor de mercado.',
      recommendationDecision: isStaple
        ? `Staple de alta demanda en torneos (Poder: ${score.toFixed(1)}/10). Protégela en binder o reserva de cambio [4].`
        : `Cotización de mercado destacada ($${effectivePrice.toFixed(2)}). Archívala en binder protegido [4].`,
      powerScore: score,
      tacticalRole: isStaple ? 'Staple / Disrupción Universal' : 'Pieza de Alto Valor',
      metaTier: isStaple ? 'Tier 1 Staples' : 'Colección / Inversión',
      cardEconomy,
    };
  }
  // 3. Prioridad: Monetizar / Venta (>= $0.50)
  if (effectivePrice >= 0.5) {
    return {
      action: 'trade_sale',
      actionLabel: 'Poner en Venta',
      actionNumber: 5,
      badgeColor: 'amber',
      headline: `Monetizar: Poner en Venta ($${effectivePrice.toFixed(2)})`,
      statsAnalysis,
      effectSpeedAnalysis: 'No requerida en tus estrategias vivas pero con liquidez comercial.',
      themeViability: 'Sin mazo activo que la aproveche en tu repertorio.',
      recommendationDecision: `Sin espacio en tus barajas pero con cotización ($${effectivePrice.toFixed(2)}). Deshazte de ella vendiéndola o cambiándola por singles útiles [5].`,
      powerScore: 6.0,
      tacticalRole,
      metaTier: 'Comercial / Trade',
      cardEconomy,
    };
  }

  // 4. Prioridad: Arquetipo Oficial Cohesivo con Core Real
  const hasRealArchetypeCore = Boolean(
    d?.archetype && thematicIncubators.some(i => i.themeCategory === 'archetype' && i.hasEnoughForCore)
  );

  if (hasRealArchetypeCore && d?.archetype) {
    return {
      action: 'thematic_pool',
      actionLabel: 'Proyecto Temático',
      actionNumber: 2,
      badgeColor: 'purple',
      headline: `Guardar para Proyecto: ${d.archetype}`,
      statsAnalysis,
      effectSpeedAnalysis: 'Pieza de motor o buscador sinérgico con tu lote temático.',
      themeViability: `Posees masa crítica suficiente (${thematicIncubators[0]?.totalCardsInCollection || 0}+ cartas) para el core.`,
      recommendationDecision: `Cuentas con la base para armar "${d.archetype}". Consérvala en el lote de incubación temática [2].`,
      powerScore: 7.0,
      tacticalRole,
      metaTier: `Motor Temático (${d.archetype})`,
      cardEconomy,
    };
  }

  // 5. Prioridad: Ensalada Didáctica para Talleres
  if (workshopCandidate) {
    return {
      action: 'workshop_salad',
      actionLabel: 'Ensalada Didáctica',
      actionNumber: 3,
      badgeColor: 'emerald',
      headline: 'Conservar para Ensalada Didáctica',
      statsAnalysis,
      effectSpeedAnalysis: 'Efecto comprensible sin párrafos densos ni candados restrictivos.',
      themeViability: 'Apta para barajas didácticas de iniciación.',
      recommendationDecision: 'Mecánicas claras de combate o interacción limpia. Ideal para enseñar a nuevos jugadores [3].',
      powerScore: 5.2,
      tacticalRole,
      metaTier: 'Casual / Didáctico',
      cardEconomy,
    };
  }

  // 6. Prioridad: Inútil / Sin Demanda (< $0.50) -> ¡DESECHAR A BULK [6]!
  const isHeavyBrick = Boolean(d?.level && d.level >= 5 && !desc.includes('special summon'));
  const isSlowPassive = desc.includes('end phase') || desc.includes('opponent');
  const powerScore = isHeavyBrick ? 2.8 : 3.5;

  return {
    action: 'bulk_discard',
    actionLabel: 'Desechar a Bulk',
    actionNumber: 6,
    badgeColor: 'zinc',
    headline: 'Desechar a Bulk (Valor Nulo)',
    statsAnalysis,
    effectSpeedAnalysis: isSlowPassive
      ? 'Efecto Lento y Pasivo: depende de condiciones tardías del oponente o End Phase.'
      : isHeavyBrick
        ? 'Monstruo pesado sin invocación inherente: alto riesgo de mano muerta (brick).'
        : 'Efecto lento o superado por el estándar del formato actual.',
    themeViability: d?.archetype
      ? `Arquetipo "${d.archetype}" sin masa crítica ni soporte suficiente.`
      : 'Sin arquetipo oficial: NO justifica armar una baraja temática.',
    recommendationDecision: isHeavyBrick
      ? `Nivel ${d?.level} que exige tributos normales y carece de invocación propia. En el ritmo actual, reduce la consistencia del mazo. Sin valor comercial ($${effectivePrice.toFixed(2)}): deséchala a Bulk [6].`
      : `Efecto de impacto marginal sin demanda en torneos ni valor de reventa ($${effectivePrice.toFixed(2)}). Evita acumular cartas muertas; deséchala a Bulk [6].`,
    powerScore,
    tacticalRole,
    metaTier: 'Inviable / Bulk',
    cardEconomy,
  };
}
