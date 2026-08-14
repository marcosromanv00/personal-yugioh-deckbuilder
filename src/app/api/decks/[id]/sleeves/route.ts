import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const isSupabaseConfigured = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// GET: Get sleeves assigned to a deck with availability info
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: deckId } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('yg_deck_sleeves')
      .select('*, sleeve_details:yg_sleeves(*)')
      .eq('deck_id', deckId);

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Assign a sleeve to a deck section (recalculates quantity_used)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: deckId } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const { sleeve_id, section_type } = body as { sleeve_id: string; section_type: 'main_side' | 'extra' };

    if (!sleeve_id || !section_type) {
      return NextResponse.json({ error: 'sleeve_id y section_type son obligatorios' }, { status: 400 });
    }

    // Calculate how many cards are in the relevant sections
    const { data: deckCards, error: dcError } = await supabase
      .from('yg_deck_cards')
      .select('count, section')
      .eq('deck_id', deckId);

    if (dcError) throw dcError;

    let quantity_used = 0;
    for (const dc of deckCards || []) {
      if (section_type === 'main_side' && (dc.section === 'main' || dc.section === 'side')) {
        quantity_used += dc.count || 0;
      } else if (section_type === 'extra' && dc.section === 'extra') {
        quantity_used += dc.count || 0;
      }
    }

    // Check sleeve has enough stock (considering other deck assignments)
    const { data: sleeve, error: sleeveErr } = await supabase
      .from('yg_sleeves')
      .select('quantity_total')
      .eq('id', sleeve_id)
      .single();

    if (sleeveErr) throw sleeveErr;

    // Get total used by other decks (exclude current deck's same section)
    const { data: otherUsages } = await supabase
      .from('yg_deck_sleeves')
      .select('quantity_used')
      .eq('sleeve_id', sleeve_id)
      .neq('deck_id', deckId);

    const totalOtherUsed = (otherUsages || []).reduce((sum, u) => sum + (u.quantity_used || 0), 0);
    const available = (sleeve?.quantity_total || 0) - totalOtherUsed;

    if (quantity_used > available) {
      return NextResponse.json(
        { error: `No hay suficientes fundas. Necesitas ${quantity_used} pero solo hay ${available} disponibles.` },
        { status: 409 }
      );
    }

    // Upsert: deck can only have one sleeve per section
    const { data, error } = await supabase
      .from('yg_deck_sleeves')
      .upsert(
        { deck_id: deckId, sleeve_id, section_type, quantity_used },
        { onConflict: 'deck_id,section_type' }
      )
      .select('*, sleeve_details:yg_sleeves(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Unassign a sleeve from a deck section
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: deckId } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = req.nextUrl;
    const section_type = searchParams.get('section_type');

    if (!section_type) {
      return NextResponse.json({ error: 'section_type es obligatorio' }, { status: 400 });
    }

    const { error } = await supabase
      .from('yg_deck_sleeves')
      .delete()
      .eq('deck_id', deckId)
      .eq('section_type', section_type);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
