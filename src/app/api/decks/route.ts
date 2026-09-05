import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureCardsExistInDb, CardInputSeed } from '@/lib/ygoprodeck';
import { Deck } from '@/types/collection';

export interface InputDeckCard {
  id: number;
  count: number;
  proxy_count?: number;
  section: string;
  name?: string;
  type?: string;
  image_url?: string;
  image_url_small?: string;
}

// Global mocks for demo mode persistence
const globalForDecks = global as unknown as {
  mockDecks?: Deck[];
  mockDeckCards?: Record<string, unknown>[];
};



if (!globalForDecks.mockDecks) {
  globalForDecks.mockDecks = [];
}
if (!globalForDecks.mockDeckCards) {
  globalForDecks.mockDeckCards = [];
}

const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// GET: Obtener decks
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const locationId = searchParams.get('location_id');

    if (!isSupabaseConfigured()) {
      let decks = [...(globalForDecks.mockDecks || [])];
      if (locationId) {
        if (locationId === 'null') {
          decks = decks.filter(d => !d.storage_location_id);
        } else {
          decks = decks.filter(d => d.storage_location_id === locationId);
        }
      }
      // Populate cards
      const populatedDecks = decks.map(d => {
        const cards = (globalForDecks.mockDeckCards || [])
          .filter(c => c.deck_id === d.id)
          .map(dc => ({
            card_id: dc.card_id,
            count: dc.count,
            section: dc.section,
            card_details: {
              name: dc.name,
              type: dc.type || 'Monster',
              image_url: dc.image_url,
              image_url_small: dc.image_url_small || dc.image_url
            }
          }));
        return { ...d, cards };
      });
      return NextResponse.json({ data: populatedDecks });
    }

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (locationId) {
      if (locationId === 'null') {
        query = query.is('storage_location_id', null);
      } else {
        query = query.eq('storage_location_id', locationId);
      }
    }

    let decks: Deck[] = [];
    try {
      const { data, error } = await query;
      if (error) {
        console.warn('Advertencia al obtener decks de Supabase, usando fallback local:', error.message);
        decks = (globalForDecks.mockDecks as Deck[]) || [];
      } else {
        decks = (data as Deck[]) || [];
      }
    } catch (supabaseErr) {
      console.warn('Error de red/DNS al conectar con Supabase (decks):', supabaseErr);
      decks = (globalForDecks.mockDecks as Deck[]) || [];
    }

    return NextResponse.json({ data: decks });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching decks:', err);
    return NextResponse.json({ data: globalForDecks.mockDecks || [] });
  }


}

