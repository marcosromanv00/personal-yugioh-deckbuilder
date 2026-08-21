'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  RefreshCw,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ScanLine,
  ZoomIn,
  Pencil,
} from 'lucide-react';
import {
  extractAndPreprocessViewfinder,
  extractGrayscaleViewfinder,
  recognizeCardPasscode,
  hasCardVisualFeatures,
  terminateCardOcrWorker,
  captureViewfinderSnapshotUrl,
  ViewfinderCropRect,
} from '@/lib/ocr/cardOcrEngine';
import { OcrLearningMemory } from '@/lib/ocr/ocrLearningMemory';

export interface YgoDetectedCard {
  id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  image_url_small?: string;
  archetype?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  attribute?: string | null;
  race?: string | null;
}

export type ScannerStage =
  | 'idle'
  | 'object_detected'
  | 'reading_ocr'
  | 'fetching_card'
  | 'card_found'
  | 'not_found';

interface CardCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardRegistered: (card: YgoDetectedCard, quantity: number) => void;
  title?: string;
  subtitle?: string;
  maxQuantity?: number;
}

export const CardCodeScannerModal: React.FC<CardCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onCardRegistered,
  title = 'Escanear Código de Carta',
  subtitle = 'Apunta exclusivamente al código de 8 dígitos (esquina inferior izquierda)',
  maxQuantity = 999,
}) => {
  // Video & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewfinderRef = useRef<HTMLDivElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);

  // Zoom State (1.0x to 5.0x)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [maxHardwareZoom, setMaxHardwareZoom] = useState<number>(1.0);
  const [appliedHardwareZoom, setAppliedHardwareZoom] = useState<number>(1.0);

  // Scanning Stage & OCR State
  const [scannerStage, setScannerStage] = useState<ScannerStage>('idle');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [detectedCard, setDetectedCard] = useState<YgoDetectedCard | null>(null);
  const [loadingCard, setLoadingCard] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [lastRegisteredNotice, setLastRegisteredNotice] = useState<string | null>(null);

  // Live Crop Snapshot State for visual feedback
  const [lastSnapshotUrl, setLastSnapshotUrl] = useState<string | null>(null);
  const [isSnapshotRefreshing, setIsSnapshotRefreshing] = useState<boolean>(false);

  // Quick Manual Code Edit State
  const [isManualEditOpen, setIsManualEditOpen] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  // Refs para control estricto de concurrencia y descarte de tareas obsoletas (cero colas/buffer)
  const isScanningRef = useRef<boolean>(false);
  const currentScanIdRef = useRef<number>(0);
  const detectedCardRef = useRef<YgoDetectedCard | null>(null);
  detectedCardRef.current = detectedCard;

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start Camera Feed
  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError('');
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : { ideal: 'environment' },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          // @ts-expect-error advanced focusMode
          advanced: [{ focusMode: 'continuous' }],
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Check capabilities for Torch & Zoom
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as {
          torch?: boolean;
          zoom?: { min: number; max: number; step: number };
        } | undefined;

        setHasTorch(Boolean(capabilities?.torch));
        if (capabilities?.zoom && capabilities.zoom.max > 1) {
          setMaxHardwareZoom(capabilities.zoom.max);
        } else {
          setMaxHardwareZoom(1.0);
        }
      }

      // Enumerate devices for switching
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (!deviceId && videoDevices.length > 0) {
        const currentDeviceId = videoTrack?.getSettings()?.deviceId;
        if (currentDeviceId) setActiveDeviceId(currentDeviceId);
      }
    } catch (err: unknown) {
      console.error('Error al acceder a la cámara:', err);
      setCameraPermission(false);
      const errorObj = err as Error;
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Concede acceso a la cámara para escanear.');
      } else {
        setCameraError('No se pudo inicializar la cámara. Verifica que no esté en uso por otra app.');
      }
    }
  }, [stream]);

  // Set Zoom (1.0x to 5.0x) with hardware + digital hybrid scaling
  const handleSetZoom = useCallback(
    async (newZoom: number) => {
      const clamped = Math.max(1.0, Math.min(5.0, Math.round(newZoom * 10) / 10));
      setZoomLevel(clamped);

      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track) return;

      const hardwareTarget = Math.min(maxHardwareZoom, clamped);
      if (maxHardwareZoom > 1.0) {
        try {
          // @ts-expect-error zoom constraint
          await track.applyConstraints({ advanced: [{ zoom: hardwareTarget }] });
          setAppliedHardwareZoom(hardwareTarget);
        } catch (e) {
          console.warn('No se pudo aplicar zoom por hardware:', e);
        }
      } else {
        setAppliedHardwareZoom(1.0);
      }
    },
    [stream, maxHardwareZoom]
  );

  // Digital zoom factor applied via CSS transform to reach desired zoomLevel
  const digitalZoomFactor = zoomLevel / appliedHardwareZoom;

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const newTorchState = !torchOn;
      // @ts-expect-error Torch is an advanced constraint
      await track.applyConstraints({ advanced: [{ torch: newTorchState }] });
      setTorchOn(newTorchState);
    } catch (e) {
      console.warn('Error al activar linterna:', e);
    }
  };

  // Switch camera if multiple exist
  const handleSwitchCamera = () => {
    if (availableDevices.length <= 1) return;
    const currentIndex = availableDevices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % availableDevices.length;
    const nextDevice = availableDevices[nextIndex];
    if (nextDevice) {
      setActiveDeviceId(nextDevice.deviceId);
      startCamera(nextDevice.deviceId);
    }
  };

  // Fetch card details with multi-candidate sequential fallback and cancellation checks
  const fetchCardInfo = useCallback(
    async (
      code: string,
      scanId: number,
      isManualTrigger: boolean = false,
      candidates: string[] = []
    ) => {
      setLoadingCard(true);
      setCameraError('');
      setScannedCode(code);
      if (!isManualEditOpen) {
        setManualCodeInput(code);
      }
      setScannerStage('fetching_card');

      // Probar lista de candidatos sin duplicados
      const codesToTry = Array.from(new Set([code, ...candidates]));

      try {
        let foundCardData: YgoDetectedCard | null = null;
        let matchedCode = code;

        for (const testCode of codesToTry) {
          if (scanId !== currentScanIdRef.current) return;
          try {
            const res = await fetch(`/api/cards?id=${encodeURIComponent(testCode)}`);
            if (res.ok) {
              const json = await res.json();
              const cardData: YgoDetectedCard | undefined = json.data?.[0] || json.card;
              if (cardData && cardData.name) {
                foundCardData = cardData;
                matchedCode = testCode;
                break;
              }
            }
          } catch {
            // Continuar con el siguiente candidato
          }
        }

        if (scanId !== currentScanIdRef.current) return;

        if (foundCardData && foundCardData.name) {
          // Registrar aprendizaje continuo
          if (code && code !== matchedCode) {
            OcrLearningMemory.learnCorrection(code, matchedCode, foundCardData.name);
          } else if (matchedCode) {
            OcrLearningMemory.learnCorrection(matchedCode, foundCardData.id.toString(), foundCardData.name);
          }

          setScannedCode(matchedCode);
          setDetectedCard(foundCardData);
          setScannerStage('card_found');
          setQuantity(1);
          setIsManualEditOpen(false);
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40, 50, 40]);
          }
        } else {
          if (isManualTrigger) {
            setScannerStage('not_found');
            setCameraError(`Código (#${code}) no coincide con ninguna carta.`);
            setTimeout(() => {
              if (!detectedCardRef.current && scanId === currentScanIdRef.current) {
                setScannerStage('idle');
              }
            }, 3000);
          } else {
            // En automático continuo, volver inmediatamente a idle sin bloquear
            setScannerStage('idle');
          }
        }
      } catch {
        if (scanId !== currentScanIdRef.current) return;
        if (isManualTrigger) {
          setScannerStage('not_found');
          setCameraError(`Código (#${code}) no encontrado en el registro.`);
          setTimeout(() => {
            if (!detectedCardRef.current && scanId === currentScanIdRef.current) {
              setScannerStage('idle');
            }
          }, 3000);
        } else {
          setScannerStage('idle');
        }
      } finally {
        if (scanId === currentScanIdRef.current) {
          setLoadingCard(false);
        }
      }
    },
    [isManualEditOpen]
  );

  // Open manual code edit dialog
  const handleOpenManualEdit = () => {
    setManualCodeInput(scannedCode || '');
    setIsManualEditOpen(true);
  };

  // Submit manual 8-digit code
  const handleManualCodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = manualCodeInput.trim().replace(/\D/g, '');
    if (cleanDigits.length >= 8) {
      const codeToUse = cleanDigits.slice(0, 8);
      const scanId = ++currentScanIdRef.current;
      if (scannedCode && scannedCode !== codeToUse) {
        OcrLearningMemory.learnCorrection(scannedCode, codeToUse, 'Corrección manual');
      }
      fetchCardInfo(codeToUse, scanId, true);
    }
  };

  // Compute crop box mapping strictly targeting the passcode digits
  const getCropRect = useCallback((): ViewfinderCropRect | null => {
    const video = videoRef.current;
    const vf = viewfinderRef.current;
    if (!video || !vf || !video.videoWidth || !video.videoHeight) return null;

    const videoRect = video.getBoundingClientRect();
    const vfRect = vf.getBoundingClientRect();

    if (videoRect.width <= 0 || videoRect.height <= 0) return null;

    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const dWidth = videoRect.width;
    const dHeight = videoRect.height;

    // object-cover scaling factor
    const scale = Math.max(dWidth / vWidth, dHeight / vHeight);
    const renderedWidth = vWidth * scale;
    const renderedHeight = vHeight * scale;

    // Centering offsets
    const offsetX = (dWidth - renderedWidth) / 2;
    const offsetY = (dHeight - renderedHeight) / 2;

    // Viewfinder relative coordinates in current DOM layout
    const vfCenterX = vfRect.left + vfRect.width / 2 - videoRect.left;
    const vfCenterY = vfRect.top + vfRect.height / 2 - videoRect.top;

    // Account for digital zoom (CSS transform scale around center)
    const digZoom = Math.max(1.0, digitalZoomFactor);
    const unzoomedCenterX = dWidth / 2 + (vfCenterX - dWidth / 2) / digZoom;
    const unzoomedCenterY = dHeight / 2 + (vfCenterY - dHeight / 2) / digZoom;
    const unzoomedWidth = vfRect.width / digZoom;
    const unzoomedHeight = vfRect.height / digZoom;

    const unzoomedLeft = unzoomedCenterX - unzoomedWidth / 2;
    const unzoomedTop = unzoomedCenterY - unzoomedHeight / 2;

    // Map to actual video pixels
    const rawCropX = Math.round((unzoomedLeft - offsetX) / scale);
    const rawCropY = Math.round((unzoomedTop - offsetY) / scale);
    const rawCropW = Math.round(unzoomedWidth / scale);
    const rawCropH = Math.round(unzoomedHeight / scale);

    // En el lado izquierdo, usar rawCropX directamente para evitar invadir el bisel vertical del marco de la carta
    const marginXRight = Math.round(rawCropW * 0.05);
    const marginY = Math.round(rawCropH * 0.02);
    const cropX = Math.max(0, rawCropX);
    const cropY = Math.max(0, rawCropY - marginY);
    const cropW = Math.min(rawCropW + marginXRight, vWidth - cropX);
    const cropH = Math.min(rawCropH + marginY * 2, vHeight - cropY);

    return {
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
    };
  }, [digitalZoomFactor]);

  // Single OCR Scan Step with Strict Concurrency Lock, Multi-pass Adaptive Binarization & Live Snapshot
  const performScan = useCallback(
    async (isManualTrigger: boolean = false) => {
      // Si ya hay carta detectada o escaneo en progreso o consulta de red activa o modal manual abierto, no ejecutar nada
      if (
        !videoRef.current ||
        isScanningRef.current ||
        loadingCard ||
        detectedCardRef.current ||
        isManualEditOpen
      ) {
        return;
      }

      const cropRect = getCropRect();
      if (!cropRect) return;

      // Actualizar snapshot visual del recorte para feedback instantáneo al usuario
      const snapshotUrl = captureViewfinderSnapshotUrl(videoRef.current, cropRect);
      if (snapshotUrl) {
        setLastSnapshotUrl(snapshotUrl);
      }

      if (isManualTrigger) {
        setIsSnapshotRefreshing(true);
        setTimeout(() => setIsSnapshotRefreshing(false), 300);
      }

      const canvas = extractAndPreprocessViewfinder(videoRef.current, cropRect);
      if (!canvas) return;

      // 1. Detección Inteligente de Presencia (<1ms): descarta fondos lisos o movimiento borroso sin texto
      const hasFeatures = hasCardVisualFeatures(canvas);
      if (!hasFeatures && !isManualTrigger) {
        if (scannerStage !== 'idle' && !loadingCard && !detectedCardRef.current) {
          setScannerStage('idle');
        }
        return;
      }

      // 2. Iniciar escaneo OCR con bloqueo single-flight y generation ID
      const scanId = ++currentScanIdRef.current;
      isScanningRef.current = true;
      if (scannerStage === 'idle') {
        setScannerStage('reading_ocr');
      }

      try {
        // Pase 1: Umbralización Adaptativa Local O(1) con Quiet Zone y supresión de bordes
        let match = await recognizeCardPasscode(canvas);

        // Pase 2: Escala de Grises con realce de contraste
        if (!match && videoRef.current) {
          const grayCanvas = extractGrayscaleViewfinder(videoRef.current, cropRect);
          if (grayCanvas) {
            match = await recognizeCardPasscode(grayCanvas);
          }
        }

        // Pase 3: Binarización Adaptativa Invertida (para cartas oscuras como XYZ / Link o letras foil)
        if (!match && videoRef.current) {
          const invertedCanvas = extractAndPreprocessViewfinder(videoRef.current, cropRect, true);
          if (invertedCanvas) {
            match = await recognizeCardPasscode(invertedCanvas);
          }
        }

        // Si el escaneo actual fue cancelado o invalidado por cambio de carta o registro o modal manual, descartar
        if (scanId !== currentScanIdRef.current || detectedCardRef.current || isManualEditOpen) {
          return;
        }

        if (match && match.code) {
          setScannedCode(match.code);
          await fetchCardInfo(match.code, scanId, isManualTrigger, match.candidates);
        } else if (isManualTrigger) {
          setScannerStage('not_found');
          setCameraError('No se detectó un código de 8 dígitos nítido en el encuadre.');
          setTimeout(() => {
            if (!detectedCardRef.current && scanId === currentScanIdRef.current) {
              setScannerStage('idle');
            }
          }, 2800);
        } else {
          setScannerStage('idle');
        }
      } catch (e) {
        console.error('Error durante performScan:', e);
        setScannerStage('idle');
      } finally {
        if (scanId === currentScanIdRef.current) {
          isScanningRef.current = false;
        }
      }
    },
    [loadingCard, getCropRect, fetchCardInfo, scannerStage, isManualEditOpen]
  );

  // Bucle de escaneo periódico (SE DETIENE POR COMPLETO cuando una carta ya fue identificada, está consultando o editando manualmente)
  useEffect(() => {
    if (!isOpen || !stream || loadingCard || detectedCard || isManualEditOpen) return;

    const interval = setInterval(() => {
      if (!isScanningRef.current && !loadingCard && !detectedCardRef.current && !isManualEditOpen) {
        performScan(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, stream, loadingCard, detectedCard, isManualEditOpen, performScan]);

  // Gestión de ciclo de vida de cámara y liberación completa de memoria de Worker al cerrar
  useEffect(() => {
    if (isOpen) {
      startCamera();
      setScannerStage('idle');
    } else {
      stopStream();
      terminateCardOcrWorker();
      currentScanIdRef.current++;
      isScanningRef.current = false;
      setDetectedCard(null);
      setScannedCode(null);
      setLastSnapshotUrl(null);
      setScannerStage('idle');
      setCameraError('');
      setLastRegisteredNotice(null);
      setZoomLevel(1.0);
      setAppliedHardwareZoom(1.0);
    }
    return () => {
      stopStream();
      terminateCardOcrWorker();
    };
  }, [isOpen]);

  // Handle register action (invalida escaneos anteriores y reanuda el escáner fresco)
  const handleRegister = () => {
    if (!detectedCard) return;

    const registeredName = detectedCard.name;
    const registeredQty = quantity;

    onCardRegistered(detectedCard, registeredQty);

    // Invalidar tareas en vuelo y reiniciar estado
    currentScanIdRef.current++;
    isScanningRef.current = false;
    setLastRegisteredNotice(`+${registeredQty}x ${registeredName}`);
    setTimeout(() => setLastRegisteredNotice(null), 2500);

    setDetectedCard(null);
    setScannedCode(null);
    setScannerStage('idle');
    setQuantity(1);
  };

  // Reset/Cambiar carta para escanear otra
  const handleResetScan = () => {
    currentScanIdRef.current++;
    isScanningRef.current = false;
    setDetectedCard(null);
    setScannedCode(null);
    setCameraError('');
    setScannerStage('idle');
    setQuantity(1);
  };

  if (!isOpen) return null;

  // Clases visuales dinámicas para el visor reactivo
  const getViewfinderStyles = () => {
    switch (scannerStage) {
      case 'object_detected':
        return {
          box: 'border-amber-500/90 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.35)]',
          corners: 'border-amber-400',
          laserGradient: 'via-amber-400 shadow-[0_0_8px_#fbbf24]',
          showLaser: true,
        };
      case 'reading_ocr':
        return {
          box: 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.4)]',
          corners: 'border-cyan-400',
          laserGradient: 'via-cyan-400 shadow-[0_0_12px_#22d3ee]',
          showLaser: true,
        };
      case 'fetching_card':
        return {
          box: 'border-blue-500 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.35)]',
          corners: 'border-blue-400',
          laserGradient: 'via-blue-400',
          showLaser: false,
        };
      case 'card_found':
        return {
          box: 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.4)]',
          corners: 'border-emerald-400',
          laserGradient: 'via-emerald-400',
          showLaser: false,
        };
      case 'not_found':
        return {
          box: 'border-red-500 bg-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.35)]',
          corners: 'border-red-400',
          laserGradient: 'via-red-400',
          showLaser: false,
        };
      case 'idle':
      default:
        return {
          box: 'border-zinc-700/80 bg-zinc-950/20 shadow-[0_0_15px_rgba(113,113,122,0.15)]',
          corners: 'border-zinc-500',
          laserGradient: 'via-zinc-400/70 shadow-[0_0_8px_rgba(212,212,216,0.4)]',
          showLaser: true,
        };
    }
  };

  const vfStyles = getViewfinderStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl text-zinc-100 flex flex-col h-dvh sm:h-auto overflow-hidden relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-800 bg-zinc-900/90 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>{title}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-red-950/60 border border-red-800/40 text-red-400">
                    OCR 8-Dig
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">{subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer touch-manipulation"
              title="Cerrar escáner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Camera Viewport Area */}
          <div className="relative flex-1 bg-black min-h-64 max-h-[55vh] sm:max-h-96 flex items-center justify-center overflow-hidden select-none">
            {cameraPermission === false ? (
              <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-sm text-zinc-300">{cameraError || 'Acceso a cámara no disponible.'}</p>
                <button
                  type="button"
                  onClick={() => startCamera(activeDeviceId)}
                  className="px-5 py-2.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer touch-manipulation"
                >
                  Reintentar Permisos
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{
                    transform: digitalZoomFactor > 1.01 ? `scale(${digitalZoomFactor})` : undefined,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder Target (Focused strictly on 8-digit passcode) */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  {/* Surrounding semi-dark mask */}
                  <div className="absolute inset-0 bg-black/40" />

                  {/* Horizontal strip target container */}
                  <div
                    ref={viewfinderRef}
                    className={`relative z-10 w-76 sm:w-80 max-w-[90%] h-20 sm:h-22 rounded-2xl border-2 transition-colors duration-200 flex items-center justify-center overflow-hidden ${vfStyles.box}`}
                  >
                    {/* Laser scanning line animation */}
                    {vfStyles.showLaser && (
                      <motion.div
                        animate={{ y: [-38, 38, -38] }}
                        transition={{
                          duration: scannerStage === 'reading_ocr' ? 0.9 : 1.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className={`absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent ${vfStyles.laserGradient} to-transparent`}
                      />
                    )}

                    {/* Corner accent guides */}
                    <div className={`absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 transition-colors ${vfStyles.corners}`} />
                    <div className={`absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 transition-colors ${vfStyles.corners}`} />
                    <div className={`absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 transition-colors ${vfStyles.corners}`} />
                    <div className={`absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 transition-colors ${vfStyles.corners}`} />
                  </div>

                  <p className="relative z-10 text-[11px] text-zinc-300 font-medium mt-2.5 bg-zinc-950/80 backdrop-blur-xs px-3 py-1 rounded-full border border-zinc-800 shadow-md">
                    Coloca solo los 8 números de la esquina inferior
                  </p>
                </div>

                {/* Quick controls on top of camera (Zoom Slider, Torch, Switch Camera) */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 sm:gap-2">
                  {/* Zoom Slider Control (1.0x to 5.0x) */}
                  <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md rounded-full px-2.5 py-1.5 sm:py-1 border border-zinc-800 text-xs font-mono shadow-md">
                    <ZoomIn className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={zoomLevel}
                      onChange={(e) => handleSetZoom(parseFloat(e.target.value))}
                      className="w-16 sm:w-24 h-1.5 sm:h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      title="Ajustar zoom (1.0x a 5.0x)"
                    />
                    <span className="text-[10px] font-bold text-zinc-200 min-w-7 text-right">
                      {zoomLevel.toFixed(1)}x
                    </span>
                  </div>

                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2.5 sm:p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer touch-manipulation ${
                        torchOn
                          ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                          : 'bg-black/60 text-zinc-300 hover:bg-black/80'
                      }`}
                      title={torchOn ? 'Apagar flash' : 'Encender flash'}
                    >
                      {torchOn ? <Zap className="w-4.5 h-4.5 sm:w-4 sm:h-4 fill-current" /> : <ZapOff className="w-4.5 h-4.5 sm:w-4 sm:h-4" />}
                    </button>
                  )}

                  {availableDevices.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="p-2.5 sm:p-2 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 hover:bg-black/80 transition-colors cursor-pointer touch-manipulation"
                      title="Cambiar cámara"
                    >
                      <RefreshCw className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>

                {/* Granular Reactive Status Indicator Pill */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 max-w-[50%] sm:max-w-none">
                  {scannerStage === 'fetching_card' || loadingCard ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/90 border border-blue-500/50 text-[11px] font-mono text-blue-300 shadow-md truncate">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                      <span className="truncate">Consultando #{scannedCode || '...'}</span>
                    </div>
                  ) : scannerStage === 'reading_ocr' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-[11px] font-mono text-cyan-300 shadow-md truncate">
                      <ScanLine className="w-3.5 h-3.5 animate-pulse text-cyan-400 shrink-0" />
                      <span className="truncate">Leyendo código...</span>
                    </div>
                  ) : scannerStage === 'object_detected' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-[11px] font-mono text-amber-300 shadow-md truncate">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400 shrink-0" />
                      <span className="truncate">Enfocando objeto...</span>
                    </div>
                  ) : scannerStage === 'card_found' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-[11px] font-mono text-emerald-300 shadow-md truncate">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">¡Carta identificada!</span>
                    </div>
                  ) : scannerStage === 'not_found' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/90 border border-red-500/50 text-[11px] font-mono text-red-300 shadow-md truncate">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="truncate">No registrado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-300 shadow-md truncate">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                      <span className="truncate">Apunta al código...</span>
                    </div>
                  )}
                </div>

                {/* Live Crop Screenshot Preview Badge & Box (Feedback en Vivo) */}
                {lastSnapshotUrl && (
                  <div className="absolute top-12 left-3 z-20 flex flex-col gap-1 max-w-[55%] sm:max-w-xs animate-in fade-in duration-200">
                    <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-1.5 shadow-xl flex items-center gap-2">
                      <div
                        className={`relative w-20 h-7 rounded-lg overflow-hidden bg-black border border-zinc-700 shrink-0 transition-transform ${
                          isSnapshotRefreshing ? 'scale-105 border-red-500' : ''
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={lastSnapshotUrl}
                          alt="Recorte capturado"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono flex items-center gap-1">
                          <ScanLine className="w-2.5 h-2.5 text-red-400 shrink-0" />
                          <span className="truncate">Recorte analizado</span>
                        </span>
                        <span className="text-[10px] text-zinc-200 font-mono truncate">
                          {scannedCode ? `#${scannedCode}` : 'Listo'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Non-Intrusive Error Alert at Top (No tapa botones inferiores) */}
                <AnimatePresence>
                  {cameraError && !detectedCard && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-22 sm:top-12 left-3 right-3 sm:left-auto sm:right-3 z-30 max-w-sm p-2.5 rounded-xl bg-red-950/90 border border-red-800/80 text-red-200 text-xs shadow-2xl flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span className="truncate">{cameraError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenManualEdit}
                        className="px-2.5 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white font-mono font-bold text-[11px] shrink-0 flex items-center gap-1 border border-red-700/60 cursor-pointer shadow-xs active:scale-95 transition-transform touch-manipulation"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Toast Notification at TOP center (No interfiere con botones inferiores) */}
                <AnimatePresence>
                  {lastRegisteredNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="absolute top-12 inset-x-0 mx-auto w-fit z-40 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 border border-emerald-400/40 pointer-events-none"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lastRegisteredNotice} añadida</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Bottom Card Preview & Registration Section (Estructura fija, limpia y estable) */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col gap-3">
            {detectedCard ? (
              <div className="flex flex-col gap-3">
                {/* Detected Card Details Badge */}
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
                      <span className="text-[10px] text-zinc-400 truncate">
                        {detectedCard.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100 truncate mt-0.5">
                      {detectedCard.name}
                    </h4>
                    {detectedCard.archetype && (
                      <p className="text-[11px] text-zinc-400 truncate">
                        Arquetipo: <span className="text-zinc-300 font-medium">{detectedCard.archetype}</span>
                      </p>
                    )}
                  </div>

                  {/* Quick Reset / Discard to scan another */}
                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="px-3 py-2 sm:p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 sm:bg-transparent border border-zinc-800 sm:border-transparent hover:bg-zinc-800 rounded-xl transition-all text-xs sm:text-[10px] font-mono flex items-center sm:flex-col gap-1 cursor-pointer active:scale-95 shrink-0 touch-manipulation"
                    title="Descartar y escanear otra"
                  >
                    <RefreshCw className="w-4 h-4 sm:mb-0.5" />
                    <span>Cambiar</span>
                  </button>
                </div>

                {/* Quantity Controls & Submit (Mobile Friendly Touch Targets) */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  {/* Stepper (min-h-11 on mobile) */}
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

                  {/* Action Register Button (min-h-11 on mobile) */}
                  <button
                    type="button"
                    onClick={handleRegister}
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
                  {/* Manual Code Input Button */}
                  <button
                    type="button"
                    onClick={handleOpenManualEdit}
                    className="flex-1 sm:flex-initial min-h-12 sm:h-auto px-4 py-2.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-zinc-700/60 shadow-sm touch-manipulation"
                    title="Ingresar o editar código manualmente"
                  >
                    <Pencil className="w-4 h-4 sm:w-3 sm:h-3 text-zinc-400" />
                    <span>Código manual</span>
                  </button>

                  {/* Manual Trigger Scan Button with Live Snapshot Refresh */}
                  <button
                    type="button"
                    onClick={() => performScan(true)}
                    disabled={isScanningRef.current || loadingCard}
                    className="flex-1 sm:flex-initial min-h-12 sm:h-auto px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-950/50 disabled:opacity-50 cursor-pointer touch-manipulation"
                  >
                    <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-red-200" />
                    <span>Escanear ahora</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Manual Code Edit Modal (Isolated Bottom Sheet on Mobile) */}
          <AnimatePresence>
            {isManualEditOpen && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/25 sm:bg-black/80 backdrop-blur-none sm:backdrop-blur-xs">
                {/* Backdrop dismiss */}
                <div
                  onClick={() => setIsManualEditOpen(false)}
                  className="absolute inset-0 cursor-pointer"
                />

                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10 w-full max-w-lg sm:max-w-sm bg-zinc-900 border-t sm:border border-zinc-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[70vh] sm:max-h-none overflow-y-auto"
                >
                  {/* Mobile drag handle */}
                  <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400">
                        <Pencil className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">
                          Corregir Código de Carta
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          Código de 8 dígitos de la esquina inferior
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsManualEditOpen(false)}
                      className="p-2 sm:p-1.5 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer touch-manipulation"
                    >
                      <X className="w-5 h-5 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  {/* Live camera assistance banner for mobile */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-medium sm:hidden">
                    <span className="text-base leading-none">👁️</span>
                    <span>La cámara sigue visible arriba para que leas el código en pantalla sin mover la carta</span>
                  </div>

                  <form onSubmit={handleManualCodeSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono font-bold text-zinc-300">
                        Dígitos detectados / Passcode (8 cifras):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        autoFocus
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Ej. 29616929"
                        className="w-full text-center font-mono font-black text-2xl tracking-widest py-3.5 sm:py-3 px-4 bg-zinc-950 border-2 border-red-500/60 focus:border-red-500 rounded-2xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none shadow-inner"
                      />
                      <p className="text-[10px] text-zinc-500 text-center font-mono">
                        {manualCodeInput.length}/8 dígitos ingresados
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsManualEditOpen(false)}
                        className="flex-1 min-h-12 sm:h-auto py-3 sm:py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 text-xs font-bold transition-colors cursor-pointer font-mono touch-manipulation"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={manualCodeInput.trim().length < 8 || loadingCard}
                        className="flex-1 min-h-12 sm:h-auto py-3 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-red-950 flex items-center justify-center gap-1.5 cursor-pointer font-mono active:scale-95 touch-manipulation"
                      >
                        {loadingCard ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Buscar Carta</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
