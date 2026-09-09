import React from 'react';
import Image from 'next/image';
import { RefreshCw, Minus, Plus, Check, Pencil, Sparkles } from 'lucide-react';
import { YgoDetectedCard, ScannerStage } from './scanner.types';

interface ScannerDetectedCardPanelProps {
  detectedCard: YgoDetectedCard | null;
  scannerStage: ScannerStage;
  quantity: number;
  maxQuantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  loadingCard: boolean;
  isSnapshotRefreshing: boolean;
  onResetScan: () => void;
  onRegister: () => void;
  onOpenManualEdit: () => void;
  onPerformManualScan: () => void;
}

export const ScannerDetectedCardPanel: React.FC<ScannerDetectedCardPanelProps> = ({
  detectedCard,
  scannerStage,
  quantity,
  maxQuantity,
  setQuantity,
  loadingCard,
  isSnapshotRefreshing,
  onResetScan,
  onRegister,
  onOpenManualEdit,
  onPerformManualScan,
}) => {
  return (
    <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col gap-3">
      {detectedCard ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 sm:p-2.5 rounded-2xl bg-zinc-950 border border-emerald-500/40 shadow-md">
            <div className="relative w-14 h-18 sm:w-12 sm:h-16 shrink-0 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
              <Image
                src={detectedCard.image_url_small || detectedCard.image_url}
                alt={detectedCard.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60">
                  #{detectedCard.id}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">{detectedCard.type}</span>
              </div>
              <h4 className="text-sm font-bold text-zinc-100 truncate mt-0.5">{detectedCard.name}</h4>
              {detectedCard.archetype && (
                <p className="text-[11px] text-zinc-400 truncate">
                  Arquetipo: <span className="text-zinc-300 font-medium">{detectedCard.archetype}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onResetScan}
              className="px-3 py-2 sm:p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 sm:bg-transparent border border-zinc-800 sm:border-transparent hover:bg-zinc-800 rounded-xl transition-all text-xs sm:text-[10px] font-mono flex items-center sm:flex-col gap-1 cursor-pointer active:scale-95 shrink-0 touch-manipulation"
              title="Descartar y escanear otra"
            >
              <RefreshCw className="w-4 h-4 sm:mb-0.5" />
              <span>Cambiar</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl sm:rounded-xl border border-zinc-800 shadow-inner">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 transition-transform active:scale-95 cursor-pointer touch-manipulation"
                title="Disminuir cantidad"
              >
                <Minus className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
              </button>
              <span className="w-9 sm:w-8 text-center text-base sm:text-sm font-black font-mono text-zinc-100">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= maxQuantity}
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                className="w-12 h-12 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 transition-transform active:scale-95 cursor-pointer touch-manipulation"
                title="Aumentar cantidad"
              >
                <Plus className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onRegister}
              className="flex-1 min-h-12 sm:h-auto py-3 sm:py-2.5 px-5 sm:px-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-sm sm:text-xs rounded-2xl sm:rounded-xl transition-all shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              <Check className="w-5 h-5 sm:w-4 sm:h-4" />
              <span>Registrar Carta ({quantity}x)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
            <div className={`w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full ${scannerStage === 'idle' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className="truncate">
              {scannerStage === 'reading_ocr'
                ? 'Procesando lectura...'
                : scannerStage === 'object_detected'
                ? 'Carta en visor'
                : 'Escáner en espera de código'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenManualEdit}
              className="flex-1 sm:flex-initial min-h-12 sm:h-auto px-4 py-2.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-zinc-700/60 shadow-sm touch-manipulation"
              title="Ingresar o editar código manualmente"
            >
              <Pencil className="w-4 h-4 sm:w-3 sm:h-3 text-zinc-400" />
              <span>Código manual</span>
            </button>

            <button
              type="button"
              onClick={onPerformManualScan}
              disabled={scannerStage === 'reading_ocr' || scannerStage === 'fetching_card' || loadingCard || isSnapshotRefreshing}
              className="flex-1 sm:flex-initial min-h-12 sm:h-auto px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-950/50 disabled:opacity-50 cursor-pointer touch-manipulation"
            >
              <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-red-200" />
              <span>Escanear ahora</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
