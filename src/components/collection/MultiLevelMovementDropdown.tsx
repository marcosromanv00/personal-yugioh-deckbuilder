'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Sparkles, 
  Box, 
  Layers, 
  Check, 
  Loader2, 
  ArrowRight,
  Shield,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { computeMultiLevelDestinationsForCard, MultiLevelDestination } from '@/lib/collectionSuggestions';
import { useToast } from '@/components/ui/ToastProvider';

interface MultiLevelMovementDropdownProps {
  card: UserCard;
  allUserCards: UserCard[];
  locations: StorageLocation[];
  decks: Deck[];
  onMoveSuccess?: () => void;
  buttonClassName?: string;
}

export const MultiLevelMovementDropdown: React.FC<MultiLevelMovementDropdownProps> = ({
  card,
  allUserCards,
  locations,
  decks,
  onMoveSuccess,
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const destinations = useMemo(() => {
    return computeMultiLevelDestinationsForCard(card, allUserCards, locations, decks);
  }, [card, allUserCards, locations, decks]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectDestination = async (dest: MultiLevelDestination) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: card.id,
          storage_location_id: dest.actionPayload.storage_location_id,
          deck_id: dest.actionPayload.deck_id,
          deck_section: dest.actionPayload.deck_section,
          status_flag: dest.actionPayload.status_flag,
        }),
      });

      if (res.ok) {
        toast.success(`Carta movida a "${dest.targetName}"`);
        setIsOpen(false);
        if (onMoveSuccess) {
          onMoveSuccess();
        }
      } else {
        const json = await res.json();
        toast.error(json.error || 'Error al mover carta');
      }
    } catch (err) {
      console.error('Error al mover carta:', err);
      toast.error('Error de red al aplicar el movimiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [dropDirection, setDropDirection] = useState<'down' | 'up'>('down');

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 320 && spaceAbove > spaceBelow) {
        setDropDirection('up');
      } else {
        setDropDirection('down');
      }
    }
  }, [isOpen]);

  const getLevelBadgeStyles = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 2:
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 3:
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 4:
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${isOpen ? 'z-40' : 'z-10'}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isSubmitting || destinations.length === 0}
        className={
          buttonClassName ||
          `flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50`
        }
        title="Ver sugerencias multinivel de reubicación"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Destinos Sugeridos</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropDirection === 'up' ? -6 : 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropDirection === 'up' ? -6 : 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 sm:right-0 sm:left-auto ${dropDirection === 'up' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'} w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 font-sans`}
          >
            {/* DROPDOWN HEADER */}
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 font-display">
                  Sugerencias Multinivel
                </span>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                {destinations.length} opciones
              </span>
            </div>

            {/* DESTINATIONS LIST */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 divide-y divide-zinc-100 dark:divide-zinc-800/40">
              {destinations.map((dest, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectDestination(dest)}
                  className="p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getLevelBadgeStyles(
                        dest.level
                      )}`}
                    >
                      {dest.levelLabel}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 font-mono">
                      <span>{dest.affinityScore}%</span>
                      <span>afinidad</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: dest.targetColor || '#ef4444' }}
                      />
                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                        {dest.targetName}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                    {dest.rationale}
                  </p>
                </div>
              ))}
            </div>

            {isSubmitting && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span>Reubicando carta...</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
