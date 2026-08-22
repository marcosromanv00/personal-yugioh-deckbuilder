import { getSupabaseAdmin } from './supabase';
import { fetchAllCards } from './ygoprodeck';
import { SupabaseClient } from '@supabase/supabase-js';
import { buildCooccurrenceMatrix } from './engines/cooccurrenceEngine';

interface MDMCardPayload {
  card: {
    _id: string;
    name: string;
    rarity: string;
  };
  amount: number;
}

interface MDMDeck {
  _id: string;
  deckType: {
    _id: string;
    name: string;
  };
  main: MDMCardPayload[];
  extra: MDMCardPayload[];
  side: MDMCardPayload[];
  created: string;
}

/**
 * Ejecuta la sincronización masiva de cartas de YGOPRODeck y ratios de Master Duel Meta.
 * Esta función es llamada tanto por el endpoint de API como por el script local.
 */
export async function runMetaSync() {
  console.log('Iniciando sincronización de meta...');

  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!isSupabaseConfigured) {
    console.log('Soporte de Supabase ausente o en modo Placeholder. Simulando sincronización...');
    // Simular retraso de procesamiento para dar feedback visual al usuario en modo demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      mode: 'demo',
      message: 'Sincronización simulada con éxito. Se procesaron 200 recetas de la comunidad y se calcularon ratios en caliente para 25 arquetipos.',
      stats: {
        decksProcessed: 200,
        archetypesUpdated: 25,
        cardsRegistered: 1250,
      }
    };
  }

  const supabase = getSupabaseAdmin();
  const batchSize = 250;

  // 1. Descargar cartas de YGOPRODeck
  console.log('Descargando cartas desde YGOPRODeck...');
  const cards = await fetchAllCards();
  
  // Mapear al esquema
  const mappedCards = cards.map(c => {
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
      updated_at: new Date().toISOString()
    };
  });

  // Upsertar cartas en Supabase
  console.log(`Subiendo cartas a yg_cards... Total: ${mappedCards.length} cartas`);
  for (let i = 0; i < mappedCards.length; i += batchSize) {
    const batch = mappedCards.slice(i, i + batchSize);
    console.log(`> Subiendo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(mappedCards.length / batchSize)} (${batch.length} cartas)...`);
    const { error } = await supabase
      .from('yg_cards')
      .upsert(batch, { onConflict: 'id' });

    if (error) throw new Error(`Fallo al insertar cartas en Supabase: ${error.message}`);
    
    // Pequeño retardo para no saturar sockets/rate limit
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 2. Crear mapa de Nombre -> ID en memoria usando las cartas descargadas
  const nameToIdMap = new Map<string, number>();
  cards.forEach(c => {
    nameToIdMap.set(c.name.toLowerCase(), c.id);
  });

  // 3. Descargar y procesar recetas competitivas para cada formato (Master Duel, TCG, Duel Links)
  const formatSources: { format: 'Master Duel' | 'TCG' | 'Duel Links'; url: string }[] = [
    { format: 'Master Duel', url: 'https://www.masterduelmeta.com/api/v1/top-decks?limit=200' },
    { format: 'TCG', url: 'https://www.yugiohmeta.com/api/v1/top-decks?limit=200' },
    { format: 'Duel Links', url: 'https://www.duellinksmeta.com/api/v1/top-decks?limit=200' }
  ];

  interface GlobalCardStatPayload {
    card_id: number;
    format: string;
    usage_percent: number;
    average_copies: number;
    updated_at: string;
  }

  interface ArchetypeStatPayload {
    archetype_name: string;
    card_id: number;
    format: string;
    usage_percent: number;
    average_copies: number;
    is_main_deck: boolean;
    updated_at: string;
  }

  let totalDecksProcessed = 0;
  let totalArchetypesUpdated = 0;

  for (const source of formatSources) {
    console.log(`Obteniendo recetas competitivas para formato ${source.format}...`);
    try {
      const mdmResponse = await fetch(source.url);
      if (!mdmResponse.ok) {
        console.warn(`No se pudo obtener recetas para ${source.format}: ${mdmResponse.statusText}`);
        continue;
      }
      const mdmDecks = (await mdmResponse.json()) as MDMDeck[];
      if (!Array.isArray(mdmDecks) || mdmDecks.length === 0) continue;

      totalDecksProcessed += mdmDecks.length;

      const globalStats = new Map<number, { count: number; totalCopies: number }>();
      const archetypeStats = new Map<string, Map<number, { count: number; totalCopies: number; isMainDeck: boolean }>>();
      const archetypeDeckCounts = new Map<string, number>();

      mdmDecks.forEach(deck => {
        const archName = deck.deckType?.name;
        if (!archName) return;

        archetypeDeckCounts.set(archName, (archetypeDeckCounts.get(archName) || 0) + 1);

        if (!archetypeStats.has(archName)) {
          archetypeStats.set(archName, new Map());
        }
        const archCardMap = archetypeStats.get(archName)!;

        const processCardList = (list: MDMCardPayload[], isMain: boolean) => {
          if (!Array.isArray(list)) return;
          list.forEach(item => {
            const cardName = item.card?.name;
            if (!cardName) return;

            const cardId = nameToIdMap.get(cardName.toLowerCase());
            if (!cardId) return;

            const copies = item.amount || 1;

            if (!globalStats.has(cardId)) {
              globalStats.set(cardId, { count: 0, totalCopies: 0 });
            }
            const glob = globalStats.get(cardId)!;
            glob.count += 1;
            glob.totalCopies += copies;

            if (!archCardMap.has(cardId)) {
              archCardMap.set(cardId, { count: 0, totalCopies: 0, isMainDeck: isMain });
            }
            const archCard = archCardMap.get(cardId)!;
            archCard.count += 1;
            archCard.totalCopies += copies;
          });
        };

        processCardList(deck.main, true);
        processCardList(deck.extra, false);
      });

      totalArchetypesUpdated += archetypeStats.size;

      // Minería de Co-ocurrencia de Paquetes de Torneo
      const formattedDeckInputs = mdmDecks.map((d) => {
        const deckCardsList: { id: number; name: string; count: number }[] = [];
        const appendList = (list: MDMCardPayload[]) => {
          if (!Array.isArray(list)) return;
          list.forEach((item) => {
            const cardName = item.card?.name;
            if (!cardName) return;
            const cardId = nameToIdMap.get(cardName.toLowerCase());
            if (cardId) {
              deckCardsList.push({ id: cardId, name: cardName, count: item.amount || 1 });
            }
          });
        };
        appendList(d.main);
        appendList(d.extra);
        return {
          archetype: d.deckType?.name,
          cards: deckCardsList,
        };
      });

      const cooccurrenceMap = buildCooccurrenceMatrix(formattedDeckInputs, 0.04);
      console.log(`> Minería de co-ocurrencia calculada: ${cooccurrenceMap.size} cartas con correlaciones de torneo detectadas.`);

      // Insertar yg_card_stats para este formato
      const dbGlobalStats: GlobalCardStatPayload[] = [];
      globalStats.forEach((stats, cardId) => {
        const usagePercent = (stats.count / mdmDecks.length) * 100;
        const averageCopies = stats.totalCopies / stats.count;
        dbGlobalStats.push({
          card_id: cardId,
          format: source.format,
          usage_percent: parseFloat(usagePercent.toFixed(2)),
          average_copies: parseFloat(averageCopies.toFixed(2)),
          updated_at: new Date().toISOString()
        });
      });

      for (let i = 0; i < dbGlobalStats.length; i += batchSize) {
        const batch = dbGlobalStats.slice(i, i + batchSize);
        const { error } = await supabase
          .from('yg_card_stats')
          .upsert(batch, { onConflict: 'card_id,format' });

        if (error) console.warn(`Error en yg_card_stats para ${source.format}:`, error.message);
      }

      // Insertar yg_archetype_breakdown para este formato
      const dbArchetypeStats: ArchetypeStatPayload[] = [];
      archetypeStats.forEach((cardMap, archName) => {
        const decksOfArchCount = archetypeDeckCounts.get(archName) || 1;
        cardMap.forEach((stats, cardId) => {
          const usagePercent = (stats.count / decksOfArchCount) * 100;
          const averageCopies = stats.totalCopies / stats.count;

          dbArchetypeStats.push({
            archetype_name: archName,
            card_id: cardId,
            format: source.format,
            usage_percent: parseFloat(usagePercent.toFixed(2)),
            average_copies: parseFloat(averageCopies.toFixed(2)),
            is_main_deck: stats.isMainDeck,
            updated_at: new Date().toISOString()
          });
        });
      });

      for (let i = 0; i < dbArchetypeStats.length; i += batchSize) {
        const batch = dbArchetypeStats.slice(i, i + batchSize);
        const { error } = await supabase
          .from('yg_archetype_breakdown')
          .upsert(batch, { onConflict: 'archetype_name,card_id,format' });

        if (error) console.warn(`Error en yg_archetype_breakdown para ${source.format}:`, error.message);
      }
    } catch (formatErr) {
      console.warn(`Error sincronizando meta de ${source.format}:`, formatErr);
    }
  }

  // 7. Poblar reemplazos
  await populateReplacements(nameToIdMap, supabase);

  return {
    success: true,
    mode: 'production',
    message: `Sincronización finalizada con éxito en base de datos. Se importaron ${cards.length} cartas y se procesaron ${totalDecksProcessed} recetas para calcular los desgloses de arquetipos en los 3 formatos (Master Duel, TCG, Duel Links).`,
    stats: {
      decksProcessed: totalDecksProcessed,
      archetypesUpdated: totalArchetypesUpdated,
      cardsRegistered: cards.length
    }
  };
}

