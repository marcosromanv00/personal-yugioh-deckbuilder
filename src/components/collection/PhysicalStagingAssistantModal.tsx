'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle2, ArrowRight, Sparkles, Layers, Box, Loader2, 
  Check, Search, Filter, HelpCircle, ShieldAlert, ArrowUpRight 
} from 'lucide-react';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { useToast } from '@/components/ui/ToastProvider';
import { MovedCardInfo } from '@/types/collection';

interface PhysicalStagingAssistantModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PhysicalStagingAssistantModal({ isOpen: propIsOpen, onClose: propOnClose }: PhysicalStagingAssistantModalProps = {}) {
  const { syncData, isAssistantModalOpen, closeAssistantModal } = useIdealEnvironment();
  const toast = useToast();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isAssistantModalOpen;
  const handleClose = propOnClose || closeAssistantModal;

  const [activeStage, setActiveStage] = useState<'binders' | 'decks' | 'bulk'>('binders');
  const [isApplying, setIsApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedCards, setCheckedCards] = useState<Record<string, boolean>>({});
  const [completedStages, setCompletedStages] = useState<Record<string, boolean>>({});

  // ─── EXTRAER CARTAS POR ETAPA ───
  const stageData = useMemo(() => {
    if (!syncData) return { binderCards: [], deckCards: [], bulkCards: [] };

    const binderCards: MovedCardInfo[] = [];
    const deckCards: MovedCardInfo[] = [];
    const bulkCards: MovedCardInfo[] = [];

    syncData.logs.forEach(log => {
      if (log.category === 'card_promoted' && log.moved_cards) {
        binderCards.push(...log.moved_cards);
      } else if (log.category === 'bulk_sorted' && log.moved_cards) {
        bulkCards.push(...log.moved_cards);
      }
    });

    // Decks cards from idealDecks
    syncData.idealDecks.forEach(deck => {
      (deck.cards || []).slice(0, 15).forEach(dc => {
        deckCards.push({
          card_id: dc.card_id,
          name: dc.card_details?.name || `Carta #${dc.card_id}`,
          image_url: dc.card_details?.image_url_small || dc.card_details?.image_url,
          rarity: 'Deck Core',
          quantity: dc.count,
          from_location: 'Cajas / Binders de Origen',
          to_location: `Deckbox: ${deck.name} (${dc.section.toUpperCase()})`,
          reason_tag: `Ensamblaje de ${deck.name}`
        });
      });
    });

    return { binderCards, deckCards, bulkCards };
  }, [syncData]);

