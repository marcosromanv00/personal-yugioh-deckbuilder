'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import {
  MONSTER_RACES,
  SPELL_RACES,
  TRAP_RACES,
  ATTRIBUTES,
  CARD_TYPE_OPTIONS,
  LEVEL_FILTER_OPTIONS,
} from './constants/cardFilters.constants';
import { CardStatRangeFilter } from './components/CardStatRangeFilter';
import { CardCollectionFilterFields } from './components/CardCollectionFilterFields';

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
  className?: string;
}

export const CardFilters: React.FC<CardFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  showRarity = false,
  showCollectionOptions = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
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

  const isMonster = !filters.type || filters.type === 'Monster' || filters.type === 'Extra' || filters.type.includes('Monster');

  return (
    <div
      className={`w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs transition-all duration-300 ${
        isOpen ? 'overflow-visible relative z-30' : 'overflow-hidden'
      } ${className}`}
    >
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
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors select-none focus:outline-none rounded-t-2xl"
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
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-red-600 dark:text-red-400 transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-b-2xl overflow-visible">
          
          {/* Card Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Tipo de Carta</label>
            <PremiumDropdown
              value={filters.type}
              onChange={(val) => updateFilter('type', val)}
              align="full"
              size="sm"
              placeholder="Todos"
              options={CARD_TYPE_OPTIONS}
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
              placeholder="Todos"
              options={[
                { value: '', label: 'Todos' },
                ...getRaceOptions().map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>

          {/* Attribute */}
          {isMonster && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Atributo</label>
              <PremiumDropdown
                value={filters.attribute}
                onChange={(val) => updateFilter('attribute', val)}
                align="full"
                size="sm"
                placeholder="Todos"
                options={[
                  { value: '', label: 'Todos' },
                  ...ATTRIBUTES.map((attr) => ({ value: attr, label: attr })),
                ]}
              />
            </div>
          )}

          {/* Level / Rank */}
          {isMonster && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Nivel / Rk (★)</label>
              <PremiumDropdown
                value={filters.level}
                onChange={(val) => updateFilter('level', val)}
                align="full"
                size="sm"
                placeholder="Todos"
                options={LEVEL_FILTER_OPTIONS}
              />
            </div>
          )}

          {/* ATK Range */}
          {isMonster && (
            <CardStatRangeFilter
              label="ATK"
              minVal={filters.atkMin}
              maxVal={filters.atkMax}
              onMinChange={(val) => updateFilter('atkMin', val)}
              onMaxChange={(val) => updateFilter('atkMax', val)}
            />
          )}

          {/* DEF Range */}
          {isMonster && (
            <CardStatRangeFilter
              label="DEF"
              minVal={filters.defMin}
              maxVal={filters.defMax}
              onMinChange={(val) => updateFilter('defMin', val)}
              onMaxChange={(val) => updateFilter('defMax', val)}
            />
          )}

          {/* Archetype */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">Arquetipo</label>
            <input
              type="text"
              placeholder="Ej: HERO, Branded..."
              value={filters.archetype}
              onChange={(e) => updateFilter('archetype', e.target.value)}
              className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-bold shadow-xs transition-colors"
            />
          </div>

          {/* Collection Rarity & Status */}
          <CardCollectionFilterFields
            showRarity={showRarity}
            showCollectionOptions={showCollectionOptions}
            rarity={filters.rarity}
            status={filters.status}
            onRarityChange={(val) => updateFilter('rarity', val)}
            onStatusChange={(val) => updateFilter('status', val)}
          />

        </div>
      )}
    </div>
  );
};
