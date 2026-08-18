import { createWorker, Worker, PSM } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

/**
 * Obtiene o inicializa el Worker singleton de Tesseract.js configurado
 * específicamente para reconocimiento rápido de dígitos numéricos de 8 cifras.
 */
export async function getCardOcrWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * Termina el worker de OCR si se desea liberar memoria al desmontar.
 */
export async function terminateCardOcrWorker(): Promise<void> {
  if (workerPromise) {
    try {
      const worker = await workerPromise;
      await worker.terminate();
    } catch {
      // Ignorar errores al terminar
    } finally {
      workerPromise = null;
    }
  }
}

export interface ViewfinderCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Recorta la franja del visor desde el elemento <video> y aplica un preprocesamiento
 * de estiramiento de contraste y escala de grises para maximizar la nitidez de los dígitos.
 */
export function extractAndPreprocessViewfinder(
  video: HTMLVideoElement,
  cropRect: ViewfinderCropRect
): HTMLCanvasElement | null {
  if (!video.videoWidth || !video.videoHeight || cropRect.width <= 0 || cropRect.height <= 0) {
    return null;
  }

  // Asegurar límites dentro del video real
  const sx = Math.max(0, Math.min(cropRect.x, video.videoWidth - 1));
  const sy = Math.max(0, Math.min(cropRect.y, video.videoHeight - 1));
  const sw = Math.min(cropRect.width, video.videoWidth - sx);
  const sh = Math.min(cropRect.height, video.videoHeight - sy);

  if (sw <= 10 || sh <= 10) return null;

  const canvas = document.createElement('canvas');
  // Escalamos 2.5x para mejorar la resolución de lectura de fuentes pequeñas
  const scale = 2.5;
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Dibujar el recorte escalado
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // Preprocesamiento de píxeles: Escala de grises + estiramiento de histograma de contraste
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let minLum = 255;
  let maxLum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    data[i] = lum;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = maxLum - minLum || 1;

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i];
    // Estiramiento lineal del contraste sin eliminar anti-aliasing
    const stretched = Math.round(((lum - minLum) / range) * 255);
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Escanea el canvas preprocesado con Tesseract y busca un código de 8 dígitos continuo.
 * Retorna el código de 8 dígitos si se encuentra, o null si aún no coincide con confianza.
 */
export async function recognizeCardPasscode(
  canvas: HTMLCanvasElement
): Promise<{ code: string; rawText: string } | null> {
  try {
    const worker = await getCardOcrWorker();
    const result = await worker.recognize(canvas);
    const rawText = result.data.text || '';

    // 1. Buscar coincidencia directa de 8 dígitos
    const match8 = rawText.match(/\b\d{8}\b/);
    if (match8) {
      return { code: match8[0], rawText };
    }

    // 2. Extraer todos los dígitos limpios
    const digitsOnly = rawText.replace(/\D/g, '');
    
    // Si los dígitos limpios tienen exactamente 8 números
    if (digitsOnly.length === 8) {
      return { code: digitsOnly, rawText };
    }

    // Si tiene entre 8 y 10 dígitos (por ruidos en los bordes)
    if (digitsOnly.length >= 8 && digitsOnly.length <= 10) {
      const candidate = digitsOnly.slice(0, 8);
      return { code: candidate, rawText };
    }

    return null;
  } catch (error) {
    console.error('Error durante el reconocimiento OCR:', error);
    return null;
  }
}
