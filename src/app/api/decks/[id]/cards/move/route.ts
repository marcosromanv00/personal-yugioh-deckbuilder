import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

const normalizeSection = (section: string): string => {
  if (section === 'pool') return 'extras';
  return section;
};

// PUT: Mover cartas de una sección a otra dentro del mismo deck
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    if (!deckId) {
      return NextResponse.json({ error: 'ID de deck requerido' }, { status: 400 });
    }

    const body = await req.json();
    const { card_id, from_section, to_section } = body;

    if (!card_id || !from_section || !to_section) {
      return NextResponse.json({ error: 'card_id, from_section y to_section son obligatorios' }, { status: 400 });
    }

    const fromSec = normalizeSection(from_section);
    const toSec = normalizeSection(to_section);

    if (fromSec === toSec) {
      return NextResponse.json({ success: true });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    // 1. Obtener la fila de origen
    const { data: sourceRow, error: srcErr } = await supabase
      .from('yg_deck_cards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('card_id', card_id)
      .eq('section', fromSec)
      .maybeSingle();

    if (srcErr) {
      console.error('Error al buscar fila de origen:', srcErr);
      return NextResponse.json({ error: srcErr.message }, { status: 500 });
    }

    if (!sourceRow) {
      return NextResponse.json({ error: 'Carta no encontrada en la sección de origen' }, { status: 404 });
    }

    // 2. Comprobar si ya existe en la sección destino
    const { data: targetRow, error: tgtErr } = await supabase
      .from('yg_deck_cards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('card_id', card_id)
      .eq('section', toSec)
      .maybeSingle();

    if (tgtErr) {
      console.error('Error al buscar fila de destino:', tgtErr);
      return NextResponse.json({ error: tgtErr.message }, { status: 500 });
    }

    if (targetRow) {
      // Fusionar contadores y eliminar fila de origen
      const { error: mergeErr } = await supabase
        .from('yg_deck_cards')
        .update({ count: targetRow.count + sourceRow.count })
        .eq('deck_id', deckId)
        .eq('card_id', card_id)
        .eq('section', toSec);

      if (mergeErr) throw mergeErr;

      const { error: delErr } = await supabase
        .from('yg_deck_cards')
        .delete()
        .eq('deck_id', deckId)
        .eq('card_id', card_id)
        .eq('section', fromSec);

      if (delErr) throw delErr;
    } else {
      // Actualizar la sección directamente
      const { error: moveErr } = await supabase
        .from('yg_deck_cards')
        .update({ section: toSec })
        .eq('deck_id', deckId)
        .eq('card_id', card_id)
        .eq('section', fromSec);

      if (moveErr) throw moveErr;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error en PUT /api/decks/[id]/cards/move:', err);
    return NextResponse.json({ error: err.message || 'Error al mover carta de sección' }, { status: 500 });
  }
}
