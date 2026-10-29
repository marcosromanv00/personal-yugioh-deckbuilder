import { NextRequest, NextResponse } from 'next/server';
import { CardSetPrinting, CardSetPrintingsResponse } from '@/types/triage';
import { analyzeRarityDisparity } from '@/lib/rarityDisparity.utils';

interface YgoCardApiSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

const setsCache = new Map<number, { data: CardSetPrintingsResponse; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cardId = parseInt(resolvedParams.id, 10);

    if (isNaN(cardId) || cardId <= 0) {
      return NextResponse.json({ success: false, error: 'ID de carta inválido' }, { status: 400 });
    }

    const now = Date.now();
    const cached = setsCache.get(cardId);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, data: cached.data });
    }

    const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`, {
      headers: { 'User-Agent': 'Personal-Yugioh-Deckbuilder/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const fallbackPayload: CardSetPrintingsResponse = {
        cardId,
        name: `Carta #${cardId}`,
        defaultRarity: 'Common',
        highValueWarning: false,
        printings: [],
        marketPriceTcg: 0.25,
        marketPriceCardmarket: 0.20,
      };
      fallbackPayload.rarityAlert = analyzeRarityDisparity(fallbackPayload);

      return NextResponse.json({
        success: true,
        data: fallbackPayload,
      });
    }

    const json = await res.json();
    const cardData = json?.data?.[0];

    const prices = cardData?.card_prices?.[0] || {};
    const tcgPrice = parseFloat(prices.tcgplayer_price || '0.25') || 0.25;
    const cmPrice = parseFloat(prices.cardmarket_price || '0.20') || 0.20;

    const rawSets: YgoCardApiSet[] = Array.isArray(cardData?.card_sets) ? cardData.card_sets : [];
    const printings: CardSetPrinting[] = rawSets.map(s => {
      const parsedSetPrice = parseFloat(s.set_price || '0');
      const finalPrice = parsedSetPrice > 0 ? parsedSetPrice : tcgPrice;

      return {
        setName: s.set_name,
        setCode: s.set_code,
        setRarity: s.set_rarity,
        setRarityCode: s.set_rarity_code,
        setPrice: finalPrice,
      };
    });

    const hasHighValue = tcgPrice >= 3.0 || printings.some(p => p.setPrice >= 3.0);
    const defaultRarity = printings[0]?.setRarity || 'Common';

    const tempPayload: CardSetPrintingsResponse = {
      cardId,
      name: cardData?.name || `Carta #${cardId}`,
      defaultRarity,
      highValueWarning: hasHighValue,
      printings,
      marketPriceTcg: tcgPrice,
      marketPriceCardmarket: cmPrice,
    };

    const rarityAlert = analyzeRarityDisparity(tempPayload);
    const payload: CardSetPrintingsResponse = {
      ...tempPayload,
      highValueWarning: hasHighValue || rarityAlert.hasDisparity,
      rarityAlert,
    };

    setsCache.set(cardId, { data: payload, timestamp: now });
    return NextResponse.json({ success: true, data: payload });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
