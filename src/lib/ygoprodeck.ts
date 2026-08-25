import { supabase } from './supabase';

export interface YGOCardImage {
  id: number;
  image_url: string;
  image_url_small: string;
}

export interface YGOCardBanlist {
  ban_tcg?: string;
  ban_ocg?: string;
  ban_goat?: string;
  ban_md?: string; // Algunas cartas tienen estado de ban para Master Duel
}

export interface YGOCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  archetype?: string;
  card_images: YGOCardImage[];
  banlist_info?: YGOCardBanlist;
}

export interface YGOPRODeckResponse {
  data: YGOCard[];
}

const YGOPRODECK_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

export interface CardInputSeed {
  id: number;
  name?: string;
  type?: string;
  desc?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  race?: string | null;
  attribute?: string | null;
  archetype?: string | null;
  image_url?: string | null;
  image_url_small?: string | null;
}

/**
 * Garantiza que una lista de cartas exista en la tabla `yg_cards` de Supabase
 * antes de realizar inserciones en tablas con clave foránea (yg_deck_cards, yg_user_cards, etc.).
 * Si alguna carta no existe en Supabase, la consulta a YGOPRODeck API en lote o utiliza la metadata provista.
 */
export async function ensureCardsExistInDb(
  cards: (number | CardInputSeed)[]
): Promise<Set<number>> {
  if (!cards || cards.length === 0) return new Set();

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    return new Set(
      cards
        .map(c => (typeof c === 'number' ? c : c.id))
        .filter(id => typeof id === 'number' && !isNaN(id))
    );
  }

  // 1. Extraer IDs únicos válidos y mapa de seeds/hints provistos por el cliente
  const inputMap = new Map<number, CardInputSeed>();
  for (const c of cards) {
    if (typeof c === 'number') {
      if (!isNaN(c) && c > 0) inputMap.set(c, { id: c });
    } else if (c && typeof c.id === 'number' && !isNaN(c.id) && c.id > 0) {
      inputMap.set(c.id, c);
    }
  }

  const uniqueIds = Array.from(inputMap.keys());
  if (uniqueIds.length === 0) return new Set();

  try {
    // 2. Verificar qué cartas ya existen en yg_cards (en lotes de 500 para evitar límites de query)
    const existingIdSet = new Set<number>();
    const checkBatchSize = 500;
    for (let i = 0; i < uniqueIds.length; i += checkBatchSize) {
      const chunk = uniqueIds.slice(i, i + checkBatchSize);
      const { data: existing, error } = await supabase
        .from('yg_cards')
        .select('id')
        .in('id', chunk);

      if (!error && existing) {
        existing.forEach((row: { id: number }) => existingIdSet.add(row.id));
      }
    }

    const missingIds = uniqueIds.filter(id => !existingIdSet.has(id));
    if (missingIds.length === 0) {
      return existingIdSet;
    }

    // 3. Obtener cartas faltantes desde la API oficial de YGOPRODeck
    const apiFetchedCards: Record<string, unknown>[] = [];
    const apiBatchSize = 50; // YGOPRODeck acepta varias decenas por id=...

    for (let i = 0; i < missingIds.length; i += apiBatchSize) {
      const chunk = missingIds.slice(i, i + apiBatchSize);
      try {
        const response = await fetch(`${YGOPRODECK_API_URL}?id=${chunk.join(',')}&misc=yes`);
        if (response.ok) {
          const result: YGOPRODeckResponse = await response.json();
          const apiData = result.data || [];
          for (const c of apiData) {
            const img = c.card_images?.[0];
            apiFetchedCards.push({
              id: c.id,
              name: c.name,
              type: c.type,
              desc: c.desc || '',
              atk: c.atk !== undefined ? c.atk : null,
              def: c.def !== undefined ? c.def : null,
              level: c.level !== undefined ? c.level : null,
              race: c.race || null,
              attribute: c.attribute || null,
              archetype: c.archetype || null,
              image_url: img?.image_url || null,
              image_url_small: img?.image_url_small || null,
              ban_master_duel: c.banlist_info?.ban_md || 'Unlimited',
              ban_tcg: c.banlist_info?.ban_tcg || 'Unlimited',
              ban_ocg: c.banlist_info?.ban_ocg || 'Unlimited',
              ban_duel_links: c.banlist_info?.ban_goat || 'Unlimited',
            });
          }
        }
      } catch (fetchErr) {
        console.warn('Advertencia al consultar lote en YGOPRODeck API:', fetchErr);
      }
    }

    // 4. Armar registros para upsertar en yg_cards
    const upsertMap = new Map<number, Record<string, unknown>>();

    // Prioridad 1: Cartas obtenidas de YGOPRODeck API
    for (const card of apiFetchedCards) {
      if (typeof card.id === 'number') {
        upsertMap.set(card.id, card);
      }
    }

    // Prioridad 2: Para cualquier missingId que no vino de YGOPRODeck, usar datos hint o sintéticos
    for (const id of missingIds) {
      if (!upsertMap.has(id)) {
        const hint = inputMap.get(id);
        upsertMap.set(id, {
          id,
          name: hint?.name || `Card #${id}`,
          type: hint?.type || 'Normal Monster',
          desc: hint?.desc || '',
          atk: hint?.atk ?? null,
          def: hint?.def ?? null,
          level: hint?.level ?? null,
          race: hint?.race ?? null,
          attribute: hint?.attribute ?? null,
          archetype: hint?.archetype ?? null,
          image_url: hint?.image_url || `https://images.ygoprodeck.com/images/cards/${id}.jpg`,
          image_url_small: hint?.image_url_small || hint?.image_url || `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`,
          ban_master_duel: 'Unlimited',
          ban_tcg: 'Unlimited',
          ban_ocg: 'Unlimited',
          ban_duel_links: 'Unlimited'
        });
      }
    }

    const cardsToUpsert = Array.from(upsertMap.values());
    if (cardsToUpsert.length > 0) {
      const upsertBatchSize = 100;
      for (let i = 0; i < cardsToUpsert.length; i += upsertBatchSize) {
        const batch = cardsToUpsert.slice(i, i + upsertBatchSize);
        const { error: upsertErr } = await supabase
          .from('yg_cards')
          .upsert(batch, { onConflict: 'id' });

        if (upsertErr) {
          console.error('Error upserting missing cards into yg_cards:', upsertErr);
        } else {
          batch.forEach(c => existingIdSet.add(c.id as number));
        }
      }
    }

    return existingIdSet;
  } catch (err) {
    console.error('Error crítico en ensureCardsExistInDb:', err);
    return new Set(uniqueIds);
  }
}

