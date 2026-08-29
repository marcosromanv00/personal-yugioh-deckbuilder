'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  RotateCcw, 
  Box, 
  Plus, 
  Sparkles, 
  Filter, 
  LayoutGrid, 
  List, 
  X,
  Layers
} from 'lucide-react';
import { StorageLocation, Deck } from '@/types/collection';
import { 
  StorageContainerCard, 
  StorageContainerListRow, 
  AddContainerCard, 
  UnclassifiedContainerCard 
} from '../StorageContainerCard';
import { 
  ContainerFilterPopover, 
  ContainerTypeFilter, 
  ContainerStatusFilter, 
  ContainerSortOption 
} from './ContainerFilterPopover';
import { ContainersTabSkeleton } from './ContainersTabSkeleton';

interface ContainersTabProps {
  loading: boolean;
  locations: StorageLocation[];
  decks: Deck[];
  inboxCount: number;
  handleOpenContainer: (loc: StorageLocation) => void;
  handleOpenInbox: () => void;
  handleOrganizeInbox?: () => void;
  handleEditContainerClick: (loc: StorageLocation) => void;
  handleCopyStorage: (loc: StorageLocation) => Promise<void>;
  handleDeleteStorage: (id: string) => Promise<void>;
  handleDropDeck: (deckId: string, locationId: string | null) => Promise<void>;
  handleNewContainerClick: () => void;
  onDeckClick?: (deck: Deck) => void;
  onRefreshData?: () => Promise<void> | void;
}

