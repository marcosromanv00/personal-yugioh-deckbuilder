import React, { useState, useMemo } from 'react';
import { RefreshCw, RotateCcw, Box, Plus, Sparkles, Inbox, Layers } from 'lucide-react';
import { StorageLocation, Deck } from '@/types/collection';
import { StorageContainerCard, AddContainerCard, UnclassifiedContainerCard } from '../StorageContainerCard';

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

/**
 * ContainersTab Component
 * Renders the dashboard view with all user-defined physical card containers (Binders, Boxes, etc)
 * along with a fixed Unclassified Inbox card in the first position and a top toolbar with refresh action.
 */
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
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-red-500 animate-spin mb-2" />
        <p className="text-xs font-mono text-zinc-500">Cargando contenedores y almacenamiento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ BARRA SUPERIOR DE HERRAMIENTAS Y REFRESCO DE CONTENEDORES ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 font-display uppercase tracking-wider">
                Mis Contenedores
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                {locations.length + 1}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
              {totalOccupiedCards} cartas en contenedores • Capacidad: {totalCapacity} slots {inboxCount > 0 && `• ${inboxCount} en Inbox`}
            </p>
          </div>
        </div>

        {/* ACCIONES Y BOTÓN REFRESCAR */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onRefreshData && (
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefreshClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400 text-xs font-bold transition-all cursor-pointer min-h-10 touch-manipulation active:scale-95"
              title="Refrescar estado de contenedores"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600 dark:text-red-400' : ''}`} />
              <span>Refrescar</span>
            </button>
          )}

          {handleOrganizeInbox && inboxCount > 0 && (
            <button
              type="button"
              onClick={handleOrganizeInbox}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer min-h-10 touch-manipulation"
              title="Organización inteligente del Inbox"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Organizar Inbox</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNewContainerClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer min-h-10 touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* ═══ GRID DE CONTENEDORES ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1. Posición fija para Slot Sin Clasificar (Inbox) */}
        <UnclassifiedContainerCard
          inboxCount={inboxCount}
          onClick={handleOpenInbox}
          onOrganizeClick={handleOrganizeInbox}
        />

        {/* 2. Contenedores del usuario (Binders, Latas, Cajas, Deckboxes) */}
        {locations.map((loc) => (
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
        <AddContainerCard onClick={handleNewContainerClick} />
      </div>
    </div>
  );
};

