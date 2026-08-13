import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Global mocks for demo mode persistence
const globalForDecks = global as unknown as {
  mockDecks?: any[];
  mockDeckCards?: any[];
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

    const { data: decks, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: decks || [] });
  } catch (error: any) {
    console.error('Error fetching decks:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener decks' }, { status: 500 });
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
      cards, // array of { id, count, section, name, type, image_url }
      register_to_inventory, // boolean
      inventory_cards_to_add // array of card IDs (filtered by user preview) to add to yg_user_cards
    } = body;

    if (!name || !format) {
      return NextResponse.json({ error: 'Nombre y formato son obligatorios' }, { status: 400 });
    }

    const deckId = `deck-demo-${Date.now()}`;

    if (!isSupabaseConfigured()) {
      const newDeck = {
        id: deckId,
        name,
        description: description || '',
        format,
        skill_name: skill_name || '',
        storage_location_id: storage_location_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      globalForDecks.mockDecks = [...(globalForDecks.mockDecks || []), newDeck];

      const newCards = (cards || []).map((c: any) => ({
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
        storage_location_id: storage_location_id || null
      }])
      .select()
      .single();

    if (deckErr) throw deckErr;

    // 2. Insertar cartas del Deck
    if (cards && cards.length > 0) {
      const deckCardsPayload = cards.map((c: any) => ({
        deck_id: deck.id,
        card_id: c.id,
        count: c.count,
        section: c.section
      }));

      const { error: cardsErr } = await supabase
        .from('yg_deck_cards')
        .insert(deckCardsPayload);

      if (cardsErr) throw cardsErr;
    }

    // 3. Registrar cartas al inventario general (yg_user_cards)
    if (register_to_inventory && inventory_cards_to_add && inventory_cards_to_add.length > 0) {
      const inventoryPayload = inventory_cards_to_add.map((c: any) => ({
        card_id: c.id,
        storage_location_id: storage_location_id || null,
        quantity: c.count || 1,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'en',
        status_flag: 'collection',
        sleeve_type: 'none',
        notes: `Registrado automáticamente desde deck "${name}"`
      }));

      const { error: invErr } = await supabase
        .from('yg_user_cards')
        .insert(inventoryPayload);

      if (invErr) {
        console.error('Error al registrar cartas en inventario:', invErr);
      }
    }

    return NextResponse.json({ data: deck });
  } catch (error: any) {
    console.error('Error creating deck:', error);
    return NextResponse.json({ error: error.message || 'Error al crear deck' }, { status: 500 });
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
            skill_name: skill_name !== undefined ? skill_name : d.skill_name,
            storage_location_id: storage_location_id !== undefined ? storage_location_id : d.storage_location_id,
            updated_at: new Date().toISOString()
          };
        }
        return d;
      });

      if (cards !== undefined) {
        // Reemplazar cartas del mock
        globalForDecks.mockDeckCards = (globalForDecks.mockDeckCards || []).filter(c => c.deck_id !== id);
        const newCards = cards.map((c: any) => ({
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
    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (format !== undefined) updatePayload.format = format;
    if (skill_name !== undefined) updatePayload.skill_name = skill_name;
    if (storage_location_id !== undefined) updatePayload.storage_location_id = storage_location_id;
    updatePayload.updated_at = new Date().toISOString();

    const { error: deckErr } = await supabase
      .from('yg_decks')
      .update(updatePayload)
      .eq('id', id);

    if (deckErr) throw deckErr;

    if (cards !== undefined) {
      // Eliminar cartas anteriores
      const { error: delErr } = await supabase
        .from('yg_deck_cards')
        .delete()
        .eq('deck_id', id);

      if (delErr) throw delErr;

      // Insertar nuevas cartas
      if (cards.length > 0) {
        const deckCardsPayload = cards.map((c: any) => ({
          deck_id: id,
          card_id: c.id,
          count: c.count,
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
      const inventoryPayload = inventory_cards_to_add.map((c: any) => ({
        card_id: c.id,
        storage_location_id: storage_location_id || null,
        quantity: c.count || 1,
        rarity: 'Common',
        condition: 'Near Mint',
        language: 'en',
        status_flag: 'collection',
        sleeve_type: 'none',
        notes: `Registrado automáticamente desde deck "${name || 'Actualizado'}"`
      }));

      const { error: invErr } = await supabase
        .from('yg_user_cards')
        .insert(inventoryPayload);

      if (invErr) {
        console.error('Error al registrar cartas en inventario:', invErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating deck:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar deck' }, { status: 500 });
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
  } catch (error: any) {
    console.error('Error deleting deck:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar deck' }, { status: 500 });
  }
}