  const currentCards = useMemo(() => {
    let list: MovedCardInfo[] = [];
    if (activeStage === 'binders') list = stageData.binderCards;
    if (activeStage === 'decks') list = stageData.deckCards;
    if (activeStage === 'bulk') list = stageData.bulkCards;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.to_location.toLowerCase().includes(q) ||
      c.from_location.toLowerCase().includes(q) ||
      (c.reason_tag && c.reason_tag.toLowerCase().includes(q))
    );
  }, [activeStage, stageData, searchQuery]);

  const totalInActiveStage = useMemo(() => {
    if (activeStage === 'binders') return stageData.binderCards.length;
    if (activeStage === 'decks') return stageData.deckCards.length;
    return stageData.bulkCards.length;
  }, [activeStage, stageData]);

  const checkedCountInActiveStage = useMemo(() => {
    let list: MovedCardInfo[] = [];
    if (activeStage === 'binders') list = stageData.binderCards;
    if (activeStage === 'decks') list = stageData.deckCards;
    if (activeStage === 'bulk') list = stageData.bulkCards;

    return list.filter((_, idx) => checkedCards[`${activeStage}-${idx}`]).length;
  }, [activeStage, stageData, checkedCards]);

  const progressPercentage = totalInActiveStage > 0 
    ? Math.round((checkedCountInActiveStage / totalInActiveStage) * 100)
    : 0;

  if (!isOpen || !syncData) return null;

  const toggleCardCheck = (cardKey: string) => {
    setCheckedCards(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  const handleToggleAllInStage = () => {
    const shouldCheckAll = checkedCountInActiveStage < totalInActiveStage;
    const updated = { ...checkedCards };
    
    let list: MovedCardInfo[] = [];
    if (activeStage === 'binders') list = stageData.binderCards;
    if (activeStage === 'decks') list = stageData.deckCards;
    if (activeStage === 'bulk') list = stageData.bulkCards;

    list.forEach((_, idx) => {
      updated[`${activeStage}-${idx}`] = shouldCheckAll;
    });

    setCheckedCards(updated);
  };

  const handleApplyCurrentStage = async () => {
    setIsApplying(true);
    try {
      await fetch('/api/collection/ideal/apply-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeStage === 'binders' ? 'card_promoted' : activeStage === 'decks' ? 'deck_created' : 'bulk_sorted' })
      });
      setCompletedStages(prev => ({ ...prev, [activeStage]: true }));
      toast.success(`¡Etapa de '${activeStage.toUpperCase()}' sincronizada con éxito a tu colección física!`);
    } catch (e) {
      console.error('Error aplicando etapa:', e);
      toast.error('Error al aplicar etapa de reorganización.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-dvh sm:h-auto sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                  Asistente de Reorganización <span className="text-red-600 dark:text-red-500">Física</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  Guía interactiva paso a paso para aplicar los movimientos en tus carpetas y cajas reales.
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
              aria-label="Cerrar Asistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-800 dark:text-zinc-200 font-sans">
            
            {/* Stage Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveStage('binders')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-11 touch-manipulation ${
                  activeStage === 'binders'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Binders &amp; Mosaicos ({stageData.binderCards.length})</span>
                {completedStages['binders'] && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveStage('decks')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-11 touch-manipulation ${
                  activeStage === 'decks'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Decks &amp; Variantes ({stageData.deckCards.length})</span>
                {completedStages['decks'] && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveStage('bulk')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-11 touch-manipulation ${
                  activeStage === 'bulk'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3. Bulk &amp; Cajas ({stageData.bulkCards.length})</span>
                {completedStages['bulk'] && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
              </button>
            </div>

            {/* Stage Progress & Filter Controls */}
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                      Progreso de la Etapa:
                    </span>
                    <span className="text-xs font-mono font-black text-red-600 dark:text-red-400">
                      {checkedCountInActiveStage} de {totalInActiveStage} verificadas ({progressPercentage}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Marca las casillas conforme muevas cada carta físicamente en tus carpetas o cajas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleAllInStage}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer min-h-9 touch-manipulation"
                  >
                    {checkedCountInActiveStage === totalInActiveStage ? 'Desmarcar Todo' : 'Marcar Todo'}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full rounded-full bg-linear-to-r from-red-600 via-red-500 to-emerald-500 shadow-xs"
                />
              </div>

              {/* Quick Search in Stage */}
              <div className="relative pt-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-4" />
                <input
                  type="text"
                  placeholder="Buscar carta, destino o motivo en esta etapa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* List of Tactical Card Movements */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display block">
                Movimientos Requeridos ({currentCards.length}):
              </span>

              {currentCards.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-xs text-zinc-500">
                  No hay cartas que coincidan con el filtro en esta etapa.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-105 overflow-y-auto pr-1">
                  {currentCards.map((card, idx) => {
                    const cardKey = `${activeStage}-${idx}`;
                    const isChecked = !!checkedCards[cardKey];

                    return (
                      <div
                        key={cardKey}
                        onClick={() => toggleCardCheck(cardKey)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-500/5 border-emerald-500/30' 
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 mt-1 ${
                          isChecked 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-3" />}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-10 h-14 relative rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-300 dark:border-zinc-700">
                          {card.image_url ? (
                            <Image src={card.image_url} alt={card.name} fill unoptimized sizes="60px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-zinc-500">
                              YGO
                            </div>
                          )}
                          {card.quantity && card.quantity > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[9px] font-mono font-bold px-1 rounded-tl z-10">
                              x{card.quantity}
                            </span>
                          )}
                        </div>

                        {/* Card Details & Movement Path */}
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-2 flex-wrap justify-between">
                            <strong className={`font-bold truncate ${isChecked ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                              {card.name}
                            </strong>
                            <div className="flex items-center gap-1.5">
                              {card.reason_tag && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                                  {card.reason_tag}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {card.rarity}
                              </span>
                            </div>
                          </div>

                          {/* Origen -> Destino */}
                          <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-zinc-600 dark:text-zinc-400">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800/80 font-mono">
                              Origen: {card.from_location}
                            </span>
                            <ArrowRight className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="px-2 py-0.5 rounded-md bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono font-bold">
                              Destino: {card.to_location}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation"
            >
              Cerrar Asistente
            </button>

            <button
              type="button"
              onClick={handleApplyCurrentStage}
              disabled={isApplying}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer font-display min-h-11 touch-manipulation"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando con Colección Real...</span>
                </>
              ) : (
                <>
                  <span>Marcar Etapa como Realizada en Físico</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
