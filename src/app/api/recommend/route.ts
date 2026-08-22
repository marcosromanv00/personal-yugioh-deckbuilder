import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getImplicitSynergiesForArchetype } from '@/lib/constants/archetypeSynergies';
import {
  canSummonExtraDeckCard,
  isSearcherUsefulInDeck,
  inferCardValueProposition,
  CardBasicInfo,
} from '@/lib/engines/mechanicsValidator';

interface DeckCardInput {
  id: number;
  name: string;
  count: number;
  section: 'main' | 'extra' | 'side';
}

interface RecommendRequestBody {
  cards: DeckCardInput[];
  format: 'Master Duel' | 'TCG' | 'Duel Links';
  archetype?: string;
}

interface CardDetail {
  id: number;
  name: string;
  type?: string;
  desc?: string | null;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  race?: string | null;
  attribute?: string | null;
  archetype?: string | null;
  image_url?: string | null;
  image_url_small?: string | null;
  ban_master_duel?: string | null;
  ban_tcg?: string | null;
  ban_duel_links?: string | null;
}

interface ArchetypeBreakdownItem {
  card_id: number;
  usage_percent: number;
  average_copies: number;
  is_main_deck: boolean;
  yg_cards: CardDetail | null;
}

interface PopularCardItem {
  card_id: number;
  usage_percent: number;
  average_copies: number;
  yg_cards: CardDetail | null;
}

interface ReplacementItem {
  id: number;
  name: string;
  type: string;
  image_url: string;
  similarityScore: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RecommendRequestBody = await req.json();
    const { cards, format, archetype: userArchetype } = body;

