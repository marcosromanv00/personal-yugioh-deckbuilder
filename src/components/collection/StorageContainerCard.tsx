'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StorageLocation, Deck } from '@/types/collection';
import { 
  BookOpen, 
  Box, 
  Shield, 
  Layers, 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  LogOut, 
  ChevronDown,
  Sparkles,
  MapPin
} from 'lucide-react';

interface StorageContainerCardProps {
  location: StorageLocation;
  decks?: Deck[];
  onClick: (location: StorageLocation) => void;
  onEdit: (location: StorageLocation) => void;
  onCopy: (location: StorageLocation) => void;
  onDelete: (id: string) => void;
  onDropDeck?: (deckId: string, locationId: string | null) => void;
  onDeckClick?: (deck: Deck) => void;
  onPrefetch?: (location: StorageLocation) => void;
}

export const getContainerIcon = (type: string, className = "w-5 h-5") => {
  switch (type) {
    case 'binder':
      return <BookOpen className={`${className} text-purple-600 dark:text-purple-400`} />;
    case 'deckbox':
      return <Shield className={`${className} text-cyan-600 dark:text-cyan-400`} />;
    case 'tin':
      return <Box className={`${className} text-amber-600 dark:text-amber-400`} />;
    case 'box':
    default:
      return <Layers className={`${className} text-zinc-700 dark:text-zinc-300`} />;
  }
};

export const getFormatBadge = (location: StorageLocation, storedDecks: Deck[] = []) => {
  if (location.type === 'binder') {
    const rows = location.grid_layout?.rows || 3;
    const cols = location.grid_layout?.cols || 3;
    return `Binder ${rows}x${cols} (${rows * cols} pockets/pág)`;
  } else if (location.type === 'deckbox') {
    return storedDecks.length > 0
      ? `${storedDecks.length} ${storedDecks.length === 1 ? 'baraja' : 'barajas'}`
      : 'Deckbox (Vacío)';
  } else if (location.type === 'tin') {
    return `Lata (${location.capacity || 0} slots)`;
  }
  return `Caja (${location.capacity || 0} slots)`;
};

/**
 * Minimalist StorageContainerCard (Grid View)
 */
