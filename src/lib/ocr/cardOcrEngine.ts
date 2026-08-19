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
 * Analiza rápidamente (<1ms) si el canvas preprocesado contiene características
 * visuales de texto/bordes (varianza de contraste suficiente) antes de invocar
 * el motor de OCR Tesseract.js.
 */
export function hasCardVisualFeatures(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width <= 0 || canvas.height <= 0) return false;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const totalPixels = data.length / 4;
  if (totalPixels === 0) return false;

  // Tomamos una muestra uniforme cada 4 píxeles para máxima velocidad (<0.5ms)
  let sum = 0;
  let sumSq = 0;
  let sampleCount = 0;

  for (let i = 0; i < data.length; i += 16) {
    const lum = data[i]; // Ya en escala de grises
    sum += lum;
    sumSq += lum * lum;
    sampleCount++;
  }

  if (sampleCount === 0) return false;

  const mean = sum / sampleCount;
  const variance = sumSq / sampleCount - mean * mean;
  const stdDev = Math.sqrt(Math.max(0, variance));

  // Umbral optimizado (> 18) para permitir detección confiable incluso con luz tenue o fondos de baja saturación
  return stdDev > 18;
}

/**
 * Recorta la franja del visor desde el elemento <video> y aplica un preprocesamiento
 * de alta nitidez: escalado 3.0x, escala de grises, filtro convolucional de enfoque (Sharpening)
 * y normalización de contraste para separar nítidamente los números de cualquier marco de color.
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

  if (sw <= 8 || sh <= 8) return null;

  const canvas = document.createElement('canvas');
  // Escalamos 3.0x para alimentar a Tesseract con glifos grandes, detallados y sin aliasing pixelado
  const scale = 3.0;
  const width = Math.round(sw * scale);
  const height = Math.round(sh * scale);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Renderizar recorte escalado con suavizado de imagen
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const len = src.length;

  // 1. Paso de escala de grises y cálculo de histograma mín/máx
  const gray = new Uint8Array(width * height);
  let minLum = 255;
  let maxLum = 0;

  for (let i = 0, p = 0; i < len; i += 4, p++) {
    // Luminancia perceptual
    const lum = Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]);
    gray[p] = lum;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = maxLum - minLum || 1;

  // 2. Estiramiento de histograma normalizado
  for (let p = 0; p < gray.length; p++) {
    gray[p] = Math.round(((gray[p] - minLum) / range) * 255);
  }

  // 3. Filtro convolucional 3x3 de Enfoque / Realce de Bordes (Sharpen Kernel)
  // [  0, -1,  0 ]
  // [ -1,  5, -1 ]
  // [  0, -1,  0 ]
  const sharpened = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const yOffset = y * width;
    const yPrev = (y > 0 ? y - 1 : 0) * width;
    const yNext = (y < height - 1 ? y + 1 : height - 1) * width;

    for (let x = 0; x < width; x++) {
      const xPrev = x > 0 ? x - 1 : 0;
      const xNext = x < width - 1 ? x + 1 : width - 1;

      const c = gray[yOffset + x];
      const top = gray[yPrev + x];
      const bottom = gray[yNext + x];
      const left = gray[yOffset + xPrev];
      const right = gray[yOffset + xNext];

      const val = 5 * c - (top + bottom + left + right);
      sharpened[yOffset + x] = Math.max(0, Math.min(255, val));
    }
  }

  // 4. Copiar píxeles procesados al ImageData final
  for (let p = 0, i = 0; p < sharpened.length; p++, i += 4) {
    const val = sharpened[p];
    src[i] = val;
    src[i + 1] = val;
    src[i + 2] = val;
    src[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Escanea el canvas preprocesado con Tesseract y busca el código de 8 dígitos de la carta.
 * Regla Estricta: Extrae siempre los primeros 8 dígitos leídos de izquierda a derecha,
 * ignorando automáticamente el "1" de "1st Edition", "Limited Edition" o textos secundarios del borde.
 */
export async function recognizeCardPasscode(
  canvas: HTMLCanvasElement
): Promise<{ code: string; rawText: string } | null> {
  try {
    const worker = await getCardOcrWorker();
    const result = await worker.recognize(canvas);
    const rawText = result.data.text || '';

    // 1. Limpieza de textos y palabras clave del borde inferior
    const cleanedText = rawText
      .replace(/\b1\s*(?:st|ST|St|ed|ED|Ed)?\b/gi, ' ')
      .replace(/\b(?:edition|limited|unlimited|kazuki|takahashi|konami|studio|dice|shueisha|tv|tokyo)\b/gi, ' ');

    // 2. Buscar primero cualquier bloque aislado exacto de 8 dígitos (\b\d{8}\b)
    const match8 = cleanedText.match(/(?:^|\D)(\d{8})(?:\D|$)/) || rawText.match(/(?:^|\D)(\d{8})(?:\D|$)/);
    if (match8 && match8[1]) {
      return { code: match8[1], rawText };
    }

    // 3. Extracción secuencial de dígitos limpios (de izquierda a derecha)
    const cleanDigits = cleanedText.replace(/\D/g, '');
    if (cleanDigits.length >= 8) {
      // Regla estricta: Tomar exactamente los PRIMEROS 8 dígitos
      return { code: cleanDigits.slice(0, 8), rawText };
    }

    // 4. Fallback sobre el texto bruto original: primeros 8 dígitos
    const rawDigits = rawText.replace(/\D/g, '');
    if (rawDigits.length >= 8) {
      return { code: rawDigits.slice(0, 8), rawText };
    }

    return null;
  } catch (error) {
    console.error('Error durante el reconocimiento OCR:', error);
    return null;
  }
}
