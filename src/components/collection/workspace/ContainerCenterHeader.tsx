'use client';

import React, { useMemo } from 'react';
import { Search, Layers, Box, Swords, CheckCircle2, Tag, Package, Settings, ArrowUpDown, CheckSquare, CheckCheck, X } from 'lucide-react';
import { StorageLocation, UserCard } from '@/types/collection';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';
import { DeckInContainer } from './types';

interface ContainerCenterHeaderProps {
  containerSearch: string;
  setContainerSearch: (s: string) => void;
  location: StorageLocation | null;
  currentLocation: StorageLocation | null;
  cards: UserCard[];
  totalPhysicalCards: number;
  activeCompartment: number;
  handleSelectCompartment: (idx: number) => void;
  setActiveClusterFilter: (f: string | null) => void;
  decksInContainer: DeckInContainer[];
  decksInActiveLane: DeckInContainer[];
  selectedDeckFilter: string;
  setSelectedDeckFilter: (f: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  displayedGridCardsCount: number;
  filteredCards: UserCard[];
  onOpenAssignDeckModal: () => void;
  isSelectMode?: boolean;
  setIsSelectMode?: (mode: boolean | ((prev: boolean) => boolean)) => void;
  selectedCardIds?: string[];
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export const ContainerCenterHeader: React.FC<ContainerCenterHeaderProps> = ({
  containerSearch,
  setContainerSearch,
  location,
  currentLocation,
  cards,
  totalPhysicalCards,
  activeCompartment,
  handleSelectCompartment,
  setActiveClusterFilter,
  decksInContainer,
  decksInActiveLane,
  selectedDeckFilter,
  setSelectedDeckFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  displayedGridCardsCount,
  filteredCards,
  onOpenAssignDeckModal,
  isSelectMode = false,
  setIsSelectMode,
  selectedCardIds = [],
  onSelectAll,
  onClearSelection,
}) => {
  const loc = currentLocation || location;
  const selectedCount = selectedCardIds.length;

  // Dropdown de carriles cuando hay > 5
  const carrilDropdownOptions = useMemo<DropdownOption<number>[]>(() => {
    if (!loc?.compartments) return [];
    const opts: DropdownOption<number>[] = [
      {
        value: -1,
        label: 'Todos los carriles',
        badge: totalPhysicalCards,
        icon: <Layers className="w-3.5 h-3.5 text-purple-500" />
      }
    ];
    loc.compartments.names.forEach((compName, idx) => {
      const compCount = cards.filter(c => (c.compartment_index || 0) === idx).reduce((sum, c) => sum + (c.quantity || 1), 0);
      const laneDecks = decksInContainer.filter(d => d.compartments.has(idx));
      const deckSummary = laneDecks.length > 0 ? `${laneDecks.length} mazo(s): ${laneDecks.map(d => d.name).join(', ')}` : undefined;
      opts.push({
        value: idx,
        label: compName || `Carril ${idx + 1}`,
        badge: compCount,
        description: deckSummary,
        icon: <Box className="w-3.5 h-3.5 text-purple-400" />
      });
    });
    return opts;
  }, [loc, totalPhysicalCards, cards, decksInContainer]);

  // Opciones para el filtro de mazos
  const deckFilterOptions = useMemo<DropdownOption<string>[]>(() => {
    const opts: DropdownOption<string>[] = [
      {
        value: 'all',
        label: activeCompartment === -1 ? 'Todos los mazos' : 'Mazos en este carril',
        badge: activeCompartment === -1 ? decksInContainer.length : decksInActiveLane.length,
        icon: <Swords className="w-3.5 h-3.5 text-red-500" />
      }
    ];
    decksInActiveLane.forEach(d => {
      opts.push({
        value: d.id,
        label: d.name,
        badge: `${d.countInContainer}`,
        icon: <Swords className="w-3.5 h-3.5 text-amber-500" />,
        description: `${d.countInContainer} de ${d.totalCards} cartas físicas`
      });
    });
    opts.push({
      value: 'unassigned',
      label: 'Sin mazo (Cartas sueltas)',
      icon: <Package className="w-3.5 h-3.5 text-zinc-400" />
    });
    return opts;
  }, [activeCompartment, decksInContainer, decksInActiveLane]);

  // Opciones para el filtro de estado
  const statusFilterOptions: DropdownOption<string>[] = useMemo(() => [
    { value: 'all', label: 'Todos los estados' },
    { value: 'collection', label: 'En Colección', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
    { value: 'trade_sale', label: 'Venta / Trade', icon: <Tag className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'bulk', label: 'Bulk (Sobrantes)', icon: <Package className="w-3.5 h-3.5 text-zinc-400" /> },
    { value: 'workshop', label: 'Taller / Activo', icon: <Settings className="w-3.5 h-3.5 text-purple-500" /> },
  ], []);

  // Opciones para el filtro de ordenamiento
  const sortOptions: DropdownOption<string>[] = useMemo(() => [
    { value: 'registration_asc', label: 'Registro (1º → N)', icon: <ArrowUpDown className="w-3.5 h-3.5 text-red-500" /> },
    { value: 'registration_desc', label: 'Recientes primero', icon: <ArrowUpDown className="w-3.5 h-3.5 text-red-500" /> },
    { value: 'name_asc', label: 'Nombre (A → Z)' },
    { value: 'name_desc', label: 'Nombre (Z → A)' },
    { value: 'id_asc', label: 'Passcode ID (0 → 9)' },
    { value: 'type', label: 'Tipo de Carta' },
  ], []);

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 relative z-30 overflow-visible">
      {/* Fila 1: Buscador y Selector de Carriles */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/60 flex-wrap sm:flex-nowrap relative z-30 overflow-visible">
        {/* Buscador dentro del contenedor */}
        <div className="flex items-center gap-2 flex-1 min-w-36 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={containerSearch}
              onChange={(e) => setContainerSearch(e.target.value)}
              placeholder="Filtrar cartas..."
              className="w-full pl-8.5 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Botón de Modo Selección */}
          {setIsSelectMode && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsSelectMode(p => !p)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 select-none ${
                  isSelectMode
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                }`}
                title={isSelectMode ? 'Desactivar modo selección' : 'Activar selección múltiple de cartas'}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Selección</span>
                {selectedCount > 0 && (
                  <span className="text-[10px] bg-red-950 text-white px-1.5 py-0.2 rounded-full font-bold">
                    {selectedCount}
                  </span>
                )}
              </button>

              {isSelectMode && (
                <>
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-mono transition-colors cursor-pointer"
                    title="Seleccionar todas las cartas visibles"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-red-500" />
                  </button>
                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={onClearSelection}
                      className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-mono transition-colors cursor-pointer"
                      title="Deseleccionar todas"
                    >
                      <X className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Selector de Carriles en Dropdown y Botón de Gestión de Mazos */}
        {loc?.compartments && loc.compartments.count > 1 ? (
          <div className="flex items-center gap-2 shrink-0">
            <PremiumDropdown
              options={carrilDropdownOptions}
              value={activeCompartment}
              onChange={(val) => {
                handleSelectCompartment(val);
                setActiveClusterFilter(null);
              }}
              icon={<Layers className="w-3.5 h-3.5 text-red-500" />}
              menuWidth="w-64"
              size="sm"
            />

            {/* Botón de Gestión de Mazos y Carriles */}
            <button
              type="button"
              onClick={onOpenAssignDeckModal}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 select-none group"
              title="Ver y gestionar los mazos distribuidos en esta caja"
            >
              <Swords className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
              <span>Mazos ({decksInContainer.length})</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Fila 2: Filtros Secundarios (Mazo, Estado, Orden) */}
      <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-xs relative z-20 overflow-visible flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 shrink-0">
          {/* Filtro por Mazo específico dentro del contenedor/carril */}
          {decksInContainer.length > 0 && (
            <PremiumDropdown
              options={deckFilterOptions}
              value={selectedDeckFilter}
              onChange={(val) => setSelectedDeckFilter(val)}
              icon={<Swords className="w-3.5 h-3.5 text-red-500" />}
              menuWidth="w-64"
              size="sm"
            />
          )}

          {/* Filtro de Estado */}
          <PremiumDropdown
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            size="sm"
            menuWidth="w-48"
          />

          {/* Filtro de Orden */}
          <PremiumDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-red-500" />}
            menuWidth="w-56"
            size="sm"
          />
        </div>

        {/* Resumen de cartas mostradas */}
        <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0 hidden sm:block">
          Mostrando <strong>{displayedGridCardsCount}</strong> {displayedGridCardsCount === 1 ? 'tipo único' : 'tipos únicos'} ({filteredCards.reduce((sum, c) => sum + (c.quantity || 1), 0)} cartas físicas)
        </div>
      </div>
    </div>
  );
};