// POST: Crear un nuevo deck y opcionalmente registrar cartas al inventario
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      format,
      skill_name,
      storage_location_id,
      is_active,
      cards, // array of { id, count, section, name, type, image_url }
      register_to_inventory, // boolean
      inventory_cards_to_add // array of card IDs (filtered by user preview) to add to yg_user_cards
    } = body;

    if (!name || !format) {
      return NextResponse.json({ error: 'Nombre y formato son obligatorios' }, { status: 400 });
    }

    const deckId = `deck-demo-${Date.now()}`;
    const isActiveVal = is_active !== undefined ? Boolean(is_active) : true;

    if (!isSupabaseConfigured()) {
      const newDeck = {
        id: deckId,
        name,
        description: description || '',
        format,
        skill_name: skill_name || '',
        storage_location_id: storage_location_id || null,
        is_active: isActiveVal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      globalForDecks.mockDecks = [...(globalForDecks.mockDecks || []), newDeck];

      interface InputDeckCard {
        id: number;
        count: number;
        proxy_count?: number;
        section: string;
        name?: string;
        type?: string;
        image_url?: string;
      }

      const newCards = (cards || []).map((c: InputDeckCard) => ({
        deck_id: newDeck.id,
        card_id: c.id,
        count: c.count,
        section: c.section,
        name: c.name,
        type: c.type,
        image_url: c.image_url,
        image_url_small: c.image_url
      }));

      globalForDecks.mockDeckCards = [...(globalForDecks.mockDeckCards || []), ...newCards];

      return NextResponse.json({ data: { ...newDeck, cards: newCards } });
    }

    // Usando Supabase
    // 1. Insertar Deck
    const { data: deck, error: deckErr } = await supabase
      .from('yg_decks')
      .insert([{
        name,
        description: description || '',
        format,
        skill_name: skill_name || '',
        storage_location_id: storage_location_id || null,
        is_active: isActiveVal
      }])
      .select()
      .single();

    if (deckErr) throw deckErr;

    // 2. Garantizar que todas las cartas existan en yg_cards para evitar violaciones de clave foránea
    const allInputCards: CardInputSeed[] = [
      ...(cards || []),
      ...(inventory_cards_to_add || [])
    ];
    if (allInputCards.length > 0) {
      await ensureCardsExistInDb(allInputCards);
    }

    // 3. Insertar cartas del Deck
    if (cards && cards.length > 0) {
      const deckCardsPayload = cards.map((c: InputDeckCard) => ({
        deck_id: deck.id,
        card_id: c.id,
        count: c.count,
        proxy_count: c.proxy_count || 0,
        section: c.section
      }));

      const { error: cardsErr } = await supabase
        .from('yg_deck_cards')
        .insert(deckCardsPayload);

      if (cardsErr) throw cardsErr;
    }

    // 4. Registrar cartas al inventario general (yg_user_cards) si fue solicitado
    if (register_to_inventory && inventory_cards_to_add && inventory_cards_to_add.length > 0) {
      const cardIdsToRegister = inventory_cards_to_add.map((c: InputDeckCard) => c.id);
      const { data: existingUserCards } = await supabase
        .from('yg_user_cards')
        .select('card_id, quantity')
        .in('card_id', cardIdsToRegister);

      const existingCounts: Record<number, number> = {};
      for (const euc of existingUserCards || []) {
        existingCounts[euc.card_id] = (existingCounts[euc.card_id] || 0) + (euc.quantity || 1);
      }

      const inventoryPayload = [];
      for (const c of inventory_cards_to_add) {
        const matchingDeckCard = (cards || []).find((dc: InputDeckCard) => dc.id === c.id);
        const rawSec = c.section || matchingDeckCard?.section;
        const section = (rawSec === 'pool' || rawSec === 'extras')
          ? 'extras'
          : (rawSec && ['main', 'extra', 'side'].includes(rawSec) ? rawSec : null);

        const qtyToInsert = c.count || 1;

        if (qtyToInsert > 0) {
          inventoryPayload.push({
            card_id: c.id,
            storage_location_id: storage_location_id || null,
            compartment_index: body.compartment_index !== undefined ? body.compartment_index : null,
            deck_id: deck.id,
            deck_section: section,
            quantity: qtyToInsert,
            rarity: c.rarity || matchingDeckCard?.rarity || 'Common',
            condition: c.condition || 'Near Mint',
            language: 'en',
            status_flag: isActiveVal ? 'in_deck' : 'collection',
            is_proxy: Boolean(c.is_proxy),
            sleeve_type: 'none',
            notes: `Registrado automáticamente desde deck "${name}"`
          });
        }
      }

      if (inventoryPayload.length > 0) {
        const { error: invErr } = await supabase
          .from('yg_user_cards')
          .insert(inventoryPayload);

        if (invErr) {
          console.error('Error al registrar cartas en inventario:', invErr);
        }
      }
    }

    // 5. Inactivar decks en conflicto si fue solicitado
    const deactivatedDeckIds: string[] = body.deactivated_deck_ids || [];
    if (deactivatedDeckIds.length > 0) {
      await supabase
        .from('yg_decks')
        .update({ is_active: false })
        .in('id', deactivatedDeckIds);

      await supabase
        .from('yg_user_cards')
        .update({ status_flag: 'collection' })
        .in('deck_id', deactivatedDeckIds);
    }

    // 6. Asignar copias físicas específicas seleccionadas en el borrador si el deck es activo
    const assignedUserCardIds: string[] = body.assigned_user_card_ids || [];
    if (isActiveVal && assignedUserCardIds.length > 0) {
      await supabase
        .from('yg_user_cards')
        .update({
          deck_id: deck.id,
          storage_location_id: storage_location_id || null,
          status_flag: 'in_deck',
          binder_page: null,
          binder_slot: null
        })
        .in('id', assignedUserCardIds);
    }

    // 7. Si se asignó un contenedor físico de almacenamiento al deck, registrar posición en carril
    if (storage_location_id) {
      const compIdx = typeof body.compartment_index === 'number' ? body.compartment_index : 0;

      // Actualizar registro del deck en el carril del contenedor
      try {
        const { data: locData } = await supabase
          .from('yg_storage_locations')
          .select('compartments')
          .eq('id', storage_location_id)
          .single();
        if (locData?.compartments) {
          const comps = { ...locData.compartments };
          const deckIds = Array.isArray(comps.deck_ids) ? [...comps.deck_ids] : [];
          while (deckIds.length <= compIdx) {
            deckIds.push(null);
          }
          deckIds[compIdx] = deck.id;
          comps.deck_ids = deckIds;
          await supabase
            .from('yg_storage_locations')
            .update({ compartments: comps })
            .eq('id', storage_location_id);
        }
      } catch (locErr) {
        console.warn('Advertencia al vincular deck al carril del contenedor:', locErr);
      }
    }

    return NextResponse.json({ data: deck });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating deck:', err);
    return NextResponse.json({ error: err.message || 'Error al crear deck' }, { status: 500 });
  }

}

