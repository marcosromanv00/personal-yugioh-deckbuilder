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
}

export const StorageContainerCard: React.FC<StorageContainerCardProps> = ({
  location,
  decks = [],
  onClick,
  onEdit,
  onCopy,
  onDelete,
  onDropDeck
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
        borderColor: isDragOver ? '#06b6d4' : (location.color_code || 'hsl(224, 15%, 25%)'),
        boxShadow: `0 10px 30px -10px ${location.color_code || '#8b5cf6'}25`
      }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(location)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative cursor-pointer group rounded-2xl p-5 border transition-all duration-300 shadow-md shadow-black/25 overflow-hidden ${
        isDragOver 
          ? 'border-cyan-400 bg-cyan-950/20 shadow-cyan-950/40 shadow-lg scale-[1.02]' 
          : 'border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/70 hover:bg-[hsl(224,22%,10%)]/95'
      }`}
    >
      {/* Efecto hover premium para drag zone */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-cyan-400/60 rounded-2xl pointer-events-none animate-pulse" />
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl flex items-center justify-center border border-[hsl(224,15%,16%)] bg-[hsl(224,25%,6%)]">
            {getContainerIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-slate-100 group-hover:text-purple-300 transition-colors">
                {location.name}
              </h3>
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: location.color_code || '#8b5cf6' }} 
                title="Color del contenedor"
              />
            </div>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-md font-mono mt-1.5 bg-slate-950/60 text-slate-400 border border-slate-850">
              {getFormatBadge()}
            </span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(location);
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-450 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Editar contenedor"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(location);
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-455 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Duplicar contenedor"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(location.id);
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-455 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/40 transition-colors"
            title="Eliminar contenedor"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {location.description && (
        <p className="text-xs text-slate-400 mt-3.5 line-clamp-2">
          {location.description}
        </p>
      )}

      {/* Listado interactivo de decks vinculados */}
      {storedDecks.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-[hsl(224,15%,16%)]/40" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsDecksExpanded(!isDecksExpanded)}
            className="flex items-center justify-between w-full text-[10px] font-mono text-slate-500 hover:text-slate-350 transition-colors uppercase tracking-wider cursor-pointer"
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
                  className="flex items-center justify-between text-xs bg-slate-950/65 p-2 rounded-lg border border-slate-850 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{deck.name}</span>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">({deck.format})</span>
                  </div>
                  
                  {/* Botón para sacar del contenedor */}
                  {onDropDeck && (
                    <button
                      type="button"
                      onClick={() => onDropDeck(deck.id, null)}
                      className="p-1 rounded hover:bg-slate-900 text-slate-550 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                      title="Sacar de este contenedor"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Barra de Ocupación / Estado de Decks */}
      <div className="mt-4 pt-3 border-t border-[hsl(224,15%,16%)]">
        {location.type === 'deckbox' ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
              <span>Barajas Guardadas</span>
              <span className="text-cyan-400 font-semibold">{storedDecks.length} deck(s)</span>
            </div>
            {storedDecks.length === 0 && (
              <span className="text-[10px] text-amber-500 font-mono italic">
                ⚠️ Sin barajas asignadas
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mb-1">
              <span>Ocupación</span>
              <span className="text-slate-200 font-semibold">{occupied} / {capacity}</span>
            </div>
            <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-slate-900">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: location.color_code || '#8b5cf6',
                  width: `${occupancyPercent}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </>
        )}
      </div>    </motion.div>
  );
};

export const AddContainerCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.03)'
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-5 border border-dashed border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/20 transition-all duration-300 flex flex-col items-center justify-center min-h-40 group text-center"
    >
      <div className="p-3 rounded-xl bg-purple-900/10 text-purple-400 group-hover:scale-110 transition-transform mb-2 border border-purple-900/20">
        <Plus className="w-5 h-5" />
      </div>
      <span className="text-sm font-medium text-slate-350 group-hover:text-purple-300">
        Añadir Nuevo Contenedor
      </span>
      <span className="text-xs text-slate-500 mt-1 font-mono">
        Binder, Lata, Deckbox o Caja
      </span>
    </motion.div>
  );
};