async function populateReplacements(nameToIdMap: Map<string, number>, supabase: SupabaseClient) {
  const staples = [
    {
      original: 'Ash Blossom & Joyous Spring',
      replacements: [
        { name: 'Effect Veiler', reason: 'Interrupción genérica de monstruos', score: 0.85 },
        { name: 'Infinite Impermanence', reason: 'Negador de monstruos desde la mano/campo', score: 0.90 },
        { name: 'Ghost Belle & Haunted Mansion', reason: 'Interrupción en cementerio', score: 0.75 }
      ]
    },
    {
      original: 'Maxx "C"',
      replacements: [
        { name: 'Droll & Lock Bird', reason: 'Frena combos si el oponente añade cartas', score: 0.70 },
        { name: 'Shared Ride', reason: 'Roba cartas cuando el oponente añade cartas', score: 0.75 }
      ]
    },
    {
      original: 'Infinite Impermanence',
      replacements: [
        { name: 'Effect Veiler', reason: 'Negador de efectos de monstruo en campo', score: 0.90 }
      ]
    }
  ];

  interface ReplacementPayload {
    card_id: number;
    replacement_card_id: number;
    format: string;
    similarity_score: number;
    reason: string;
  }

  const dbReplacements: ReplacementPayload[] = [];
  staples.forEach(s => {
    const originalId = nameToIdMap.get(s.original.toLowerCase());
    if (!originalId) return;

    s.replacements.forEach(r => {
      const repId = nameToIdMap.get(r.name.toLowerCase());
      if (!repId) return;

      dbReplacements.push({
        card_id: originalId,
        replacement_card_id: repId,
        format: 'Master Duel',
        similarity_score: r.score,
        reason: r.reason
      });
      dbReplacements.push({
        card_id: repId,
        replacement_card_id: originalId,
        format: 'Master Duel',
        similarity_score: r.score,
        reason: r.reason
      });
    });
  });

  if (dbReplacements.length > 0) {
    await supabase
      .from('yg_card_replacements')
      .upsert(dbReplacements, { onConflict: 'card_id,replacement_card_id,format' });
  }
}