export const ContainersTab: React.FC<ContainersTabProps> = ({
  loading,
  locations,
  decks,
  inboxCount,
  handleOpenContainer,
  handleOpenInbox,
  handleOrganizeInbox,
  handleEditContainerClick,
  handleCopyStorage,
  handleDeleteStorage,
  handleDropDeck,
  handleNewContainerClick,
  onDeckClick,
  onRefreshData,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Persistencia de modo de vista
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('exordio_containers_view_mode');
      if (saved === 'grid' || saved === 'list') {
        setViewMode(saved);
      }
    } catch {
      // Ignorar errores de acceso a localStorage en SSR
    }
  }, []);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('exordio_containers_view_mode', mode);
    } catch {
      // noop
    }
  };

  // Estados de Filtrado y Ordenación
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ContainerTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ContainerStatusFilter>('all');
  const [sortBy, setSortBy] = useState<ContainerSortOption>('name');

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (sortBy !== 'name') count++;
    return count;
  }, [typeFilter, statusFilter, sortBy]);

  const handleResetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSortBy('name');
  };

  // Filtrado y Ordenación en Tiempo Real
  const filteredAndSortedLocations = useMemo(() => {
    let result = [...locations];

    // 1. Filtro por Tipo
    if (typeFilter !== 'all') {
      result = result.filter(loc => loc.type === typeFilter);
    }

    // 2. Filtro por Estado
    if (statusFilter !== 'all') {
      result = result.filter(loc => {
        const occupied = loc.occupied_cards || 0;
        const capacity = loc.capacity || 1;
        const storedDecksCount = decks.filter(
          d => d.storage_location_id === loc.id || Boolean(loc.compartments?.deck_ids?.includes(d.id))
        ).length;

        if (statusFilter === 'has_space') return occupied < capacity;
        if (statusFilter === 'full') return occupied >= capacity;
        if (statusFilter === 'empty') return occupied === 0 && storedDecksCount === 0;
        if (statusFilter === 'with_decks') return storedDecksCount > 0;
        return true;
      });
    }

    // 3. Ordenación
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'capacity_desc') {
        return (b.capacity || 0) - (a.capacity || 0);
      }
      if (sortBy === 'occupancy_desc') {
        const percentA = ((a.occupied_cards || 0) / (a.capacity || 1));
        const percentB = ((b.occupied_cards || 0) / (b.capacity || 1));
        return percentB - percentA;
      }
      if (sortBy === 'occupancy_asc') {
        const percentA = ((a.occupied_cards || 0) / (a.capacity || 1));
        const percentB = ((b.occupied_cards || 0) / (b.capacity || 1));
        return percentA - percentB;
      }
      return 0;
    });

    return result;
  }, [locations, decks, typeFilter, statusFilter, sortBy]);

  const totalOccupiedCards = useMemo(() => {
    return locations.reduce((sum, loc) => sum + (loc.occupied_cards || 0), 0);
  }, [locations]);

  const totalCapacity = useMemo(() => {
    return locations.reduce((sum, loc) => sum + (loc.capacity || 0), 0);
  }, [locations]);

  const handleRefreshClick = async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <ContainersTabSkeleton viewMode={viewMode} />;
  }

  const showInboxCard = typeFilter === 'all' || typeFilter === 'box';

  return (
    <div className="space-y-6">
      {/* ═══ BARRA SUPERIOR DE HERRAMIENTAS ERGONÓMICA ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
        
        {/* Cabecera & Estadísticas */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 font-display uppercase tracking-wider">
                Mis Contenedores
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                {filteredAndSortedLocations.length + (showInboxCard ? 1 : 0)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
              {totalOccupiedCards} cartas • Capacidad: {totalCapacity} slots {inboxCount > 0 && `• ${inboxCount} en Inbox`}
            </p>
          </div>
        </div>

        {/* ═══ BOTONERA UTILITARIA EN ORDEN SOLICITADO ═══
            [Grid/List] -> Organizar -> Filtros -> Refrescar -> + Nuevo
        */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          
          {/* Alternador de Vista (Cuadrícula / Lista) */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Vista en cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Vista en lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Botón "Organizar" (Smart Organize / Inbox) */}
          {handleOrganizeInbox && (
            <button
              type="button"
              onClick={handleOrganizeInbox}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-10 touch-manipulation border ${
                inboxCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-300 dark:border-amber-900/50 text-amber-700 dark:text-amber-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200'
              }`}
              title="Organización inteligente y distribución de cartas"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Organizar</span>
            </button>
          )}

          {/* 2. Botón "Filtro" (con Popover Flotante) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-10 touch-manipulation border ${
                activeFiltersCount > 0 || isFilterOpen
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-900/50'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200'
              }`}
              title="Filtrar y ordenar contenedores"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Filtrar</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Popover Flotante de Filtros */}
            <ContainerFilterPopover
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onResetFilters={handleResetFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>

          {/* 3. Botón "Refrescar" */}
          {onRefreshData && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefreshClick}
              className="flex items-center justify-center p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold transition-all cursor-pointer min-h-10 min-w-10 touch-manipulation active:scale-95"
              title="Refrescar estado de contenedores"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600 dark:text-red-400' : ''}`} />
            </button>
          )}

          {/* 4. Botón "+ Nuevo" (Primario Carmesí) */}
          <button
            type="button"
            onClick={handleNewContainerClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/20 transition-all cursor-pointer min-h-10 touch-manipulation"
            title="Crear un nuevo contenedor físico"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Píldoras de Filtros Activos (si aplica) */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <span className="text-zinc-400 font-mono text-[10px] uppercase font-bold">Filtros activos:</span>
          {typeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-mono text-[11px] font-bold">
              Tipo: {typeFilter}
              <button onClick={() => setTypeFilter('all')} className="hover:text-red-800">×</button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] font-bold">
              Estado: {statusFilter}
              <button onClick={() => setStatusFilter('all')} className="hover:text-zinc-500">×</button>
            </span>
          )}
          {sortBy !== 'name' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] font-bold">
              Orden: {sortBy}
              <button onClick={() => setSortBy('name')} className="hover:text-zinc-500">×</button>
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400 underline font-mono text-[10px] ml-auto cursor-pointer"
          >
            Limpiar todos
          </button>
        </div>
      )}

      {/* ═══ RENDER DE CONTENEDORES (GRID O LISTA) ═══ */}
      {filteredAndSortedLocations.length === 0 && !showInboxCard ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <Layers className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-display">
            No se encontraron contenedores
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto font-medium">
            Ningún contenedor coincide con los filtros aplicados.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-500 shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* 1. Posición fija para Slot Sin Clasificar (Inbox) */}
          {showInboxCard && (
            <UnclassifiedContainerCard
              inboxCount={inboxCount}
              onClick={handleOpenInbox}
              onOrganizeClick={handleOrganizeInbox}
              viewMode="grid"
            />
          )}

          {/* 2. Contenedores del usuario */}
          {filteredAndSortedLocations.map((loc) => (
            <StorageContainerCard
              key={loc.id}
              location={loc}
              decks={decks}
              onClick={handleOpenContainer}
              onEdit={handleEditContainerClick}
              onCopy={handleCopyStorage}
              onDelete={handleDeleteStorage}
              onDropDeck={handleDropDeck}
              onDeckClick={onDeckClick}
            />
          ))}

          {/* 3. Slot para crear nuevo contenedor */}
          <AddContainerCard onClick={handleNewContainerClick} viewMode="grid" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Slot Inbox en Vista Lista */}
          {showInboxCard && (
            <UnclassifiedContainerCard
              inboxCount={inboxCount}
              onClick={handleOpenInbox}
              onOrganizeClick={handleOrganizeInbox}
              viewMode="list"
            />
          )}

          {/* Filas de Contenedores en Vista Lista */}
          {filteredAndSortedLocations.map((loc) => (
            <StorageContainerListRow
              key={loc.id}
              location={loc}
              decks={decks}
              onClick={handleOpenContainer}
              onEdit={handleEditContainerClick}
              onCopy={handleCopyStorage}
              onDelete={handleDeleteStorage}
              onDropDeck={handleDropDeck}
              onDeckClick={onDeckClick}
            />
          ))}

          {/* Slot Crear en Vista Lista */}
          <AddContainerCard onClick={handleNewContainerClick} viewMode="list" />
        </div>
      )}
    </div>
  );
};
