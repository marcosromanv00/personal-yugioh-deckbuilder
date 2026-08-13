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
