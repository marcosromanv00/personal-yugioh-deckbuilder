import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { UserCard } from '@/types/collection';

// GET: Obtener cartas de la colección con filtros
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const locationId = searchParams.get('location_id');
    const statusFlag = searchParams.get('status');
    const sleeveType = searchParams.get('sleeve');
    const query = searchParams.get('q');

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ data: [] });
    }

    const attribute = searchParams.get('attribute');
    const type = searchParams.get('type');
    const race = searchParams.get('race');
    const level = searchParams.get('level');
    const atkMin = searchParams.get('atkMin');
    const atkMax = searchParams.get('atkMax');
    const defMin = searchParams.get('defMin');
    const defMax = searchParams.get('defMax');
    const archetype = searchParams.get('archetype');

    let dbQuery = supabase
      .from('yg_user_cards')
      .select('*, card_details:yg_cards(*), deck_details:yg_decks(name)')
      .order('created_at', { ascending: false });

    if (locationId === 'null' || locationId === 'inbox') {
      dbQuery = dbQuery.is('storage_location_id', null);
    } else if (locationId) {
      dbQuery = dbQuery.eq('storage_location_id', locationId);
    }

    if (statusFlag) {
      dbQuery = dbQuery.eq('status_flag', statusFlag);
    }

    if (sleeveType) {
      dbQuery = dbQuery.eq('sleeve_type', sleeveType);
    }

    const { data: cards, error } = await dbQuery;

    if (error) {
      throw error;
    }

    let filteredCards = cards || [];

    if (query) {
      const qLower = query.toLowerCase();
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.name?.toLowerCase().includes(qLower) ||
        uc.rarity?.toLowerCase().includes(qLower) ||
        uc.notes?.toLowerCase().includes(qLower)
      );
    }

    if (type) {
      filteredCards = filteredCards.filter((uc: UserCard) => {
        const cType = uc.card_details?.type;
        if (!cType) return false;
        if (type === 'Monster') {
          return cType.includes('Monster') && !['Fusion Monster', 'Link Monster', 'Synchro Monster', 'XYZ Monster'].some(t => cType.includes(t));
        } else if (type === 'Spell') {
          return cType === 'Spell Card';
        } else if (type === 'Trap') {
          return cType === 'Trap Card';
        } else if (type === 'Extra') {
          return ['Fusion', 'Link', 'Synchro', 'XYZ'].some(t => cType.includes(t));
        } else {
          return cType.toLowerCase().includes(type.toLowerCase());
        }
      });
    }

    if (attribute) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.attribute?.toLowerCase() === attribute.toLowerCase()
      );
    }

    if (race) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.race?.toLowerCase() === race.toLowerCase()
      );
    }

    if (level) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.level === parseInt(level)
      );
    }

    if (atkMin) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.atk !== undefined && uc.card_details?.atk !== null && uc.card_details?.atk >= parseInt(atkMin)
      );
    }

    if (atkMax) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.atk !== undefined && uc.card_details?.atk !== null && uc.card_details?.atk <= parseInt(atkMax)
      );
    }

    if (defMin) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.def !== undefined && uc.card_details?.def !== null && uc.card_details?.def >= parseInt(defMin)
      );
    }

    if (defMax) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.def !== undefined && uc.card_details?.def !== null && uc.card_details?.def <= parseInt(defMax)
      );
    }

    if (archetype) {
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.archetype?.toLowerCase().includes(archetype.toLowerCase())
      );
    }

    return NextResponse.json({ data: filteredCards });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al obtener cartas de colección:', err);
    return NextResponse.json({ error: err.message || 'Error al obtener cartas' }, { status: 500 });
  }
}