    if (!format) {
      return NextResponse.json({ error: 'El formato es requerido' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let dbCards: CardDetail[] = [];
    const cardIds = cards.map(c => c.id);

    if (isSupabaseConfigured && cardIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('yg_cards')
          .select('*')
          .in('id', cardIds);

        if (!error && data) {
          dbCards = data;
        }
      } catch {
        console.warn('Fallo al obtener cartas de Supabase, usando fallback local');
      }
    }

    // Mapa de detalles de cartas
    const cardDetailsMap = new Map<number, CardDetail>();
    dbCards.forEach(c => cardDetailsMap.set(c.id, c));

    // Si la base de datos no está poblada, poblar con datos mínimos basados en las cartas del input
    cards.forEach(c => {
      if (!cardDetailsMap.has(c.id)) {
        // Mock básico de carta
        const isExtra = ['link', 'synchro', 'xyz', 'fusion'].some(t => c.name.toLowerCase().includes(t));
        cardDetailsMap.set(c.id, {
          id: c.id,
          name: c.name,
          type: isExtra ? 'Fusion Monster' : 'Effect Monster',
          archetype: c.name.toLowerCase().includes('yubel') ? 'Yubel' : 
                     c.name.toLowerCase().includes('zoodiac') ? 'Zoodiac' : null,
          ban_master_duel: c.name.includes('Maxx "C"') || c.name.includes('Ash Blossom') ? 'Unlimited' : 'Unlimited',
        });
      }
    });

    // 2. Inferir y rankear los arquetipos de la baraja
    const archetypeCountsMap = new Map<string, number>();
    cards.forEach(c => {
      const details = cardDetailsMap.get(c.id);
      if (details?.archetype) {
        archetypeCountsMap.set(details.archetype, (archetypeCountsMap.get(details.archetype) || 0) + (c.count || 1));
      }
    });

    // Ordenar por número de cartas de mayor a menor y tomar los 2 arquetipos principales
    const sortedArchetypes = Array.from(archetypeCountsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const detectedArchetypes = sortedArchetypes.slice(0, 2);

    let inferredArchetype = userArchetype || (detectedArchetypes.length > 0 ? detectedArchetypes[0].name : '');

    const recommendations: Record<string, unknown>[] = [];
    const banlistAlerts: Record<string, unknown>[] = [];

    // 3. Validar Banlist
    cards.forEach(c => {
      const details = cardDetailsMap.get(c.id);
      if (!details) return;

      let banStatus = 'Unlimited';
      if (format === 'Master Duel') banStatus = details.ban_master_duel || 'Unlimited';
      else if (format === 'TCG') banStatus = details.ban_tcg || 'Unlimited';
      else if (format === 'Duel Links') banStatus = details.ban_duel_links || 'Unlimited';

      // Banlist mock para algunas cartas en TCG/Duel Links
      if (c.name.includes('Maxx "C"') && format === 'TCG') {
        banStatus = 'Forbidden';
      }

      if (banStatus === 'Forbidden' && c.count > 0) {
        banlistAlerts.push({
          cardId: c.id,
          cardName: c.name,
          status: 'Forbidden',
          message: `${c.name} está PROHIBIDA en el formato ${format}. Debes quitarla.`
        });
      } else if (banStatus === 'Limited' && c.count > 1) {
        banlistAlerts.push({
          cardId: c.id,
          cardName: c.name,
          status: 'Limited',
          message: `${c.name} está LIMITADA a 1 copia en ${format}. Llevas ${c.count}.`
        });
      }
    });

    // 4 & 5. Obtener desglose de arquetipo (Base de datos o Mock)
    let archetypeBreakdown: ArchetypeBreakdownItem[] = [];
    
    if (inferredArchetype) {
      let loadedFromDb = false;
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('yg_archetype_breakdown')
            .select('*, yg_cards(*)')
            .eq('archetype_name', inferredArchetype)
            .eq('format', format === 'Duel Links' ? 'Duel Links' : 'Master Duel');

          if (!error && data && data.length > 0) {
            archetypeBreakdown = data as unknown as ArchetypeBreakdownItem[];
            loadedFromDb = true;
          }
        } catch {
          console.warn('Error al buscar desglose en base de datos, usando mock');
        }
      }

      // Mock de desglose si no cargó de la BD
      if (!loadedFromDb) {
        if (inferredArchetype.toLowerCase() === 'yubel') {
          archetypeBreakdown = [
            {
              card_id: 80893500,
              usage_percent: 100,
              average_copies: 3,
              is_main_deck: false,
              yg_cards: { id: 80893500, name: 'Phantom of Yubel', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/80893500.jpg' }
            },
            {
              card_id: 70685000,
              usage_percent: 100,
              average_copies: 3,
              is_main_deck: true,
              yg_cards: { id: 70685000, name: 'Spirit of Yubel', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/70685000.jpg' }
            },
            {
              card_id: 60235000,
              usage_percent: 90,
              average_copies: 3,
              is_main_deck: true,
              yg_cards: { id: 60235000, name: 'Opening of the Spirit Gates', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/60235000.jpg' }
            },
            {
              card_id: 78371393,
              usage_percent: 95,
              average_copies: 1,
              is_main_deck: true,
              yg_cards: { id: 78371393, name: 'Yubel', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/78371393.jpg' }
            }
          ];
        } else if (inferredArchetype.toLowerCase() === 'zoodiac') {
          archetypeBreakdown = [
            {
              card_id: 4614116,
              usage_percent: 100,
              average_copies: 3,
              is_main_deck: true,
              yg_cards: { id: 4614116, name: 'Zoodiac Thoroughblade', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/4614116.jpg' }
            },
            {
              card_id: 77568553,
              usage_percent: 100,
              average_copies: 3,
              is_main_deck: true,
              yg_cards: { id: 77568553, name: 'Zoodiac Whiptail', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/77568553.jpg' }
            },
            {
              card_id: 58932615,
              usage_percent: 100,
              average_copies: 1,
              is_main_deck: false,
              yg_cards: { id: 58932615, name: 'Zoodiac Drident', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/58932615.jpg' }
            }
          ];
        }
      }
    }

    const deckCardIds = new Set(cards.map(c => c.id));
    const deckCardCounts = new Map<number, number>();
    cards.forEach(c => deckCardCounts.set(c.id, c.count));

    const deckBasicCards: CardBasicInfo[] = cards.map(c => {
      const details = cardDetailsMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        type: details?.type,
        desc: details?.desc,
        level: details?.level,
        race: details?.race,
        attribute: details?.attribute,
        archetype: details?.archetype,
        count: c.count,
      };
    });

    archetypeBreakdown.forEach(item => {
      const targetCard = item.yg_cards;
      if (!targetCard) return;

      const currentCount = deckCardCounts.get(item.card_id) || 0;
      const recCopies = Math.round(item.average_copies);

      // Si es de Extra Deck, validar invocabilidad
      const isExtra = (targetCard.type || '').match(/fusion|synchro|xyz|link/i);
      if (isExtra) {
        const check = canSummonExtraDeckCard(
          { id: item.card_id, name: targetCard.name, type: targetCard.type, level: targetCard.level, race: targetCard.race, archetype: targetCard.archetype },
          deckBasicCards
        );
        if (!check.canSummon) return; // No recomendar cartas de Extra Deck que no se puedan invocar
      }

      const cardBasic: CardBasicInfo = {
        id: item.card_id,
        name: targetCard.name,
        type: targetCard.type,
        level: targetCard.level,
        race: targetCard.race,
        archetype: targetCard.archetype || inferredArchetype,
      };
      const rationale = inferCardValueProposition(cardBasic, deckBasicCards, inferredArchetype ? [inferredArchetype] : []);

      if (currentCount === 0 && item.usage_percent >= 50) {
        recommendations.push({
          type: 'missing_archetype_card',
          cardId: item.card_id,
          cardName: targetCard.name,
          image_url: targetCard.image_url_small,
          usagePercent: item.usage_percent,
          averageCopies: item.average_copies,
          rationale,
          message: `Carta núcleo recomendada para el arquetipo ${inferredArchetype}: "${targetCard.name}" (se juega en el ${Math.round(item.usage_percent)}% de los decks, promedio ${item.average_copies} copias).`
        });
      } else if (currentCount > 0 && currentCount < recCopies) {
        recommendations.push({
          type: 'ratio_warning',
          cardId: item.card_id,
          cardName: targetCard.name,
          image_url: targetCard.image_url_small,
          usagePercent: item.usage_percent,
          averageCopies: item.average_copies,
          rationale,
          message: `Considera aumentar "${targetCard.name}" de ${currentCount} a ${recCopies} copias (media competitiva: ${item.average_copies}).`
        });
      }
    });

    // 5.1 Recomendación de Sinergias Implícitas y Soporte No Nominal
    if (inferredArchetype) {
      const implicitSynergies = getImplicitSynergiesForArchetype(inferredArchetype);
      const deckNamesSet = new Set(cards.map(c => c.name.toLowerCase()));

      implicitSynergies.forEach(syn => {
        if (!deckNamesSet.has(syn.cardName.toLowerCase())) {
          recommendations.push({
            type: 'missing_archetype_card',
            cardId: 0,
            cardName: syn.cardName,
            image_url: null,
            usagePercent: Math.round(syn.weight * 100),
            averageCopies: syn.recommendedCopies || 1,
            rationale: {
              role: syn.role as any,
              badgeLabel: `Sinergia ${syn.role.toUpperCase()}`,
              badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
              shortReason: syn.reason,
              confidenceScore: Math.round(syn.weight * 100),
            },
            message: `Sinergia clave (${syn.role.toUpperCase()}) para ${inferredArchetype}: "${syn.cardName}". ${syn.reason}`
          });
        }
      });
    }

    // 6. Recomendación de Staples
    let popularCards: PopularCardItem[] = [];
    let loadedStaplesFromDb = false;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('yg_card_stats')
          .select('*, yg_cards(*)')
          .eq('format', format === 'Duel Links' ? 'Duel Links' : 'Master Duel')
          .order('usage_percent', { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          popularCards = data as unknown as PopularCardItem[];
          loadedStaplesFromDb = true;
        }
      } catch {
        console.warn('Error al buscar staples en base de datos');
      }
    }

    if (!loadedStaplesFromDb) {
      popularCards = [
        {
          card_id: 14558127,
          usage_percent: 92,
          average_copies: 3,
          yg_cards: { id: 14558127, name: 'Ash Blossom & Joyous Spring', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/14558127.jpg' }
        },
        {
          card_id: 23434530,
          usage_percent: 95,
          average_copies: 3,
          yg_cards: { id: 23434530, name: 'Maxx "C"', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/23434530.jpg' }
        },
        {
          card_id: 10045474,
          usage_percent: 85,
          average_copies: 3,
          yg_cards: { id: 10045474, name: 'Infinite Impermanence', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/10045474.jpg' }
        },
        {
          card_id: 24224830,
          usage_percent: 90,
          average_copies: 2,
          yg_cards: { id: 24224830, name: 'Called by the Grave', image_url_small: 'https://images.ygoprodeck.com/images/cards_small/24224830.jpg' }
        }
      ];
    }

    popularCards.forEach(item => {
      const targetCard = item.yg_cards;
      if (!targetCard) return;

      // Saltar Maxx "C" en TCG
      if (targetCard.name === 'Maxx "C"' && format === 'TCG') return;

      if (item.usage_percent >= 30 && !deckCardIds.has(item.card_id)) {
        const alreadyRec = recommendations.some(r => r.cardId === item.card_id);
        if (!alreadyRec) {
          const cardBasic: CardBasicInfo = {
            id: item.card_id,
            name: targetCard.name,
            type: targetCard.type,
            level: targetCard.level,
            race: targetCard.race,
          };
          const rationale = inferCardValueProposition(cardBasic, deckBasicCards, inferredArchetype ? [inferredArchetype] : []);

          recommendations.push({
            type: 'missing_staple',
            cardId: item.card_id,
            cardName: targetCard.name,
            image_url: targetCard.image_url_small,
            usagePercent: item.usage_percent,
            averageCopies: item.average_copies,
            rationale,
            message: `Staple recomendada para el formato: "${targetCard.name}" (usada en el ${Math.round(item.usage_percent)}% de decks competitivos).`
          });
        }
      }
    });

    // 7. Sugerir Reemplazos
    const replacementsMap: Record<number, ReplacementItem[]> = {};
    let loadedReplacementsFromDb = false;

    if (isSupabaseConfigured && cardIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('yg_card_replacements')
          .select('*, replacement_card:yg_cards!yg_card_replacements_replacement_card_id_fkey(*)')
          .in('card_id', cardIds)
          .eq('format', format === 'Duel Links' ? 'Duel Links' : 'Master Duel')
          .order('similarity_score', { ascending: false });

        if (!error && data && data.length > 0) {
          data.forEach(item => {
            const cardId = item.card_id;
            const repCard = item.replacement_card;
            if (!repCard) return;

            if (!replacementsMap[cardId]) {
              replacementsMap[cardId] = [];
            }
            replacementsMap[cardId].push({
              id: repCard.id,
              name: repCard.name,
              type: repCard.type,
              image_url: repCard.image_url_small,
              similarityScore: item.similarity_score,
              reason: item.reason
            });
          });
          loadedReplacementsFromDb = true;
        }
      } catch {
        console.warn('Error al buscar reemplazos en base de datos, usando mock');
      }
    }

    if (!loadedReplacementsFromDb) {
      const mockStapleReplacements: Record<number, ReplacementItem[]> = {
        14558127: [ // Ash Blossom
          { id: 97077563, name: 'Effect Veiler', type: 'Effect Monster', image_url: 'https://images.ygoprodeck.com/images/cards_small/97077563.jpg', similarityScore: 0.85, reason: 'Interrupción genérica de monstruos' },
          { id: 10045474, name: 'Infinite Impermanence', type: 'Trap Card', image_url: 'https://images.ygoprodeck.com/images/cards_small/10045474.jpg', similarityScore: 0.90, reason: 'Negador en campo desde la mano' }
        ],
        23434530: [ // Maxx "C"
          { id: 94141791, name: 'Droll & Lock Bird', type: 'Effect Monster', image_url: 'https://images.ygoprodeck.com/images/cards_small/94141791.jpg', similarityScore: 0.70, reason: 'Frena combos si el oponente añade cartas' }
        ],
        24224830: [ // Called by the Grave
          { id: 65681350, name: 'Crossout Designator', type: 'Spell Card', image_url: 'https://images.ygoprodeck.com/images/cards_small/65681350.jpg', similarityScore: 0.85, reason: 'Niega handtraps declarando el nombre' }
        ],
        10045474: [ // Infinite Impermanence
          { id: 97077563, name: 'Effect Veiler', type: 'Effect Monster', image_url: 'https://images.ygoprodeck.com/images/cards_small/97077563.jpg', similarityScore: 0.90, reason: 'Negador de efectos en campo' }
        ]
      };

      cards.forEach(c => {
        if (mockStapleReplacements[c.id]) {
          replacementsMap[c.id] = mockStapleReplacements[c.id];
        }
      });
    }

    return NextResponse.json({
      archetype: inferredArchetype,
      detectedArchetypes,
      recommendations,
      banlistAlerts,
      replacements: replacementsMap
    });

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Error en /api/recommend:', errorObj);
    return NextResponse.json({ error: errorObj.message || 'Error interno del servidor' }, { status: 500 });
  }
}
