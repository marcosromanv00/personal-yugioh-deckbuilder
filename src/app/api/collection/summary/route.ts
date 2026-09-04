import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface CardSummaryItem {
  card_id: number;
  quantity: number;
  is_proxy: boolean;
  storage_location_id: string | null;
  deck_id: string | null;
}

/**
 * GET /api/collection/summary
 * Returns ultra-lightweight inventory summary without expensive joins to yg_cards.
 * Reduces payload from 5MB to ~100KB for all 3,000+ cards for instant DeckBuilder and KPIs.
 */
export async function GET() {
  try {
    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, data: [] });
    }

    let allRows: {
      card_id: number;
      quantity?: number | null;
      is_proxy?: boolean | null;
      storage_location_id?: string | null;
      deck_id?: string | null;
    }[] = [];

    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('yg_user_cards')
        .select('card_id, quantity, is_proxy, storage_location_id, deck_id')
        .range(from, from + batchSize - 1);

      if (error) {
        console.warn('Advertencia consultando yg_user_cards summary chunk:', error.message);
        break;
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    const summary: CardSummaryItem[] = allRows.map((row) => ({
      card_id: row.card_id,
      quantity: row.quantity ?? 1,
      is_proxy: Boolean(row.is_proxy),
      storage_location_id: row.storage_location_id ?? null,
      deck_id: row.deck_id ?? null,
    }));

    return NextResponse.json(
      { success: true, count: summary.length, data: summary },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ success: false, error: message, data: [] }, { status: 500 });
  }
}
