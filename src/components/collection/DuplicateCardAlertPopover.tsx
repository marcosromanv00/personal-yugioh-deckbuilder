'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Box, BookOpen, Layers, Swords, X, ArrowRightLeft } from 'lucide-react';
import { DuplicateMatchInfo } from '@/lib/collectionSuggestions';

interface DuplicateCardAlertPopoverProps {
  matchInfo?: DuplicateMatchInfo;
  onOpenConsolidate?: (cardId: number) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const DuplicateCardAlertPopover: React.FC<DuplicateCardAlertPopoverProps> = ({
  matchInfo,
  onOpenConsolidate,
  className = '',
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!matchInfo || !matchInfo.hasDuplicatesInOtherContainers) {
    return null;
  }

  const isSmall = size === 'sm';

  return (
    <div 
      ref={popoverRef}
      className={`relative z-20 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Botón / Badge del Triángulo Amarillo */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(p => !p);
        }}
        title={`⚠️ Esta carta tiene ${matchInfo.totalCopies}x copias repartidas en ${matchInfo.locationsCount} ubicaciones diferentes.`}
        className={`flex items-center gap-0.5 rounded shadow-lg cursor-pointer transition-all border ${
          isOpen
            ? 'bg-amber-500 text-zinc-950 border-amber-300 ring-2 ring-amber-400/60 font-black'
            : 'bg-amber-950/95 hover:bg-amber-900 text-amber-300 border-amber-500/80 hover:border-amber-400'
        } ${isSmall ? 'p-1 text-[8px]' : 'px-1.5 py-0.5 text-[9px]'}`}
      >
        <AlertTriangle className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0 fill-amber-400/20`} />
        <span className="font-mono font-black">{matchInfo.locationsCount}x</span>
      </motion.button>

      {/* Popover Flotante de Desglose de Ubicaciones */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 bg-zinc-950/98 backdrop-blur-md border border-amber-500/50 rounded-2xl p-3 shadow-2xl z-50 text-zinc-100 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Popover */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-amber-300 truncate font-display">
                    Coincidencias ({matchInfo.totalCopies}x)
                  </h4>
                  <p className="text-[9px] text-zinc-400 truncate">
                    Repartida en {matchInfo.locationsCount} contenedores
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lista de Ubicaciones y Cantidades */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {matchInfo.locations.map((loc, idx) => {
                const isBinder = loc.location_type === 'binder';
                const isDeck = loc.is_deck;
                const isInbox = loc.is_inbox;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: loc.color_code ? `${loc.color_code}25` : '#27272a',
                          borderColor: loc.color_code || '#3f3f46',
                        }}
                      >
                        {isInbox ? (
                          <Layers className="w-3 h-3 text-amber-400" />
                        ) : isDeck ? (
                          <Swords className="w-3 h-3 text-purple-400" />
                        ) : isBinder ? (
                          <BookOpen className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Box className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <span className="font-bold text-zinc-200 truncate">
                        {loc.location_name}
                      </span>
                    </div>

                    <span className="font-mono font-black text-amber-400 text-xs shrink-0 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                      {loc.quantity}x
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Acción de Consolidación Rápida */}
            {onOpenConsolidate && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenConsolidate(matchInfo.card_id);
                  }}
                  className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-950 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Consolidar / Mover Copias</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
