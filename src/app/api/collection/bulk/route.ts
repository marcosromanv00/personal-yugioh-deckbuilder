import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// POST /api/collection/bulk: parsea una lista de texto plano y devuelve coincidencias o las inserta
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, action, storage_location_id, language, status_flag, sleeve_type, condition, rarity } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'El texto es obligatorio' }, { status: 400 });
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedItems: { raw: string; name: string; quantity: number }[] = [];

    // RegExp to match: "3 Ash Blossom", "1x Nibiru", "Raigeki x2", "Ash Blossom"
    const qtyStartRegex = /^(\d+)x?\s+(.+)$/i;
    const qtyEndRegex = /^(.+?)\s+x?\s*(\d+)$/i;

    for (const line of lines) {
      let quantity = 1;
      let cardName = line;

      const startMatch = line.match(qtyStartRegex);
      if (startMatch) {
        quantity = parseInt(startMatch[1], 10);
        cardName = startMatch[2].trim();
      } else {
        const endMatch = line.match(qtyEndRegex);
        if (endMatch) {
          quantity = parseInt(endMatch[2], 10);
          cardName = endMatch[1].trim();
        }
      }

      // Quitar comillas o caracteres extra
      cardName = cardName.replace(/^["'«“]|["'»”]$/g, '').trim();
      if (cardName) {
        parsedItems.push({ raw: line, name: cardName, quantity });
      }
    }

    const matchedList: any[] = [];
    const unmatchedList: string[] = [];

    const hasSupabase = isSupabaseConfigured();

    for (const item of parsedItems) {
      let cardId: number | null = null;
      let cardDetails: any = null;

      if (hasSupabase) {
        // Buscar coincidencia exacta o cercana en base de datos local
        const { data: dbCards } = await supabase
          .from('yg_cards')
          .select('*')
          .ilike('name', item.name);

        if (dbCards && dbCards.length > 0) {
          cardDetails = dbCards[0];
          cardId = dbCards[0].id;
        } else {
          // Intentar coincidencia parcial
          const { data: partialCards } = await supabase
            .from('yg_cards')
            .select('*')
            .ilike('name', `%${item.name}%`)
            .limit(1);

          if (partialCards && partialCards.length > 0) {
            cardDetails = partialCards[0];
            cardId = partialCards[0].id;
          }
        }
      }

      // Si no se encuentra en DB local, intentar buscar en API de YGOPRODeck
      if (!cardId) {
        try {
          const ygoproRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(item.name)}`);
          if (ygoproRes.ok) {
            const ygoproJson = await ygoproRes.json();
            const c = ygoproJson.data?.[0];
            if (c) {
              cardId = c.id;
              cardDetails = {
                id: c.id,
                name: c.name,
                type: c.type,
                desc: c.desc || '',
                atk: c.atk,
                def: c.def,
                level: c.level,
                race: c.race,
                attribute: c.attribute,
                archetype: c.archetype,
                image_url: c.card_images?.[0]?.image_url,
                image_url_small: c.card_images?.[0]?.image_url_small
              };

              // Si tenemos Supabase, guardar caché de la carta encontrada
              if (hasSupabase) {
                await supabase.from('yg_cards').upsert(cardDetails);
              }
            }
          }
        } catch (err) {
          console.warn(`Error buscando "${item.name}" en YGOPRODeck:`, err);
        }
      }

      if (cardId && cardDetails) {
        matchedList.push({
          card_id: cardId,
          name: cardDetails.name,
          type: cardDetails.type,
          image_url: cardDetails.image_url,
          image_url_small: cardDetails.image_url_small,
          quantity: item.quantity
        });
      } else {
        unmatchedList.push(item.raw);
      }
    }

    // Si la acción es "save", procedemos a insertar todas las cartas encontradas
    if (action === 'save') {
      if (hasSupabase) {
        const insertPayload = matchedList.map(item => ({
          card_id: item.card_id,
          storage_location_id: storage_location_id === 'inbox' ? null : storage_location_id,
          quantity: item.quantity,
          rarity: rarity || 'Common',
          condition: condition || 'Near Mint',
          language: language || 'en',
          status_flag: status_flag || 'collection',
          sleeve_type: sleeve_type || 'none',
          notes: 'Registrado en lote (Bulk)'
        }));

        const { error: insErr } = await supabase
          .from('yg_user_cards')
          .insert(insertPayload);

        if (insErr) throw insErr;
      }

      return NextResponse.json({
        success: true,
        message: `Se registraron exitosamente ${matchedList.reduce((acc, m) => acc + m.quantity, 0)} cartas en el inventario.`,
        unmatched: unmatchedList
      });
    }

    // Por defecto devuelve la vista previa analizada
    return NextResponse.json({
      parsed: matchedList,
      unmatched: unmatchedList
    });

  } catch (error: any) {
    console.error('Error parseando lote:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar lote de cartas' }, { status: 500 });
  }
}
