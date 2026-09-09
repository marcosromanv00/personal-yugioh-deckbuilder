import { ScannerStage } from './scanner.types';
import {
  ViewfinderCropRect,
  recognizeCardPasscode,
  extractGrayscaleViewfinder,
  extractAndPreprocessViewfinder,
} from '@/lib/ocr/cardOcrEngine';

export function getViewfinderStyles(scannerStage: ScannerStage) {
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
}

export function computeCropRect(
  video: HTMLVideoElement | null,
  vf: HTMLDivElement | null,
  digitalZoomFactor: number
): ViewfinderCropRect | null {
  if (!video || !vf || !video.videoWidth || !video.videoHeight) return null;

  const videoRect = video.getBoundingClientRect();
  const vfRect = vf.getBoundingClientRect();
  if (videoRect.width <= 0 || videoRect.height <= 0) return null;

  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;
  const dWidth = videoRect.width;
  const dHeight = videoRect.height;

  const scale = Math.max(dWidth / vWidth, dHeight / vHeight);
  const renderedWidth = vWidth * scale;
  const renderedHeight = vHeight * scale;

  const offsetX = (dWidth - renderedWidth) / 2;
  const offsetY = (dHeight - renderedHeight) / 2;

  const vfCenterX = vfRect.left + vfRect.width / 2 - videoRect.left;
  const vfCenterY = vfRect.top + vfRect.height / 2 - videoRect.top;

  const digZoom = Math.max(1.0, digitalZoomFactor);
  const unzoomedCenterX = dWidth / 2 + (vfCenterX - dWidth / 2) / digZoom;
  const unzoomedCenterY = dHeight / 2 + (vfCenterY - dHeight / 2) / digZoom;
  const unzoomedWidth = vfRect.width / digZoom;
  const unzoomedHeight = vfRect.height / digZoom;

  const unzoomedLeft = unzoomedCenterX - unzoomedWidth / 2;
  const unzoomedTop = unzoomedCenterY - unzoomedHeight / 2;

  const rawCropX = Math.round((unzoomedLeft - offsetX) / scale);
  const rawCropY = Math.round((unzoomedTop - offsetY) / scale);
  const rawCropW = Math.round(unzoomedWidth / scale);
  const rawCropH = Math.round(unzoomedHeight / scale);

  const marginXLeft = Math.round(rawCropW * 0.05);
  const marginXRight = Math.round(rawCropW * 0.05);
  const marginY = Math.round(rawCropH * 0.04);
  const cropX = Math.max(0, rawCropX - marginXLeft);
  const cropY = Math.max(0, rawCropY - marginY);
  const cropW = Math.min(rawCropW + marginXLeft + marginXRight, vWidth - cropX);
  const cropH = Math.min(rawCropH + marginY * 2, vHeight - cropY);

  return { x: cropX, y: cropY, width: cropW, height: cropH };
}

export async function executeMultiPassOcr(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  cropRect: ViewfinderCropRect,
  isManualTrigger: boolean
) {
  let match = await recognizeCardPasscode(canvas);
  if (!match && isManualTrigger) {
    const grayCanvas = extractGrayscaleViewfinder(video, cropRect);
    if (grayCanvas) match = await recognizeCardPasscode(grayCanvas);
    if (!match) {
      const inverted = extractAndPreprocessViewfinder(video, cropRect, true);
      if (inverted) match = await recognizeCardPasscode(inverted);
    }
  }
  return match;
}
