'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, X, ArrowDownRight, ArrowUpRight, MapPin, Check, Loader2 } from 'lucide-react';
import { DeckVariant, VariantDiffSummary } from '@/types/collection';

interface VariantDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVariant: DeckVariant | null;
  targetVariant: DeckVariant | null;
  diff: VariantDiffSummary;
  isLoading?: boolean;
  onConfirmSwitch: (targetVariant: DeckVariant, transferCardIds: string[]) => void;
}

export const VariantDiffModal: React.FC<VariantDiffModalProps> = ({
  isOpen,
  onClose,
  activeVariant,
  targetVariant,
  diff,
  isLoading = false,
  onConfirmSwitch,
}) => {
  const [transfers, setTransfers] = useState<Record<string, boolean>>({});

  if (!isOpen || !targetVariant) return null;

  const handleToggleTransfer = (id: string) => {
    setTransfers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedTransferIds = Object.entries(transfers)
    .filter(([, active]) => active)
    .map(([id]) => id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide flex items-center gap-2">
                  <span>{activeVariant?.name || 'Actual'}</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-red-500">{targetVariant.name}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">Vista previa del intercambio de cartas físicas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Columns */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Salen a Reserva */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4" /> Salen a Reserva ({diff.toRemoveFromActive.length})
                  </span>
                </div>
                {diff.toRemoveFromActive.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">Ninguna carta sale del deck activo.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {diff.toRemoveFromActive.map((c) => (
                      <div key={`${c.card_id}_${c.fromSection}`} className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                        <span className="truncate pr-2 font-medium">{c.name}</span>
                        <span className="font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-lg shrink-0">
                          -{c.count} ({c.fromSection.toUpperCase()})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Entran al Deck */}
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4" /> Entran al Deck ({diff.toAddToActive.length})
                  </span>
                </div>
                {diff.toAddToActive.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-2">Ninguna carta nueva ingresa al deck.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {diff.toAddToActive.map((c) => (
                      <div key={`${c.card_id}_${c.toSection}`} className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                        <span className="truncate pr-2 font-medium">{c.name}</span>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-lg shrink-0">
                          +{c.count} ({c.toSection.toUpperCase()})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Préstamos y Origen de Cartas */}
            {diff.toAddToActive.some((c) => c.sourceLocation?.isCrossDeckLoan || c.sourceLocation?.locationId) && (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Ubicación física de las cartas a incorporar</span>
                </span>
                <div className="space-y-2 mt-2">
                  {diff.toAddToActive
                    .filter((c) => c.sourceLocation)
                    .map((c) => {
                      const loc = c.sourceLocation!;
                      const transferKey = `${c.card_id}_${loc.locationId || 'inbox'}`;
                      return (
                        <div key={transferKey} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                          <div>
                            <span className="font-bold text-zinc-200">{c.name}</span>
                            <span className="text-zinc-500 font-mono ml-2">x{c.count}</span>
                            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                              <span>Origen:</span>
                              <span className="font-medium text-red-400">{loc.locationName}</span>
                            </div>
                          </div>
                          {loc.isCrossDeckLoan && (
                            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] bg-red-950/40 border border-red-900/60 px-2.5 py-1.5 rounded-xl text-red-200">
                              <input
                                type="checkbox"
                                checked={Boolean(transfers[transferKey])}
                                onChange={() => handleToggleTransfer(transferKey)}
                                className="rounded text-red-600 focus:ring-0"
                              />
                              <span>Trasladar a Deckbox</span>
                            </label>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer min-h-11 md:min-h-9 touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onConfirmSwitch(targetVariant, selectedTransferIds)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 cursor-pointer min-h-11 md:min-h-9 touch-manipulation disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Confirmar y Activar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
