import { Card, SearchScope, BreakdownCardItem } from './types';
import { FilterState } from './CardFilters';
import { UserCard } from '@/types/collection';

export function filterRecentCards(list: Card[], query: string, type: string, adv: FilterState): Card[] {
  let filtered = list;
  const q = query.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        (c.desc && c.desc.toLowerCase().includes(q)) ||
        (c.archetype && c.archetype.toLowerCase().includes(q))
    );
  }
  const typeToUse = type !== 'All' ? type : adv.type;
  if (typeToUse) filtered = filtered.filter((c) => c.type === typeToUse);
  if (adv.attribute) filtered = filtered.filter((c) => c.attribute?.toLowerCase() === adv.attribute.toLowerCase());
  if (adv.race) filtered = filtered.filter((c) => c.race?.toLowerCase() === adv.race.toLowerCase());
  if (adv.level) filtered = filtered.filter((c) => c.level === parseInt(adv.level));
  if (adv.archetype) filtered = filtered.filter((c) => c.archetype?.toLowerCase().includes(adv.archetype.toLowerCase()));
  return filtered;
}

export function mapMetaCards(sidebarBreakdownCards: BreakdownCardItem[], query: string, type: string, adv: FilterState): Card[] {
  let list: Card[] = sidebarBreakdownCards.map((b) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    image_url: b.image_url || `https://images.ygoprodeck.com/images/cards/${b.id}.jpg`,
    image_url_small: b.image_url_small || b.image_url,
    average_copies: b.average_copies,
    usage_percent: b.usage_percent,
  }));
  const q = query.trim().toLowerCase();
  if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || String(c.id).includes(q));
  const typeToUse = type !== 'All' ? type : adv.type;
  if (typeToUse) list = list.filter((c) => c.type === typeToUse);
  return list;
}

export function buildSearchCardsUrl(query: string, type: string, adv: FilterState, limitVal: number, endpoint = '/api/cards'): string {
  let url = `${endpoint}?limit=${limitVal}`;
  if (query) url += `&q=${encodeURIComponent(query)}`;
  const typeToUse = type !== 'All' ? type : adv.type;
  if (typeToUse) url += `&type=${typeToUse}`;
  if (adv.attribute) url += `&attribute=${encodeURIComponent(adv.attribute)}`;
  if (adv.race) url += `&race=${encodeURIComponent(adv.race)}`;
  if (adv.level) url += `&level=${encodeURIComponent(adv.level)}`;
  if (adv.atkMin) url += `&atkMin=${encodeURIComponent(adv.atkMin)}`;
  if (adv.atkMax) url += `&atkMax=${encodeURIComponent(adv.atkMax)}`;
  if (adv.defMin) url += `&defMin=${encodeURIComponent(adv.defMin)}`;
  if (adv.defMax) url += `&defMax=${encodeURIComponent(adv.defMax)}`;
  if (adv.archetype) url += `&archetype=${encodeURIComponent(adv.archetype)}`;
  return url;
}

export function mapCollectionUserCards(rawList: UserCard[]): Card[] {
  const seen = new Set<number>();
  const mappedCards: Card[] = [];
  for (const uc of rawList) {
    if (!uc.card_details || seen.has(uc.card_id)) continue;
    seen.add(uc.card_id);
    mappedCards.push({
      ...uc.card_details,
      id: uc.card_id,
      image_url: uc.card_details.image_url || '',
      userCardsGroup: rawList.filter((x: UserCard) => x.card_id === uc.card_id),
    });
  }
  return mappedCards;
}
