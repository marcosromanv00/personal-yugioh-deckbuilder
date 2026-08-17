'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StorageLocation, Deck } from '@/types/collection';
import { BookOpen, Box, Shield, Layers, Plus, Pencil, Trash2, Copy, LogOut } from 'lucide-react';

interface StorageContainerCardProps {
  location: StorageLocation;
  decks?: Deck[];
  onClick: (location: StorageLocation) => void;
  onEdit: (location: StorageLocation) => void;
  onCopy: (location: StorageLocation) => void;
  onDelete: (id: string) => void;
  onDropDeck?: (deckId: string, locationId: string | null) => void;
  onDeckClick?: (deck: Deck) => void;
}

export const StorageContainerCard: React.FC<StorageContainerCardProps> = ({
  location,
  decks = [],
  onClick,
  onEdit,
  onCopy,
  onDelete,
  onDropDeck,
  onDeckClick
}) => {
  const occupied = location.occupied_cards || 0;
  const capacity = location.capacity || 1;
  const occupancyPercent = Math.min(100, Math.round((occupied / capacity) * 100));
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDecksExpanded, setIsDecksExpanded] = useState(false);

  // Filtrar los decks almacenados en este contenedor específico
  const storedDecks = decks.filter(d => d.storage_location_id === location.id);

  const getContainerIcon = () => {
    switch (location.type) {
      case 'binder':
        return <BookOpen className="w-8 h-8 text-purple-400" />;
      case 'deckbox':
        return <Shield className="w-8 h-8 text-cyan-400" />;
      case 'tin':
        return <Box className="w-8 h-8 text-amber-400" />;
      case 'box':
      default:
        return <Layers className="w-8 h-8 text-indigo-400" />;
    }
  };

  const getFormatBadge = () => {
    if (location.type === 'binder') {
      const rows = location.grid_layout?.rows || 3;
      const cols = location.grid_layout?.cols || 3;
      return `${rows}x${cols} (${rows * cols} pockets/pág)`;
    } else if (location.type === 'deckbox') {
      return storedDecks.length > 0
        ? storedDecks.map(d => d.name).join(' • ')
        : 'Vacío (Sin Decks)';
    }
    return `${location.capacity} Slots`;
  };

  // Eventos de Drag & Drop para Deckboxes
  const handleDragOver = (e: React.DragEvent) => {
    if (location.type === 'deckbox') {
      e.preventDefault();
    }
  };  const handleDragEnter = () => {
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
      whileHover={{ 
        y: -4,
        borderColor: isDragOver ? '#06b6d4' : (location.color_code || '#dc2626'),
        boxShadow: `0 10px 30px -10px ${location.color_code || '#dc2626'}25`
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(location)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative cursor-pointer group rounded-2xl p-5 border transition-all duration-300 shadow-sm overflow-hidden ${
        isDragOver 
          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 shadow-lg scale-[1.02]' 
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500/50'
      }`}
    >
      {/* Efecto hover premium para drag zone */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-cyan-500 rounded-2xl pointer-events-none animate-pulse" />
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shadow-xs">
            {getContainerIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors">
                {location.name}
              </h3>
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                style={{ backgroundColor: location.color_code || '#dc2626' }} 
                title="Color del contenedor"
              />
            </div>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-md font-mono font-bold mt-1.5 bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              {getFormatBadge()}
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex space-x-1 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(location);
            }}
            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Editar contenedor"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(location);
            }}
            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Duplicar contenedor"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(location.id);
            }}
            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            title="Eliminar contenedor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {location.description && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3.5 line-clamp-2 font-medium">
          {location.description}
        </p>
      )}

      {/* Listado interactivo de decks vinculados */}
      {storedDecks.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsDecksExpanded(!isDecksExpanded)}
            className="flex items-center justify-between w-full text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <span>Decks Almacenados ({storedDecks.length})</span>
            <span className="text-[10px] transition-transform duration-250 select-none" style={{ transform: isDecksExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
          
          {isDecksExpanded && (
            <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1">
              {storedDecks.map(deck => (
                <div 
                  key={deck.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeckClick) {
                      onDeckClick(deck);
                    }
                  }}
                  className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer group/deck"
                  title="Haz clic para ver los detalles y cartas de este deck"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 group-hover/deck:scale-125 transition-transform" />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover/deck:text-red-500 transition-colors truncate">{deck.name}</span>
                    <span className="text-[9px] font-mono font-bold text-zinc-500 shrink-0">({deck.format})</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono font-bold text-red-500 group-hover/deck:underline hidden xs:inline">
                      Ver detalle
                    </span>
                    {/* Botón para sacar del contenedor */}
                    {onDropDeck && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDropDeck(deck.id, null);
                        }}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title="Sacar de este contenedor"
                      >
                        <LogOut className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Barra de Ocupación / Estado de Decks */}
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        {location.type === 'deckbox' ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-mono font-bold text-zinc-500">
              <span>Barajas Guardadas</span>
              <span className="text-red-600 dark:text-red-400 font-bold">{storedDecks.length} deck(s)</span>
            </div>
            {storedDecks.length === 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold italic">
                ⚠️ Sin barajas asignadas
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-[11px] font-mono font-bold text-zinc-500 mb-1">
              <span>Ocupación</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{occupied} / {capacity}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: location.color_code || '#dc2626',
                  width: `${occupancyPercent}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export const AddContainerCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        borderColor: '#dc2626',
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-5 border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300 flex flex-col items-center justify-center min-h-40 group text-center shadow-xs"
    >
      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform mb-2 border border-red-200 dark:border-red-900/40 shadow-xs">
        <Plus className="w-5 h-5" />
      </div>
      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 uppercase tracking-wider">
        Añadir Nuevo Contenedor
      </span>
      <span className="text-xs text-zinc-500 mt-1 font-mono font-medium">
        Binder, Lata, Deckbox o Caja
      </span>
    </motion.div>
  );
};

export const UnclassifiedContainerCard: React.FC<{
  inboxCount: number;
  onClick: () => void;
  onOrganizeClick?: () => void;
}> = ({ inboxCount, onClick, onOrganizeClick }) => {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        borderColor: '#f59e0b',
        boxShadow: '0 10px 30px -10px rgba(245, 158, 11, 0.25)'
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer group rounded-2xl p-5 border transition-all duration-300 shadow-sm overflow-hidden border-amber-300 dark:border-amber-900/50 bg-linear-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/20 dark:via-zinc-900 dark:to-amber-950/10 hover:border-amber-500"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl flex items-center justify-center border border-amber-200 dark:border-amber-900/60 bg-amber-100/70 dark:bg-amber-950/50 shadow-xs text-amber-600 dark:text-amber-400">
            <Box className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">
                Sin Clasificar
              </h3>
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs bg-amber-500" 
                title="Bandeja de entrada (Inbox)"
              />
            </div>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-md font-mono font-bold mt-1.5 bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {inboxCount} {inboxCount === 1 ? 'Carta pendiente' : 'Cartas pendientes'}
            </span>
          </div>
        </div>

        {onOrganizeClick && inboxCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOrganizeClick();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0"
            title="Distribuir automáticamente las cartas del inbox"
          >
            <span>✨</span>
            <span className="hidden sm:inline">Auto</span>
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3.5 line-clamp-2 font-medium">
        Bandeja de entrada para cartas importadas o sueltas pendientes de ser asignadas a un contenedor físico.
      </p>

      {/* Estado visual inferior */}
      <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
          {inboxCount > 0 ? 'Requiere asignación' : 'Bandeja vacía'}
        </span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 group-hover:text-amber-500 transition-colors">
          Abrir visor →
        </span>
      </div>
    </motion.div>
  );
};