/**
 * Obtiene todas las cartas de la base de datos de YGOPRODeck.
 * Útil para la sincronización y caching inicial en la base de datos de Supabase.
 */
export async function fetchAllCards(): Promise<YGOCard[]> {
  try {
    const response = await fetch(`${YGOPRODECK_API_URL}?misc=yes`);
    if (!response.ok) {
      throw new Error(`Error al consultar YGOPRODeck API: ${response.statusText}`);
    }
    const result: YGOPRODeckResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error en fetchAllCards:', error);
    throw error;
  }
}

/**
 * Busca una carta individual por su nombre exacto o ID.
 */
export async function fetchCardByNameOrId(param: string | number): Promise<YGOCard | null> {
  const queryParam = typeof param === 'number' ? `id=${param}` : `name=${encodeURIComponent(param)}`;
  try {
    const response = await fetch(`${YGOPRODECK_API_URL}?${queryParam}`);
    if (!response.ok) {
      if (response.status === 400) {
        // Carta no encontrada
        return null;
      }
      throw new Error(`Error al buscar carta: ${response.statusText}`);
    }
    const result: YGOPRODeckResponse = await response.json();
    return result.data[0] || null;
  } catch (error) {
    console.error(`Error en fetchCardByNameOrId para ${param}:`, error);
    return null;
  }
}
