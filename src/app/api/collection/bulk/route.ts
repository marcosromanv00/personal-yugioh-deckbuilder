import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeBulkInput } from '@/lib/bulkSanitizer';
import { ensureCardsExistInDb } from '@/lib/ygoprodeck';

const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// POST /api/collection/bulk: parsea una lista de texto plano y devuelve coincidencias o las inserta
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = (body.text || body.bulkText || '') as string;
    const { action, storage_location_id, language, status_flag, sleeve_type, condition, rarity } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'El texto es obligatorio' }, { status: 400 });
    }

    const sanitizedText = sanitizeBulkInput(text, false);
    const lines = sanitizedText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedItems: { raw: string; name: string; quantity: number; section: string }[] = [];
    let currentSection = 'main';

    // RegExp para nombres con cantidad: "3 Ash Blossom", "1x Nibiru", "Raigeki x2", "Ash Blossom"
    const qtyStartRegex = /^(\d+)[\s,xX.:\-]+(.+)$/i;
    const qtyEndRegex = /^(.+?)[\s,xX.:\-]+(\d+)$/i;

    for (const line of lines) {
      if (line.toLowerCase().startsWith('#main')) {
        currentSection = 'main';
        continue;
      }
      if (line.toLowerCase().startsWith('#extra')) {
        currentSection = 'extra';
        continue;
      }
      if (line.toLowerCase().startsWith('!side') || line.toLowerCase().startsWith('#side')) {
        currentSection = 'side';
        continue;
      }
      if (line.startsWith('#') || line.startsWith('!')) {
        continue;
      }

      // Comprobar si la línea está compuesta únicamente por números y espacios (IDs numéricos)
      const numOnlyLine = line.replace(/[^\d]/g, ' ').replace(/\s+/g, ' ').trim();
      const numTokens = numOnlyLine ? numOnlyLine.split(' ').filter(Boolean) : [];

      // Si la línea original no tiene letras o es claramente numérica (ej: "3,66569334", "3 57946551", "17155634 25687552")
      const hasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(line);

      if (!hasLetters && numTokens.length > 0) {
        if (numTokens.length === 1) {
          parsedItems.push({ raw: line, name: numTokens[0], quantity: 1, section: currentSection });
        } else if (numTokens.length === 2) {
          const v1 = parseInt(numTokens[0], 10);
          const v2 = parseInt(numTokens[1], 10);
          if (v1 <= 100 && v2 > 100) {
            parsedItems.push({ raw: line, name: String(v2), quantity: v1, section: currentSection });
          } else if (v2 <= 100 && v1 > 100) {
            parsedItems.push({ raw: line, name: String(v1), quantity: v2, section: currentSection });
          } else {
            parsedItems.push({ raw: line, name: String(v1), quantity: 1, section: currentSection });
            parsedItems.push({ raw: line, name: String(v2), quantity: 1, section: currentSection });
          }
        } else {
          let i = 0;
          while (i < numTokens.length) {
            const v = parseInt(numTokens[i], 10);
            const nextV = i + 1 < numTokens.length ? parseInt(numTokens[i + 1], 10) : null;
            if (v <= 100 && nextV !== null && nextV > 100) {
              parsedItems.push({ raw: line, name: String(nextV), quantity: v, section: currentSection });
              i += 2;
            } else {
              parsedItems.push({ raw: line, name: String(v), quantity: 1, section: currentSection });
              i += 1;
            }
          }
        }
        continue;
      }

      // Si contiene texto / nombres de cartas
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

      // Quitar comillas o corchetes extra en los extremos
      cardName = cardName.replace(/^["'«“(\[]+|["'»”)\]]+$/g, '').trim();
      if (cardName) {
        parsedItems.push({ raw: line, name: cardName, quantity, section: currentSection });
      }
    }

    interface MatchedBulkCardItem {
      card_id: number;
      name: string;
      type: string;
      image_url: string;
      image_url_small?: string;
      quantity: number;
      section: string;
    }

    interface YgoCardDetailsRecord {
      id: number;
      name: string;
      type: string;
      desc?: string;
      atk?: number | null;
      def?: number | null;
      level?: number | null;
      race?: string | null;
      attribute?: string | null;
      archetype?: string | null;
      image_url?: string;
      image_url_small?: string;
    }

    const matchedList: MatchedBulkCardItem[] = [];
    const unmatchedList: string[] = [];

    const hasSupabase = isSupabaseConfigured();

    for (const item of parsedItems) {
      let cardId: number | null = null;
      let cardDetails: YgoCardDetailsRecord | null = null;

      const isNumericId = /^\d+$/.test(item.name);


      if (hasSupabase) {
        if (isNumericId) {
          const numId = parseInt(item.name, 10);
          const { data: dbCards } = await supabase
            .from('yg_cards')
            .select('*')
            .eq('id', numId);

          if (dbCards && dbCards.length > 0) {
            cardDetails = dbCards[0];
            cardId = dbCards[0].id;
          }
        } else {
          // 1. Buscar coincidencia exacta en base de datos local
          const { data: dbCards } = await supabase
            .from('yg_cards')
            .select('*')
            .ilike('name', item.name);

          if (dbCards && dbCards.length > 0) {
            cardDetails = dbCards[0];
            cardId = dbCards[0].id;
          } else {
            // 2. Intentar coincidencia parcial
            const { data: partialCards } = await supabase
              .from('yg_cards')
              .select('*')
              .ilike('name', `%${item.name}%`)
              .limit(1);

            if (partialCards && partialCards.length > 0) {
              cardDetails = partialCards[0];
              cardId = partialCards[0].id;
            } else if (item.name.includes(' ')) {
              // 3. Fallback: si el usuario escribió con espacios en lugar de guiones (ej. "Blue Eyes" -> "Blue-Eyes")
              const hyphenated = item.name.replace(/\s+/g, '-');
              const { data: hyphenCards } = await supabase
                .from('yg_cards')
                .select('*')
                .ilike('name', `%${hyphenated}%`)
                .limit(1);

              if (hyphenCards && hyphenCards.length > 0) {
                cardDetails = hyphenCards[0];
                cardId = hyphenCards[0].id;
              }
            } else if (item.name.includes('-')) {
              // 4. Fallback: si el usuario escribió con guiones y en DB está con espacios
              const spaced = item.name.replace(/-/g, ' ');
              const { data: spacedCards } = await supabase
                .from('yg_cards')
                .select('*')
                .ilike('name', `%${spaced}%`)
                .limit(1);

              if (spacedCards && spacedCards.length > 0) {
                cardDetails = spacedCards[0];
                cardId = spacedCards[0].id;
              }
            }
          }
        }
      }

      // Si no se encuentra en DB local, intentar buscar en API de YGOPRODeck
      if (!cardId) {
        try {
          let ygoproUrl = isNumericId
            ? `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(item.name)}`
            : `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(item.name)}`;

          let ygoproRes = await fetch(ygoproUrl);
          if (!ygoproRes.ok && !isNumericId) {
            // Reintentar con parámetro exacto name=
            ygoproUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(item.name)}`;
            ygoproRes = await fetch(ygoproUrl);
          }

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
          image_url: cardDetails.image_url || `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`,
          image_url_small: cardDetails.image_url_small,
          quantity: item.quantity,
          section: item.section || 'main'

        });
      } else {
        unmatchedList.push(item.raw);
      }
    }


    // Si la acción es "save", procedemos a insertar todas las cartas encontradas
    if (action === 'save') {
      if (hasSupabase) {
        await ensureCardsExistInDb(matchedList.map(item => ({
          id: item.card_id,
          name: item.name,
          type: item.type,
          image_url: item.image_url,
          image_url_small: item.image_url_small
        })));

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

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error parseando lote:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar lote de cartas' }, { status: 500 });
  }

}
