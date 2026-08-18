import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// GET: Obtener un deck específico con sus cartas y fundas
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    if (!deckId) {
      return NextResponse.json({ error: 'ID de deck es requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 });
    }

    const { data: deck, error } = await supabase
      .from('yg_decks')
      .select(`
        *,
        cards:yg_deck_cards (
          card_id,
          count,
          proxy_count,
          section,
          card_details:yg_cards (
            name,
            type,
            desc,
            atk,
            def,
            level,
            race,
            attribute,
            archetype,
            image_url,
            image_url_small
          )
        ),
        sleeves:yg_deck_sleeves (
          id,
          sleeve_id,
          section_type,
          quantity_used,
          sleeve_details:yg_sleeves (*)
        )
      `)
      .eq('id', deckId)
      .single();

    if (error) {
      console.error('Error al obtener deck:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data: deck });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error en GET /api/decks/[id]:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT: Actualizar metadata y fundas de un deck específico
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    if (!deckId) {
      return NextResponse.json({ error: 'ID de deck es requerido' }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      description,
      format,
      skill_name,
      storage_location_id,
      is_active,
      sleeves // Array de { sleeve_id: string, section: 'main_side' | 'extra' }
    } = body;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (format !== undefined) updatePayload.format = format;
    if (skill_name !== undefined) updatePayload.skill_name = skill_name;
    if (storage_location_id !== undefined) updatePayload.storage_location_id = storage_location_id;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { data: updatedDeck, error: updateErr } = await supabase
      .from('yg_decks')
      .update(updatePayload)
      .eq('id', deckId)
      .select()
      .single();

    if (updateErr) {
      console.error('Error al actualizar deck:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Actualizar estado de las cartas en el inventario físico si cambió is_active
    if (is_active !== undefined) {
      const newStatusFlag = is_active ? 'in_deck' : 'collection';
      await supabase
        .from('yg_user_cards')
        .update({ status_flag: newStatusFlag })
        .eq('deck_id', deckId);
    }

    // Actualizar ubicación física base de las cartas del deck si cambió storage_location_id
    if (storage_location_id !== undefined) {
      await supabase
        .from('yg_user_cards')
        .update({
          storage_location_id: storage_location_id,
          binder_page: null,
          binder_slot: null
        })
        .eq('deck_id', deckId);
    }

    // Sincronizar fundas asignadas al deck si se especificaron
    if (sleeves && Array.isArray(sleeves)) {
      const definedSections = sleeves.map(s => s.section || s.section_type);

      // Eliminar fundas de secciones no incluidas
      if (definedSections.length > 0) {
        await supabase
          .from('yg_deck_sleeves')
          .delete()
          .eq('deck_id', deckId)
          .not('section_type', 'in', `(${definedSections.join(',')})`);
      } else {
        await supabase
          .from('yg_deck_sleeves')
          .delete()
          .eq('deck_id', deckId);
      }

      // Upsert de cada funda
      for (const slv of sleeves) {
        const secType = slv.section || slv.section_type;
        if (!slv.sleeve_id || !secType) continue;

        // Comprobar si ya existe
        const { data: existing } = await supabase
          .from('yg_deck_sleeves')
          .select('id')
          .eq('deck_id', deckId)
          .eq('section_type', secType)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('yg_deck_sleeves')
            .update({ sleeve_id: slv.sleeve_id })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('yg_deck_sleeves')
            .insert([{
              deck_id: deckId,
              sleeve_id: slv.sleeve_id,
              section_type: secType,
              quantity_used: 0
            }]);
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedDeck });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error en PUT /api/decks/[id]:', err);
    return NextResponse.json({ error: err.message || 'Error al actualizar el deck' }, { status: 500 });
  }
}

// DELETE: Eliminar un deck específico
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deckId } = await params;

    if (!deckId) {
      return NextResponse.json({ error: 'ID de deck es requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('yg_decks')
      .delete()
      .eq('id', deckId);

    if (error) {
      console.error('Error al eliminar deck:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error en DELETE /api/decks/[id]:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar el deck' }, { status: 500 });
  }
}