export const StorageContainerCard: React.FC<StorageContainerCardProps> = ({
  location,
  decks = [],
  onClick,
  onEdit,
  onCopy,
  onDelete,
  onDropDeck,
  onDeckClick,
  onPrefetch,
}) => {
  const occupied = location.occupied_cards || 0;
  const capacity = location.capacity || 1;
  const occupancyPercent = Math.min(100, Math.round((occupied / capacity) * 100));
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDecksExpanded, setIsDecksExpanded] = useState(false);

  const storedDecks = decks.filter(
    d => d.storage_location_id === location.id || Boolean(location.compartments?.deck_ids?.includes(d.id))
  );

  const handleDragOver = (e: React.DragEvent) => {
    if (location.type === 'deckbox') {
      e.preventDefault();
    }
  };
  const handleDragEnter = () => {
    if (location.type === 'deckbox') {
      setIsDragOver(true);
    }
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (location.type === 'deckbox') {
      e.preventDefault();
      setIsDragOver(false);
      const deckId = e.dataTransfer.getData('text/plain');
      if (deckId && onDropDeck) {
        onDropDeck(deckId, location.id);
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick(location)}
      onMouseEnter={() => onPrefetch?.(location)}
      onFocus={() => onPrefetch?.(location)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative cursor-pointer group rounded-2xl p-4.5 border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${
        isDragOver 
          ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/30 ring-2 ring-cyan-500/30' 
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500/50 hover:shadow-md'
      }`}
    >
      {/* Indicador de Color de Contenedor en borde superior izquierdo */}
      <div 
        className="absolute top-0 left-0 h-1 w-full"
        style={{ backgroundColor: location.color_code || '#dc2626' }}
      />

      <div className="space-y-3">
        {/* Cabecera: Icono, Nombre, Badge y Acciones */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 shrink-0">
              {getContainerIcon(location.type, "w-5 h-5")}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors truncate font-display">
                {location.name}
              </h3>
              <span className="inline-block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {getFormatBadge(location, storedDecks)}
              </span>
            </div>
          </div>

          {/* Acciones discretas al pasar el cursor */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(location);
              }}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Editar contenedor"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(location);
              }}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Duplicar contenedor"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(location.id);
              }}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="Eliminar contenedor"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Descripción / Ubicación física (si existe) */}
        {location.description && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1">
            <MapPin className="w-3 h-3 shrink-0 text-zinc-400" />
            <span className="truncate">{location.description}</span>
          </div>
        )}

        {/* Chips de Decks Almacenados */}
        {storedDecks.length > 0 && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Decks ({storedDecks.length})
              </span>
              {storedDecks.length > 2 && (
                <button
                  type="button"
                  onClick={() => setIsDecksExpanded(!isDecksExpanded)}
                  className="text-[9px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isDecksExpanded ? 'Menos' : `+${storedDecks.length - 2} más`}</span>
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isDecksExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(isDecksExpanded ? storedDecks : storedDecks.slice(0, 2)).map(deck => (
                <div
                  key={deck.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeckClick) onDeckClick(deck);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-800 dark:text-zinc-200 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer group/chip truncate max-w-full"
                  title="Clic para ver detalles del deck"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="truncate">{deck.name}</span>
                  {onDropDeck && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDropDeck(deck.id, null);
                      }}
                      className="p-0.5 ml-0.5 text-zinc-400 hover:text-amber-500 transition-colors"
                      title="Sacar deck del contenedor"
                    >
                      <LogOut className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra de Ocupación Minimalista Integrada */}
      <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
        {location.type === 'deckbox' ? (
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500 dark:text-zinc-400 font-bold">Estado</span>
            <span className={`font-bold ${storedDecks.length > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {storedDecks.length > 0 ? `${storedDecks.length} deck(s) asignados` : '⚠️ Sin barajas'}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500 dark:text-zinc-400 font-bold">
                {occupied} / {capacity} slots
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {occupancyPercent}%
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  backgroundColor: location.color_code || '#dc2626',
                  width: `${occupancyPercent}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Minimalist StorageContainerListRow (List View)
 */
export const StorageContainerListRow: React.FC<StorageContainerCardProps> = ({
  location,
  decks = [],
  onClick,
  onEdit,
  onCopy,
  onDelete,
  onDeckClick,
  onPrefetch,
}) => {
  const occupied = location.occupied_cards || 0;
  const capacity = location.capacity || 1;
  const occupancyPercent = Math.min(100, Math.round((occupied / capacity) * 100));

  const storedDecks = decks.filter(
    d => d.storage_location_id === location.id || Boolean(location.compartments?.deck_ids?.includes(d.id))
  );

  return (
    <div
      onClick={() => onClick(location)}
      onMouseEnter={() => onPrefetch?.(location)}
      onFocus={() => onPrefetch?.(location)}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:shadow-xs transition-all cursor-pointer"
    >
      {/* Columna Izquierda: Icono + Nombre + Badge */}
      <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
        <div 
          className="w-1 h-8 rounded-full shrink-0"
          style={{ backgroundColor: location.color_code || '#dc2626' }}
        />
        <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 shrink-0">
          {getContainerIcon(location.type, "w-4 h-4")}
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors truncate font-display">
            {location.name}
          </h4>
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block truncate">
            {getFormatBadge(location, storedDecks)}
          </span>
        </div>
      </div>

      {/* Columna Central: Ocupación + Ubicación o Decks */}
      <div className="flex items-center gap-4 flex-1 min-w-0 px-1 sm:px-4">
        {location.type === 'deckbox' ? (
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {storedDecks.length > 0 ? (
              storedDecks.slice(0, 3).map(d => (
                <span
                  key={d.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeckClick) onDeckClick(d);
                  }}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-red-500 truncate max-w-32"
                >
                  {d.name}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 italic">
                Sin barajas asignadas
              </span>
            )}
            {storedDecks.length > 3 && (
              <span className="text-[10px] font-mono text-zinc-400">+{storedDecks.length - 3}</span>
            )}
          </div>
        ) : (
          <div className="w-full max-w-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>{occupied} / {capacity} slots</span>
              <span>{occupancyPercent}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  backgroundColor: location.color_code || '#dc2626',
                  width: `${occupancyPercent}%`,
                }}
              />
            </div>
          </div>
        )}

        {location.description && (
          <span className="hidden md:inline-block text-[11px] font-mono text-zinc-400 truncate max-w-36">
            📍 {location.description}
          </span>
        )}
      </div>

      {/* Columna Derecha: Acciones */}
      <div className="flex items-center gap-1 shrink-0 justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(location);
          }}
          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          title="Editar contenedor"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(location);
          }}
          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          title="Duplicar contenedor"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(location.id);
          }}
          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          title="Eliminar contenedor"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Minimalist Unclassified / Inbox Container Card
 */
export const UnclassifiedContainerCard: React.FC<{
  inboxCount: number;
  onClick: () => void;
  onOrganizeClick?: () => void;
  viewMode?: 'grid' | 'list';
}> = ({ inboxCount, onClick, onOrganizeClick, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/50 hover:border-amber-500 transition-all cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-8 rounded-full bg-amber-500 shrink-0" />
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-display">
              Sin Clasificar (Inbox)
            </h4>
            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
              {inboxCount} {inboxCount === 1 ? 'carta pendiente' : 'cartas pendientes'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOrganizeClick && inboxCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOrganizeClick();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Organizar</span>
            </button>
          )}
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="relative cursor-pointer group rounded-2xl p-4.5 border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden border-amber-300 dark:border-amber-900/50 bg-linear-to-br from-amber-50/60 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-zinc-900 dark:to-amber-950/10 hover:border-amber-500"
    >
      <div className="absolute top-0 left-0 h-1 w-full bg-amber-500" />

      <div className="space-y-3 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-display">
                Sin Clasificar
              </h3>
              <span className="inline-block text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                {inboxCount} {inboxCount === 1 ? 'carta pendiente' : 'cartas pendientes'}
              </span>
            </div>
          </div>

          {onOrganizeClick && inboxCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOrganizeClick();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Organizar automáticamente las cartas del inbox"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto</span>
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 font-medium">
          Bandeja de entrada para cartas pendientes de asignar a un contenedor físico.
        </p>
      </div>

      <div className="mt-4 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-[11px] font-mono">
        <span className="text-amber-700 dark:text-amber-400 font-bold">
          {inboxCount > 0 ? 'Requiere asignación' : 'Bandeja vacía'}
        </span>
        <span className="text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-bold transition-colors">
          Abrir visor →
        </span>
      </div>
    </motion.div>
  );
};

/**
 * Minimalist Add Container Card
 */
export const AddContainerCard: React.FC<{ onClick: () => void; viewMode?: 'grid' | 'list' }> = ({ onClick, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-red-500 hover:bg-red-50/20 dark:hover:bg-red-950/20 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Añadir Nuevo Contenedor</span>
      </button>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-4.5 border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:border-red-500 hover:bg-white dark:hover:bg-zinc-900 transition-all flex flex-col items-center justify-center min-h-36 group text-center shadow-xs"
    >
      <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform mb-2 border border-red-200 dark:border-red-900/40 shadow-xs">
        <Plus className="w-4 h-4" />
      </div>
      <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 uppercase tracking-wider font-display">
        Añadir Contenedor
      </span>
      <span className="text-[10px] text-zinc-500 mt-0.5 font-mono">
        Binder, Deckbox, Caja o Lata
      </span>
    </motion.div>
  );
};
