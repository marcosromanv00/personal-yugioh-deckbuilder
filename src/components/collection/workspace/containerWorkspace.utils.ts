/**
 * containerWorkspace.utils.ts
 * Funciones puras para el espacio de trabajo de contenedores y archivadores físicos.
 */
import { UserCard } from '@/types/collection';

/**
 * Parser para listas numéricas de cantidad + ID de Yu-Gi-Oh!
 * Soporta formatos:
 * - "89631139" (1 copia de ID)
 * - "3 89631139" (3 copias de ID)
 * - "89631139 3" (ID y luego 3 copias)
 * - Listas separadas por comas, espacios o saltos de línea
 */
export function parseQuantityIdList(text: string): number[] {
  const lines = text.split(/\r?\n/);
  const result: number[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

    // Reemplazar caracteres no numéricos por espacio
    const cleanLine = trimmed.replace(/[^\d]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanLine) continue;

    const tokens = cleanLine.split(' ').filter(Boolean);
    if (tokens.length === 1) {
      const id = parseInt(tokens[0], 10);
      if (!isNaN(id) && id > 100) {
        result.push(id);
      }
    } else if (tokens.length === 2) {
      const v1 = parseInt(tokens[0], 10);
      const v2 = parseInt(tokens[1], 10);

      if (!isNaN(v1) && !isNaN(v2)) {
        if (v1 <= 100 && v2 > 100) {
          for (let i = 0; i < v1; i++) result.push(v2);
        } else if (v2 <= 100 && v1 > 100) {
          for (let i = 0; i < v2; i++) result.push(v1);
        } else {
          result.push(v1);
          result.push(v2);
        }
      }
    } else if (tokens.length > 2) {
      let i = 0;
      while (i < tokens.length) {
        const v = parseInt(tokens[i], 10);
        const nextV = i + 1 < tokens.length ? parseInt(tokens[i + 1], 10) : null;
        if (v <= 100 && nextV !== null && nextV > 100) {
          for (let k = 0; k < v; k++) result.push(nextV);
          i += 2;
        } else if (v > 100) {
          result.push(v);
          i += 1;
        } else {
          i += 1;
        }
      }
    }
  }

  return result;
}

export function createMoveCardHistoryItem(
  card: UserCard,
  newLocId: string | null,
  newComp: number,
  newPage: number | null,
  newSlot: number | null
) {
  return {
    id: card.id,
    prevLocationId: card.storage_location_id || null,
    newLocationId: newLocId,
    prevCompartment: card.compartment_index ?? 0,
    newCompartment: newComp,
    prevPage: card.binder_page ?? null,
    newPage,
    prevSlot: card.binder_slot ?? null,
    newSlot,
    prevCard: card,
    newCard: {
      ...card,
      storage_location_id: newLocId,
      compartment_index: newComp,
      binder_page: newPage ?? undefined,
      binder_slot: newSlot ?? undefined,
    }
  };
}

