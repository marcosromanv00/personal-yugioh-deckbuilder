import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, Zap, ZapOff, RefreshCw, Loader2, ScanLine, Check, AlertCircle, Pencil } from 'lucide-react';
import { ScannerStage } from './scanner.types';
import { getViewfinderStyles } from './scanner.utils';

interface ScannerViewfinderOverlayProps {
  viewfinderRef: React.RefObject<HTMLDivElement | null>;
  scannerStage: ScannerStage;
  zoomLevel: number;
  handleSetZoom: (z: number) => void;
  hasTorch: boolean;
  torchOn: boolean;
  toggleTorch: () => void;
  availableDevicesCount: number;
  handleSwitchCamera: () => void;
  scannedCode: string | null;
  loadingCard: boolean;
  lastSnapshotUrl: string | null;
  isSnapshotRefreshing: boolean;
  cameraError: string;
  hasDetectedCard: boolean;
  onOpenManualEdit: () => void;
  lastRegisteredNotice: string | null;
}

export const ScannerViewfinderOverlay: React.FC<ScannerViewfinderOverlayProps> = ({
  viewfinderRef, scannerStage, zoomLevel, handleSetZoom, hasTorch, torchOn, toggleTorch,
  availableDevicesCount, handleSwitchCamera, scannedCode, loadingCard, lastSnapshotUrl,
  isSnapshotRefreshing, cameraError, hasDetectedCard, onOpenManualEdit, lastRegisteredNotice,
}) => {
  const vfStyles = getViewfinderStyles(scannerStage);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" />
        <div ref={viewfinderRef} className={`relative z-10 w-64 sm:w-68 max-w-[80%] h-18 sm:h-20 rounded-2xl border-2 transition-colors duration-200 flex items-center justify-center overflow-hidden ${vfStyles.box}`}>
          {vfStyles.showLaser && (
            <motion.div
              animate={{ y: [-32, 32, -32] }}
              transition={{ duration: scannerStage === 'reading_ocr' ? 0.9 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent ${vfStyles.laserGradient} to-transparent`}
            />
          )}
          <div className={`absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 transition-colors ${vfStyles.corners}`} />
          <div className={`absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 transition-colors ${vfStyles.corners}`} />
          <div className={`absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 transition-colors ${vfStyles.corners}`} />
          <div className={`absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 transition-colors ${vfStyles.corners}`} />
        </div>
        <p className="relative z-10 text-[11px] text-zinc-300 font-medium mt-2.5 bg-zinc-950/80 backdrop-blur-xs px-3 py-1 rounded-full border border-zinc-800 shadow-md">
          Coloca solo los 8 números de la esquina inferior
        </p>
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md rounded-full px-2.5 py-1.5 sm:py-1 border border-zinc-800 text-xs font-mono shadow-md">
          <ZoomIn className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <input
            type="range" min="1.0" max="5.0" step="0.1" value={zoomLevel}
            onChange={(e) => handleSetZoom(parseFloat(e.target.value))}
            className="w-16 sm:w-24 h-1.5 sm:h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            title="Ajustar zoom"
          />
          <span className="text-[10px] font-bold text-zinc-200 min-w-7 text-right">{zoomLevel.toFixed(1)}x</span>
        </div>
        {hasTorch && (
          <button type="button" onClick={toggleTorch} className={`p-2.5 sm:p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer touch-manipulation ${torchOn ? 'bg-amber-500 text-zinc-950' : 'bg-black/60 text-zinc-300'}`}>
            {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
          </button>
        )}
        {availableDevicesCount > 1 && (
          <button type="button" onClick={handleSwitchCamera} className="p-2.5 sm:p-2 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 transition-colors cursor-pointer touch-manipulation">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 max-w-[50%] sm:max-w-none">
        {scannerStage === 'fetching_card' || loadingCard ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/90 border border-blue-500/50 text-[11px] font-mono text-blue-300 shadow-md truncate">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" /><span className="truncate">Consultando #{scannedCode || '...'}</span>
          </div>
        ) : scannerStage === 'reading_ocr' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-[11px] font-mono text-cyan-300 shadow-md truncate">
            <ScanLine className="w-3.5 h-3.5 animate-pulse text-cyan-400 shrink-0" /><span className="truncate">Leyendo código...</span>
          </div>
        ) : scannerStage === 'card_found' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-[11px] font-mono text-emerald-300 shadow-md truncate">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span className="truncate">¡Carta identificada!</span>
          </div>
        ) : scannerStage === 'not_found' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/90 border border-red-500/50 text-[11px] font-mono text-red-300 shadow-md truncate">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /><span className="truncate">No registrado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-300 shadow-md truncate">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" /><span className="truncate">Apunta al código...</span>
          </div>
        )}
      </div>

      {lastSnapshotUrl && (
        <div className="absolute top-12 left-3 z-20 flex flex-col gap-1 max-w-[55%] sm:max-w-xs animate-in fade-in duration-200">
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-1.5 shadow-xl flex items-center gap-2">
            <div className={`relative w-20 h-7 rounded-lg overflow-hidden bg-black border border-zinc-700 shrink-0 transition-transform ${isSnapshotRefreshing ? 'scale-105 border-red-500' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lastSnapshotUrl} alt="Recorte" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono flex items-center gap-1">
                <ScanLine className="w-2.5 h-2.5 text-red-400 shrink-0" /><span className="truncate">Recorte analizado</span>
              </span>
              <span className="text-[10px] text-zinc-200 font-mono truncate">{scannedCode ? `#${scannedCode}` : 'Buscando...'}</span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {cameraError && !hasDetectedCard && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-22 sm:top-12 left-3 right-3 sm:left-auto sm:right-3 z-30 max-w-sm p-2.5 rounded-xl bg-red-950/90 border border-red-800/80 text-red-200 text-xs shadow-2xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0"><AlertCircle className="w-4 h-4 shrink-0 text-red-400" /><span className="truncate">{cameraError}</span></div>
            <button type="button" onClick={onOpenManualEdit} className="px-2.5 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-mono font-bold text-[11px] shrink-0 flex items-center gap-1 border border-red-700/60 cursor-pointer">
              <Pencil className="w-3 h-3" /><span>Editar</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastRegisteredNotice && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-12 inset-x-0 mx-auto w-fit z-40 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 border border-emerald-400/40 pointer-events-none">
            <Check className="w-3.5 h-3.5" /><span>{lastRegisteredNotice} añadida</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
