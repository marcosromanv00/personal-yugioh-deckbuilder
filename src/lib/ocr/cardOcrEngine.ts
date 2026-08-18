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
 * el motor pesado de OCR Tesseract.js.
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
    const lum = data[i]; // Ya está en escala de grises
    sum += lum;
    sumSq += lum * lum;
    sampleCount++;
  }

  if (sampleCount === 0) return false;

  const mean = sum / sampleCount;
  const variance = sumSq / sampleCount - mean * mean;
  const stdDev = Math.sqrt(Math.max(0, variance));

  // Si la desviación estándar es muy baja (<25), el área es completamente plana/uniforme sin dígitos legibles
  return stdDev > 25;
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
  // Escalamos 2.0x para balance óptimo entre nitidez de dígitos y consumo ligero de CPU/RAM
  const scale = 2.0;
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
 * Escanea el canvas preprocesado con Tesseract y busca un código de 8 dígitos continuo,
 * ignorando automáticamente textos como '1st Edition', 'Limited Edition' y ruidos del borde.
 */
export async function recognizeCardPasscode(
  canvas: HTMLCanvasElement
): Promise<{ code: string; rawText: string } | null> {
  try {
    const worker = await getCardOcrWorker();
    const result = await worker.recognize(canvas);
    const rawText = result.data.text || '';

    // 1. Limpieza de textos y frases comunes en el borde de cartas Yu-Gi-Oh! (1st Edition, Limited, etc.)
    const cleanedText = rawText
      .replace(/\b1\s*(?:st|ST|St)?\b/gi, ' ') // "1st", "1ST", "1 st"
      .replace(/\b(?:edition|limited|unlimited|kazuki|takahashi|konami|studio|dice|shueisha|tv|tokyo)\b/gi, ' ');

    // 2. Buscar un bloque exacto de 8 dígitos aislado (evita confundir el "1" de "1st")
    const match8 = cleanedText.match(/(?:^|\D)(\d{8})(?:\D|$)/) || rawText.match(/(?:^|\D)(\d{8})(?:\D|$)/);
    if (match8 && match8[1]) {
      return { code: match8[1], rawText };
    }

    // 3. Extraer dígitos limpios tras eliminar palabras clave
    const cleanedDigits = cleanedText.replace(/\D/g, '');
    if (cleanedDigits.length === 8) {
      return { code: cleanedDigits, rawText };
    }

    // 4. Si los dígitos tienen 9 caracteres y empiezan por "1" (residuo del "1" en "1st Edition")
    const rawDigits = rawText.replace(/\D/g, '');
    if (rawDigits.length === 9 && rawDigits.startsWith('1')) {
      return { code: rawDigits.slice(1), rawText };
    }

    // 5. Si tiene entre 8 y 10 dígitos, tomar el bloque de 8 dígitos más coherente (preferir últimos 8 si empieza con 1)
    if (rawDigits.length >= 8 && rawDigits.length <= 10) {
      if (rawDigits.startsWith('1') && rawDigits.length > 8) {
        return { code: rawDigits.slice(-8), rawText };
      }
      return { code: rawDigits.slice(0, 8), rawText };
    }

    return null;
  } catch (error) {
    console.error('Error durante el reconocimiento OCR:', error);
    return null;
  }
}
