import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { UserCard } from '@/types/collection';

// GET: Obtener cartas de la colección con filtros
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const locationId = searchParams.get('location_id');
    const deckIdFilter = searchParams.get('deck_id');
    const sleeveType = searchParams.get('sleeve');
    const query = searchParams.get('q');
    const isProxyFilter = searchParams.get('is_proxy');

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
    const rarity = searchParams.get('rarity');
    const onlyFavorites = searchParams.get('favorites') === 'true';

    let cards: UserCard[] = [];
    try {
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        let chunkQuery = supabase
          .from('yg_user_cards')
          .select('*, card_details:yg_cards(*), deck_details:yg_decks(name)')
          .order('created_at', { ascending: true })
          .range(from, from + step - 1);

        if (locationId === 'null' || locationId === 'inbox') {
          chunkQuery = chunkQuery.is('storage_location_id', null).is('deck_id', null);
        } else if (locationId === 'in_deck') {
          chunkQuery = chunkQuery.not('deck_id', 'is', null);
        } else if (locationId) {
          chunkQuery = chunkQuery.eq('storage_location_id', locationId);
        }

        if (deckIdFilter) {
          chunkQuery = chunkQuery.eq('deck_id', deckIdFilter);
        }

        if (isProxyFilter === 'true') {
          chunkQuery = chunkQuery.eq('is_proxy', true);
        } else if (isProxyFilter === 'false') {
          chunkQuery = chunkQuery.eq('is_proxy', false);
        }

        if (sleeveType) {
          chunkQuery = chunkQuery.eq('sleeve_type', sleeveType);
        }

        const { data, error } = await chunkQuery;
        if (error) {
          console.warn('Advertencia de consulta Supabase en cards chunk:', error.message);
          break;
        }

        if (data && data.length > 0) {
          cards = cards.concat(data as UserCard[]);
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }
    } catch (supabaseErr) {
      console.warn('Error de red/DNS al consultar Supabase (cards):', supabaseErr);
    }


    let filteredCards = cards || [];


    if (query) {
      const qLower = query.toLowerCase();
      filteredCards = filteredCards.filter((uc: UserCard) => 
        uc.card_details?.name?.toLowerCase().includes(qLower) ||
        uc.rarity?.toLowerCase().includes(qLower) ||
        uc.notes?.toLowerCase().includes(qLower) ||
        String(uc.card_id).includes(qLower)
      );
    }

    if (type) {
      filteredCards = filteredCards.filter((uc: UserCard) => {
        const cType = uc.card_details?.type;
        if (!cType) return false;
        if (type === 'Monster') {
          // Main Deck monsters: includes 'Monster' but NOT extra deck types
          const EXTRA_TYPES = ['Fusion Monster', 'Link Monster', 'Synchro Monster', 'XYZ Monster', 'Pendulum Effect Fusion Monster'];
          return cType.includes('Monster') && !EXTRA_TYPES.some(t => cType.includes(t));
        } else if (type === 'Spell') {
          return cType === 'Spell Card';
        } else if (type === 'Trap') {
          return cType === 'Trap Card';
        } else if (type === 'Extra') {
          // All extra deck monsters
          return ['Fusion Monster', 'Link Monster', 'Synchro Monster', 'XYZ Monster'].some(t => cType.includes(t));
        } else if (type === 'Fusion Monster') {
          return cType.includes('Fusion Monster');
        } else if (type === 'Synchro Monster') {
          return cType.includes('Synchro Monster');
        } else if (type === 'XYZ Monster') {
          return cType.includes('XYZ Monster');
        } else if (type === 'Link Monster') {
          return cType.includes('Link Monster');
        } else if (type === 'Ritual Monster') {
          return cType.includes('Ritual Monster');
        } else if (type === 'Pendulum Effect Monster') {
          return cType.includes('Pendulum');
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

    if (rarity) {
      filteredCards = filteredCards.filter((uc: UserCard) =>
        uc.rarity?.toLowerCase() === rarity.toLowerCase()
      );
    }

    if (onlyFavorites) {
      filteredCards = filteredCards.filter((uc: UserCard) => uc.is_favorite === true);
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
      is_proxy,
      is_favorite
    } = body;

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Caso especial: Mover todas las cartas físicas de un mazo a un contenedor y carril
    if (body.action === 'move_deck_cards' && body.target_deck_id && body.target_storage_location_id !== undefined) {
      if (!isSupabaseConfigured) {
        return NextResponse.json({ success: true, message: 'Modo demo: Cartas del mazo movidas' });
      }
      const { data: updatedCards, error: moveError } = await supabase
        .from('yg_user_cards')
        .update({
          storage_location_id: body.target_storage_location_id,
          compartment_index: body.target_compartment_index ?? 0,
          binder_page: null,
          binder_slot: null
        })
        .eq('deck_id', body.target_deck_id)
        .select('id');

      if (moveError) throw moveError;
      return NextResponse.json({ success: true, count: updatedCards?.length || 0 });
    }

    // Caso especial: Mover lote de cartas por IDs hacia un contenedor / carril específico (Pick-List / Unificación)
    if (body.action === 'batch_move' && Array.isArray(body.card_ids) && body.card_ids.length > 0) {
      const targetLoc = body.target_storage_location_id === undefined ? null : body.target_storage_location_id;
      const targetComp = body.target_compartment_index ?? 0;
      const targetStatus = body.target_status_flag;

      if (!isSupabaseConfigured) {
        return NextResponse.json({ success: true, message: 'Modo demo: Lote de cartas reubicado', count: body.card_ids.length });
      }

      const updateData: Record<string, unknown> = {
        storage_location_id: targetLoc,
        compartment_index: targetComp,
        deck_id: null,
        deck_section: null,
        binder_page: null,
        binder_slot: null,
      };
      if (targetStatus) {
        updateData.status_flag = targetStatus;
      }

      const { data: updatedCards, error: batchError } = await supabase
        .from('yg_user_cards')
        .update(updateData)
        .in('id', body.card_ids)
        .select('id');

      if (batchError) throw batchError;
      return NextResponse.json({ success: true, count: updatedCards?.length || 0 });
    }

    // Caso especial: Actualización genérica en lote (Bulk Update: Estado, Condición, Funda, Ubicación, etc.)
    if (body.action === 'batch_update' && Array.isArray(body.card_ids) && body.card_ids.length > 0) {
      const { updates } = body;
      if (!updates || typeof updates !== 'object') {
        return NextResponse.json({ error: 'Objeto de actualizaciones requerido' }, { status: 400 });
      }

      if (!isSupabaseConfigured) {
        return NextResponse.json({ success: true, message: 'Modo demo: Lote actualizado', count: body.card_ids.length });
      }

      const cleanUpdates: Record<string, unknown> = {};
      if (updates.storage_location_id !== undefined) {
        cleanUpdates.storage_location_id = updates.storage_location_id;
        cleanUpdates.binder_page = null;
        cleanUpdates.binder_slot = null;
      }
      if (updates.compartment_index !== undefined) cleanUpdates.compartment_index = updates.compartment_index;
      if (updates.status_flag !== undefined) cleanUpdates.status_flag = updates.status_flag;
      if (updates.condition !== undefined) cleanUpdates.condition = updates.condition;
      if (updates.sleeve_type !== undefined) cleanUpdates.sleeve_type = updates.sleeve_type;
      if (updates.sleeve_color !== undefined) cleanUpdates.sleeve_color = updates.sleeve_color;
      if (updates.sleeve_brand !== undefined) cleanUpdates.sleeve_brand = updates.sleeve_brand;
      if (updates.is_favorite !== undefined) cleanUpdates.is_favorite = updates.is_favorite;
      if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;

      const { data: updatedBatch, error: batchUpErr } = await supabase
        .from('yg_user_cards')
        .update(cleanUpdates)
        .in('id', body.card_ids)
        .select('id');

      if (batchUpErr) throw batchUpErr;
      return NextResponse.json({ success: true, count: updatedBatch?.length || 0 });
    }

    // Caso especial: Separar copias (Hacer copia individual a partir de un grupo con quantity > 1)
    if (body.action === 'split_copy' && body.user_card_id && typeof body.split_quantity === 'number') {
      const { user_card_id, split_quantity } = body;
      const qtyToSplit = Math.max(1, Math.floor(split_quantity));

      if (!isSupabaseConfigured) {
        return NextResponse.json({ 
          success: true, 
          message: 'Modo demo: Copia individual separada', 
          splitCount: qtyToSplit 
        });
      }

      // 1. Obtener registro original
      const { data: originalCard, error: fetchErr } = await supabase
        .from('yg_user_cards')
        .select('*')
        .eq('id', user_card_id)
        .single();

      if (fetchErr || !originalCard) {
        return NextResponse.json({ error: 'No se encontró el registro de la carta original' }, { status: 404 });
      }

      const currentQty = originalCard.quantity || 1;
      if (currentQty <= qtyToSplit) {
        return NextResponse.json({ 
          error: `No se pueden separar ${qtyToSplit} copias de un registro que sólo contiene ${currentQty}` 
        }, { status: 400 });
      }

      // 2. Reducir la cantidad del registro original
      const remainingQty = currentQty - qtyToSplit;
      const { data: updatedSource, error: updateErr } = await supabase
        .from('yg_user_cards')
        .update({ quantity: remainingQty })
        .eq('id', user_card_id)
        .select('*, card_details:yg_cards(*)')
        .single();

      if (updateErr) throw updateErr;

      // 3. Crear el nuevo registro independiente con la cantidad separada
      const { data: newRecord, error: insertErr } = await supabase
        .from('yg_user_cards')
        .insert([{
          card_id: originalCard.card_id,
          storage_location_id: originalCard.storage_location_id,
          compartment_index: originalCard.compartment_index ?? 0,
          quantity: qtyToSplit,
          rarity: originalCard.rarity || 'Common',
          condition: originalCard.condition || 'Near Mint',
          language: originalCard.language || 'en',
          status_flag: originalCard.status_flag || 'collection',
          sleeve_type: originalCard.sleeve_type || 'none',
          sleeve_brand: originalCard.sleeve_brand || null,
          sleeve_color: originalCard.sleeve_color || null,
          sleeve_condition: originalCard.sleeve_condition || null,
          is_proxy: !!originalCard.is_proxy,
          is_favorite: !!originalCard.is_favorite,
          notes: originalCard.notes || '',
          binder_page: null,
          binder_slot: null,
        }])
        .select('*, card_details:yg_cards(*)')
        .single();

      if (insertErr) throw insertErr;

      return NextResponse.json({
        success: true,
        updatedSource,
        newRecord,
        message: `Se separaron ${qtyToSplit} copia(s) a un registro independiente.`
      });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID de registro de carta es obligatorio' }, { status: 400 });
    }

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
    if (is_favorite !== undefined) updatePayload.is_favorite = is_favorite;
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

// POST: Registrar una o varias cartas manualmente en la colección
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Caso 1: Inserción en lote (Batch)
    if (Array.isArray(body.cards) && body.cards.length > 0) {
      const cardsList: Partial<UserCard>[] = body.cards;

      if (!isSupabaseConfigured) {
        const mockCreated = cardsList.map((c: Partial<UserCard>, index: number) => ({
          id: `demo-${Date.now()}-${index}`,
          card_id: c.card_id,
          storage_location_id: c.storage_location_id || null,
          quantity: c.quantity || 1,
          rarity: c.rarity || 'Common',
          condition: c.condition || 'Near Mint',
          language: c.language || 'en',
          status_flag: c.status_flag || 'collection',
          sleeve_type: c.sleeve_type || 'none',
          is_proxy: !!c.is_proxy,
          notes: c.notes || '',
        }));
        return NextResponse.json({ success: true, count: mockCreated.length, data: mockCreated });
      }

      // Asegurar que las cartas existan en yg_cards
      for (const c of cardsList) {
        if (!c.card_id) continue;
        const { data: existingCard } = await supabase
          .from('yg_cards')
          .select('id')
          .eq('id', c.card_id)
          .maybeSingle();

        if (!existingCard) {
          try {
            const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${c.card_id}`);
            if (response.ok) {
              const result = await response.json();
              const cardData = result.data?.[0];
              if (cardData) {
                const img = cardData.card_images?.[0];
                await supabase.from('yg_cards').upsert({
                  id: cardData.id,
                  name: cardData.name,
                  type: cardData.type,
                  desc: cardData.desc || '',
                  atk: cardData.atk !== undefined ? cardData.atk : null,
                  def: cardData.def !== undefined ? cardData.def : null,
                  level: cardData.level !== undefined ? cardData.level : null,
                  race: cardData.race || null,
                  attribute: cardData.attribute || null,
                  archetype: cardData.archetype || null,
                  image_url: img ? img.image_url : null,
                  image_url_small: img ? img.image_url_small : null,
                  ban_master_duel: cardData.banlist_info?.ban_md || 'Unlimited',
                  ban_tcg: cardData.banlist_info?.ban_tcg || 'Unlimited',
                  ban_ocg: cardData.banlist_info?.ban_ocg || 'Unlimited',
                  ban_duel_links: cardData.banlist_info?.ban_goat || 'Unlimited',
                });
              }
            }
          } catch (err) {
            console.warn('Error al precargar carta faltante en lote:', err);
          }
        }
      }

      const insertPayload = cardsList.map((c: Partial<UserCard>) => ({
        card_id: c.card_id,
        storage_location_id: c.storage_location_id || null,
        quantity: c.quantity || 1,
        rarity: c.rarity || 'Common',
        condition: c.condition || 'Near Mint',
        language: c.language || 'en',
        status_flag: c.status_flag || 'collection',
        sleeve_type: c.sleeve_type || 'none',
        is_proxy: !!c.is_proxy,
        notes: c.notes || '',
      }));


      const { data, error } = await supabase
        .from('yg_user_cards')
        .insert(insertPayload)
        .select('*, card_details:yg_cards(name, image_url, image_url_small)');

      if (error) throw error;
      return NextResponse.json({ success: true, count: data?.length || 0, data });
    }

    // Caso 2: Inserción individual
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
      binder_page,
      binder_slot,
      compartment_index,
    } = body;

    if (!card_id) {
      return NextResponse.json({ error: 'ID de carta es obligatorio' }, { status: 400 });
    }

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
        binder_page: binder_page || null,
        binder_slot: binder_slot || null,
        compartment_index: compartment_index ?? 0,
      }])
      .select('*, card_details:yg_cards(*)')
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

// DELETE: Eliminar carta(s) de la colección
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids');
    const cardId = searchParams.get('card_id');

    let bodyIds: string[] | undefined;
    try {
      const body = await req.json();
      if (Array.isArray(body?.ids)) bodyIds = body.ids;
      else if (Array.isArray(body?.card_ids)) bodyIds = body.card_ids;
    } catch {
      // Body is optional for DELETE
    }

    const targetIds: string[] = [];
    if (id) targetIds.push(id);
    if (idsParam) {
      targetIds.push(...idsParam.split(',').map(s => s.trim()).filter(Boolean));
    }
    if (bodyIds && bodyIds.length > 0) {
      targetIds.push(...bodyIds);
    }

    const uniqueTargetIds = Array.from(new Set(targetIds));

    if (uniqueTargetIds.length === 0 && !cardId) {
      return NextResponse.json({ error: 'ID o card_id de registro es obligatorio' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isSupabaseConfigured) {
      if (uniqueTargetIds.length > 0) {
        const { error } = await supabase
          .from('yg_user_cards')
          .delete()
          .in('id', uniqueTargetIds);

        if (error) {
          throw error;
        }
      } else if (cardId) {
        const { error } = await supabase
          .from('yg_user_cards')
          .delete()
          .eq('card_id', parseInt(cardId));

        if (error) {
          throw error;
        }
      }
    }

    return NextResponse.json({ success: true, count: uniqueTargetIds.length || 1 });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al eliminar carta de la colección:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar carta' }, { status: 500 });
  }
}
