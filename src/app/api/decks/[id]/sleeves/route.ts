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

// POST: Assign a sleeve to a deck section (recalculates quantity_used and updates card sleeves)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: deckId } = await params;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const { sleeve_id, section_type, action_mode = 'take', added_quantity = 0 } = body as {
      sleeve_id: string;
      section_type: 'main_side' | 'extra';
      action_mode?: 'take' | 'add';
      added_quantity?: number;
    };

    if (!sleeve_id || !section_type) {
      return NextResponse.json({ error: 'sleeve_id y section_type son obligatorios' }, { status: 400 });
    }

    // 1. Calculate how many cards are in the relevant sections (from the deck recipe)
    const { data: deckCards, error: dcError } = await supabase
      .from('yg_deck_cards')
      .select('count, section')
      .eq('deck_id', deckId);

    if (dcError) throw dcError;

    let N_total = 0;
    const targetSections = section_type === 'main_side' ? ['main', 'side'] : ['extra'];
    for (const dc of deckCards || []) {
      if (targetSections.includes(dc.section)) {
        N_total += dc.count || 0;
      }
    }

    // 2. Fetch the selected sleeve details
    const { data: sleeve, error: sleeveErr } = await supabase
      .from('yg_sleeves')
      .select('*')
      .eq('id', sleeve_id)
      .single();

    if (sleeveErr) throw sleeveErr;

    // 3. Count physical cards in this deck section that are already sleeved with this specific sleeve
    const { data: userCards, error: ucError } = await supabase
      .from('yg_user_cards')
      .select('quantity, sleeve_type, sleeve_brand, sleeve_color')
      .eq('deck_id', deckId)
      .in('deck_section', targetSections);

    if (ucError) throw ucError;

    let N_already_sleeved_with_S = 0;
    for (const uc of userCards || []) {
      if (
        uc.sleeve_type !== 'none' &&
        uc.sleeve_brand?.toLowerCase() === sleeve.brand?.toLowerCase() &&
        uc.sleeve_color?.toLowerCase() === sleeve.color_pattern?.toLowerCase()
      ) {
        N_already_sleeved_with_S += uc.quantity || 0;
      }
    }

    const N_needed = Math.max(0, N_total - N_already_sleeved_with_S);

    // 4. Calculate total sleeves of this type used by other decks
    const { data: otherUsages } = await supabase
      .from('yg_deck_sleeves')
      .select('quantity_used')
      .eq('sleeve_id', sleeve_id)
      .neq('deck_id', deckId);

    const totalOtherUsed = (otherUsages || []).reduce((sum, u) => sum + (u.quantity_used || 0), 0);

    let currentTotal = sleeve.quantity_total || 0;

    // 5. Handle action modes (e.g. adding new stock of sleeves to inventory)
    if (action_mode === 'add' && added_quantity > 0) {
      currentTotal += added_quantity;
      const { error: updateSleeveErr } = await supabase
        .from('yg_sleeves')
        .update({ quantity_total: currentTotal, updated_at: new Date().toISOString() })
        .eq('id', sleeve_id);

      if (updateSleeveErr) throw updateSleeveErr;
    }

    const available = currentTotal - totalOtherUsed;

    if (N_needed > available) {
      return NextResponse.json(
        {
          error: `No hay suficientes fundas en la colección. Necesitas ${N_needed} fundas de "${sleeve.name}" pero solo hay ${available} disponibles.`,
        },
        { status: 409 }
      );
    }

    // 6. Update physical cards in yg_user_cards:
    // Update all cards in this deck section that do not match the selected sleeve.
    const { data: cardsToUpdate } = await supabase
      .from('yg_user_cards')
      .select('id, sleeve_brand, sleeve_color, sleeve_type')
      .eq('deck_id', deckId)
      .in('deck_section', targetSections);

    for (const uc of cardsToUpdate || []) {
      const isAlreadyMatching =
        uc.sleeve_type !== 'none' &&
        uc.sleeve_brand?.toLowerCase() === sleeve.brand?.toLowerCase() &&
        uc.sleeve_color?.toLowerCase() === sleeve.color_pattern?.toLowerCase();

      if (!isAlreadyMatching) {
        const { error: cardUpdateErr } = await supabase
          .from('yg_user_cards')
          .update({
            sleeve_type: 'single',
            sleeve_brand: sleeve.brand,
            sleeve_color: sleeve.color_pattern,
            sleeve_condition: sleeve.condition || 'good',
          })
          .eq('id', uc.id);

        if (cardUpdateErr) throw cardUpdateErr;
      }
    }

    // 7. Upsert the deck sleeve relation (quantity_used becomes the section size N_total)
    const { data, error } = await supabase
      .from('yg_deck_sleeves')
      .upsert(
        { deck_id: deckId, sleeve_id, section_type, quantity_used: N_total },
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
