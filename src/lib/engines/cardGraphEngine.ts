/**
 * Motor de Grafos Relacionales de Cartas de Yu-Gi-Oh!
 * Analiza el texto de efecto, tipo y arquetipo de cada carta para construir
 * un grafo interactivo de sinergias (Buscadores, Invocaciones Especiales, Envíos al GY, Protecciones).
 */

export type RelationType = 
  | 'searches' 
  | 'special_summons' 
  | 'sends_to_gy' 
  | 'recycles' 
  | 'protects' 
  | 'fusion_material' 
  | 'tribute_requirement';

export interface GraphNode {
  id: number;
  name: string;
  type: string;
  image_url: string;
  archetype?: string;
  role: 'starter' | 'extender' | 'boss' | 'handtrap' | 'utility' | 'target';
}

export interface GraphEdge {
  sourceId: number;
  targetId: number;
  relation: RelationType;
  description: string;
  weight: number; // Fuerza de la sinergia (1 a 3)
}

export interface DeckGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isolatedCount: number;
  denseClusters: string[];
}

interface CardInput {
  id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  archetype?: string;
}

/**
 * Detecta relaciones semánticas entre las cartas presentes en un deck.
 */
export function buildDeckCardGraph(cards: CardInput[]): DeckGraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const cardMap = new Map<number, CardInput>();
  const archetypeMap = new Map<string, CardInput[]>();

  // Poblar mapas
  cards.forEach((card) => {
    cardMap.set(card.id, card);
    if (card.archetype) {
      const list = archetypeMap.get(card.archetype) || [];
      list.push(card);
      archetypeMap.set(card.archetype, list);
    }

    // Clasificar rol heurístico
    let role: GraphNode['role'] = 'utility';
    const text = (card.desc || '').toLowerCase();
    const type = card.type.toLowerCase();

    if (
      text.includes('add 1') && 
      (text.includes('from your deck to your hand') || text.includes('search'))
    ) {
      role = 'starter';
    } else if (
      text.includes('if you control') || 
      text.includes('special summon this card from your hand')
    ) {
      role = 'extender';
    } else if (
      type.includes('fusion') || 
      type.includes('synchro') || 
      type.includes('xyz') || 
      type.includes('link')
    ) {
      role = 'boss';
    } else if (
      text.includes('discard this card') || 
      text.includes('quick effect') || 
      card.name.includes('Ash Blossom') || 
      card.name.includes('Nibiru') || 
      card.name.includes('Infinite Impermanence')
    ) {
      role = 'handtrap';
    }

    nodes.push({
      id: card.id,
      name: card.name,
      type: card.type,
      image_url: card.image_url,
      archetype: card.archetype,
      role,
    });
  });

  // Mapear aristas (Edges) analizando menciones y efectos
  cards.forEach((source) => {
    const text = (source.desc || '').toLowerCase();
    const sourceArchetype = source.archetype?.toLowerCase();

    cards.forEach((target) => {
      if (source.id === target.id) return;

      const targetNameLower = target.name.toLowerCase();
      const targetArchetype = target.archetype?.toLowerCase();

      // 1. Mención explícita por nombre
      if (text.includes(`"${targetNameLower}"`) || text.includes(`'${targetNameLower}'`)) {
        if (text.includes('add') && text.includes('hand')) {
          edges.push({
            sourceId: source.id,
            targetId: target.id,
            relation: 'searches',
            description: `Busca directamente a "${target.name}"`,
            weight: 3,
          });
        } else if (text.includes('special summon')) {
          edges.push({
            sourceId: source.id,
            targetId: target.id,
            relation: 'special_summons',
            description: `Invoca de Modo Especial a "${target.name}"`,
            weight: 3,
          });
        } else if (text.includes('send') && text.includes('gy')) {
          edges.push({
            sourceId: source.id,
            targetId: target.id,
            relation: 'sends_to_gy',
            description: `Envía al Cementerio a "${target.name}"`,
            weight: 3,
          });
        }
      }

      // 2. Mención por arquetipo (Buscadores de arquetipo)
      else if (sourceArchetype && targetArchetype && sourceArchetype === targetArchetype) {
        if (
          text.includes('add 1') && 
          text.includes(sourceArchetype) && 
          (text.includes('from your deck to your hand') || text.includes('card'))
        ) {
          edges.push({
            sourceId: source.id,
            targetId: target.id,
            relation: 'searches',
            description: `Busca cartas del arquetipo "${source.archetype}"`,
            weight: 2,
          });
        } else if (
          text.includes('special summon') && 
          text.includes(sourceArchetype)
        ) {
          edges.push({
            sourceId: source.id,
            targetId: target.id,
            relation: 'special_summons',
            description: `Extiende invocando a miembros de "${source.archetype}"`,
            weight: 2,
          });
        }
      }
    });
  });

  // Contar nodos aislados
  const connectedNodeIds = new Set<number>();
  edges.forEach((e) => {
    connectedNodeIds.add(e.sourceId);
    connectedNodeIds.add(e.targetId);
  });

  const isolatedCount = nodes.filter((n) => !connectedNodeIds.has(n.id)).length;
  const denseClusters = Array.from(archetypeMap.keys()).filter(
    (arch) => (archetypeMap.get(arch)?.length || 0) >= 3
  );

  return {
    nodes,
    edges,
    isolatedCount,
    denseClusters,
  };
}
