'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, AlertCircle, BarChart2 } from 'lucide-react';
import { OcrLearningMemory } from '@/lib/ocr/ocrLearningMemory';
import { OcrDigitStats } from '@/lib/ocr/ocrDigitStatsStore';
import { OcrStatsModal } from './OcrStatsModal';
import { CardCodeScannerModalProps, YgoDetectedCard, ScannerStage } from './scanner.types';
import { useScannerCamera } from './useScannerCamera';
import { useScannerOcrLoop } from './useScannerOcrLoop';
import { ScannerViewfinderOverlay } from './ScannerViewfinderOverlay';
import { ScannerDetectedCardPanel } from './ScannerDetectedCardPanel';
import { ScannerManualCodeModal } from './ScannerManualCodeModal';

export type { YgoDetectedCard, ScannerStage };

export const CardCodeScannerModal: React.FC<CardCodeScannerModalProps> = ({
  isOpen, onClose, onCardRegistered,
  title = 'Escanear Código de Carta',
  subtitle = 'Apunta exclusivamente al código de 8 dígitos (esquina inferior izquierda)',
  maxQuantity = 999,
}) => {
  const [isManualEditOpen, setIsManualEditOpen] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isManualSearching, setIsManualSearching] = useState<boolean>(false);
  const [manualSearchError, setManualSearchError] = useState<string>('');
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const viewfinderRef = React.useRef<HTMLDivElement | null>(null);

  const cam = useScannerCamera({ isOpen, videoRef });
  const ocr = useScannerOcrLoop({
    isOpen, stream: cam.stream, videoRef, viewfinderRef,
    digitalZoomFactor: cam.digitalZoomFactor, isManualEditOpen,
    setCameraError: cam.setCameraError, setManualCodeInput,
  });

  const handleOpenManualEdit = () => {
    ocr.pauseScanning();
    setManualSearchError('');
    setManualCodeInput(ocr.scannedCode || '');
    setIsManualEditOpen(true);
  };

  const handleManualCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualCodeInput.trim();
    if (!clean) return;

    const scanId = ocr.cancelAndIncrementScan();
    setIsManualSearching(true);
    setManualSearchError('');

    const isNumeric = /^\d+$/.test(clean);
    const codeToUse = isNumeric ? clean.slice(0, 8) : clean;

    try {
      const res = await fetch(`/api/cards?${isNumeric ? `id=${encodeURIComponent(codeToUse)}` : `q=${encodeURIComponent(codeToUse)}`}`);
      if (res.ok) {
        const json = await res.json();
        const cardData: YgoDetectedCard | undefined = json.data?.[0] || json.card;
        if (cardData?.name) {
          if (isNumeric && ocr.scannedCode && ocr.scannedCode !== codeToUse) {
            OcrLearningMemory.learnCorrection(ocr.scannedCode, codeToUse, cardData.name);
          }
          OcrDigitStats.consolidateCardSession(cardData.id.toString());
          ocr.setScannedCode(cardData.id.toString());
          ocr.setDetectedCard(cardData);
          ocr.setScannerStage('card_found');
          ocr.setQuantity(1);
          setIsManualEditOpen(false);
          if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([40, 50, 40]);
          return;
        }
      }
      if (ocr.isCurrentScan(scanId)) setManualSearchError(`No se encontró la carta con #${codeToUse}`);
    } catch {
      if (ocr.isCurrentScan(scanId)) setManualSearchError('Error de red al consultar el ID.');
    } finally {
      if (ocr.isCurrentScan(scanId)) setIsManualSearching(false);
    }
  };

  const handleRegister = () => {
    if (!ocr.detectedCard) return;
    const name = ocr.detectedCard.name;
    const qty = ocr.quantity;
    onCardRegistered(ocr.detectedCard, qty);
    ocr.resetOcrState();
    ocr.setLastRegisteredNotice(`+${qty}x ${name}`);
    setTimeout(() => ocr.setLastRegisteredNotice(null), 2500);
  };

  const handleClose = () => {
    ocr.resetOcrState();
    cam.resetCamera();
    setIsManualEditOpen(false);
    setIsManualSearching(false);
    setManualSearchError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl text-zinc-100 flex flex-col h-dvh sm:h-auto overflow-hidden relative"
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-800 bg-zinc-900/90 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>{title}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-400">OCR 8-Dig</span>
                </h3>
                <p className="text-[11px] text-zinc-400">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setIsStatsOpen(true)} className="p-2 sm:p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-xl cursor-pointer" title="Diagnóstico OCR">
                <BarChart2 className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <button type="button" onClick={handleClose} className="p-2 sm:p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl cursor-pointer" title="Cerrar escáner">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-black min-h-64 max-h-[55vh] sm:max-h-96 flex items-center justify-center overflow-hidden select-none">
            {cam.cameraPermission === false ? (
              <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-sm text-zinc-300">{cam.cameraError || 'Acceso a cámara no disponible.'}</p>
                <button type="button" onClick={() => cam.setRetryTrigger((c) => c + 1)} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer">
                  Reintentar Permisos
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef} playsInline muted autoPlay
                  style={{ transform: cam.digitalZoomFactor > 1.01 ? `scale(${cam.digitalZoomFactor})` : undefined, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
                  className="w-full h-full object-cover"
                />
                <ScannerViewfinderOverlay
                  viewfinderRef={viewfinderRef} scannerStage={ocr.scannerStage} zoomLevel={cam.zoomLevel}
                  handleSetZoom={cam.handleSetZoom} hasTorch={cam.hasTorch} torchOn={cam.torchOn} toggleTorch={cam.toggleTorch}
                  availableDevicesCount={cam.availableDevices.length} handleSwitchCamera={cam.handleSwitchCamera}
                  scannedCode={ocr.scannedCode} loadingCard={ocr.loadingCard} lastSnapshotUrl={ocr.lastSnapshotUrl}
                  isSnapshotRefreshing={ocr.isSnapshotRefreshing} cameraError={cam.cameraError} hasDetectedCard={Boolean(ocr.detectedCard)}
                  onOpenManualEdit={handleOpenManualEdit} lastRegisteredNotice={ocr.lastRegisteredNotice}
                />
              </>
            )}
          </div>

          <ScannerDetectedCardPanel
            detectedCard={ocr.detectedCard} scannerStage={ocr.scannerStage} quantity={ocr.quantity} maxQuantity={maxQuantity}
            setQuantity={ocr.setQuantity} loadingCard={ocr.loadingCard} isSnapshotRefreshing={ocr.isSnapshotRefreshing}
            onResetScan={ocr.resetOcrState} onRegister={handleRegister} onOpenManualEdit={handleOpenManualEdit}
            onPerformManualScan={() => ocr.performScan(true)}
          />

          <ScannerManualCodeModal
            isOpen={isManualEditOpen} onClose={() => setIsManualEditOpen(false)} manualCodeInput={manualCodeInput}
            setManualCodeInput={setManualCodeInput} onSubmit={handleManualCodeSubmit} isManualSearching={isManualSearching}
            manualSearchError={manualSearchError}
          />
        </motion.div>
      </div>

      <OcrStatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </AnimatePresence>
  );
};