// PUT: Actualizar ubicación, fundas o atributos de cartas de la colección
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      storage_location_id, 
      deck_id,
      deck_section,
      binder_page, 
      binder_slot, 
      compartment_index,
      rarity, 
      condition, 
      quantity, 
      status_flag, 
      sleeve_type, 
      sleeve_brand, 
      sleeve_color, 
      sleeve_condition, 
      sale_price, 
      notes,
      is_proxy
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de registro de carta es obligatorio' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ success: true, message: 'Modo demostración: Carta actualizada' });
    }

    const updatePayload: Record<string, string | number | boolean | null | undefined> = {};

    if (storage_location_id !== undefined) updatePayload.storage_location_id = storage_location_id;
    if (deck_id !== undefined) updatePayload.deck_id = deck_id;
    if (deck_section !== undefined) updatePayload.deck_section = deck_section;
    if (binder_page !== undefined) updatePayload.binder_page = binder_page;
    if (binder_slot !== undefined) updatePayload.binder_slot = binder_slot;
    if (compartment_index !== undefined) updatePayload.compartment_index = compartment_index;
    if (rarity !== undefined) updatePayload.rarity = rarity;
    if (condition !== undefined) updatePayload.condition = condition;
    if (quantity !== undefined) updatePayload.quantity = quantity;
    if (status_flag !== undefined) updatePayload.status_flag = status_flag;
    if (sleeve_type !== undefined) updatePayload.sleeve_type = sleeve_type;
    if (sleeve_brand !== undefined) updatePayload.sleeve_brand = sleeve_brand;
    if (sleeve_color !== undefined) updatePayload.sleeve_color = sleeve_color;
    if (sleeve_condition !== undefined) updatePayload.sleeve_condition = sleeve_condition;
    if (is_proxy !== undefined) updatePayload.is_proxy = is_proxy;
    if (sale_price !== undefined) updatePayload.sale_price = sale_price;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data, error } = await supabase
      .from('yg_user_cards')
      .update(updatePayload)
      .eq('id', id)
      .select('*, card_details:yg_cards(*), deck_details:yg_decks(name)')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al actualizar carta:', err);
    return NextResponse.json({ error: err.message || 'Error al actualizar carta' }, { status: 500 });
  }
}

// POST: Registrar una nueva carta manualmente en la colección
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      card_id,
      storage_location_id,
      quantity,
      rarity,
      condition,
      language,
      status_flag,
      sleeve_type,
      is_proxy,
      notes,
    } = body;

    if (!card_id) {
      return NextResponse.json({ error: 'ID de carta es obligatorio' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        success: true, 
        message: 'Modo demostración: Carta registrada en la colección',
        data: {
          id: `demo-${Date.now()}`,
          card_id,
          storage_location_id: storage_location_id || null,
          quantity: quantity || 1,
          rarity: rarity || 'Common',
          condition: condition || 'Near Mint',
          language: language || 'en',
          status_flag: status_flag || 'collection',
          sleeve_type: sleeve_type || 'none',
          is_proxy: !!is_proxy,
          notes: notes || '',
        }
      });
    }

    // Asegurarse de que la carta de Yu-Gi-Oh! exista en la tabla yg_cards de la BD
    const { data: existingCard } = await supabase
      .from('yg_cards')
      .select('id')
      .eq('id', card_id)
      .maybeSingle();

    if (!existingCard) {
      try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${card_id}`);
        if (response.ok) {
          const result = await response.json();
          const c = result.data?.[0];
          if (c) {
            const img = c.card_images?.[0];
            await supabase.from('yg_cards').upsert({
              id: c.id,
              name: c.name,
              type: c.type,
              desc: c.desc || '',
              atk: c.atk !== undefined ? c.atk : null,
              def: c.def !== undefined ? c.def : null,
              level: c.level !== undefined ? c.level : null,
              race: c.race || null,
              attribute: c.attribute || null,
              archetype: c.archetype || null,
              image_url: img ? img.image_url : null,
              image_url_small: img ? img.image_url_small : null,
              ban_master_duel: c.banlist_info?.ban_md || 'Unlimited',
              ban_tcg: c.banlist_info?.ban_tcg || 'Unlimited',
              ban_ocg: c.banlist_info?.ban_ocg || 'Unlimited',
              ban_duel_links: c.banlist_info?.ban_goat || 'Unlimited',
            });
          }
        }
      } catch (err) {
        console.warn('Error al buscar carta faltante al registrar manualmente:', err);
      }
    }

    const { data, error } = await supabase
      .from('yg_user_cards')
      .insert([{
        card_id,
        storage_location_id: storage_location_id || null,
        quantity: quantity || 1,
        rarity: rarity || 'Common',
        condition: condition || 'Near Mint',
        language: language || 'en',
        status_flag: status_flag || 'collection',
        sleeve_type: sleeve_type || 'none',
        is_proxy: !!is_proxy,
        notes: notes || '',
      }])
      .select('*, card_details:yg_cards(name, image_url, image_url_small)')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al registrar carta manualmente:', err);
    return NextResponse.json({ error: err.message || 'Error al registrar carta' }, { status: 500 });
  }
}

// DELETE: Eliminar carta de la colección
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de registro es obligatorio' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('yg_user_cards')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al eliminar carta de la colección:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar carta' }, { status: 500 });
  }
}
