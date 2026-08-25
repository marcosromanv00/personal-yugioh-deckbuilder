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
      const inventoryPayload = inventory_cards_to_add.map((c: InputDeckCard) => {
        const matchingDeckCard = (cards || []).find((dc: InputDeckCard) => dc.id === c.id);
        const section = matchingDeckCard?.section && ['main', 'extra', 'side'].includes(matchingDeckCard.section)
          ? matchingDeckCard.section
          : null;

        return {
          card_id: c.id,
          storage_location_id: storage_location_id || null,
          deck_id: deck.id,
          deck_section: section,
          quantity: c.count || 1,
          rarity: 'Common',
          condition: 'Near Mint',
          language: 'en',
          status_flag: isActiveVal ? 'in_deck' : 'collection',
          sleeve_type: 'none',
          notes: `Registrado automáticamente desde deck "${name}"`
        };
      });

      const { error: invErr } = await supabase
        .from('yg_user_cards')
        .insert(inventoryPayload);

      if (invErr) {
        console.error('Error al registrar cartas en inventario:', invErr);
      }
    }

    // 4. Si se asignó un contenedor físico de almacenamiento al deck, recolocar las cartas existentes libres hacia esa ubicación
    if (storage_location_id && cards && cards.length > 0) {
      const compIdx = typeof body.compartment_index === 'number' ? body.compartment_index : 0;
      for (const dc of cards) {
        if (['main', 'extra', 'side'].includes(dc.section)) {
          await supabase
            .from('yg_user_cards')
            .update({
              storage_location_id: storage_location_id,
              deck_id: deck.id,
              deck_section: dc.section,
              compartment_index: compIdx,
              status_flag: isActiveVal ? 'in_deck' : 'collection',
              binder_page: null,
              binder_slot: null
            })
            .eq('card_id', dc.id)
            .or(`storage_location_id.is.null,deck_id.is.null`);
        }
      }

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
          if (['main', 'extra', 'side'].includes(dc.section)) {
            // Actualizar cartas físicas del inventario que no tengan ubicación o que estén asociadas a este deck
            // y desvincularlas de cualquier binder previa (limpiando página y ranura).
            await supabase
              .from('yg_user_cards')
              .update({
                storage_location_id: storage_location_id,
                deck_id: id,
                deck_section: dc.section,
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

      // 2. Obtener copias físicas actuales asociadas a este deck en yg_user_cards
      const { data: existingUserCards } = await supabase
        .from('yg_user_cards')
        .select('card_id, quantity, deck_section, sleeve_type, sleeve_brand, sleeve_color')
        .eq('deck_id', id);

      // Agrupar copias existentes por card_id y deck_section
      const existingCounts: Record<string, number> = {};
      for (const euc of existingUserCards || []) {
        const key = `${euc.card_id}-${euc.deck_section || 'none'}`;
        existingCounts[key] = (existingCounts[key] || 0) + (euc.quantity || 1);
      }

      const inventoryPayload = [];

      for (const c of inventory_cards_to_add) {
        const matchingDeckCard = (cards || []).find((dc: { id: number; section: string }) => dc.id === c.id);
        const section = matchingDeckCard?.section && ['main', 'extra', 'side'].includes(matchingDeckCard.section)
          ? matchingDeckCard.section
          : null;

        const targetCount = c.count || 1;
        const key = `${c.id}-${section || 'none'}`;
        const alreadyInInventory = existingCounts[key] || 0;
        const qtyToInsert = Math.max(0, targetCount - alreadyInInventory);

        if (qtyToInsert > 0) {
          // Determinar si ya hay una funda asignada para esta sección en el deck
          const sectionType = (section === 'main' || section === 'side') ? 'main_side' : 'extra';
          const assignedSleeve = deckSleeves?.find((ds: { section_type: string; sleeve_details?: { brand?: string; color_pattern?: string; condition?: string } }) => ds.section_type === sectionType);

          let sleeveType = 'none';
          let sleeveBrand = null;
          let sleeveColor = null;
          let sleeveCondition = null;

          if (assignedSleeve?.sleeve_details) {
            sleeveType = 'single';
            sleeveBrand = assignedSleeve.sleeve_details.brand;
            sleeveColor = assignedSleeve.sleeve_details.color_pattern;
            sleeveCondition = assignedSleeve.sleeve_details.condition || 'good';
          }

          inventoryPayload.push({
            card_id: c.id,
            storage_location_id: storage_location_id || null,
            deck_id: id,
            deck_section: section,
            quantity: qtyToInsert,
            rarity: 'Common',
            condition: 'Near Mint',
            language: 'en',
            status_flag: newStatusFlag,
            sleeve_type: sleeveType,
            sleeve_brand: sleeveBrand,
            sleeve_color: sleeveColor,
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
        }
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

