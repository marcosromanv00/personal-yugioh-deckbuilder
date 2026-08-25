'use client';

import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';

export interface FilterState {
  type: string;
  attribute: string;
  race: string;
  level: string;
  atkMin: string;
  atkMax: string;
  defMin: string;
  defMax: string;
  archetype: string;
  rarity?: string;
  status?: string;
}

interface CardFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  showRarity?: boolean;
  showCollectionOptions?: boolean;
}

const MONSTER_RACES = [
  'Warrior', 'Spellcaster', 'Dragon', 'Zombie', 'Fiend', 'Fairy', 'Beast', 
  'Beast-Warrior', 'Winged Beast', 'Machine', 'Insect', 'Dinosaur', 'Reptile', 
  'Fish', 'Sea Serpent', 'Aqua', 'Pyro', 'Thunder', 'Rock', 'Plant', 
  'Psychic', 'Divine-Beast', 'Wyrm', 'Cyberse', 'Illusionist'
];

const SPELL_RACES = [
  'Normal', 'Continuous', 'Quick-Play', 'Equip', 'Field', 'Ritual'
];

const TRAP_RACES = [
  'Normal', 'Continuous', 'Counter'
];

const ATTRIBUTES = ['DARK', 'LIGHT', 'FIRE', 'WATER', 'EARTH', 'WIND', 'DIVINE'];

const RARITIES = [
  'Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare', 
  'Ultimate Rare', 'Ghost Rare', 'Gold Rare', 'Collector\'s Rare', 'Starlight Rare',
  'Quarter Century Secret Rare', 'Proxy'
];

const STATUS_FLAGS = [
  { value: 'collection', label: 'Colección' },
  { value: 'trade_sale', label: 'Venta / Trade' },
  { value: 'workshop', label: 'Taller / Comunidad' },
  { value: 'bulk', label: 'Bulk / Crap' }
];

export const CardFilters: React.FC<CardFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  showRarity = false,
  showCollectionOptions = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const getRaceOptions = () => {
    if (filters.type === 'Spell') return SPELL_RACES;
    if (filters.type === 'Trap') return TRAP_RACES;
    return MONSTER_RACES;
  };

  const hasActiveFilters = Object.entries(filters).some(([key, val]) => {
    if (key === 'rarity' && !showRarity) return false;
    if (key === 'status' && !showCollectionOptions) return false;
    return val !== '' && val !== undefined;
  });

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs transition-all duration-300 overflow-hidden">
      {/* Header / Toggle Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors select-none focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className={`w-4 h-4 text-red-500 ${hasActiveFilters ? 'animate-pulse text-red-600' : ''}`} />
          <span>Filtros Avanzados</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-red-600 dark:text-red-400 transition-colors"
              title="Resetear filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Filter Body */}
      {isOpen && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-950/40">
          
          {/* Card Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Tipo de Carta</label>
            <PremiumDropdown
              value={filters.type}
              onChange={(val) => updateFilter('type', val)}
              align="full"
              size="sm"
              placeholder="Cualquiera"
              options={[
                { value: '', label: 'Cualquiera' },
                { value: 'Monster', label: 'Monstruo (Main)' },
                { value: 'Extra', label: 'Monstruo (Extra)' },
                { value: 'Spell', label: 'Magia' },
                { value: 'Trap', label: 'Trampa' },
                { value: 'Fusion Monster', label: 'Fusion Monster' },
                { value: 'Synchro Monster', label: 'Synchro Monster' },
                { value: 'XYZ Monster', label: 'XYZ Monster' },
                { value: 'Link Monster', label: 'Link Monster' },
                { value: 'Ritual Monster', label: 'Ritual Monster' },
                { value: 'Pendulum Effect Monster', label: 'Pendulum Monster' },
              ]}
            />
          </div>

          {/* Subtype / Race */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">
              {filters.type === 'Spell' || filters.type === 'Trap' ? 'Propiedad' : 'Tipo / Raza'}
            </label>
            <PremiumDropdown
              value={filters.race}
              onChange={(val) => updateFilter('race', val)}
              align="full"
              size="sm"
              placeholder="Cualquiera"
              options={[
                { value: '', label: 'Cualquiera' },
                ...getRaceOptions().map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>

          {/* Attribute */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Atributo</label>
              <PremiumDropdown
                value={filters.attribute}
                onChange={(val) => updateFilter('attribute', val)}
                align="full"
                size="sm"
                placeholder="Cualquiera"
                options={[
                  { value: '', label: 'Cualquiera' },
                  ...ATTRIBUTES.map((attr) => ({ value: attr, label: attr })),
                ]}
              />
            </div>
          )}

          {/* Level / Rank */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Nivel / Rango / Link</label>
              <PremiumDropdown
                value={filters.level}
                onChange={(val) => updateFilter('level', val)}
                align="full"
                size="sm"
                placeholder="Cualquiera"
                options={[
                  { value: '', label: 'Cualquiera' },
                  ...Array.from({ length: 12 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: `Nivel / Rango ${i + 1}`,
                  })),
                ]}
              />
            </div>
          )}

          {/* ATK Range */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Ataque (ATK)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.atkMin}
                  onChange={(e) => updateFilter('atkMin', e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-mono font-bold shadow-xs transition-colors"
                />
                <span className="text-zinc-400 text-xs font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.atkMax}
                  onChange={(e) => updateFilter('atkMax', e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-mono font-bold shadow-xs transition-colors"
                />
              </div>
            </div>
          )}

          {/* DEF Range */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Defensa (DEF)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.defMin}
                  onChange={(e) => updateFilter('defMin', e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-mono font-bold shadow-xs transition-colors"
                />
                <span className="text-zinc-400 text-xs font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.defMax}
                  onChange={(e) => updateFilter('defMax', e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-mono font-bold shadow-xs transition-colors"
                />
              </div>
            </div>
          )}

          {/* Archetype */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Arquetipo</label>
            <input
              type="text"
              placeholder="Ej: Elemental HERO..."
              value={filters.archetype}
              onChange={(e) => updateFilter('archetype', e.target.value)}
              className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-bold shadow-xs transition-colors"
            />
          </div>

          {/* Rarity (Collection only) */}
          {showRarity && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Rareza</label>
              <PremiumDropdown
                value={filters.rarity || ''}
                onChange={(val) => updateFilter('rarity', val)}
                align="full"
                size="sm"
                placeholder="Cualquiera"
                options={[
                  { value: '', label: 'Cualquiera' },
                  ...RARITIES.map((r) => ({ value: r, label: r })),
                ]}
              />
            </div>
          )}

          {/* Status Flag (Collection only) */}
          {showCollectionOptions && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Estado / Destino</label>
              <PremiumDropdown
                value={filters.status || ''}
                onChange={(val) => updateFilter('status', val)}
                align="full"
                size="sm"
                placeholder="Cualquiera"
                options={[
                  { value: '', label: 'Cualquiera' },
                  ...STATUS_FLAGS.map((f) => ({ value: f.value, label: f.label })),
                ]}
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
};
