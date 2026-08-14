import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SleeveInventoryFormData } from '@/types/collection';

const isSupabaseConfigured = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// GET: List all sleeves with quantity_available computed
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [] });
    }

    // Fetch all sleeves
    const { data: sleeves, error } = await supabase
      .from('yg_sleeves')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Compute quantity_available = quantity_total - SUM(quantity_used across deck_sleeves)
    const { data: deckSleeves, error: dsError } = await supabase
      .from('yg_deck_sleeves')
      .select('sleeve_id, quantity_used');

    if (dsError) throw dsError;

    const usedMap: Record<string, number> = {};
    for (const ds of deckSleeves || []) {
      usedMap[ds.sleeve_id] = (usedMap[ds.sleeve_id] || 0) + (ds.quantity_used || 0);
    }

    const enriched = (sleeves || []).map((s) => ({
      ...s,
      quantity_available: Math.max(0, (s.quantity_total || 0) - (usedMap[s.id] || 0)),
    }));

    return NextResponse.json({ data: enriched });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al obtener fundas:', err);
    return NextResponse.json({ error: err.message || 'Error al obtener fundas' }, { status: 500 });
  }
}

// POST: Create a new sleeve
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, data: { id: `demo-${Date.now()}` } });
    }

    const body: SleeveInventoryFormData = await req.json();

    const { name, brand, color_pattern, color_hex, size_type, condition, quantity_total, notes } = body;

    if (!name || !brand) {
      return NextResponse.json({ error: 'Nombre y marca son obligatorios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('yg_sleeves')
      .insert([{ name, brand, color_pattern, color_hex, size_type, condition, quantity_total, notes }])
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ data: { ...data, quantity_available: data.quantity_total } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al crear funda:', err);
    return NextResponse.json({ error: err.message || 'Error al crear funda' }, { status: 500 });
  }
}

// PUT: Update a sleeve
export async function PUT(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const { id, name, brand, color_pattern, color_hex, size_type, condition, quantity_total, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de funda es obligatorio' }, { status: 400 });
    }

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) payload.name = name;
    if (brand !== undefined) payload.brand = brand;
    if (color_pattern !== undefined) payload.color_pattern = color_pattern;
    if (color_hex !== undefined) payload.color_hex = color_hex;
    if (size_type !== undefined) payload.size_type = size_type;
    if (condition !== undefined) payload.condition = condition;
    if (quantity_total !== undefined) payload.quantity_total = quantity_total;
    if (notes !== undefined) payload.notes = notes;

    const { data, error } = await supabase
      .from('yg_sleeves')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al actualizar funda:', err);
    return NextResponse.json({ error: err.message || 'Error al actualizar funda' }, { status: 500 });
  }
}

// DELETE: Delete a sleeve (only if not in use)
export async function DELETE(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de funda es obligatorio' }, { status: 400 });
    }

    // Check if in use
    const { data: inUse } = await supabase
      .from('yg_deck_sleeves')
      .select('id')
      .eq('sleeve_id', id)
      .limit(1);

    if (inUse && inUse.length > 0) {
      return NextResponse.json(
        { error: 'No puedes eliminar esta funda porque está asignada a uno o más decks.' },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('yg_sleeves').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al eliminar funda:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar funda' }, { status: 500 });
  }
}
