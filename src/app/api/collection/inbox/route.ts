import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseYdkContent } from '@/lib/ydkParser';
import { ensureCardsExistInDb } from '@/lib/ygoprodeck';

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
      return NextResponse.json({ error: 'No se enviaron cartas para procesar' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        message: 'Modo demostración: Cartas procesadas',
        parsedCount: targetCardIds.length 
      });
    }

    // 1. Garantizar que las cartas existan en yg_cards (fetch de YGOPRODeck si falta alguna)
    const validIdSet = await ensureCardsExistInDb(targetCardIds);
    const validTargetCardIds = targetCardIds.filter(id => validIdSet.has(id));
    const uniqueIds = Array.from(new Set(targetCardIds));
    const invalidIds = uniqueIds.filter(id => !validIdSet.has(id));

    if (validTargetCardIds.length === 0) {
      return NextResponse.json({ 
        error: `No se encontraron cartas en la base de datos oficial para los IDs ingresados (${invalidIds.slice(0, 5).join(', ')}). Verifica que los passcodes numéricos sean correctos.` 
      }, { status: 400 });
    }

    // 3. Insertar registros en yg_user_cards
    const now = Date.now();
    let rowsToInsert: Array<Record<string, unknown>> = [];

      // Agrupar apariciones consecutivas idénticas
      const itemsSequence: Array<{ card_id: number; quantity: number }> = [];
      for (const id of validTargetCardIds) {
        const lastItem = itemsSequence[itemsSequence.length - 1];
        if (lastItem && lastItem.card_id === id) {
          lastItem.quantity += 1;
        } else {
          itemsSequence.push({ card_id: id, quantity: 1 });
        }
      }

      rowsToInsert = itemsSequence.map((item, idx) => ({
        card_id: item.card_id,
        storage_location_id: targetLocationId,
        compartment_index: typeof compartment_index === 'number' ? compartment_index : 0,
        quantity: item.quantity,
        rarity: rarity || 'Common',
        status_flag: status_flag || 'collection',
        sleeve_type: 'none',
        condition: 'Near Mint',
        created_at: new Date(now + idx * 1000).toISOString(),
      }));

    const { data: inserted, error: insertError } = await supabase
      .from('yg_user_cards')
      .insert(rowsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    const insertedTotal = rowsToInsert.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
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
