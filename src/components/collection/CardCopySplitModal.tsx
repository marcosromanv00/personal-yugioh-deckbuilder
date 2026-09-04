'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, X, AlertCircle, Check } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { getLanguageDisplay, getCategoryBadgeStyle } from '@/lib/collectionUtils';

interface CardCopySplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCard: UserCard | null;
  onConfirmSplit: (userCardId: string, splitQuantity: number) => Promise<void>;
}

export const CardCopySplitModal: React.FC<CardCopySplitModalProps> = ({
  isOpen,
  onClose,
  userCard,
  onConfirmSplit,
}) => {
  const currentQuantity = userCard?.quantity || 1;
  const maxSplit = Math.max(1, currentQuantity - 1);
  const [prevCardId, setPrevCardId] = useState<string | null>(userCard?.id || null);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  if (prevCardId !== (userCard?.id || null)) {
    setPrevCardId(userCard?.id || null);
    setSplitCount(1);
    setIsProcessing(false);
  }

  if (!isOpen || !userCard) return null;

  const remainingOriginal = currentQuantity - splitCount;
  const isSplitPossible = currentQuantity > 1;
  const catStyle = getCategoryBadgeStyle(userCard.status_flag);
  const langDisplay = getLanguageDisplay(userCard.language);

  const handleConfirm = async () => {
    if (!isSplitPossible || splitCount < 1 || splitCount >= currentQuantity) return;
    setIsProcessing(true);
    try {
      await onConfirmSplit(userCard.id, splitCount);
      onClose();
    } catch (e) {
      console.error('Error al separar copias:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                  Hacer Copia Individual
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Separa copias a un nuevo registro independiente
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Card Preview Card */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex gap-3.5 items-center">
              <div className="relative w-14 aspect-3/4 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                {userCard.card_details && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={userCard.card_details.image_url_small || userCard.card_details.image_url}
                    alt={userCard.card_details.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-0.5 right-0.5 bg-zinc-950/90 text-white font-mono text-[8.5px] px-1 rounded font-black">
                  {currentQuantity}x
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                  {userCard.card_details?.name || 'Carta'}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                  <span className="font-bold text-purple-600 dark:text-purple-400">{userCard.rarity || 'Common'}</span>
                  <span>•</span>
                  <span>{userCard.condition || 'Near Mint'}</span>
                  <span>•</span>
                  <span title={langDisplay.name}>{langDisplay.flag} {langDisplay.badge}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className={`w-2 h-2 rounded-full ${catStyle.dotColorClass}`} />
                  <span className="text-[9.5px] font-mono font-bold text-zinc-600 dark:text-zinc-400 truncate">
                    {catStyle.label}
                  </span>
                </div>
              </div>
            </div>

            {!isSplitPossible ? (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/40 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="leading-snug">
                  Este registro contiene únicamente <strong>1 copia</strong>. Para poder separar copias independientes necesitas tener al menos 2 copias agrupadas.
                </p>
              </div>
            ) : (
              <>
                {/* Quantity Stepper Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <label className="font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
                      Copias a separar:
                    </label>
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      {splitCount} de {currentQuantity} {currentQuantity === 1 ? 'copia' : 'copias'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={splitCount <= 1}
                      onClick={() => setSplitCount(p => Math.max(1, p - 1))}
                      className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 font-mono font-black text-sm disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <span className="font-mono text-base font-black text-red-600 dark:text-red-400">
                        {splitCount}x
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {splitCount === 1 ? 'copia individual' : 'copias en nuevo grupo'}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={splitCount >= maxSplit}
                      onClick={() => setSplitCount(p => Math.min(maxSplit, p + 1))}
                      className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 font-mono font-black text-sm disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  {/* Range Slider for fast selection */}
                  {maxSplit > 1 && (
                    <input
                      type="range"
                      min={1}
                      max={maxSplit}
                      value={splitCount}
                      onChange={(e) => setSplitCount(parseInt(e.target.value) || 1)}
                      className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                  )}
                </div>

                {/* Outcome Preview Cards */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-center space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                      Registro Original
                    </span>
                    <div className="text-sm font-mono font-black text-zinc-800 dark:text-zinc-200">
                      {remainingOriginal}x {remainingOriginal === 1 ? 'copia' : 'copias'}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono block">
                      Permanece intacto
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl border border-purple-300 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/20 text-center space-y-1">
                    <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 uppercase font-bold block">
                      Nueva Separación
                    </span>
                    <div className="text-sm font-mono font-black text-purple-600 dark:text-purple-400">
                      +{splitCount}x {splitCount === 1 ? 'copia' : 'copias'}
                    </div>
                    <span className="text-[9px] text-purple-500 dark:text-purple-400 font-mono block">
                      100% editable por separado
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            {isSplitPossible && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Separando...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar Separación ({splitCount}x)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
