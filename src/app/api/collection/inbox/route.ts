import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseYdkContent } from '@/lib/ydkParser';

// GET: Obtener todas las cartas en la bandeja "Sin Clasificar" (storage_location_id IS NULL)
export async function GET() {
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ data: [] });
    }

    const { data: userCards, error } = await supabase
      .from('yg_user_cards')
      .select('*, card_details:yg_cards(*)')
      .is('storage_location_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: userCards || [] });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al obtener bandeja inbox:', err);
    return NextResponse.json({ error: err.message || 'Error al obtener cartas sin clasificar' }, { status: 500 });
  }
}

// POST: Parsear archivo .ydk o lista de IDs y registrarlos en la bandeja "Sin Clasificar" o en un contenedor específico
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ydkText, cardIds, rarity, status_flag, storage_location_id, compartment_index } = body;
    const targetLocationId = (storage_location_id === 'inbox' || !storage_location_id) ? null : storage_location_id;

    let targetCardIds: number[] = [];

    if (ydkText) {
      const parsed = parseYdkContent(ydkText);
      targetCardIds = [...parsed.mainDeckCardIds, ...parsed.extraDeckCardIds, ...parsed.sideDeckCardIds];
    } else if (Array.isArray(cardIds)) {
      targetCardIds = cardIds;
    }

    if (targetCardIds.length === 0) {
      return NextResponse.json({ error: 'No se encontraron IDs de cartas válidos' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        message: 'Modo demostración: Cartas procesadas',
        parsedCount: targetCardIds.length 
      });
    }

    // 1. Garantizar que las cartas existan en yg_cards (fetch de YGOPRODeck si falta alguna)
    const uniqueIds = Array.from(new Set(targetCardIds));
    const { data: existingCards } = await supabase
      .from('yg_cards')
      .select('id')
      .in('id', uniqueIds);

    const existingIdSet = new Set((existingCards || []).map((c: { id: number }) => c.id));
    const missingIds = uniqueIds.filter(id => !existingIdSet.has(id));

    if (missingIds.length > 0) {
      try {
        // Consultar YGOPRODeck API para las cartas faltantes
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${missingIds.join(',')}`);
        if (response.ok) {
          const result = await response.json();
          const apiCards = result.data || [];
          
          const cardsToInsert = apiCards.map((c: {
            id: number;
            name: string;
            type: string;
            desc?: string;
            atk?: number;
            def?: number;
            level?: number;
            race?: string;
            attribute?: string;
            archetype?: string;
            card_images?: Array<{ image_url?: string; image_url_small?: string }>;
            banlist_info?: { ban_md?: string; ban_tcg?: string; ban_ocg?: string; ban_goat?: string };
          }) => ({
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
            image_url: c.card_images?.[0]?.image_url || null,
            image_url_small: c.card_images?.[0]?.image_url_small || null,
            ban_master_duel: c.banlist_info?.ban_md || 'Unlimited',
            ban_tcg: c.banlist_info?.ban_tcg || 'Unlimited',
            ban_ocg: c.banlist_info?.ban_ocg || 'Unlimited',
            ban_duel_links: c.banlist_info?.ban_goat || 'Unlimited',
          }));

          if (cardsToInsert.length > 0) {
            await supabase.from('yg_cards').upsert(cardsToInsert, { onConflict: 'id' });
          }
        }
      } catch (apiErr) {
        console.warn('Advertencia al consultar cartas faltantes en YGOPRODeck:', apiErr);
      }
    }

    // 2. Verificar cuales IDs realmente existen en yg_cards para evitar violaciones de clave foranea
    const { data: finalValidCards } = await supabase
      .from('yg_cards')
      .select('id')
      .in('id', uniqueIds);

    const validIdSet = new Set((finalValidCards || []).map((c: { id: number }) => c.id));
    const validTargetCardIds = targetCardIds.filter(id => validIdSet.has(id));
    const invalidIds = uniqueIds.filter(id => !validIdSet.has(id));

    if (validTargetCardIds.length === 0) {
      return NextResponse.json({ 
        error: `No se encontraron cartas en la base de datos oficial para los IDs ingresados (${invalidIds.slice(0, 5).join(', ')}). Verifica que los passcodes numéricos sean correctos.` 
      }, { status: 400 });
    }

    // 3. Insertar registros en yg_user_cards reservando la secuencia exacta del listado bulk
    const itemsSequence: Array<{ card_id: number; quantity: number }> = [];
    for (const id of validTargetCardIds) {
      const lastItem = itemsSequence[itemsSequence.length - 1];
      if (lastItem && lastItem.card_id === id) {
        lastItem.quantity += 1;
      } else {
        itemsSequence.push({ card_id: id, quantity: 1 });
      }
    }

    const rowsToInsert = itemsSequence.map(item => ({
      card_id: item.card_id,
      storage_location_id: targetLocationId,
      compartment_index: typeof compartment_index === 'number' ? compartment_index : 0,
      quantity: item.quantity,
      rarity: rarity || 'Common',
      status_flag: status_flag || 'collection',
      sleeve_type: 'none',
      condition: 'Near Mint',
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('yg_user_cards')
      .insert(rowsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    const insertedTotal = rowsToInsert.reduce((acc, curr) => acc + curr.quantity, 0);
    let warningMsg: string | undefined = undefined;
    if (invalidIds.length > 0) {
      warningMsg = `Se omitieron ${invalidIds.length} IDs no válidos (${invalidIds.slice(0, 3).join(', ')}${invalidIds.length > 3 ? '...' : ''}).`;
    }

    return NextResponse.json({
      success: true,
      insertedCount: insertedTotal,
      uniqueCards: inserted?.length || 0,
      invalidCount: invalidIds.length,
      warningMsg,
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al importar a bandeja Inbox:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar la importación' }, { status: 500 });
  }
}
