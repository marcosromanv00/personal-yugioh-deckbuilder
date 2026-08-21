import { createWorker, Worker, PSM } from 'tesseract.js';
import { OcrLearningMemory } from './ocrLearningMemory';

let workerPromise: Promise<Worker> | null = null;

/**
 * Obtiene o inicializa el Worker singleton de Tesseract.js configurado con
 * parámetros óptimos: PSM.SINGLE_LINE (7), DPI 300 y whitelist numérica.
 */
export async function getCardOcrWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_LINE, // PSM 7: asume una sola línea uniforme de texto (código de 8 dígitos)
        user_defined_dpi: '300',
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

export interface PasscodeOcrResult {
  code: string;
  candidates: string[];
  rawText: string;
  fromLearningMemory?: boolean;
}

/**
 * Captura un snapshot visual del área del recorte del visor en formato Data URL
 * para mostrar feedback visual en tiempo real en la interfaz.
 */
export function captureViewfinderSnapshotUrl(
  video: HTMLVideoElement,
  cropRect: ViewfinderCropRect
): string | null {
  if (!video.videoWidth || !video.videoHeight || cropRect.width <= 0 || cropRect.height <= 0) {
    return null;
  }

  const sx = Math.max(0, Math.min(cropRect.x, video.videoWidth - 1));
  const sy = Math.max(0, Math.min(cropRect.y, video.videoHeight - 1));
  const sw = Math.min(cropRect.width, video.videoWidth - sx);
  const sh = Math.min(cropRect.height, video.videoHeight - sy);

  if (sw <= 4 || sh <= 4) return null;

  const canvas = document.createElement('canvas');
  canvas.width = Math.min(320, sw);
  canvas.height = Math.max(20, Math.round((sh / sw) * canvas.width));

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  try {
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
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

  return stdDev > 12;
}

/**
 * Extrae y preprocesa el recorte del visor aplicando:
 * 1. Normalización de resolución: Altura fija a 80px (glifos de ~36px para Tesseract LSTM).
 * 2. Conversión a escala de grises.
 * 3. Umbralización adaptativa local mediante Imagen Integral O(1) (inmune a fondos y sombras).
 * 4. Supresión de líneas verticales de borde lateral izquierdo (previene '1' falso).
 * 5. Margen perimetral blanco (Quiet Zone de 24px).
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

  // Normalizar la altura a 80px (rango óptimo de 32-40px de glifo para LSTM de Tesseract)
  const targetH = 80;
  const targetW = Math.max(160, Math.min(480, Math.round((sw / sh) * targetH)));

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = targetW;
  rawCanvas.height = targetH;

  const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
  if (!rawCtx) return null;

  rawCtx.imageSmoothingEnabled = true;
  rawCtx.imageSmoothingQuality = 'high';
  rawCtx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);

  const imgData = rawCtx.getImageData(0, 0, targetW, targetH);
  const src = imgData.data;
  const total = targetW * targetH;

  // 1. Escala de grises
  const gray = new Uint8Array(total);
  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    gray[p] = Math.round(0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]);
  }

  // 2. Construcción de Imagen Integral (Summed Area Table) para umbralización adaptativa O(1)
  const integral = new Int32Array((targetW + 1) * (targetH + 1));
  for (let y = 0; y < targetH; y++) {
    let rowSum = 0;
    for (let x = 0; x < targetW; x++) {
      rowSum += gray[y * targetW + x];
      integral[(y + 1) * (targetW + 1) + (x + 1)] = integral[y * (targetW + 1) + (x + 1)] + rowSum;
    }
  }

  // Radio de vecindad adaptativa (~14px horizontal, ~10px vertical)
  const rx = 14;
  const ry = 10;
  const cOffset = 10; // Compensación de contraste

  // 3. Crear canvas final con Quiet-Zone (margen blanco de 24px)
  const pad = 24;
  const finalW = targetW + pad * 2;
  const finalH = targetH + pad * 2;

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalW;
  finalCanvas.height = finalH;

  const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
  if (!finalCtx) return null;

  // Fondo blanco puro
  finalCtx.fillStyle = '#ffffff';
  finalCtx.fillRect(0, 0, finalW, finalH);

  const finalImgData = finalCtx.getImageData(0, 0, finalW, finalH);
  const dst = finalImgData.data;

  // Matriz de píxeles binarizados antes de supresión de bordes
  const binaryGrid = new Uint8Array(total);

  for (let y = 0; y < targetH; y++) {
    const y1 = Math.max(0, y - ry);
    const y2 = Math.min(targetH - 1, y + ry);

    for (let x = 0; x < targetW; x++) {
      const x1 = Math.max(0, x - rx);
      const x2 = Math.min(targetW - 1, x + rx);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * (targetW + 1) + (x2 + 1)] -
        integral[y1 * (targetW + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (targetW + 1) + x1] +
        integral[y1 * (targetW + 1) + x1];

      const localMean = sum / count;
      const threshold = localMean - cOffset;

      const p = y * targetW + x;
      const isDarker = gray[p] < threshold;
      const isInk = invert ? !isDarker : isDarker;
      binaryGrid[p] = isInk ? 0 : 255;
    }
  }

  // 4. Supresión inteligente de artefacto de borde izquierdo (solo líneas continuas reales >80% altura)
  let foundBorder = false;
  for (let x = 0; x < Math.min(6, targetW); x++) {
    let darkCount = 0;
    for (let y = 0; y < targetH; y++) {
      if (binaryGrid[y * targetW + x] === 0) darkCount++;
    }
    // Solo suprimir si es una línea vertical continua extrema que abarca >80% de la altura
    if (darkCount > targetH * 0.8) {
      foundBorder = true;
      for (let y = 0; y < targetH; y++) {
        binaryGrid[y * targetW + x] = 255;
      }
    } else if (foundBorder) {
      break; // Dejar de suprimir una vez que termina el borde
    }
  }

  // 5. Micro-cierre morfológico horizontal para unir trazos finos (barra del 4, bucle del 9)
  const closedGrid = new Uint8Array(binaryGrid);
  for (let y = 1; y < targetH - 1; y++) {
    for (let x = 1; x < targetW - 1; x++) {
      const idx = y * targetW + x;
      if (binaryGrid[idx] === 255 && binaryGrid[idx - 1] === 0 && binaryGrid[idx + 1] === 0) {
        closedGrid[idx] = 0;
      }
    }
  }

  // Renderizar al canvas final con padding (Quiet-Zone)
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const val = closedGrid[y * targetW + x];
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
 * Diccionario de pares de confusión visual comunes en OCR para dígitos de cartas Yu-Gi-Oh!
 */
export const OCR_DIGIT_CONFUSION_MAP: Record<string, string[]> = {
  '1': ['4', '7', '0'],
  '4': ['1', '7', '9'],
  '9': ['5', '8', '0', '6', '4'],
  '5': ['9', '6', '3', '8'],
  '0': ['8', '6', '9', '1', '5'],
  '8': ['0', '9', '6', '3', '5'],
  '7': ['1', '4'],
  '6': ['8', '5', '0', '9'],
  '3': ['8', '5', '9'],
};

/**
 * Genera candidatos inteligentes de 8 dígitos priorizando sustituciones en los primeros 4 dígitos.
 */
export function generatePasscodeCandidates(rawCode: string): string[] {
  const digits = rawCode.replace(/\D/g, '');
  if (digits.length < 8) return [rawCode];

  const results = new Set<string>();

  if (digits.length === 8) {
    results.add(digits);

    const chars = digits.split('');

    // Prioridad 1: Sustituciones en los primeros 4 dígitos (posiciones 0..3)
    for (let i = 0; i < 4; i++) {
      const alts = OCR_DIGIT_CONFUSION_MAP[chars[i]];
      if (alts) {
        for (const alt of alts) {
          const variant = [...chars];
          variant[i] = alt;
          results.add(variant.join(''));
        }
      }
    }

    // Prioridad 2: Sustituciones en los últimos 4 dígitos (posiciones 4..7)
    for (let i = 4; i < 8; i++) {
      const alts = OCR_DIGIT_CONFUSION_MAP[chars[i]];
      if (alts) {
        for (const alt of alts) {
          const variant = [...chars];
          variant[i] = alt;
          results.add(variant.join(''));
        }
      }
    }

    // Prioridad 3: Doble sustitución en las primeras 4 posiciones (ej. 1->4 y 5->9)
    for (let i = 0; i < 2; i++) {
      const altsI = OCR_DIGIT_CONFUSION_MAP[chars[i]];
      if (altsI) {
        for (const altI of altsI) {
          for (let j = i + 1; j < 4; j++) {
            const altsJ = OCR_DIGIT_CONFUSION_MAP[chars[j]];
            if (altsJ) {
              for (const altJ of altsJ) {
                const variant = [...chars];
                variant[i] = altI;
                variant[j] = altJ;
                results.add(variant.join(''));
              }
            }
          }
        }
      }
    }
  } else if (digits.length === 9) {
    results.add(digits.slice(-8));
    results.add(digits.slice(0, 8));
  } else if (digits.length === 10) {
    results.add(digits.slice(1, 9));
    results.add(digits.slice(-8));
    results.add(digits.slice(0, 8));
  } else {
    for (let i = 0; i <= digits.length - 8; i++) {
      results.add(digits.slice(i, i + 8));
    }
  }

  return Array.from(results);
}

/**
 * Genera una versión en escala de grises con realce de contraste (Pase 2)
 * para permitir a la red neuronal de Tesseract aprovechar bordes anti-aliased.
 */
export function extractGrayscaleViewfinder(
  video: HTMLVideoElement,
  cropRect: ViewfinderCropRect
): HTMLCanvasElement | null {
  if (!video.videoWidth || !video.videoHeight || cropRect.width <= 0 || cropRect.height <= 0) {
    return null;
  }

  const sx = Math.max(0, Math.min(cropRect.x, video.videoWidth - 1));
  const sy = Math.max(0, Math.min(cropRect.y, video.videoHeight - 1));
  const sw = Math.min(cropRect.width, video.videoWidth - sx);
  const sh = Math.min(cropRect.height, video.videoHeight - sy);

  if (sw <= 8 || sh <= 8) return null;

  const targetH = 80;
  const targetW = Math.max(160, Math.min(480, Math.round((sw / sh) * targetH)));

  const pad = 24;
  const finalW = targetW + pad * 2;
  const finalH = targetH + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, finalW, finalH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, sx, sy, sw, sh, pad, pad, targetW, targetH);

  const imgData = ctx.getImageData(0, 0, finalW, finalH);
  const data = imgData.data;

  // Escala de grises con estiramiento de contraste
  let minLum = 255;
  let maxLum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  const range = maxLum - minLum || 1;
  for (let i = 0; i < data.length; i += 4) {
    const stretched = Math.round(((data[i] - minLum) / range) * 255);
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Escanea el canvas preprocesado con Tesseract y busca el código de 8 dígitos de la carta.
 * Aplica:
 * - Extracción inteligente de candidatos (descartando '1' espurio de bordes o '1st').
 * - Resolución instantánea mediante Memoria de Aprendizaje Continuo (OcrLearningMemory).
 */
export async function recognizeCardPasscode(
  canvas: HTMLCanvasElement
): Promise<PasscodeOcrResult | null> {
  try {
    const worker = await getCardOcrWorker();
    const result = await worker.recognize(canvas);
    const rawText = result.data.text || '';

    // 1. Limpieza de textos y palabras clave del borde inferior
    const cleanedText = rawText
      .replace(/\b1\s*(?:st|ST|St|ed|ED|Ed|a|A)?\b/gi, ' ')
      .replace(/\b(?:edition|edicion|limited|unlimited|kazuki|takahashi|konami|studio|dice|shueisha|tv|tokyo)\b/gi, ' ');

    const rawCandidatesSet: Set<string> = new Set();

    // 2. Buscar primero cualquier bloque aislado exacto de 8 dígitos (\b\d{8}\b)
    const match8 = cleanedText.match(/(?:^|\D)(\d{8})(?:\D|$)/) || rawText.match(/(?:^|\D)(\d{8})(?:\D|$)/);
    if (match8 && match8[1]) {
      rawCandidatesSet.add(match8[1]);
    }

    // 3. Extracción secuencial de dígitos limpios
    const cleanDigits = cleanedText.replace(/\D/g, '');
    const rawDigits = rawText.replace(/\D/g, '');
    const digitsToUse = cleanDigits.length >= 8 ? cleanDigits : rawDigits;

    if (digitsToUse.length >= 8) {
      rawCandidatesSet.add(digitsToUse);
    }

    if (rawCandidatesSet.size === 0) return null;

    // 4. Generar candidatos con matriz de confusión ponderada
    const fullCandidateList: string[] = [];
    rawCandidatesSet.forEach(rawCand => {
      const generated = generatePasscodeCandidates(rawCand);
      generated.forEach(g => {
        if (!fullCandidateList.includes(g)) fullCandidateList.push(g);
      });
    });

    if (fullCandidateList.length === 0) return null;

    const primaryCode = fullCandidateList[0];
    const resolvedFromMemory = OcrLearningMemory.resolve(primaryCode);
    const isLearned = resolvedFromMemory !== primaryCode;

    return {
      code: resolvedFromMemory,
      candidates: fullCandidateList,
      rawText,
      fromLearningMemory: isLearned,
    };
  } catch (error) {
    console.error('Error durante el reconocimiento OCR:', error);
    return null;
  }
}
