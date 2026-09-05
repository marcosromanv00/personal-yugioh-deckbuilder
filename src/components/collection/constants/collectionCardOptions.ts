import { DropdownOption } from '@/components/ui/PremiumDropdown';
import { CardStatusFlag } from '@/types/collection';

export const RARITY_OPTIONS: DropdownOption<string>[] = [
  { value: 'Common', label: 'Common (Común)' },
  { value: 'Rare', label: 'Rare (Rara)' },
  { value: 'Super Rare', label: 'Super Rare' },
  { value: 'Ultra Rare', label: 'Ultra Rare' },
  { value: 'Secret Rare', label: 'Secret Rare' },
  { value: 'Prismatic Secret Rare', label: 'Prismatic Secret' },
  { value: 'Prismatic Ultimate Rare', label: 'Prismatic Ultimate' },
  { value: 'Prismatic Platinum Rare', label: 'Prismatic Platinum' },
  { value: 'Gold Rare', label: 'Gold (Dorada)' },
  { value: 'Duel Terminal', label: 'Duel Terminal' },
  { value: 'Ultimate Rare', label: 'Ultimate Rare' },
  { value: 'Ghost Rare', label: 'Ghost Rare' },
  { value: 'Starlight Rare', label: 'Starlight Rare' },
  { value: "Collector's Rare", label: "Collector's Rare" },
  { value: 'Quarter Century Secret Rare', label: '25th Quarter Century' },
  { value: 'Proxy', label: '🖨️ Proxy (Impresión)' },
];

export const CONDITION_OPTIONS: DropdownOption<string>[] = [
  { value: 'Near Mint', label: 'Near Mint (NM)' },
  { value: 'Lightly Played', label: 'Lightly Played (LP)' },
  { value: 'Moderately Played', label: 'Moderately Played (MP)' },
  { value: 'Heavily Played', label: 'Heavily Played (HP)' },
  { value: 'Damaged', label: 'Damaged (DMG)' },
];

export const LANGUAGE_OPTIONS: DropdownOption<string>[] = [
  { value: 'es', label: '🇪🇸 Español (ES)' },
  { value: 'en', label: '🇺🇸 Inglés (EN)' },
  { value: 'ja', label: '🇯🇵 Japonés (OCG / JP)' },
  { value: 'de', label: '🇩🇪 Alemán (DE)' },
  { value: 'fr', label: '🇫🇷 Francés (FR)' },
  { value: 'it', label: '🇮🇹 Italiano (IT)' },
  { value: 'pt', label: '🇧🇷 Portugués (PT)' },
  { value: 'ko', label: '🇰🇷 Coreano (KO)' },
];

export const STATUS_FLAG_OPTIONS: DropdownOption<CardStatusFlag>[] = [
  { value: 'collection', label: '📦 Mi Colección (Físico)' },
  { value: 'in_deck', label: '🃏 Asignada a Baraja (En Deck)' },
  { value: 'trade_sale', label: '🤝 Intercambio / Venta' },
  { value: 'workshop', label: '🛠️ Mesa de Taller / Testeo' },
  { value: 'bulk', label: '📦 Lote / Bulk' },
  { value: 'memory_deck', label: '✨ Deck Histórico / Recuerdo' },
];
