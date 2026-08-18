import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// Normalizar sección para respetar constraints ('pool' -> 'extras')
const normalizeSection = (section: string): string => {
  if (section === 'pool') return 'extras';
  return section;
};

// POST: Añadir carta o incrementar copias en una sección del deck
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    if (!deckId) {
      return NextResponse.json({ error: 'ID de deck requerido' }, { status: 400 });
    }

    const body = await req.json();
    const { card_id, section = 'main', count = 1, proxy_count = 0 } = body;

    if (!card_id) {
      return NextResponse.json({ error: 'card_id es requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const targetSection = normalizeSection(section);

    // Buscar si ya existe la carta en esa sección del deck
    const { data: existing, error: findErr } = await supabase
      .from('yg_deck_cards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('card_id', card_id)
      .eq('section', targetSection)
      .maybeSingle();

    if (findErr) {
      console.error('Error al buscar carta existente en deck:', findErr);
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }

    if (existing) {
      const { error: updateErr } = await supabase
        .from('yg_deck_cards')
        .update({ count: existing.count + count })
        .eq('deck_id', deckId)
        .eq('card_id', card_id)
        .eq('section', targetSection);

      if (updateErr) {
        console.error('Error al incrementar copias en deck:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabase
        .from('yg_deck_cards')
        .insert([{
          deck_id: deckId,
          card_id: card_id,
          count: count,
          proxy_count: proxy_count,
          section: targetSection
        }]);

      if (insertErr) {
        console.error('Error al insertar carta en deck:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error en POST /api/decks/[id]/cards:', err);
    return NextResponse.json({ error: err.message || 'Error al agregar carta al deck' }, { status: 500 });
  }
}

// DELETE: Retirar carta o decrementar copias en una sección del deck
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    if (!deckId) {
      return NextResponse.json({ error: 'ID de deck requerido' }, { status: 400 });
    }

    const body = await req.json();
    const { card_id, section = 'main', remove_all = false } = body;

    if (!card_id) {
      return NextResponse.json({ error: 'card_id es requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const targetSection = normalizeSection(section);

    const { data: existing, error: findErr } = await supabase
      .from('yg_deck_cards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('card_id', card_id)
      .eq('section', targetSection)
      .maybeSingle();

    if (findErr) {
      console.error('Error al buscar carta en deck:', findErr);
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ success: true });
    }

    if (remove_all || existing.count <= 1) {
      const { error: delErr } = await supabase
        .from('yg_deck_cards')
        .delete()
        .eq('deck_id', deckId)
        .eq('card_id', card_id)
        .eq('section', targetSection);

      if (delErr) {
        console.error('Error al eliminar carta del deck:', delErr);
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    } else {
      const { error: updateErr } = await supabase
        .from('yg_deck_cards')
        .update({ count: existing.count - 1 })
        .eq('deck_id', deckId)
        .eq('card_id', card_id)
        .eq('section', targetSection);

      if (updateErr) {
        console.error('Error al decrementar carta en deck:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error en DELETE /api/decks/[id]/cards:', err);
    return NextResponse.json({ error: err.message || 'Error al remover carta del deck' }, { status: 500 });
  }
}
