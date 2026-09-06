import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureCardsExistInDb } from '@/lib/ygoprodeck';

const isSupabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// GET: Obtener todas las variantes de un deck
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    if (!deckId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    if (!isSupabaseConfigured()) return NextResponse.json({ data: [] });

    const { data: variants, error } = await supabase
      .from('yg_deck_variants')
      .select(`
        *,
        cards:yg_deck_variant_cards (
          card_id,
          count,
          proxy_count,
          section,
          card_details:yg_cards (
            name,
            type,
            image_url,
            image_url_small
          )
        )
      `)
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: variants || [] });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Crear una nueva variante para el deck
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    const body = await req.json();
    const { name, description = '', is_active = false, cards = [] } = body;

    if (!deckId || !name?.trim()) {
      return NextResponse.json({ error: 'Nombre de variante requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        data: { id: `var-demo-${Date.now()}`, deck_id: deckId, name, is_active, cards }
      });
    }

    if (is_active) {
      await supabase.from('yg_deck_variants').update({ is_active: false }).eq('deck_id', deckId);
    }

    const { data: variant, error: varErr } = await supabase
      .from('yg_deck_variants')
      .insert([{ deck_id: deckId, name: name.trim(), description, is_active }])
      .select()
      .single();

    if (varErr) throw varErr;

    if (cards.length > 0) {
      await ensureCardsExistInDb(cards);
      const payload = cards.map((c: { card_id?: number; id?: number; count: number; proxy_count?: number; section: string }) => ({
        variant_id: variant.id,
        card_id: c.card_id || c.id,
        count: c.count,
        proxy_count: c.proxy_count || 0,
        section: c.section
      }));
      const { error: cardsErr } = await supabase.from('yg_deck_variant_cards').insert(payload);
      if (cardsErr) throw cardsErr;
    }

    return NextResponse.json({ data: { ...variant, cards } });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Activar o actualizar una variante
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    const body = await req.json();
    const { variant_id, action = 'activate', name, description, cards, transfer_user_card_ids = [] } = body;

    if (!variant_id) return NextResponse.json({ error: 'ID de variante requerido' }, { status: 400 });
    if (!isSupabaseConfigured()) return NextResponse.json({ success: true });

    if (action === 'activate') {
      // 1. Desactivar las demás y activar la seleccionada
      await supabase.from('yg_deck_variants').update({ is_active: false }).eq('deck_id', deckId);
      await supabase.from('yg_deck_variants').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', variant_id);

      // 2. Si se envían cartas actualizadas o si leemos las cartas de la variante
      let variantCards = cards;
      if (!variantCards) {
        const { data: fetched } = await supabase.from('yg_deck_variant_cards').select('*').eq('variant_id', variant_id);
        variantCards = fetched || [];
      }

      if (variantCards.length > 0) {
        await supabase.from('yg_deck_cards').delete().eq('deck_id', deckId);
        const deckCardsPayload = variantCards.map((c: { card_id?: number; id?: number; count: number; proxy_count?: number; section: string }) => ({
          deck_id: deckId,
          card_id: c.card_id || c.id,
          count: c.count,
          proxy_count: c.proxy_count || 0,
          section: c.section
        }));
        await supabase.from('yg_deck_cards').insert(deckCardsPayload);
      }

      // 3. Trasladar cartas físicas de otras ubicaciones si fueron confirmadas
      if (transfer_user_card_ids.length > 0) {
        const { data: currentDeck } = await supabase.from('yg_decks').select('storage_location_id').eq('id', deckId).single();
        await supabase
          .from('yg_user_cards')
          .update({
            deck_id: deckId,
            storage_location_id: currentDeck?.storage_location_id || null,
            status_flag: 'in_deck'
          })
          .in('id', transfer_user_card_ids);
      }

      // 4. Actualizar secciones físicas en yg_user_cards para el deck
      for (const vc of variantCards) {
        const cardId = vc.card_id || vc.id;
        const section = vc.section === 'extras' ? null : vc.section;
        await supabase
          .from('yg_user_cards')
          .update({ deck_section: section })
          .eq('deck_id', deckId)
          .eq('card_id', cardId);
      }

      return NextResponse.json({ success: true });
    }

    // Actualización de metadatos o cartas de la variante
    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updatePayload.name = name.trim();
    if (description !== undefined) updatePayload.description = description;

    await supabase.from('yg_deck_variants').update(updatePayload).eq('id', variant_id);

    if (cards && Array.isArray(cards)) {
      await ensureCardsExistInDb(cards);
      await supabase.from('yg_deck_variant_cards').delete().eq('variant_id', variant_id);
      const payload = cards.map((c: { card_id?: number; id?: number; count: number; proxy_count?: number; section: string }) => ({
        variant_id,
        card_id: c.card_id || c.id,
        count: c.count,
        proxy_count: c.proxy_count || 0,
        section: c.section
      }));
      await supabase.from('yg_deck_variant_cards').insert(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Eliminar una variante
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;
    const url = new URL(req.url);
    const variantId = url.searchParams.get('variant_id');

    if (!variantId) return NextResponse.json({ error: 'variant_id es requerido' }, { status: 400 });
    if (!isSupabaseConfigured()) return NextResponse.json({ success: true });

    // Verificar si era la activa
    const { data: varData } = await supabase.from('yg_deck_variants').select('is_active').eq('id', variantId).single();
    await supabase.from('yg_deck_variants').delete().eq('id', variantId);

    if (varData?.is_active) {
      const { data: remaining } = await supabase
        .from('yg_deck_variants')
        .select('id')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await supabase.from('yg_deck_variants').update({ is_active: true }).eq('id', remaining[0].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