// PUT: Actualizar un deck existente (incluyendo moverlo de deckbox o re-sincronizar cartas)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      description,
      format,
      skill_name,
      storage_location_id,
      is_active,
      cards,
      register_to_inventory,
      inventory_cards_to_add
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de deck es obligatorio' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      globalForDecks.mockDecks = (globalForDecks.mockDecks || []).map(d => {
        if (d.id === id) {
          return {
            ...d,
            name: name !== undefined ? name : d.name,
            description: description !== undefined ? description : d.description,
            format: format !== undefined ? format : d.format,
            skill_name: skill_name !== undefined ? skill_name : (d as unknown as Record<string, unknown>).skill_name,


            storage_location_id: storage_location_id !== undefined ? storage_location_id : d.storage_location_id,
            is_active: is_active !== undefined ? is_active : d.is_active,
            updated_at: new Date().toISOString()
          };
        }
        return d;
      });

      if (cards !== undefined) {
        // Reemplazar cartas del mock
        globalForDecks.mockDeckCards = (globalForDecks.mockDeckCards || []).filter(c => c.deck_id !== id);
        const newCards = cards.map((c: { id: number; count: number; section: string; name?: string; type?: string; image_url?: string }) => ({
          deck_id: id,
          card_id: c.id,
          count: c.count,
          section: c.section,
          name: c.name,
          type: c.type,
          image_url: c.image_url,
          image_url_small: c.image_url
        }));
        globalForDecks.mockDeckCards = [...(globalForDecks.mockDeckCards || []), ...newCards];
      }

      return NextResponse.json({ success: true });
    }

    // Supabase
    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (format !== undefined) updatePayload.format = format;
    if (skill_name !== undefined) updatePayload.skill_name = skill_name;
    if (storage_location_id !== undefined) updatePayload.storage_location_id = storage_location_id;
    if (is_active !== undefined) updatePayload.is_active = is_active;
    updatePayload.updated_at = new Date().toISOString();

    const { error: deckErr } = await supabase
      .from('yg_decks')
      .update(updatePayload)
      .eq('id', id);

    if (deckErr) throw deckErr;

    if (is_active !== undefined) {
      const newStatusFlag = is_active ? 'in_deck' : 'collection';
      await supabase
        .from('yg_user_cards')
        .update({ status_flag: newStatusFlag })
        .eq('deck_id', id);
    }

    // Si se asigna el deck a una ubicación física (Deckbox / Contenedor)
    if (storage_location_id !== undefined) {
      const compIdx = typeof body.compartment_index === 'number' ? body.compartment_index : 0;
      // 1. Obtener cartas que pertenecen a este deck en yg_deck_cards
      const { data: currentDeckCards } = await supabase
        .from('yg_deck_cards')
        .select('card_id, section')
        .eq('deck_id', id);

      if (currentDeckCards && currentDeckCards.length > 0) {
        for (const dc of currentDeckCards) {
          const isPool = dc.section === 'pool' || dc.section === 'extras';
          if (['main', 'extra', 'side', 'extras', 'pool'].includes(dc.section)) {
            // Actualizar cartas físicas del inventario que no tengan ubicación o que estén asociadas a este deck
            // y desvincularlas de cualquier binder previa (limpiando página y ranura).
            await supabase
              .from('yg_user_cards')
              .update({
                storage_location_id: storage_location_id,
                deck_id: id,
                deck_section: isPool ? null : dc.section,
                compartment_index: compIdx,
                binder_page: null,
                binder_slot: null
              })
              .eq('card_id', dc.card_id)
              .or(`storage_location_id.is.null,deck_id.eq.${id}`);
          }
        }
      }

      if (storage_location_id) {
        try {
          const { data: locData } = await supabase
            .from('yg_storage_locations')
            .select('compartments')
            .eq('id', storage_location_id)
            .single();
          if (locData?.compartments) {
            const comps = { ...locData.compartments };
            const deckIds = Array.isArray(comps.deck_ids) ? [...comps.deck_ids] : [];
            while (deckIds.length <= compIdx) {
              deckIds.push(null);
            }
            deckIds[compIdx] = id;
            comps.deck_ids = deckIds;
            await supabase
              .from('yg_storage_locations')
              .update({ compartments: comps })
              .eq('id', storage_location_id);
          }
        } catch (locErr) {
          console.warn('Advertencia al actualizar carril del contenedor:', locErr);
        }
      }
    }

    // Garantizar que todas las cartas existan en yg_cards para evitar violaciones de clave foránea
    const allInputCards: CardInputSeed[] = [
      ...(Array.isArray(cards) ? cards : []),
      ...(Array.isArray(inventory_cards_to_add) ? inventory_cards_to_add : [])
    ];
    if (allInputCards.length > 0) {
      await ensureCardsExistInDb(allInputCards);
    }

    if (cards !== undefined) {
      // Eliminar cartas anteriores
      const { error: delErr } = await supabase
        .from('yg_deck_cards')
        .delete()
        .eq('deck_id', id);

      if (delErr) throw delErr;

      // Insertar nuevas cartas
      if (cards.length > 0) {
        const deckCardsPayload = cards.map((c: { id: number; count: number; proxy_count?: number; section: string }) => ({
          deck_id: id,
          card_id: c.id,
          count: c.count,
          proxy_count: c.proxy_count || 0,
          section: c.section
        }));

        const { error: cardsErr } = await supabase
          .from('yg_deck_cards')
          .insert(deckCardsPayload);

        if (cardsErr) throw cardsErr;
      }
    }

    // Registrar al inventario
    if (register_to_inventory && inventory_cards_to_add && inventory_cards_to_add.length > 0) {
      let activeStatus = is_active;
      if (activeStatus === undefined) {
        const { data: existingDeck } = await supabase
          .from('yg_decks')
          .select('is_active')
          .eq('id', id)
          .single();
        activeStatus = existingDeck?.is_active ?? true;
      }
      const newStatusFlag = activeStatus ? 'in_deck' : 'collection';

      // 1. Obtener fundas actuales del deck en yg_deck_sleeves
      const { data: deckSleeves } = await supabase
        .from('yg_deck_sleeves')
        .select('*, sleeve_details:yg_sleeves(*)')
        .eq('deck_id', id);

      // Obtener detalles de fundas específicas si alguna carta eligió fundas distintas a las del mazo
      const specificSleeveIds = (inventory_cards_to_add as Array<{
        sleeve_id?: string;
        sleeve_fit_id?: string;
        sleeve_regular_id?: string;
        sleeve_over_id?: string;
      }>)
        .flatMap((c) => [c.sleeve_id, c.sleeve_fit_id, c.sleeve_regular_id, c.sleeve_over_id])
        .filter((sid: string | undefined): sid is string => Boolean(sid && sid !== 'none' && sid !== 'inherit'));

      const extraSleevesMap: Record<string, { id: string; brand?: string; color_pattern?: string; condition?: string }> = {};
      if (specificSleeveIds.length > 0) {
        const { data: extSleeves } = await supabase
          .from('yg_sleeves')
          .select('*')
          .in('id', Array.from(new Set(specificSleeveIds)));
        if (extSleeves) {
          for (const s of extSleeves) {
            extraSleevesMap[s.id] = s;
          }
        }
      }

      // 2. Obtener copias físicas existentes en inventario general para las cartas a registrar
      const cardIdsToRegister = inventory_cards_to_add.map((c: { id: number }) => c.id);
      const { data: existingUserCards } = await supabase
        .from('yg_user_cards')
        .select('card_id, quantity, deck_section, sleeve_type, sleeve_brand, sleeve_color')
        .in('card_id', cardIdsToRegister);

      // Agrupar copias existentes totales por card_id
      const existingCounts: Record<number, number> = {};
      for (const euc of existingUserCards || []) {
        existingCounts[euc.card_id] = (existingCounts[euc.card_id] || 0) + (euc.quantity || 1);
      }

      const inventoryPayload = [];

      for (const c of inventory_cards_to_add) {
        const matchingDeckCard = (cards || []).find((dc: { id: number; section: string }) => dc.id === c.id);
        const rawSec = (c as { section?: string })?.section || matchingDeckCard?.section;
        // En yg_user_cards, el constraint chk_user_card_deck_section solo admite 'main', 'extra', 'side' o NULL (para reserva/pool)
        const section = (rawSec === 'pool' || rawSec === 'extras')
          ? null
          : (rawSec && ['main', 'extra', 'side'].includes(rawSec) ? rawSec : null);

        const qtyToInsert = (c as { count?: number }).count || 1;

        if (qtyToInsert > 0) {
          // Determinar ubicación física de la carta (prioridad: propia de la carta > mazo)
          const targetLocId = (c as { storage_location_id?: string | null })?.storage_location_id !== undefined
            ? (c as { storage_location_id?: string | null }).storage_location_id
            : (storage_location_id || null);
          const targetCompIdx = (c as { compartment_index?: number | null })?.compartment_index !== undefined
            ? (c as { compartment_index?: number | null }).compartment_index
            : (body.compartment_index !== undefined ? body.compartment_index : null);

          // Determinar fundas asignadas
          const requestedType = (c as { sleeve_type?: string })?.sleeve_type || 'none';
          const fitId = (c as { sleeve_fit_id?: string | null })?.sleeve_fit_id;
          const regId = (c as { sleeve_regular_id?: string | null })?.sleeve_regular_id || (c as { sleeve_id?: string | null })?.sleeve_id;
          const overId = (c as { sleeve_over_id?: string | null })?.sleeve_over_id;

          const isExtraSec = section === 'extra';
          const assignedFit = deckSleeves?.find((ds: { section_type: string }) => ds.section_type === (isExtraSec ? 'extra_fit' : 'main_fit'));
          const assignedReg = deckSleeves?.find((ds: { section_type: string }) => ds.section_type === (isExtraSec ? 'extra_regular' : 'main_side') || ds.section_type === (isExtraSec ? 'extra' : 'main_regular'));
          const assignedOver = deckSleeves?.find((ds: { section_type: string }) => ds.section_type === (isExtraSec ? 'extra_over' : 'main_over'));

          const sleeveType = requestedType;
          let sleeveBrand: string | null = null;
          let sleeveColor: string | null = null;
          let sleeveCondition: string | null = null;
          let sleeveFitId: string | null = null;
          let sleeveRegularId: string | null = null;
          let sleeveOverId: string | null = null;
          let sleeveInnerBrand: string | null = null;
          let sleeveInnerColor: string | null = null;
          let sleeveOuterBrand: string | null = null;
          let sleeveOuterColor: string | null = null;

          if (sleeveType !== 'none') {
            // Capa 1: Fit / Inner
            if (fitId === 'inherit' && assignedFit?.sleeve_details) {
              sleeveFitId = assignedFit.sleeve_id;
              sleeveInnerBrand = assignedFit.sleeve_details.brand || null;
              sleeveInnerColor = assignedFit.sleeve_details.color_pattern || null;
            } else if (fitId && fitId !== 'inherit' && extraSleevesMap[fitId]) {
              sleeveFitId = fitId;
              sleeveInnerBrand = extraSleevesMap[fitId].brand || null;
              sleeveInnerColor = extraSleevesMap[fitId].color_pattern || null;
            }

            // Capa 2: Regular
            if (regId === 'inherit' && assignedReg?.sleeve_details) {
              sleeveRegularId = assignedReg.sleeve_id;
              sleeveBrand = assignedReg.sleeve_details.brand || null;
              sleeveColor = assignedReg.sleeve_details.color_pattern || null;
              sleeveCondition = assignedReg.sleeve_details.condition || 'good';
            } else if (regId && regId !== 'inherit' && extraSleevesMap[regId]) {
              const slv = extraSleevesMap[regId];
              sleeveRegularId = slv.id;
              sleeveBrand = slv.brand || null;
              sleeveColor = slv.color_pattern || null;
              sleeveCondition = slv.condition || 'good';
            }

            // Capa 3: Over (aplica a triple o double con regular_over)
            if (overId === 'inherit' && assignedOver?.sleeve_details) {
              sleeveOverId = assignedOver.sleeve_id;
              sleeveOuterBrand = assignedOver.sleeve_details.brand || null;
              sleeveOuterColor = assignedOver.sleeve_details.color_pattern || null;
            } else if (overId && overId !== 'inherit' && extraSleevesMap[overId]) {
              sleeveOverId = overId;
              sleeveOuterBrand = extraSleevesMap[overId].brand || null;
              sleeveOuterColor = extraSleevesMap[overId].color_pattern || null;
            }
          }

          inventoryPayload.push({
            card_id: c.id,
            storage_location_id: targetLocId,
            compartment_index: targetCompIdx,
            deck_id: id,
            deck_section: section,
            quantity: qtyToInsert,
            rarity: (c as { rarity?: string })?.rarity || (matchingDeckCard as { rarity?: string })?.rarity || 'Common',
            condition: (c as { condition?: string })?.condition || 'Near Mint',
            language: 'en',
            status_flag: newStatusFlag,
            is_proxy: Boolean((c as { is_proxy?: boolean })?.is_proxy),
            sleeve_type: sleeveType,
            sleeve_fit_id: sleeveFitId,
            sleeve_regular_id: sleeveRegularId,
            sleeve_over_id: sleeveOverId,
            sleeve_inner_brand: sleeveInnerBrand,
            sleeve_inner_color: sleeveInnerColor,
            sleeve_brand: sleeveBrand,
            sleeve_color: sleeveColor,
            sleeve_outer_brand: sleeveOuterBrand,
            sleeve_outer_color: sleeveOuterColor,
            sleeve_condition: sleeveCondition,
            notes: `Registrado automáticamente desde deck "${name || 'Actualizado'}"`
          });
        }
      }

      if (inventoryPayload.length > 0) {
        const { error: invErr } = await supabase
          .from('yg_user_cards')
          .insert(inventoryPayload);

        if (invErr) {
          console.error('Error al registrar cartas en inventario:', invErr);
          throw new Error(`Error al registrar cartas en inventario: ${invErr.message}`);
        }
      }
    }

    // Inactivar decks en conflicto si fue solicitado
    const deactivatedDeckIds: string[] = body.deactivated_deck_ids || [];
    if (deactivatedDeckIds.length > 0) {
      await supabase
        .from('yg_decks')
        .update({ is_active: false })
        .in('id', deactivatedDeckIds);

      await supabase
        .from('yg_user_cards')
        .update({ status_flag: 'collection' })
        .in('deck_id', deactivatedDeckIds);
    }

    // Desvincular copias físicas retiradas del mazo (enviándolas de forma segura a Inbox)
    const unassignedUserCardIds: string[] = body.unassigned_user_card_ids || [];
    if (unassignedUserCardIds.length > 0) {
      await supabase
        .from('yg_user_cards')
        .update({
          deck_id: null,
          deck_section: null,
          storage_location_id: null,
          compartment_index: null,
          status_flag: 'collection',
          binder_page: null,
          binder_slot: null
        })
        .in('id', unassignedUserCardIds);
    }

    // Eliminar permanentemente copias físicas dadas de baja por daño o venta
    const deletedUserCardIds: string[] = body.deleted_user_card_ids || [];
    if (deletedUserCardIds.length > 0) {
      await supabase
        .from('yg_user_cards')
        .delete()
        .in('id', deletedUserCardIds);
    }

    // Reubicar copias reemplazadas a ubicaciones físicas específicas o inbox
    const relocatedUserCards: Array<{
      id: string;
      storage_location_id: string | null;
      compartment_index?: number | null;
    }> = body.relocated_user_cards || [];
    if (relocatedUserCards.length > 0) {
      for (const r of relocatedUserCards) {
        await supabase
          .from('yg_user_cards')
          .update({
            deck_id: null,
            deck_section: null,
            storage_location_id: r.storage_location_id || null,
            compartment_index: r.compartment_index !== undefined ? r.compartment_index : null,
            status_flag: 'collection',
            binder_page: null,
            binder_slot: null
          })
          .eq('id', r.id);
      }
    }

    // Asignar copias físicas específicas seleccionadas en el borrador si el deck es activo
    const assignedUserCardIds: string[] = body.assigned_user_card_ids || [];
    const isNowActive = is_active !== undefined ? is_active : true;
    if (isNowActive && assignedUserCardIds.length > 0) {
      await supabase
        .from('yg_user_cards')
        .update({
          deck_id: id,
          storage_location_id: storage_location_id || null,
          status_flag: 'in_deck',
          binder_page: null,
          binder_slot: null
        })
        .in('id', assignedUserCardIds);
    }

    // Sincronizar fundas asignadas si se proporcionaron
    if (Array.isArray(body.sleeves)) {
      await supabase.from('yg_deck_sleeves').delete().eq('deck_id', id);
      if (body.sleeves.length > 0) {
        // Consultar cartas físicas asignadas a este deck para calcular quantity_used real por sección
        const { data: deckCards } = await supabase
          .from('yg_user_cards')
          .select('id, deck_section, card_details:yg_cards ( type )')
          .eq('deck_id', id);

        const pCards = (deckCards || []) as Array<{ id: string; deck_section: string; card_details?: { type?: string } }>;
        const isExtra = (type?: string) => {
          if (!type) return false;
          const t = type.toLowerCase();
          return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
        };

        const physicalExtraCount = pCards.filter((c) => c.deck_section === 'extra' || (c.deck_section === 'side' && isExtra(c.card_details?.type))).length;
        const physicalMainSideCount = pCards.filter((c) => c.deck_section === 'main' || (c.deck_section === 'side' && !isExtra(c.card_details?.type))).length;
        const physicalPoolCount = pCards.filter((c) => c.deck_section === 'pool' || c.deck_section === 'extras').length;

        // Conteo de la lista/receta del mazo para garantizar congruencia aun si no todas las copias físicas están registradas
        const rCards = (Array.isArray(cards) ? cards : []) as Array<{ count?: number; section?: string; type?: string }>;
        const recipeExtraCount = rCards.filter((c) => c.section === 'extra' || (c.section === 'side' && isExtra(c.type))).reduce((sum, c) => sum + (c.count || 1), 0);
        const recipeMainSideCount = rCards.filter((c) => c.section === 'main' || (c.section === 'side' && !isExtra(c.type))).reduce((sum, c) => sum + (c.count || 1), 0);
        const recipePoolCount = rCards.filter((c) => c.section === 'pool' || c.section === 'extras').reduce((sum, c) => sum + (c.count || 1), 0);

        const finalExtraCount = Math.max(recipeExtraCount, physicalExtraCount);
        const finalMainSideCount = Math.max(recipeMainSideCount, physicalMainSideCount);
        const finalPoolCount = Math.max(recipePoolCount, physicalPoolCount);

        const sleevesPayload = body.sleeves.map((s: { sleeve_id: string; section: string }) => {
          let qtyUsed = finalMainSideCount;
          if (s.section.startsWith('extra')) qtyUsed = finalExtraCount;
          else if (s.section.startsWith('pool') || s.section.startsWith('extras')) qtyUsed = finalPoolCount;

          return {
            deck_id: id,
            sleeve_id: s.sleeve_id,
            section_type: s.section,
            quantity_used: qtyUsed
          };
        });
        await supabase.from('yg_deck_sleeves').insert(sleevesPayload);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating deck:', err);
    return NextResponse.json({ error: err.message || 'Error al actualizar deck' }, { status: 500 });
  }

}

