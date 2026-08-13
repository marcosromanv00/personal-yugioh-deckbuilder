'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

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
  'Ultimate Rare', 'Ghost Rare', 'Gold Rare', 'Collector\'s Rare', 'Starlight Rare'
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
    <div className="w-full bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-xl transition-all duration-300">
      {/* Header / Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[hsl(215,15%,70%)] hover:text-white cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className={`w-4 h-4 text-purple-400 ${hasActiveFilters ? 'animate-pulse text-cyan-400' : ''}`} />
          <span>Filtros Avanzados</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="p-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 transition-colors"
              title="Resetear filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Filter Body */}
      {isOpen && (
        <div className="p-4 border-t border-[hsl(224,15%,16%)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-slate-200">
          
          {/* Card Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Tipo de Carta</label>
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
            >
              <option value="">Cualquiera</option>
              <option value="Monster">Monstruo (Main)</option>
              <option value="Extra">Monstruo (Extra)</option>
              <option value="Spell">Magia</option>
              <option value="Trap">Trampa</option>
              <option value="Fusion Monster">Fusion Monster</option>
              <option value="Synchro Monster">Synchro Monster</option>
              <option value="XYZ Monster">XYZ Monster</option>
              <option value="Link Monster">Link Monster</option>
              <option value="Ritual Monster">Ritual Monster</option>
              <option value="Pendulum Effect Monster">Pendulum Monster</option>
            </select>
          </div>

          {/* Subtype / Race */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">
              {filters.type === 'Spell' || filters.type === 'Trap' ? 'Propiedad' : 'Tipo / Raza'}
            </label>
            <select
              value={filters.race}
              onChange={(e) => updateFilter('race', e.target.value)}
              className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
            >
              <option value="">Cualquiera</option>
              {getRaceOptions().map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Attribute */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Atributo</label>
              <select
                value={filters.attribute}
                onChange={(e) => updateFilter('attribute', e.target.value)}
                className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
              >
                <option value="">Cualquiera</option>
                {ATTRIBUTES.map((attr) => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>
          )}

          {/* Level / Rank */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Nivel / Rango / Link</label>
              <select
                value={filters.level}
                onChange={(e) => updateFilter('level', e.target.value)}
                className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
              >
                <option value="">Cualquiera</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl.toString()}>{lvl}</option>
                ))}
              </select>
            </div>
          )}

          {/* ATK Range */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Ataque (ATK)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.atkMin}
                  onChange={(e) => updateFilter('atkMin', e.target.value)}
                  className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
                />
                <span className="text-slate-500 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.atkMax}
                  onChange={(e) => updateFilter('atkMax', e.target.value)}
                  className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* DEF Range */}
          {(!filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster')) && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Defensa (DEF)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.defMin}
                  onChange={(e) => updateFilter('defMin', e.target.value)}
                  className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
                />
                <span className="text-slate-500 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.defMax}
                  onChange={(e) => updateFilter('defMax', e.target.value)}
                  className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Archetype */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Arquetipo</label>
            <input
              type="text"
              placeholder="Ej: Elemental HERO..."
              value={filters.archetype}
              onChange={(e) => updateFilter('archetype', e.target.value)}
              className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
            />
          </div>

          {/* Rarity (Collection only) */}
          {showRarity && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Rareza</label>
              <select
                value={filters.rarity || ''}
                onChange={(e) => updateFilter('rarity', e.target.value)}
                className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
              >
                <option value="">Cualquiera</option>
                {RARITIES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Flag (Collection only) */}
          {showCollectionOptions && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Estado / Destino</label>
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full p-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 text-xs rounded-lg text-slate-100 focus:outline-none"
              >
                <option value="">Cualquiera</option>
                {STATUS_FLAGS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
