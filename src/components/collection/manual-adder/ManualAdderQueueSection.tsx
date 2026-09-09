import React from 'react';
import Image from 'next/image';
import { Trash2, X, AlertCircle, Check, Sparkles, Loader2 } from 'lucide-react';
import { QueuedCardItem } from './manualAdder.types';

interface ManualAdderQueueSectionProps {
  queuedCards: QueuedCardItem[];
  activeCardId: string | null;
  totalCardUnits: number;
  onSelectCard: (id: string) => void;
  onRemoveCard: (id: string, e?: React.MouseEvent) => void;
  onClearAll: () => void;
  onSaveAllCards: () => void;
  submitting: boolean;
  errorMsg: string;
  successMsg: string;
}

export const ManualAdderQueueSection: React.FC<ManualAdderQueueSectionProps> = ({
  queuedCards,
  activeCardId,
  totalCardUnits,
  onSelectCard,
  onRemoveCard,
  onClearAll,
  onSaveAllCards,
  submitting,
  errorMsg,
  successMsg,
}) => {
  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-hidden bg-zinc-100/50 dark:bg-zinc-900/40">
      {/* Center Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="text-red-500">📋</span>
            <span>Cola de Registro</span>
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-black">
            {totalCardUnits} cartas • {queuedCards.length} tipos
          </span>
        </div>

        {queuedCards.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar todo</span>
          </button>
        )}
      </div>

      {/* Grid of Queued Cards */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {queuedCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center text-zinc-400">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-2xl mb-4 shadow-xs">
              📦
            </div>
            <p className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Cola de Registro Vacía
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
              Busca cartas en el panel izquierdo o pega un lote de texto para añadirlas a la cola.
              Podrás editar sus rarezas, condición y contenedor en el panel derecho antes de guardar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {queuedCards.map((item) => {
              const isSelected = item.id === activeCardId;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectCard(item.id)}
                  className={`relative p-2 rounded-2xl bg-white dark:bg-zinc-950 border transition-all cursor-pointer group flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-red-500 border-red-500 shadow-lg shadow-red-500/20 scale-[1.02] z-10'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  <div className="relative aspect-[3/4.2] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-2">
                    <Image
                      src={item.image_url_small || item.image_url}
                      alt={item.name}
                      fill
                      sizes="150px"
                      className="object-contain"
                    />

                    <div className="absolute bottom-1 left-1 bg-black/90 text-white font-mono font-black text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                      {item.quantity}x
                    </div>

                    {item.is_proxy && (
                      <div className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                        PROXY
                      </div>
                    )}

                    {item.rarity && item.rarity !== 'Common' && (
                      <div className="absolute top-1 right-1 bg-amber-500/90 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                        {item.rarity.substring(0, 3)}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => onRemoveCard(item.id, e)}
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                      title="Remover de la cola"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-black line-clamp-1 text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-0.5">
                      <span className="truncate">{item.condition}</span>
                      <span className="font-mono">{item.language.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Center Footer & Save CTA */}
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          {errorMsg && (
            <div className="text-xs text-red-500 font-bold flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span className="truncate">{successMsg}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onSaveAllCards}
          disabled={submitting || queuedCards.length === 0}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando en Colección...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Registrar {totalCardUnits} Cartas en Colección</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
