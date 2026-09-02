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
      compartment_index,
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

    // Actualizar ubicación física base de las cartas del deck si cambió storage_location_id o compartment_index
    if (storage_location_id !== undefined) {
      const cardUpdate: Record<string, unknown> = {
        storage_location_id: storage_location_id,
        binder_page: null,
        binder_slot: null
      };
      if (compartment_index !== undefined) {
        cardUpdate.compartment_index = compartment_index;
      }
      await supabase
        .from('yg_user_cards')
        .update(cardUpdate)
        .eq('deck_id', deckId);

      // Sincronizar asignación de carril en yg_storage_locations
      const { data: allLocations } = await supabase
        .from('yg_storage_locations')
        .select('id, compartments');
      
      if (allLocations && Array.isArray(allLocations)) {
        for (const locItem of allLocations) {
          const comp = locItem.compartments as { count?: number; names?: string[]; deck_ids?: (string | null)[] } | null;
          if (!comp) continue;

          let hasChanges = false;
          const currentDeckIds = Array.isArray(comp.deck_ids) ? [...comp.deck_ids] : [];

          const newDeckIds = currentDeckIds.map((dId, idx) => {
            if (storage_location_id && locItem.id === storage_location_id && idx === (compartment_index ?? 0)) {
              if (dId !== deckId) {
                hasChanges = true;
                return deckId;
              }
              return dId;
            }
            if (dId === deckId) {
              hasChanges = true;
              return null;
            }
            return dId;
          });

          if (storage_location_id && locItem.id === storage_location_id) {
            const targetIdx = compartment_index ?? 0;
            while (newDeckIds.length <= targetIdx) {
              newDeckIds.push(null);
              hasChanges = true;
            }
            if (newDeckIds[targetIdx] !== deckId) {
              newDeckIds[targetIdx] = deckId;
              hasChanges = true;
            }
          }

          if (hasChanges) {
            await supabase
              .from('yg_storage_locations')
              .update({
                compartments: {
                  ...comp,
                  deck_ids: newDeckIds
                }
              })
              .eq('id', locItem.id);
          }
        }
      }
    }

    // Sincronizar fundas asignadas al deck si se especificaron
    if (sleeves && Array.isArray(sleeves)) {
      // 1. Obtener conteo y tipos de cartas del mazo por sección
      const { data: deckCards } = await supabase
        .from('yg_deck_cards')
        .select(`
          count,
          section,
          card_details:yg_cards (
            type
          )
        `)
        .eq('deck_id', deckId);

      const isExtraCardType = (type?: string | null): boolean => {
        const t = (type || '').toLowerCase();
        return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
      };

      const cardsList = (deckCards || []) as { count: number; section: string; card_details?: { type?: string } }[];

      const mainOnlyCount = cardsList
        .filter((c) => c.section === 'main')
        .reduce((sum, c) => sum + (c.count || 0), 0);

      const sideMainCount = cardsList
        .filter((c) => c.section === 'side' && !isExtraCardType(c.card_details?.type))
        .reduce((sum, c) => sum + (c.count || 0), 0);

      const sideExtraCount = cardsList
        .filter((c) => c.section === 'side' && isExtraCardType(c.card_details?.type))
        .reduce((sum, c) => sum + (c.count || 0), 0);

      const extraOnlyCount = cardsList
        .filter((c) => c.section === 'extra')
        .reduce((sum, c) => sum + (c.count || 0), 0);

      const poolCount = cardsList
        .filter((c) => c.section === 'pool' || c.section === 'extras')
        .reduce((sum, c) => sum + (c.count || 0), 0);

      const mainSideCount = mainOnlyCount + sideMainCount;
      const extraCount = extraOnlyCount + sideExtraCount;

      const definedSections = sleeves.map((s) => s.section || s.section_type).filter(Boolean);

      // Traer cartas físicas del deck para saber cuáles son de Extra o Main en Side y Pool
      const { data: physicalCards } = await supabase
        .from('yg_user_cards')
        .select(`
          id,
          deck_section,
          card_details:yg_cards (
            type
          )
        `)
        .eq('deck_id', deckId);

      const pCards = (physicalCards || []) as { id: string; deck_section: string; card_details?: { type?: string } }[];

      // Eliminar fundas de secciones no incluidas y limpiar cartas desasociadas
      if (definedSections.length > 0) {
        const { data: removedSleeves } = await supabase
          .from('yg_deck_sleeves')
          .select('section_type')
          .eq('deck_id', deckId)
          .not('section_type', 'in', `(${definedSections.join(',')})`);

        for (const rem of removedSleeves || []) {
          const sec = rem.section_type;
          let idsToClean: string[] = [];
          if (sec === 'extra') {
            idsToClean = pCards
              .filter((c) => c.deck_section === 'extra' || (c.deck_section === 'side' && isExtraCardType(c.card_details?.type)))
              .map((c) => c.id);
          } else if (sec === 'main_side' || sec === 'main') {
            idsToClean = pCards
              .filter((c) => c.deck_section === 'main' || (c.deck_section === 'side' && !isExtraCardType(c.card_details?.type)))
              .map((c) => c.id);
          } else if (sec === 'pool' || sec === 'extras') {
            idsToClean = pCards
              .filter((c) => c.deck_section === 'pool' || c.deck_section === 'extras')
              .map((c) => c.id);
          }

          if (idsToClean.length > 0) {
            await supabase
              .from('yg_user_cards')
              .update({ sleeve_type: 'none', sleeve_brand: null, sleeve_color: null })
              .in('id', idsToClean);
          }
        }

        await supabase
          .from('yg_deck_sleeves')
          .delete()
          .eq('deck_id', deckId)
          .not('section_type', 'in', `(${definedSections.join(',')})`);
      } else {
        await supabase
          .from('yg_user_cards')
          .update({ sleeve_type: 'none', sleeve_brand: null, sleeve_color: null })
          .eq('deck_id', deckId);

        await supabase
          .from('yg_deck_sleeves')
          .delete()
          .eq('deck_id', deckId);
      }

      // Upsert de cada funda y actualización de cartas físicas
      for (const slv of sleeves) {
        const secType = slv.section || slv.section_type;
        if (!slv.sleeve_id || !secType) continue;

        let qtyUsed = mainSideCount;
        if (secType.startsWith('extra')) qtyUsed = extraCount;
        if (secType.startsWith('pool') || secType.startsWith('extras')) qtyUsed = poolCount;

        // Upsert en yg_deck_sleeves con el conteo real de cartas usadas
        const { data: existing } = await supabase
          .from('yg_deck_sleeves')
          .select('id')
          .eq('deck_id', deckId)
          .eq('section_type', secType)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('yg_deck_sleeves')
            .update({ sleeve_id: slv.sleeve_id, quantity_used: qtyUsed })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('yg_deck_sleeves')
            .insert([{
              deck_id: deckId,
              sleeve_id: slv.sleeve_id,
              section_type: secType,
              quantity_used: qtyUsed,
            }]);
        }
      }

      // Sincronizar copias físicas de las cartas según las capas configuradas por sección
      const sleeveIds = sleeves.map((s: { sleeve_id?: string }) => s.sleeve_id).filter(Boolean);
      let sleevesDataMap: Record<string, { id: string; brand: string; color_pattern: string; condition: string; category: string }> = {};

      if (sleeveIds.length > 0) {
        const { data: slData } = await supabase
          .from('yg_sleeves')
          .select('id, brand, color_pattern, condition, category')
          .in('id', sleeveIds);

        if (slData) {
          sleevesDataMap = slData.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
          }, {} as Record<string, { id: string; brand: string; color_pattern: string; condition: string; category: string }>);
        }
      }

      const syncSectionCards = async (
        sectionPrefix: 'main' | 'extra' | 'pool',
        targetCardIds: string[]
      ) => {
        if (targetCardIds.length === 0) return;

        const sectionSleeves = sleeves.filter((s: { section?: string; section_type?: string; sleeve_id?: string }) => {
          const sec = s.section || s.section_type || '';
          return sec.startsWith(sectionPrefix);
        });

        if (sectionSleeves.length === 0) {
          await supabase
            .from('yg_user_cards')
            .update({
              sleeve_type: 'none',
              sleeve_brand: null,
              sleeve_color: null,
              sleeve_fit_id: null,
              sleeve_regular_id: null,
              sleeve_over_id: null,
              sleeve_inner_brand: null,
              sleeve_inner_color: null,
              sleeve_outer_brand: null,
              sleeve_outer_color: null,
            })
            .in('id', targetCardIds);
          return;
        }

        let fitSleeve: { id: string; brand: string; color_pattern: string; condition: string } | null = null;
        let regularSleeve: { id: string; brand: string; color_pattern: string; condition: string } | null = null;
        let overSleeve: { id: string; brand: string; color_pattern: string; condition: string } | null = null;

        for (const slv of sectionSleeves) {
          const sec = slv.section || slv.section_type || '';
          const sData = sleevesDataMap[slv.sleeve_id];
          if (!sData) continue;

          if (sec.endsWith('_fit') || sData.category === 'fit') {
            fitSleeve = sData;
          } else if (sec.endsWith('_over') || sData.category === 'over') {
            overSleeve = sData;
          } else {
            regularSleeve = sData;
          }
        }

        const layersCount = (fitSleeve ? 1 : 0) + (regularSleeve ? 1 : 0) + (overSleeve ? 1 : 0);
        const calculatedSleeveType: 'none' | 'single' | 'double' | 'triple' =
          layersCount === 3 ? 'triple' : layersCount === 2 ? 'double' : layersCount === 1 ? 'single' : 'none';

        const mainDisplaySleeve = regularSleeve || overSleeve || fitSleeve;

        await supabase
          .from('yg_user_cards')
          .update({
            sleeve_type: calculatedSleeveType,
            sleeve_brand: mainDisplaySleeve?.brand || null,
            sleeve_color: mainDisplaySleeve?.color_pattern || null,
            sleeve_condition: mainDisplaySleeve?.condition || 'good',
            sleeve_fit_id: fitSleeve?.id || null,
            sleeve_regular_id: regularSleeve?.id || null,
            sleeve_over_id: overSleeve?.id || null,
            sleeve_inner_brand: fitSleeve?.brand || null,
            sleeve_inner_color: fitSleeve?.color_pattern || null,
            sleeve_outer_brand: overSleeve?.brand || null,
            sleeve_outer_color: overSleeve?.color_pattern || null,
          })
          .in('id', targetCardIds);
      };

      const extraCardIds = pCards
        .filter((c) => c.deck_section === 'extra' || (c.deck_section === 'side' && isExtraCardType(c.card_details?.type)))
        .map((c) => c.id);
      const mainCardIds = pCards
        .filter((c) => c.deck_section === 'main' || (c.deck_section === 'side' && !isExtraCardType(c.card_details?.type)))
        .map((c) => c.id);
      const poolCardIds = pCards
        .filter((c) => c.deck_section === 'pool' || c.deck_section === 'extras')
        .map((c) => c.id);

      await Promise.all([
        syncSectionCards('extra', extraCardIds),
        syncSectionCards('main', mainCardIds),
        syncSectionCards('pool', poolCardIds),
      ]);
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
