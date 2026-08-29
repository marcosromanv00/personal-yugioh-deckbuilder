import { StorageLocation, UserCard } from '@/types/collection';

export interface ProposedDistribution {
  cardId: string;
  cardName: string;
  rarity: string;
  statusFlag: string;
  targetStorageId: string;
  targetStorageName: string;
  targetStorageType: string;
  reason: string;
}

export interface RecommendationResult {
  proposals: ProposedDistribution[];
  summary: {
    totalAssigned: number;
    assignedByStorage: Record<string, number>;
    unassignedCount: number;
  };
}

const HIGH_RARITIES = [
  'Secret Rare',
  'Prismatic Secret Rare',
  'Prismatic Ultimate Rare',
  'Prismatic Platinum Rare',
  'Platinum Secret Rare',
  'Starlight Rare', 
  'Quarter Century Secret Rare', 
  'Ghost Rare', 
  'Ultimate Rare', 
  'Collector\'s Rare', 
  'Ultra Rare'
];

export function generateStorageRecommendations(
  unsortedCards: UserCard[],
  locations: StorageLocation[]
): RecommendationResult {
  const proposals: ProposedDistribution[] = [];
  const assignedByStorage: Record<string, number> = {};

  // Rastrear la capacidad ocupada disponible
  const currentOccupancy: Record<string, number> = {};
  for (const loc of locations) {
    currentOccupancy[loc.id] = loc.occupied_cards || 0;
    assignedByStorage[loc.name] = 0;
  }

  // Clasificar contenedores por uso preferente
  const binderLocations = locations.filter(l => l.type === 'binder');
  const deckboxLocations = locations.filter(l => l.type === 'deckbox');
  const tinLocations = locations.filter(l => l.type === 'tin');
  const boxLocations = locations.filter(l => l.type === 'box' || l.type === 'drawer');

  let unassignedCount = 0;

  for (const card of unsortedCards) {
    const cardName = card.card_details?.name || `Carta #${card.card_id}`;
    const rarity = card.rarity || 'Common';
    const isHighRarity = HIGH_RARITIES.some(r => rarity.toLowerCase().includes(r.toLowerCase()));
    
    let targetLoc: StorageLocation | null = null;
    let reason = '';

    // 1. Si está marcada para Venta / Trade -> Buscar carpeta/caja de Trade
    if (card.status_flag === 'trade_sale') {
      targetLoc = binderLocations.find(l => 
        (l.name.toLowerCase().includes('trade') || l.name.toLowerCase().includes('venta')) && 
        (currentOccupancy[l.id] + card.quantity) <= l.capacity
      ) || binderLocations[0] || boxLocations[0] || null;
      reason = 'Marcada para Venta/Trade -> Asignada a Carpeta/Caja de Intercambio';
    } 
    // 2. Si es material de Taller / Comunidad -> Buscar Deckbox o Binder de Taller
    else if (card.status_flag === 'workshop') {
      targetLoc = deckboxLocations.find(l => 
        (l.name.toLowerCase().includes('taller') || l.name.toLowerCase().includes('comunidad')) &&
        (currentOccupancy[l.id] + card.quantity) <= l.capacity
      ) || deckboxLocations[0] || binderLocations[0] || null;
      reason = 'Material de Taller -> Asignada a Deckbox/Binder de Comunidad';
    }
    // 3. Si es de Alta Rareza o Colección -> Asignar a Binder de Colección
    else if (isHighRarity || card.status_flag === 'collection') {
      targetLoc = binderLocations.find(l => 
        (currentOccupancy[l.id] + card.quantity) <= l.capacity
      ) || null;

      if (targetLoc) {
        reason = `Alta rareza (${rarity}) -> Protegida en Binder ${targetLoc.name}`;
      } else {
        // Fallback a lata/caja si no hay espacio en binders
        targetLoc = tinLocations[0] || boxLocations[0] || null;
        reason = `Alta rareza (${rarity}) -> Colocada en ${targetLoc?.name || 'Contenedor'} (Binders llenos)`;
      }
    }
    // 4. Si es Bulk / Crap o Común -> Asignar a Lata o Caja de Almacenamiento
    else {
      targetLoc = boxLocations.find(l => 
        (currentOccupancy[l.id] + card.quantity) <= l.capacity
      ) || tinLocations.find(l => 
        (currentOccupancy[l.id] + card.quantity) <= l.capacity
      ) || null;

      if (targetLoc) {
        reason = `Carta Bulk/Común -> Guardada en ${targetLoc.name}`;
      } else {
        targetLoc = binderLocations[0] || null;
        reason = 'Guardada en espacio libre disponible';
      }
    }

    if (targetLoc) {
      currentOccupancy[targetLoc.id] += card.quantity;
      assignedByStorage[targetLoc.name] = (assignedByStorage[targetLoc.name] || 0) + card.quantity;

      proposals.push({
        cardId: card.id,
        cardName,
        rarity,
        statusFlag: card.status_flag,
        targetStorageId: targetLoc.id,
        targetStorageName: targetLoc.name,
        targetStorageType: targetLoc.type,
        reason,
      });
    } else {
      unassignedCount += card.quantity;
    }
  }

  return {
    proposals,
    summary: {
      totalAssigned: proposals.length,
      assignedByStorage,
      unassignedCount,
    },
  };
}
