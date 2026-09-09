import { DeckCard } from './types';
import { StorageLocation, UserCard } from '@/types/collection';

export async function parseYdkOrBulkToDeckCards(rawInput: string): Promise<DeckCard[]> {
  const lines = rawInput.split(/\r?\n/);
  let currentSection: 'main' | 'extra' | 'side' = 'main';
  const parsedEntries: Array<{ cardId: number; section: 'main' | 'extra' | 'side' }> = [];
  let hasSectionHeader = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('#main')) { currentSection = 'main'; hasSectionHeader = true; return; }
    if (trimmed.startsWith('#extra')) { currentSection = 'extra'; hasSectionHeader = true; return; }
    if (trimmed.startsWith('!side') || trimmed.startsWith('#side')) { currentSection = 'side'; hasSectionHeader = true; return; }
    if (trimmed.startsWith('#') || trimmed.startsWith('!')) return;

    const matches = trimmed.match(/\d+/g);
    if (matches) {
      matches.forEach((m) => {
        const id = parseInt(m, 10);
        if (id > 0) parsedEntries.push({ cardId: id, section: currentSection });
      });
    }
  });

  if (parsedEntries.length === 0) throw new Error('No se encontraron IDs de cartas válidas en el texto.');
  const uniqueIds = Array.from(new Set(parsedEntries.map((e) => e.cardId)));
  const detailsMap = new Map<number, Record<string, unknown>>();

  for (let i = 0; i < uniqueIds.length; i += 30) {
    const chunk = uniqueIds.slice(i, i + 30);
    try {
      const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${chunk.join(',')}`);
      if (res.ok) {
        const json = await res.json();
        (json.data || []).forEach((item: Record<string, unknown>) => {
          if (typeof item.id === 'number') detailsMap.set(item.id, item);
        });
      }
    } catch (e) {
      console.warn('Error resolviendo IDs:', e);
    }
  }

  const countsMap = new Map<string, { cardId: number; count: number; section: 'main' | 'extra' | 'side' }>();
  parsedEntries.forEach((entry) => {
    const details = detailsMap.get(entry.cardId);
    let sec = entry.section;
    if (!hasSectionHeader && details) {
      const type = ((details.type as string) || '').toLowerCase();
      sec = (type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link')) ? 'extra' : 'main';
    }
    const key = `${entry.cardId}_${sec}`;
    const existing = countsMap.get(key);
    if (existing) existing.count += 1;
    else countsMap.set(key, { cardId: entry.cardId, count: 1, section: sec });
  });

  return Array.from(countsMap.values()).map((item) => {
    const found = detailsMap.get(item.cardId);
    const images = found?.card_images as Array<{ image_url: string; image_url_small?: string }> | undefined;
    const physicalCopies = Array.from({ length: item.count }).map(() => ({
      is_proxy: true,
      rarity: 'Receta / Proxy',
      source_status: 'staged' as const,
    }));
    return {
      id: item.cardId,
      name: (found?.name as string) || `Carta #${item.cardId}`,
      count: item.count,
      section: item.section,
      type: (found?.type as string) || 'Monster',
      image_url: images?.[0]?.image_url || `https://images.ygoprodeck.com/images/cards/${item.cardId}.jpg`,
      image_url_small: images?.[0]?.image_url_small || images?.[0]?.image_url,
      proxy_count: item.count,
      physical_copies: physicalCopies,
    };
  });
}

export function toggleCardPhysicalLinkHelper(
  prev: DeckCard[],
  cardId: number,
  section: 'main' | 'extra' | 'side' | 'extras',
  copyIndex: number | undefined,
  allUserCards: UserCard[],
  locations: StorageLocation[]
): DeckCard[] {
  return prev.map((c) => {
    if (c.id !== cardId || c.section !== section) return c;
    const copies = [...(c.physical_copies || [])];

    if (copyIndex !== undefined && copyIndex !== null) {
      const pc = copies[copyIndex];
      if (pc?.is_proxy || !pc?.user_card_id) {
        const assignedCounts: Record<string, number> = {};
        prev.forEach((it) => it.physical_copies?.forEach((p) => { if (p.user_card_id) assignedCounts[p.user_card_id] = (assignedCounts[p.user_card_id] || 0) + 1; }));
        const target = allUserCards.find((uc) => uc.card_id === cardId && ((assignedCounts[uc.id] || 0) < (uc.quantity || 1)));
        if (target) {
          const loc = locations.find((l) => l.id === target.storage_location_id);
          copies[copyIndex] = {
            user_card_id: target.id,
            storage_location_id: target.storage_location_id,
            location_name: loc ? loc.name : 'Inbox / Sin clasificar',
            rarity: target.rarity || 'Common',
            condition: target.condition || 'Near Mint',
            is_proxy: false,
            is_in_active_deck: Boolean(target.deck_id),
            active_deck_id: target.deck_id || undefined,
            active_deck_name: target.deck_details?.name,
            binder_page: target.binder_page,
            binder_slot: target.binder_slot,
            compartment_index: target.compartment_index,
          };
        }
      } else {
        copies[copyIndex] = { is_proxy: true, rarity: pc?.rarity || 'Common' };
      }
    }
    return { ...c, physical_copies: copies, proxy_count: copies.filter((p) => p.is_proxy).length };
  });
}
