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
  Layers,
  Sparkles,
  ScanLine,
  ZoomIn,
} from 'lucide-react';
import {
  extractAndPreprocessViewfinder,
  recognizeCardPasscode,
  ViewfinderCropRect,
} from '@/lib/ocr/cardOcrEngine';

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

  // Scanning & OCR State
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [detectedCard, setDetectedCard] = useState<YgoDetectedCard | null>(null);
  const [loadingCard, setLoadingCard] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [lastRegisteredNotice, setLastRegisteredNotice] = useState<string | null>(null);

  // Ref para debounce de estabilidad de 300ms al detectar un código nuevo
  const pendingCodeRef = useRef<{ code: string; firstSeen: number } | null>(null);

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

  // Fetch card details by 8-digit passcode
  const fetchCardInfo = useCallback(async (code: string) => {
    setLoadingCard(true);
    setCameraError('');
    try {
      const res = await fetch(`/api/cards?id=${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error('Carta no encontrada');
      }
      const json = await res.json();
      const cardData: YgoDetectedCard | undefined = json.data?.[0] || json.card;

      if (cardData && cardData.name) {
        setDetectedCard(cardData);
        setQuantity(1);
        // Haptic feedback
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([40, 50, 40]);
        }
      } else {
        setCameraError(`Código detectado (#${code}), pero no coincide con ninguna carta en la base de datos.`);
      }
    } catch {
      setCameraError(`Código (#${code}) no encontrado en el registro.`);
    } finally {
      setLoadingCard(false);
    }
  }, []);

  // Compute crop box mapping from onscreen viewfinder to real video pixels with +10% radius expansion
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

    // Ampliar un 10% el radio de detección en cada dirección (+20% total de ancho y alto)
    const marginX = Math.round(rawCropW * 0.10);
    const marginY = Math.round(rawCropH * 0.10);
    const cropX = Math.max(0, rawCropX - marginX);
    const cropY = Math.max(0, rawCropY - marginY);
    const cropW = Math.min(rawCropW + marginX * 2, vWidth - cropX);
    const cropH = Math.min(rawCropH + marginY * 2, vHeight - cropY);

    return {
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
    };
  }, [digitalZoomFactor]);

  // Single OCR Scan Step with 300ms Debounce on new card detection
  const performScan = useCallback(async () => {
    if (!videoRef.current || isOcrProcessing || loadingCard) return;

    const cropRect = getCropRect();
    if (!cropRect) return;

    const canvas = extractAndPreprocessViewfinder(videoRef.current, cropRect);
    if (!canvas) return;

    setIsOcrProcessing(true);
    try {
      const match = await recognizeCardPasscode(canvas);
      if (match && match.code) {
        // Si es el mismo código que ya tenemos activo, reseteamos el pending y no cambiamos nada
        if (match.code === scannedCode) {
          pendingCodeRef.current = null;
          return;
        }

        const now = Date.now();
        // Si no hay carta cargada actualmente, cargamos inmediatamente
        if (!detectedCard) {
          setScannedCode(match.code);
          pendingCodeRef.current = null;
          await fetchCardInfo(match.code);
        } else {
          // Si ya hay una carta en pantalla y leemos un código nuevo,
          // aplicamos debounce de estabilidad de 300ms antes de cambiar
          if (pendingCodeRef.current?.code === match.code) {
            if (now - pendingCodeRef.current.firstSeen >= 300) {
              setScannedCode(match.code);
              pendingCodeRef.current = null;
              await fetchCardInfo(match.code);
            }
          } else {
            pendingCodeRef.current = { code: match.code, firstSeen: now };
          }
        }
      } else {
        pendingCodeRef.current = null;
      }
    } catch (e) {
      console.error('Error durante performScan:', e);
    } finally {
      setIsOcrProcessing(false);
    }
  }, [isOcrProcessing, loadingCard, getCropRect, scannedCode, detectedCard, fetchCardInfo]);

  // Periodic scanner loop (continúa activo incluso si hay carta detectada para permitir detección automática de la siguiente)
  useEffect(() => {
    if (!isOpen || !stream || loadingCard) return;

    const interval = setInterval(() => {
      if (!isOcrProcessing && !loadingCard) {
        performScan();
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen, stream, loadingCard, isOcrProcessing, performScan]);

  // Manage open/close camera lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setDetectedCard(null);
      setScannedCode(null);
      setCameraError('');
      setLastRegisteredNotice(null);
      setZoomLevel(1.0);
      setAppliedHardwareZoom(1.0);
      pendingCodeRef.current = null;
    }
    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Handle register action (mantiene el escáner activo para seguir agregando cartas)
  const handleRegister = () => {
    if (!detectedCard) return;

    const registeredName = detectedCard.name;
    const registeredQty = quantity;

    onCardRegistered(detectedCard, registeredQty);

    setLastRegisteredNotice(`+${registeredQty}x ${registeredName}`);
    setTimeout(() => setLastRegisteredNotice(null), 2500);
    setDetectedCard(null);
    setScannedCode(null);
    setQuantity(1);
  };

  // Reset to scan another card
  const handleResetScan = () => {
    setDetectedCard(null);
    setScannedCode(null);
    setCameraError('');
    setQuantity(1);
  };

  if (!isOpen) return null;

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
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90 z-20">
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
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors"
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

                  {/* Horizontal strip target container (+10% en cada dirección) */}
                  <div
                    ref={viewfinderRef}
                    className="relative z-10 w-80 max-w-[90%] h-24 rounded-2xl border-2 border-red-500/80 bg-red-500/5 shadow-[0_0_25px_rgba(239,68,68,0.25)] flex items-center justify-center overflow-hidden"
                  >
                    {/* Laser scanning line animation */}
                    {!detectedCard && (
                      <motion.div
                        animate={{ y: [-42, 42, -42] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-red-400 to-transparent shadow-[0_0_8px_#f87171]"
                      />
                    )}

                    {/* Corner accent guides */}
                    <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-red-400" />
                    <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-red-400" />
                    <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-red-400" />
                    <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-red-400" />
                  </div>

                  <p className="relative z-10 text-[11px] text-zinc-300 font-medium mt-3 bg-zinc-950/80 backdrop-blur-xs px-3 py-1 rounded-full border border-zinc-800 shadow-md">
                    Coloca solo los 8 números de la esquina inferior
                  </p>
                </div>

                {/* Quick controls on top of camera (Zoom Slider, Torch, Switch Camera) */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  {/* Zoom Slider Control (1.0x to 5.0x) */}
                  <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md rounded-full px-2.5 py-1 border border-zinc-800 text-xs font-mono shadow-md">
                    <ZoomIn className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={zoomLevel}
                      onChange={(e) => handleSetZoom(parseFloat(e.target.value))}
                      className="w-16 sm:w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      title="Ajustar zoom (1.0x a 5.0x)"
                    />
                    <span className="text-[10px] font-bold text-zinc-200 min-w-8 text-right">
                      {zoomLevel.toFixed(1)}x
                    </span>
                  </div>

                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                        torchOn
                          ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                          : 'bg-black/60 text-zinc-300 hover:bg-black/80'
                      }`}
                      title={torchOn ? 'Apagar flash' : 'Encender flash'}
                    >
                      {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                    </button>
                  )}

                  {availableDevices.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 hover:bg-black/80 transition-colors"
                      title="Cambiar cámara"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-zinc-800 text-[11px] font-mono">
                  {loadingCard ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                      <span className="text-red-300">Consultando carta #{scannedCode}...</span>
                    </>
                  ) : isOcrProcessing ? (
                    <>
                      <ScanLine className="w-3 h-3 animate-pulse text-cyan-400" />
                      <span className="text-cyan-300">Analizando números...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-zinc-300">Buscando código...</span>
                    </>
                  )}
                </div>

                {/* Temporary Notice for Continuous Mode */}
                <AnimatePresence>
                  {lastRegisteredNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="absolute bottom-4 z-30 px-3.5 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 border border-emerald-400/40"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lastRegisteredNotice} añadida</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Bottom Card Preview & Registration Section */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col gap-3">
            {cameraError && !detectedCard && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span className="flex-1">{cameraError}</span>
              </div>
            )}

            {detectedCard ? (
              <div className="flex flex-col gap-3">
                {/* Detected Card Details Badge */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-950 border border-red-500/40 shadow-md">
                  <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
                    <Image
                      src={detectedCard.image_url_small || detectedCard.image_url}
                      alt={detectedCard.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900/60">
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

                  {/* Quick Reset */}
                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors text-[10px] font-mono flex flex-col items-center cursor-pointer"
                    title="Descartar y escanear otra"
                  >
                    <RefreshCw className="w-4 h-4 mb-0.5" />
                    <span>Cambiar</span>
                  </button>
                </div>

                {/* Quantity Controls & Submit */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  {/* Stepper */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono text-zinc-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= maxQuantity}
                      onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action Register Button */}
                  <button
                    type="button"
                    onClick={handleRegister}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-950 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Registrar Carta ({quantity}x)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
                  <Layers className="w-3.5 h-3.5 text-red-500" />
                  <span>Escáner activo</span>
                </div>

                {/* Manual Trigger Scan button */}
                <button
                  type="button"
                  onClick={performScan}
                  disabled={isOcrProcessing || loadingCard}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  <span>Escanear Ahora</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
