import { DropdownOption } from '@/components/ui/PremiumDropdown';

export const MONSTER_RACES = [
  'Warrior', 'Spellcaster', 'Dragon', 'Zombie', 'Fiend', 'Fairy', 'Beast', 
  'Beast-Warrior', 'Winged Beast', 'Machine', 'Insect', 'Dinosaur', 'Reptile', 
  'Fish', 'Sea Serpent', 'Aqua', 'Pyro', 'Thunder', 'Rock', 'Plant', 
  'Psychic', 'Divine-Beast', 'Wyrm', 'Cyberse', 'Illusionist'
];

export const SPELL_RACES = [
  'Normal', 'Continuous', 'Quick-Play', 'Equip', 'Field', 'Ritual'
];

export const TRAP_RACES = [
  'Normal', 'Continuous', 'Counter'
];

export const ATTRIBUTES = ['DARK', 'LIGHT', 'FIRE', 'WATER', 'EARTH', 'WIND', 'DIVINE'];

export const RARITIES = [
  'Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare',
  'Prismatic Secret Rare', 'Prismatic Ultimate Rare', 'Prismatic Platinum Rare', 'Gold Rare', 'Duel Terminal',
  'Ultimate Rare', 'Ghost Rare', 'Collector\'s Rare', 'Starlight Rare',
  'Quarter Century Secret Rare', 'Proxy'
];

export const STATUS_FLAGS = [
  { value: 'collection', label: 'Colección' },
  { value: 'trade_sale', label: 'Venta / Trade' },
  { value: 'workshop', label: 'Taller' },
  { value: 'bulk', label: 'Bulk' }
];

export const CARD_TYPE_OPTIONS: DropdownOption[] = [
  { value: '', label: 'Todos' },
  { value: 'Monster', label: 'Monstruo' },
  { value: 'Extra', label: 'Extra Deck' },
  { value: 'Spell', label: 'Magia' },
  { value: 'Trap', label: 'Trampa' },
  { value: 'Fusion Monster', label: 'Fusión', description: 'Fusion Monster' },
  { value: 'Synchro Monster', label: 'Sincronía', description: 'Synchro Monster' },
  { value: 'XYZ Monster', label: 'XYZ', description: 'XYZ Monster' },
  { value: 'Link Monster', label: 'Link', description: 'Link Monster' },
  { value: 'Ritual Monster', label: 'Ritual', description: 'Ritual Monster' },
  { value: 'Pendulum Effect Monster', label: 'Péndulo', description: 'Pendulum Monster' },
];

export const LEVEL_FILTER_OPTIONS: DropdownOption[] = [
  { value: '', label: 'Todos' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `★ ${i + 1}`,
    description: `Nivel / Rango ${i + 1}`,
  })),
];