// DELETE: Eliminar un deck
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de deck es obligatorio' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      globalForDecks.mockDecks = (globalForDecks.mockDecks || []).filter(d => d.id !== id);
      globalForDecks.mockDeckCards = (globalForDecks.mockDeckCards || []).filter(c => c.deck_id !== id);
      return NextResponse.json({ success: true });
    }

    // 1. Desvincular cartas físicas de yg_user_cards a estado colección general
    await supabase
      .from('yg_user_cards')
      .update({
        deck_id: null,
        deck_section: null,
        status_flag: 'collection',
      })
      .eq('deck_id', id);

    // 2. Liberar el carril en contenedores yg_storage_locations si estaba asignado
    try {
      const { data: locs } = await supabase
        .from('yg_storage_locations')
        .select('id, compartments')
        .not('compartments', 'is', null);

      if (locs && locs.length > 0) {
        for (const loc of locs) {
          const comps = loc.compartments as { count?: number; names?: string[]; deck_ids?: (string | null)[] } | null;
          if (comps?.deck_ids && comps.deck_ids.includes(id)) {
            const updatedDeckIds = comps.deck_ids.map(dId => (dId === id ? null : dId));
            await supabase
              .from('yg_storage_locations')
              .update({ compartments: { ...comps, deck_ids: updatedDeckIds } })
              .eq('id', loc.id);
          }
        }
      }
    } catch (locErr) {
      console.warn('Advertencia al desvincular deck de contenedor:', locErr);
    }

    // 3. Eliminar fundas asignadas al deck
    await supabase
      .from('yg_deck_sleeves')
      .delete()
      .eq('deck_id', id);

    // 4. Eliminar asociación de cartas de receta
    await supabase
      .from('yg_deck_cards')
      .delete()
      .eq('deck_id', id);

    // 5. Eliminar el registro del deck
    const { error } = await supabase
      .from('yg_decks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error deleting deck:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar deck' }, { status: 500 });
  }
}

