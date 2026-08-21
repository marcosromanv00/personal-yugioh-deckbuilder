import { NextRequest, NextResponse } from 'next/server';
import { CardMarketPrices } from '@/lib/valuationEngine';

interface YgoCardPricePayload {
  id: number;
  name: string;
  card_prices?: {
    cardmarket_price?: string;
    tcgplayer_price?: string;
    ebay_price?: string;
    amazon_price?: string;
    coolstuffinc_price?: string;
  }[];
  card_sets?: {
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_rarity_code: string;
    set_price: string;
  }[];
}

// In-Memory Cache de Precios de Mercado con TTL de 2 horas
const memoryPriceCache = new Map<number, { data: CardMarketPrices; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cardIds: number[] = Array.isArray(body?.card_ids)
      ? body.card_ids.map((id: unknown) => Number(id)).filter((id: number) => !isNaN(id) && id > 0)
      : [];

    if (cardIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const uniqueIds = Array.from(new Set(cardIds));
    const resultPrices: CardMarketPrices[] = [];
    const missingIds: number[] = [];
    const now = Date.now();

    // 1. Revisar caché en memoria primero
    for (const id of uniqueIds) {
      const cached = memoryPriceCache.get(id);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        resultPrices.push(cached.data);
      } else {
        missingIds.push(id);
      }
    }

    // 2. Si hay IDs faltantes, consultar a YGOPRODeck en lotes (batch de hasta 50 IDs)
    if (missingIds.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
        const chunk = missingIds.slice(i, i + BATCH_SIZE);
        const idQuery = chunk.join(',');

        try {
          const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${idQuery}`, {
            headers: { 'User-Agent': 'Personal-Yugioh-Deckbuilder/1.0' },
            next: { revalidate: 3600 },
          });

          if (res.ok) {
            const json = await res.json();
            const cards: YgoCardPricePayload[] = Array.isArray(json?.data) ? json.data : [];

            for (const c of cards) {
              const prices = c.card_prices?.[0] || {};
              const tcgPrice = parseFloat(prices.tcgplayer_price || '0.25') || 0.25;
              const cmPrice = parseFloat(prices.cardmarket_price || '0.20') || 0.20;
              const ebayPrice = parseFloat(prices.ebay_price || '0.99') || 0.99;

              const priceItem: CardMarketPrices = {
                card_id: c.id,
                name: c.name,
                tcgplayer_price: tcgPrice,
                cardmarket_price: cmPrice,
                ebay_price: ebayPrice,
                sets_count: c.card_sets?.length || 0,
              };

              memoryPriceCache.set(c.id, { data: priceItem, timestamp: now });
              resultPrices.push(priceItem);
            }
          } else {
            // Si la llamada falló o no se encontraron, registrar precio estimado seguro
            chunk.forEach((fallbackId) => {
              const fallbackItem: CardMarketPrices = {
                card_id: fallbackId,
                name: `Carta #${fallbackId}`,
                tcgplayer_price: 0.25,
                cardmarket_price: 0.20,
                ebay_price: 0.99,
              };
              memoryPriceCache.set(fallbackId, { data: fallbackItem, timestamp: now });
              resultPrices.push(fallbackItem);
            });
          }
        } catch (fetchErr) {
          console.warn('Advertencia al consultar precios de lote en YGOPRODeck:', fetchErr);
          chunk.forEach((fallbackId) => {
            const fallbackItem: CardMarketPrices = {
              card_id: fallbackId,
              name: `Carta #${fallbackId}`,
              tcgplayer_price: 0.25,
              cardmarket_price: 0.20,
              ebay_price: 0.99,
            };
            resultPrices.push(fallbackItem);
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: resultPrices,
      count: resultPrices.length,
    });
  } catch (err) {
    console.error('Error en POST /api/collection/valuation:', err);
    return NextResponse.json({ success: false, error: 'Error al obtener valoración' }, { status: 500 });
  }
}
