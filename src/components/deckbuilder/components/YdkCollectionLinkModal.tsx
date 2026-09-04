import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, ArrowRight, Box, RotateCcw } from 'lucide-react';
import { CardImage } from '@/components/ui/CardImage';
import { UserCard, StorageLocation } from '@/types/collection';
import { DeckCard, DeckCardPhysicalCopy } from '../types';
import { getRarityWeight } from '../hooks/useDeckBuilderState';

export interface YdkImportParsedCard {
  id: number;
  name: string;
  count: number;
  section: 'main' | 'extra' | 'side' | 'extras';
  type: string;
  image_url: string;
  image_url_small?: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
}

interface YdkCollectionLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedCards: YdkImportParsedCard[];
  allUserCards: UserCard[];
  locations: StorageLocation[];
  onConfirm: (cardsWithCopies: DeckCard[], unlinkedCardIds: Record<number, number>) => void;
}

export const YdkCollectionLinkModal: React.FC<YdkCollectionLinkModalProps> = ({
  isOpen,
  onClose,
  parsedCards,
  allUserCards,
  locations,
  onConfirm,
}) => {
  const [prevParsedCards, setPrevParsedCards] = useState(parsedCards);
  const [selectedBindings, setSelectedBindings] = useState<Record<number, Record<string, number>>>(() => {
    return computeInitialBindings(parsedCards, allUserCards);
  });

  if (prevParsedCards !== parsedCards) {
    setPrevParsedCards(parsedCards);
    setSelectedBindings(computeInitialBindings(parsedCards, allUserCards));
  }

  if (!isOpen) return null;

  // Función auxiliar para auto-asignar por máxima rareza
  function computeInitialBindings(
    cards: YdkImportParsedCard[],
    userCards: UserCard[]
  ): Record<number, Record<string, number>> {
    const bindings: Record<number, Record<string, number>> = {};
    const usedCounts: Record<string, number> = {};

    cards.forEach((card) => {
      bindings[card.id] = bindings[card.id] || {};
      const owned = userCards.filter((uc) => uc.card_id === card.id);

      // Priorizar: 1) Cartas libres, 2) No-proxies, 3) Mayor rareza primero
      const sorted = [...owned].sort((a, b) => {
        const aInDeck = a.deck_id ? 1 : 0;
        const bInDeck = b.deck_id ? 1 : 0;
        if (aInDeck !== bInDeck) return aInDeck - bInDeck;

        const aProxy = a.is_proxy ? 1 : 0;
        const bProxy = b.is_proxy ? 1 : 0;
        if (aProxy !== bProxy) return aProxy - bProxy;

        const weightDiff = getRarityWeight(b.rarity) - getRarityWeight(a.rarity);
        if (weightDiff !== 0) return weightDiff;

        return 0;
      });

      let remainingNeeded = card.count;
      for (const uc of sorted) {
        if (remainingNeeded <= 0) break;
        const totalCapacity = uc.quantity || 1;
        const alreadyUsed = usedCounts[uc.id] || 0;
        const available = Math.max(0, totalCapacity - alreadyUsed);

        if (available > 0) {
          const toTake = Math.min(remainingNeeded, available);
          bindings[card.id][uc.id] = toTake;
          usedCounts[uc.id] = alreadyUsed + toTake;
          remainingNeeded -= toTake;
        }
      }
    });

    return bindings;
  }

  const handleUpdateQty = (cardId: number, userCardId: string, delta: number, maxCapacity: number, requiredCount: number) => {
    setSelectedBindings((prev) => {
      const currentCardBindings = { ...(prev[cardId] || {}) };
      const currentSelected = currentCardBindings[userCardId] || 0;
      const totalSelectedForCard = Object.values(currentCardBindings).reduce((sum, q) => sum + q, 0);

      const nextVal = Math.max(0, Math.min(maxCapacity, currentSelected + delta));
      // No permitir seleccionar más del total requerido por el mazo
      const deltaApplied = nextVal - currentSelected;
      if (deltaApplied > 0 && totalSelectedForCard + deltaApplied > requiredCount) {
        return prev;
      }

      currentCardBindings[userCardId] = nextVal;
      return {
        ...prev,
        [cardId]: currentCardBindings,
      };
    });
  };

  const handleResetToAuto = () => {
    setSelectedBindings(computeInitialBindings(parsedCards, allUserCards));
  };

  const handleClearAll = () => {
    const empty: Record<number, Record<string, number>> = {};
    parsedCards.forEach((c) => {
      empty[c.id] = {};
    });
    setSelectedBindings(empty);
  };

  // Totales globales
  const totalRequired = parsedCards.reduce((sum, c) => sum + c.count, 0);
  const totalSelectedPhysical = Object.values(selectedBindings).reduce((sum, map) => {
    return sum + Object.values(map).reduce((subSum, q) => subSum + q, 0);
  }, 0);
  const totalUnselectedProxies = Math.max(0, totalRequired - totalSelectedPhysical);

  const handleConfirm = () => {
    const unlinkedCardIds: Record<number, number> = {};

    const deckCardsWithCopies: DeckCard[] = parsedCards.map((card) => {
      const cardBindings = selectedBindings[card.id] || {};
      const physicalCopies: DeckCardPhysicalCopy[] = [];

      // 1. Añadir copias físicas seleccionadas
      Object.entries(cardBindings).forEach(([ucId, qty]) => {
        if (qty > 0) {
          const uc = allUserCards.find((u) => u.id === ucId);
          if (uc) {
            const loc = locations.find((l) => l.id === uc.storage_location_id);
            for (let i = 0; i < qty; i++) {
              physicalCopies.push({
                user_card_id: uc.id,
                storage_location_id: uc.storage_location_id,
                location_name: loc ? loc.name : 'Inbox / Sin clasificar',
                rarity: uc.rarity || 'Common',
                condition: uc.condition || 'Near Mint',
                is_proxy: Boolean(uc.is_proxy),
                is_in_active_deck: Boolean(uc.deck_id),
                active_deck_id: uc.deck_id || undefined,
                active_deck_name: uc.deck_details?.name || (uc.deck_id ? 'Deck Activo' : undefined),
                binder_page: uc.binder_page,
                binder_slot: uc.binder_slot,
                compartment_index: uc.compartment_index,
              });
            }
          }
        }
      });

      // 2. Si faltan copias para completar el count requerido, rellenar con Proxies / Nuevas
      const missingCount = Math.max(0, card.count - physicalCopies.length);
      if (missingCount > 0) {
        unlinkedCardIds[card.id] = (unlinkedCardIds[card.id] || 0) + missingCount;
        for (let i = 0; i < missingCount; i++) {
          physicalCopies.push({
            is_proxy: true,
            rarity: 'Common',
          });
        }
      }

      return {
        id: card.id,
        name: card.name,
        count: card.count,
        proxy_count: physicalCopies.filter((p) => p.is_proxy).length,
        section: card.section,
        type: card.type,
        image_url: card.image_url,
        image_url_small: card.image_url_small,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        physical_copies: physicalCopies,
      };
    });

    onConfirm(deckCardsWithCopies, unlinkedCardIds);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                      Enlace Inteligente con Mi Colección
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      Elige qué cartas, rarezas y copias tomar de tu colección física.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges de Resumen & Acciones Rápidas */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black">
                  Total Mazo: <b>{totalRequired}</b>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black">
                  🟢 Enlazadas: <b>{totalSelectedPhysical}</b>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black">
                  ⚫ A Registrar / Proxies: <b>{totalUnselectedProxies}</b>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToAuto}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  title="Auto-seleccionar copias de mayor rareza disponibles"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto Mayor Rareza</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  title="Desmarcar todas para registrarlas como nuevas"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Desmarcar Todo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Cartas del Mazo */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
            {parsedCards.map((card) => {
              const ownedVariants = allUserCards.filter((uc) => uc.card_id === card.id);
              const cardBindings = selectedBindings[card.id] || {};
              const totalSelectedForCard = Object.values(cardBindings).reduce((sum, q) => sum + q, 0);
              const pendingProxies = Math.max(0, card.count - totalSelectedForCard);

              return (
                <div
                  key={`${card.id}-${card.section}`}
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/90 space-y-3"
                >
                  {/* Encabezado de la Carta */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 shrink-0 shadow-xs">
                      <CardImage
                        src={card.image_url_small || card.image_url}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">
                            {card.name}
                          </h4>
                          <span
                            className={`inline-block px-1.5 py-0.2 text-[8.5px] font-black uppercase rounded tracking-wider mt-0.5 ${
                              card.section === 'extra'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                : card.section === 'side'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {card.section}
                          </span>
                        </div>

                        {/* Estado de Asignación por Carta */}
                        <div className="flex items-center gap-2 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-zinc-400 font-mono">
                              Requeridas: <b>{card.count}x</b>
                            </span>
                            <span
                              className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                                totalSelectedForCard === card.count
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : totalSelectedForCard > 0
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                              }`}
                            >
                              {totalSelectedForCard}/{card.count} Asignadas
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nota de copias pendientes */}
                      {pendingProxies > 0 && (
                        <p className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1 font-mono">
                          <span>⚠️</span>
                          <span>
                            {pendingProxies} copia{pendingProxies > 1 ? 's' : ''} restante{pendingProxies > 1 ? 's' : ''} se registrará{pendingProxies > 1 ? 'n' : ''} como carta nueva al guardar.
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Variantes Físicas en Colección */}
                  {ownedVariants.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                        Variantes Disponibles en Mi Colección:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ownedVariants.map((uc) => {
                          const loc = locations.find((l) => l.id === uc.storage_location_id);
                          const locName = loc ? loc.name : 'Inbox / Sin clasificar';
                          let locDetail = '';
                          if (loc?.type === 'binder' && uc.binder_page) {
                            locDetail = ` (Pág ${uc.binder_page}${uc.binder_slot ? `, Ranura ${uc.binder_slot}` : ''})`;
                          } else if (uc.compartment_index !== undefined) {
                            locDetail = ` (Carril ${uc.compartment_index + 1})`;
                          }

                          const maxCap = uc.quantity || 1;
                          const selectedCount = cardBindings[uc.id] || 0;
                          const canAddMore = selectedCount < maxCap && totalSelectedForCard < card.count;

                          return (
                            <div
                              key={uc.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                selectedCount > 0
                                  ? 'bg-white dark:bg-zinc-950 border-red-500/50 shadow-xs'
                                  : 'bg-zinc-100/60 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/80 opacity-75 hover:opacity-100'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                    {uc.rarity || 'Common'}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                    {maxCap} disp.
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                  📍 {locName}{locDetail}
                                </p>
                                {uc.deck_id && (
                                  <span className="inline-block text-[9px] font-bold text-amber-500 mt-0.5">
                                    ⚔️ En: {uc.deck_details?.name || 'Deck Activo'}
                                  </span>
                                )}
                              </div>

                              {/* Stepper de Selección */}
                              <div className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-300 dark:border-zinc-800 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(card.id, uc.id, -1, maxCap, card.count)}
                                  disabled={selectedCount <= 0}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-900 dark:text-zinc-100 font-bold text-xs cursor-pointer shadow-xs"
                                >
                                  -
                                </button>
                                <span className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-100 px-1.5 min-w-[20px] text-center">
                                  {selectedCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(card.id, uc.id, 1, maxCap, card.count)}
                                  disabled={!canAddMore}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-900 dark:text-zinc-100 font-bold text-xs cursor-pointer shadow-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 font-mono flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Sin existencias en colección. Se registrarán todas las copias como cartas nuevas (Comunes).</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer de Confirmación */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer"
            >
              <span>Confirmar y Cargar al Mazo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
