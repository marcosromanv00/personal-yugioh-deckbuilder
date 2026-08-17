import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const YGOPRODECK_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

interface YGOPRODeckCard {
  id: number;
  name: string;
  type: string;
  desc?: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  archetype?: string;
  card_images?: {
    image_url: string;
    image_url_small: string;
  }[];
  banlist_info?: {
    ban_md?: string;
    ban_tcg?: string;
    ban_ocg?: string;
    ban_goat?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id') || '';
    const query = searchParams.get('q') || '';
    const archetype = searchParams.get('archetype') || '';
    const type = searchParams.get('type') || '';
    const limit = parseInt(searchParams.get('limit') || '30');

    const attribute = searchParams.get('attribute') || '';
    const race = searchParams.get('race') || '';
    const level = searchParams.get('level') || '';
    const atkMin = searchParams.get('atkMin') || '';
    const atkMax = searchParams.get('atkMax') || '';
    const defMin = searchParams.get('defMin') || '';
    const defMax = searchParams.get('defMax') || '';

    // 1. Intentar buscar en Supabase primero (si está configurado)
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (isSupabaseConfigured) {
      try {
        let dbQuery = supabase
          .from('yg_cards')
          .select('*')
          .order('name', { ascending: true })
          .limit(limit);

        if (id) {
          dbQuery = dbQuery.eq('id', parseInt(id));
        }
        if (query) {
          const isNumeric = /^\d+$/.test(query.trim());
          if (isNumeric) {
            const cardIdNum = parseInt(query.trim());
            dbQuery = dbQuery.or(`name.ilike.%${query}%,id.eq.${cardIdNum}`);
          } else {
            dbQuery = dbQuery.ilike('name', `%${query}%`);
          }
        }
        if (archetype) {
          dbQuery = dbQuery.eq('archetype', archetype);
        }
        if (attribute) {
          dbQuery = dbQuery.eq('attribute', attribute);
        }
        if (race) {
          dbQuery = dbQuery.eq('race', race);
        }
        if (level) {
          dbQuery = dbQuery.eq('level', parseInt(level));
        }
        if (atkMin) {
          dbQuery = dbQuery.gte('atk', parseInt(atkMin));
        }
        if (atkMax) {
          dbQuery = dbQuery.lte('atk', parseInt(atkMax));
        }
        if (defMin) {
          dbQuery = dbQuery.gte('def', parseInt(defMin));
        }
        if (defMax) {
          dbQuery = dbQuery.lte('def', parseInt(defMax));
        }
        if (type) {
          // Tipos de extra deck para exclusión en filtro Monster (Main)
          const EXTRA_DECK_TYPES = [
            'Fusion Monster', 'Link Monster', 'Synchro Monster', 'XYZ Monster',
            'Pendulum Effect Fusion Monster', 'Synchro Pendulum Effect Monster',
            'XYZ Pendulum Effect Monster'
          ];
          if (type === 'Monster') {
            // Main Deck Monsters: include 'Monster' but exclude all extra deck types
            dbQuery = dbQuery
              .ilike('type', '%Monster%')
              .not('type', 'in', `(${EXTRA_DECK_TYPES.map(t => `"${t}"`).join(',')})`);
          } else if (type === 'Spell') {
            dbQuery = dbQuery.eq('type', 'Spell Card');
          } else if (type === 'Trap') {
            dbQuery = dbQuery.eq('type', 'Trap Card');
          } else if (type === 'Extra') {
            dbQuery = dbQuery.in('type', EXTRA_DECK_TYPES);
          } else {
            dbQuery = dbQuery.ilike('type', `%${type}%`);
          }
        }

        const { data, error } = await dbQuery;

        if (!error && data && data.length > 0) {
          return NextResponse.json({ data });
        }
      } catch (dbError) {
        console.warn('Fallo al consultar Supabase, reintentando con API externa de YGOPRODeck:', dbError);
      }
    }

    // 2. Fallback / Alternativa directa a YGOPRODeck API
    console.log('Consultando directamente a YGOPRODeck API...');
    let url = `${YGOPRODECK_API_URL}?misc=yes`;
    
    if (id) {
      url = `${YGOPRODECK_API_URL}?id=${id}`;
    } else {
      if (query) {
        const isNumeric = /^\d+$/.test(query.trim());
        if (isNumeric) {
          url += `&id=${encodeURIComponent(query.trim())}`;
        } else {
          url += `&fname=${encodeURIComponent(query)}`;
        }
      }
      if (archetype) {
        url += `&archetype=${encodeURIComponent(archetype)}`;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 400) {
        // Ningún resultado encontrado
        return NextResponse.json({ data: [] });
      }
      throw new Error(`YGOPRODeck API error: ${response.statusText}`);
    }

    const result = await response.json();
    let cards: YGOPRODeckCard[] = result.data || [];

    // Filtrar localmente por tipo y filtros avanzados si se requiere
    if (cards.length > 0) {
      if (type) {
        if (type === 'Monster') {
          cards = cards.filter((c: YGOPRODeckCard) => c.type.includes('Monster') && !['Fusion Monster', 'Link Monster', 'Synchro Monster', 'XYZ Monster'].some(t => c.type.includes(t)));
        } else if (type === 'Spell') {
          cards = cards.filter((c: YGOPRODeckCard) => c.type === 'Spell Card');
        } else if (type === 'Trap') {
          cards = cards.filter((c: YGOPRODeckCard) => c.type === 'Trap Card');
        } else if (type === 'Extra') {
          cards = cards.filter((c: YGOPRODeckCard) => ['Fusion', 'Link', 'Synchro', 'XYZ'].some(t => c.type.includes(t)));
        } else {
          cards = cards.filter((c: YGOPRODeckCard) => c.type.toLowerCase().includes(type.toLowerCase()));
        }
      }
      if (attribute) {
        cards = cards.filter((c: YGOPRODeckCard) => c.attribute?.toLowerCase() === attribute.toLowerCase());
      }
      if (race) {
        cards = cards.filter((c: YGOPRODeckCard) => c.race?.toLowerCase() === race.toLowerCase());
      }
      if (level) {
        cards = cards.filter((c: YGOPRODeckCard) => c.level === parseInt(level));
      }
      if (atkMin) {
        cards = cards.filter((c: YGOPRODeckCard) => c.atk !== undefined && c.atk !== null && c.atk >= parseInt(atkMin));
      }
      if (atkMax) {
        cards = cards.filter((c: YGOPRODeckCard) => c.atk !== undefined && c.atk !== null && c.atk <= parseInt(atkMax));
      }
      if (defMin) {
        cards = cards.filter((c: YGOPRODeckCard) => c.def !== undefined && c.def !== null && c.def >= parseInt(defMin));
      }
      if (defMax) {
        cards = cards.filter((c: YGOPRODeckCard) => c.def !== undefined && c.def !== null && c.def <= parseInt(defMax));
      }
    }

    // Mapear al mismo formato del schema de Supabase para consistencia
    const mappedCards = cards.slice(0, limit).map((c: YGOPRODeckCard) => {
      const img = c.card_images && c.card_images[0];
      return {
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
      };
    });

    return NextResponse.json({ data: mappedCards });

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Error en /api/cards:', errorObj);
    return NextResponse.json({ error: errorObj.message || 'Error al buscar cartas' }, { status: 500 });
  }
}
