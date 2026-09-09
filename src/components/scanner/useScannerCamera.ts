import { useState, useEffect, useCallback, useRef } from 'react';
import { terminateCardOcrWorker } from '@/lib/ocr/cardOcrEngine';

interface UseScannerCameraParams {
  isOpen: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useScannerCamera({ isOpen, videoRef }: UseScannerCameraParams) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [maxHardwareZoom, setMaxHardwareZoom] = useState<number>(1.0);
  const [appliedHardwareZoom, setAppliedHardwareZoom] = useState<number>(1.0);

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

  const digitalZoomFactor = zoomLevel / appliedHardwareZoom;

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

  const handleSwitchCamera = () => {
    if (availableDevices.length <= 1) return;
    const currentIndex = availableDevices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % availableDevices.length;
    const nextDevice = availableDevices[nextIndex];
    if (nextDevice) setActiveDeviceId(nextDevice.deviceId);
  };

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    let localStream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            deviceId: activeDeviceId ? { exact: activeDeviceId } : undefined,
            facingMode: activeDeviceId ? undefined : { ideal: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            // @ts-expect-error advanced focusMode
            advanced: [{ focusMode: 'continuous' }],
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = mediaStream;
        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setCameraError('');
        setStream(mediaStream);
        setCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {});
        }

        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities?.() as {
            torch?: boolean;
            zoom?: { min: number; max: number; step: number };
          } | undefined;
          setHasTorch(Boolean(capabilities?.torch));
          setMaxHardwareZoom(capabilities?.zoom && capabilities.zoom.max > 1 ? capabilities.zoom.max : 1.0);
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (isMounted) {
          const videoDevices = devices.filter((d) => d.kind === 'videoinput');
          setAvailableDevices(videoDevices);
          if (!activeDeviceId && videoDevices.length > 0) {
            const currentDeviceId = videoTrack?.getSettings()?.deviceId;
            if (currentDeviceId) setActiveDeviceId(currentDeviceId);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setCameraPermission(false);
        const errorObj = err as Error;
        setCameraError(
          errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError'
            ? 'Permiso de cámara denegado. Concede acceso a la cámara para escanear.'
            : 'No se pudo inicializar la cámara. Verifica que no esté en uso por otra app.'
        );
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      if (localStream) localStream.getTracks().forEach((track) => track.stop());
      terminateCardOcrWorker();
    };
  }, [isOpen, activeDeviceId, retryTrigger]);

  const resetCamera = () => {
    setZoomLevel(1.0);
    setAppliedHardwareZoom(1.0);
    setCameraError('');
  };

  return {
    stream, cameraPermission, cameraError, setCameraError,
    availableDevices, activeDeviceId, hasTorch, torchOn, retryTrigger, setRetryTrigger,
    zoomLevel, appliedHardwareZoom, digitalZoomFactor,
    handleSetZoom, toggleTorch, handleSwitchCamera, resetCamera,
  };
}
