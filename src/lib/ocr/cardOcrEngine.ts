import { createWorker, Worker, PSM } from 'tesseract.js';
import { OcrLearningMemory } from './ocrLearningMemory';

let workerPromise: Promise<Worker> | null = null;

/**
 * Obtiene o inicializa el Worker singleton de Tesseract.js configurado con
 * parámetros óptimos: PSM.SINGLE_BLOCK (6), DPI 300 y whitelist numérica.
 */
export async function getCardOcrWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // PSM 6 es inmune a saltos de línea y fragmentaciones
        user_defined_dpi: '300', // Fuerza a Tesseract a escalar los glifos de 300 DPI sin descartar líneas
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
 * Analiza rápidamente (<1ms) si el área del visor contiene suficiente variación
 * de luminosidad para albergar una carta con números antes de invocar el OCR.
 */
export function hasCardVisualFeatures(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width <= 0 || canvas.height <= 0) return false;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const totalPixels = data.length / 4;
  if (totalPixels === 0) return false;

  let sum = 0;
  let sumSq = 0;
  let sampleCount = 0;

  for (let i = 0; i < data.length; i += 16) {
    const lum = data[i];
    sum += lum;
    sumSq += lum * lum;
    sampleCount++;
  }

  if (sampleCount === 0) return false;

  const mean = sum / sampleCount;
  const variance = sumSq / sampleCount - mean * mean;
  const stdDev = Math.sqrt(Math.max(0, variance));

  return stdDev > 15;
}

/**
 * Extrae y preprocesa el recorte del visor aplicando:
 * 1. Escalado de alta resolución 4.0x (glifos de ~50px de altura para LSTM).
 * 2. Conversión a escala de grises.
 * 3. Binarización inteligente mediante algoritmo de Otsu (tinta negra pura sobre fondo blanco puro).
 * 4. Margen perimetral blanco (Quiet Zone de 28px) requerido por la red neuronal de Tesseract.
 */
export function extractAndPreprocessViewfinder(
  video: HTMLVideoElement,
  cropRect: ViewfinderCropRect,
  invert: boolean = false
): HTMLCanvasElement | null {
  if (!video.videoWidth || !video.videoHeight || cropRect.width <= 0 || cropRect.height <= 0) {
    return null;
  }

  const sx = Math.max(0, Math.min(cropRect.x, video.videoWidth - 1));
  const sy = Math.max(0, Math.min(cropRect.y, video.videoHeight - 1));
  const sw = Math.min(cropRect.width, video.videoWidth - sx);
  const sh = Math.min(cropRect.height, video.videoHeight - sy);

  if (sw <= 8 || sh <= 8) return null;

  // Escalado óptimo 4.0x
  const scale = 4.0;
  const rawW = Math.round(sw * scale);
  const rawH = Math.round(sh * scale);

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = rawW;
  rawCanvas.height = rawH;

  const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
  if (!rawCtx) return null;

  rawCtx.imageSmoothingEnabled = true;
  rawCtx.imageSmoothingQuality = 'high';
  rawCtx.drawImage(video, sx, sy, sw, sh, 0, 0, rawW, rawH);

  const imgData = rawCtx.getImageData(0, 0, rawW, rawH);
  const src = imgData.data;
  const total = rawW * rawH;

  // 1. Escala de grises + histograma
  const gray = new Uint8Array(total);
  const hist = new Array(256).fill(0);

  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    const lum = Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]);
    gray[p] = lum;
    hist[lum]++;
  }

  // 2. Umbralización óptima de Otsu
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  // 3. Crear canvas final con Quiet-Zone (margen blanco de 28px)
  const pad = 28;
  const finalW = rawW + pad * 2;
  const finalH = rawH + pad * 2;

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalW;
  finalCanvas.height = finalH;

  const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
  if (!finalCtx) return null;

  // Fondo blanco sólido
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, finalW, finalH);

  const finalImgData = finalCtx.getImageData(0, 0, finalW, finalH);
  const dst = finalImgData.data;

  // Renderizar píxeles binarizados en el centro
  for (let y = 0; y < rawH; y++) {
    for (let x = 0; x < rawW; x++) {
      const p = y * rawW + x;
      const isDark = gray[p] < threshold;
      const isInk = invert ? !isDark : isDark;
      const val = isInk ? 0 : 255;

      const dstIdx = ((y + pad) * finalW + (x + pad)) * 4;
      dst[dstIdx] = val;
      dst[dstIdx + 1] = val;
      dst[dstIdx + 2] = val;
      dst[dstIdx + 3] = 255;
    }
  }

  finalCtx.putImageData(finalImgData, 0, 0);
  return finalCanvas;
}

/**
 * Escanea el canvas preprocesado con Tesseract y busca el código de 8 dígitos de la carta.
 * Aplica:
 * - Extracción estricta de los primeros 8 dígitos de izquierda a derecha.
 * - Resolución instantánea mediante Memoria de Aprendizaje Continuo (OcrLearningMemory).
 */
export async function recognizeCardPasscode(
  canvas: HTMLCanvasElement
): Promise<{ code: string; rawText: string; fromLearningMemory?: boolean } | null> {
  try {
    const worker = await getCardOcrWorker();
    const result = await worker.recognize(canvas);
    const rawText = result.data.text || '';

    // 1. Limpieza de textos y palabras clave del borde inferior
    const cleanedText = rawText
      .replace(/\b1\s*(?:st|ST|St|ed|ED|Ed)?\b/gi, ' ')
      .replace(/\b(?:edition|limited|unlimited|kazuki|takahashi|konami|studio|dice|shueisha|tv|tokyo)\b/gi, ' ');

    let extractedDigits: string | null = null;

    // 2. Buscar primero cualquier bloque aislado exacto de 8 dígitos (\b\d{8}\b)
    const match8 = cleanedText.match(/(?:^|\D)(\d{8})(?:\D|$)/) || rawText.match(/(?:^|\D)(\d{8})(?:\D|$)/);
    if (match8 && match8[1]) {
      extractedDigits = match8[1];
    } else {
      // 3. Extracción secuencial de dígitos limpios (primeros 8)
      const cleanDigits = cleanedText.replace(/\D/g, '');
      if (cleanDigits.length >= 8) {
        extractedDigits = cleanDigits.slice(0, 8);
      } else {
        const rawDigits = rawText.replace(/\D/g, '');
        if (rawDigits.length >= 8) {
          extractedDigits = rawDigits.slice(0, 8);
        }
      }
    }

    if (!extractedDigits) return null;

    // 4. Consultar memoria de aprendizaje continuo
    const resolvedFromMemory = OcrLearningMemory.resolve(extractedDigits);
    const isLearned = resolvedFromMemory !== extractedDigits;

    return {
      code: resolvedFromMemory,
      rawText,
      fromLearningMemory: isLearned,
    };
  } catch (error) {
    console.error('Error durante el reconocimiento OCR:', error);
    return null;
  }
}
