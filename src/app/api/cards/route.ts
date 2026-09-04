import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SimpleLRUCache } from '@/lib/cache/lruCache';

const cardsCache = new SimpleLRUCache<string, Record<string, unknown>>(500, 300000); // 5 min TTL

const YGOPRODECK_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

// Diccionario de pares de confusión visual comunes en OCR para dígitos numéricos
const OCR_DIGIT_CONFUSIONS: Record<string, string[]> = {
  '1': ['4', '7', '0'],
  '4': ['1', '7', '9'],
  '9': ['5', '8', '0', '6', '4'],
  '5': ['9', '6', '3', '8'],
  '0': ['8', '6', '9', '1', '5'],
  '8': ['0', '9', '6', '3', '5'],
  '7': ['1', '4'],
  '6': ['8', '5', '0', '9'],
  '3': ['8', '5', '9'],
};

/**
 * Genera combinaciones de 8 dígitos sustituyendo un dígito con sus variantes
 * de confusión visual típicas de OCR, acotando a las variantes de más alta probabilidad.
 */
function generateOcrCandidatePasscodes(code: string): number[] {
  const digitsOnly = code.replace(/\D/g, '');
  if (digitsOnly.length < 8 || digitsOnly.length > 10) return [];
  const candidates: Set<number> = new Set();

  if (digitsOnly.length === 8) {
    const chars = digitsOnly.split('');

    // 1. Variantes de 1 dígito en las primeras 3 posiciones
    for (let i = 0; i < 3 && candidates.size < 6; i++) {
      const alternates = OCR_DIGIT_CONFUSIONS[chars[i]];
      if (alternates) {
        for (const alt of alternates) {
          if (candidates.size >= 6) break;
          const candidateArr = [...chars];
          candidateArr[i] = alt;
          const num = parseInt(candidateArr.join(''), 10);
          if (num > 0 && !isNaN(num)) candidates.add(num);
        }
      }
    }

    // 2. Variantes de 1 dígito en posiciones restantes si aún hay espacio
    for (let i = 3; i < 8 && candidates.size < 6; i++) {
      const alternates = OCR_DIGIT_CONFUSIONS[chars[i]];
      if (alternates) {
        for (const alt of alternates) {
          if (candidates.size >= 6) break;
          const candidateArr = [...chars];
          candidateArr[i] = alt;
          const num = parseInt(candidateArr.join(''), 10);
          if (num > 0 && !isNaN(num)) candidates.add(num);
        }
      }
    }
  } else if (digitsOnly.length === 9) {
    candidates.add(parseInt(digitsOnly.slice(-8), 10));
    candidates.add(parseInt(digitsOnly.slice(0, 8), 10));
  } else if (digitsOnly.length === 10) {
    candidates.add(parseInt(digitsOnly.slice(1, 9), 10));
    candidates.add(parseInt(digitsOnly.slice(-8), 10));
    candidates.add(parseInt(digitsOnly.slice(0, 8), 10));
  }

  return Array.from(candidates).filter((n) => n > 0 && !isNaN(n)).slice(0, 6);
}


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
    const cacheKey = req.nextUrl.search;

    // Comprobar micro-caché LRU
    const cachedData = cardsCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
        },
      });
    }
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

        // Si la búsqueda por ID exacto falló pero es un código de 8 a 10 dígitos, intentar autocorrección inteligente
        if ((!data || data.length === 0) && id && /^\d{8,10}$/.test(id)) {
          const candidates = generateOcrCandidatePasscodes(id);
          if (candidates.length > 0) {
            const { data: correctedData, error: corrError } = await supabase
              .from('yg_cards')
              .select('*')
              .in('id', candidates)
              .limit(1);

            if (!corrError && correctedData && correctedData.length > 0) {
              return NextResponse.json({ 
                data: correctedData,
                autoCorrected: true,
                originalScannedId: id
              });
            }
          }
        }

        if (!error && data && data.length > 0) {
          const responsePayload = { data };
          cardsCache.set(cacheKey, responsePayload);
          return NextResponse.json(responsePayload, {
            headers: {
              'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
            },
          });
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

    let response = await fetch(url);
    
    // Si YGOPRODeck no encontró el ID exacto, probar candidatos de confusión OCR en paralelo ultra-rápido (máx 4)
    if (!response.ok && response.status === 400 && id && /^\d{8,10}$/.test(id)) {
      const candidates = generateOcrCandidatePasscodes(id).slice(0, 4);
      if (candidates.length > 0) {
        try {
          const candidatePromises = candidates.map(async (candId) => {
            const candRes = await fetch(`${YGOPRODECK_API_URL}?id=${candId}`, {
              signal: AbortSignal.timeout(1500),
            });
            if (candRes.ok) return candRes;
            throw new Error('Candidate not found');
          });
          response = await Promise.any(candidatePromises);
        } catch {
          // Ningún candidato alternativo coincidió
        }
      }
    }

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

    const responsePayload = { data: mappedCards };
    cardsCache.set(cacheKey, responsePayload);
    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
      },
    });

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Error en /api/cards:', errorObj);
    return NextResponse.json({ error: errorObj.message || 'Error al buscar cartas' }, { status: 500 });
  }
}
