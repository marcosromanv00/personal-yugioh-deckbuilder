import { supabase } from '@/lib/supabase';
import { runIdealOptimization, IdealOptimizerOutput } from './idealOptimizer';
import { StorageLocation, UserCard, Deck, IdealSyncLog } from '@/types/collection';

export async function synchronizeIdealEnvironment(): Promise<IdealOptimizerOutput> {
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let locations: StorageLocation[] = [];
  let cards: UserCard[] = [];
  let decks: Deck[] = [];

  if (isSupabaseConfigured) {
    // 1. Fetch physical storage locations
    const { data: locData } = await supabase
      .from('yg_storage_locations')
      .select('*');
    if (locData) locations = locData as StorageLocation[];

    // 2. Fetch physical user cards with card details
    const { data: cardData } = await supabase
      .from('yg_user_cards')
      .select('*, card_details:yg_cards(*)');
    if (cardData) cards = cardData as UserCard[];

    // 3. Fetch physical decks
    const { data: deckData } = await supabase
      .from('yg_decks')
      .select('*');
    if (deckData) decks = deckData as Deck[];
  }

  // Run the core balance optimization algorithm
  const result = runIdealOptimization({ locations, cards, decks });

  // If Supabase is connected, optionally record sync logs into yg_ideal_sync_logs
  if (isSupabaseConfigured && result.logs.length > 0) {
    try {
      await supabase.from('yg_ideal_sync_logs').insert(result.logs);
    } catch (e) {
      console.warn('Could not persist yg_ideal_sync_logs (table may need schema setup):', e);
    }
  }

  return result;
}

export async function fetchIdealLogs(): Promise<IdealSyncLog[]> {
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('yg_ideal_sync_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as IdealSyncLog[];
  } catch (e) {
    console.warn('Error fetching ideal logs:', e);
    return [];
  }
}
