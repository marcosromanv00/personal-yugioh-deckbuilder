import { useState, useEffect, useRef, useCallback } from 'react';
import {
  extractAndPreprocessViewfinder,
  hasCardVisualFeatures,
  captureViewfinderSnapshotUrl,
} from '@/lib/ocr/cardOcrEngine';
import { OcrLearningMemory } from '@/lib/ocr/ocrLearningMemory';
import { OcrDigitStats } from '@/lib/ocr/ocrDigitStatsStore';
import { YgoDetectedCard, ScannerStage } from './scanner.types';
import { computeCropRect, executeMultiPassOcr } from './scanner.utils';
import { fetchCardWithCandidatesApi } from './services/scanner.api';

interface UseScannerOcrLoopParams {
  isOpen: boolean;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  viewfinderRef: React.RefObject<HTMLDivElement | null>;
  digitalZoomFactor: number;
  isManualEditOpen: boolean;
  setCameraError: (err: string) => void;
  setManualCodeInput: (code: string) => void;
}

export function useScannerOcrLoop({
  isOpen, stream, videoRef, viewfinderRef, digitalZoomFactor, isManualEditOpen,
  setCameraError, setManualCodeInput,
}: UseScannerOcrLoopParams) {
  const [scannerStage, setScannerStage] = useState<ScannerStage>('idle');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [detectedCard, setDetectedCard] = useState<YgoDetectedCard | null>(null);
  const [loadingCard, setLoadingCard] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [lastRegisteredNotice, setLastRegisteredNotice] = useState<string | null>(null);
  const [lastSnapshotUrl, setLastSnapshotUrl] = useState<string | null>(null);
  const [isSnapshotRefreshing, setIsSnapshotRefreshing] = useState<boolean>(false);

  const isScanningRef = useRef<boolean>(false);
  const currentScanIdRef = useRef<number>(0);
  const detectedCardRef = useRef<YgoDetectedCard | null>(null);
  const currentAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { detectedCardRef.current = detectedCard; }, [detectedCard]);

  const fetchCardInfo = useCallback(
    async (code: string, scanId: number, isManualTrigger = false, candidates: string[] = []) => {
      currentAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      currentAbortControllerRef.current = abortController;

      setLoadingCard(true);
      setCameraError('');
      setScannedCode(code);
      if (!isManualEditOpen) setManualCodeInput(code);
      setScannerStage('fetching_card');

      const resolvedCode = OcrLearningMemory.resolve(code);
      try {
        const result = await fetchCardWithCandidatesApi(resolvedCode, [code, ...candidates], abortController.signal);
        if (scanId !== currentScanIdRef.current || abortController.signal.aborted) return;

        if (result?.cardData?.name) {
          const { cardData, matchedCode } = result;
          if (code && code !== matchedCode) OcrLearningMemory.learnCorrection(code, matchedCode, cardData.name);
          else if (matchedCode) OcrLearningMemory.learnCorrection(matchedCode, cardData.id.toString(), cardData.name);
          OcrDigitStats.consolidateCardSession(matchedCode || cardData.id.toString());

          setScannedCode(matchedCode);
          setDetectedCard(cardData);
          setScannerStage('card_found');
          setQuantity(1);
          if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([40, 50, 40]);
        } else {
          if (isManualTrigger) {
            setScannerStage('not_found');
            setCameraError(`Código (#${code}) no coincide con ninguna carta.`);
            setTimeout(() => { if (!detectedCardRef.current && scanId === currentScanIdRef.current) setScannerStage('idle'); }, 2500);
          } else {
            setScannerStage('idle');
          }
        }
      } catch (e: unknown) {
        if ((e as Error)?.name === 'AbortError' || scanId !== currentScanIdRef.current) return;
        setScannerStage(isManualTrigger ? 'not_found' : 'idle');
        if (isManualTrigger) setCameraError(`Código (#${code}) no encontrado.`);
      } finally {
        if (scanId === currentScanIdRef.current) setLoadingCard(false);
      }
    },
    [isManualEditOpen, setCameraError, setManualCodeInput]
  );

  const performScan = useCallback(
    async (isManualTrigger = false) => {
      if (!videoRef.current || isScanningRef.current || loadingCard || detectedCardRef.current || isManualEditOpen) return;
      const cropRect = computeCropRect(videoRef.current, viewfinderRef.current, digitalZoomFactor);
      if (!cropRect) return;

      const snapshotUrl = captureViewfinderSnapshotUrl(videoRef.current, cropRect);
      if (snapshotUrl) setLastSnapshotUrl(snapshotUrl);
      if (isManualTrigger) {
        setIsSnapshotRefreshing(true);
        setTimeout(() => setIsSnapshotRefreshing(false), 200);
      }

      const canvas = extractAndPreprocessViewfinder(videoRef.current, cropRect);
      if (!canvas) return;

      if (!hasCardVisualFeatures(canvas) && !isManualTrigger) {
        if (scannerStage !== 'idle' && !loadingCard && !detectedCardRef.current) setScannerStage('idle');
        return;
      }

      const scanId = ++currentScanIdRef.current;
      isScanningRef.current = true;
      if (scannerStage === 'idle') setScannerStage('reading_ocr');

      try {
        const match = await executeMultiPassOcr(videoRef.current, canvas, cropRect, isManualTrigger);
        if (scanId !== currentScanIdRef.current || detectedCardRef.current || isManualEditOpen) return;

        if (match?.code) {
          setScannedCode(match.code);
          await fetchCardInfo(match.code, scanId, isManualTrigger, match.candidates);
        } else if (isManualTrigger) {
          setScannerStage('not_found');
          setCameraError('No se detectó un código de 8 dígitos nítido en el encuadre.');
          setTimeout(() => { if (!detectedCardRef.current && scanId === currentScanIdRef.current) setScannerStage('idle'); }, 2000);
        } else {
          setScannerStage('idle');
        }
      } catch (e) {
        console.error('Error durante performScan:', e);
        setScannerStage('idle');
      } finally {
        isScanningRef.current = false;
      }
    },
    [digitalZoomFactor, fetchCardInfo, isManualEditOpen, loadingCard, scannerStage, setCameraError, videoRef]
  );

  useEffect(() => {
    if (!isOpen || !stream || detectedCard || isManualEditOpen) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    const scheduleNextScan = () => {
      if (isCancelled || detectedCardRef.current || isManualEditOpen) return;
      timeoutId = setTimeout(async () => {
        if (isCancelled || detectedCardRef.current || isManualEditOpen) return;
        if (!isScanningRef.current && !loadingCard && !detectedCardRef.current && !isManualEditOpen) {
          await performScan(false);
        }
        if (!isCancelled && !detectedCardRef.current && !isManualEditOpen) scheduleNextScan();
      }, 200);
    };

    scheduleNextScan();
    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, stream, loadingCard, detectedCard, isManualEditOpen, performScan]);

  const resetOcrState = () => {
    currentAbortControllerRef.current?.abort();
    currentScanIdRef.current++;
    isScanningRef.current = false;
    OcrDigitStats.clearTemporalBuffer();
    setDetectedCard(null);
    setScannedCode(null);
    setLastSnapshotUrl(null);
    setScannerStage('idle');
    setLastRegisteredNotice(null);
    setQuantity(1);
  };

  const cancelAndIncrementScan = useCallback(() => {
    currentAbortControllerRef.current?.abort();
    isScanningRef.current = false;
    currentScanIdRef.current++;
    return currentScanIdRef.current;
  }, []);

  const pauseScanning = useCallback(() => {
    currentAbortControllerRef.current?.abort();
    isScanningRef.current = false;
    currentScanIdRef.current++;
    setLoadingCard(false);
    setScannerStage('idle');
  }, []);

  const isCurrentScan = useCallback(
    (scanId: number) => scanId === currentScanIdRef.current,
    []
  );

  return {
    scannerStage, setScannerStage, scannedCode, setScannedCode,
    detectedCard, setDetectedCard, loadingCard, setLoadingCard, quantity, setQuantity,
    lastRegisteredNotice, setLastRegisteredNotice, lastSnapshotUrl, isSnapshotRefreshing,
    cancelAndIncrementScan, pauseScanning, isCurrentScan,
    performScan, resetOcrState,
  };
}
