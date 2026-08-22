/**
 * Almacén de Estadísticas y Aprendizaje por Dígitos (0-9) para el Escáner OCR
 * 
 * Permite trackear intentos en un búfer temporal y consolidar aciertos, fallos y pares de
 * confusión cuando se confirma el código real de 8 dígitos de una carta.
 */

const STORAGE_KEY = 'yg_ocr_digit_metrics_v1';

export interface DigitMetric {
  digit: number; // 0..9
  hits: number; // Cantidad de veces que se reconoció correctamente
  misses: number; // Cantidad de veces que se leyó este dígito pero era otro
  confusions: Record<number, number>; // Frecuencia de qué dígito era realmente cuando falló (ej. { 9: 4, 0: 1 })
}

export interface OcrConsolidatedMetrics {
  totalScansEvaluated: number; // Total de cartas confirmadas evaluadas
  totalAttemptsLogged: number; // Total de lecturas / frames individuales analizados
  digits: Record<number, DigitMetric>;
  lastUpdated: number;
}

const createInitialDigits = (): Record<number, DigitMetric> => {
  const digits: Record<number, DigitMetric> = {};
  for (let i = 0; i <= 9; i++) {
    digits[i] = {
      digit: i,
      hits: 0,
      misses: 0,
      confusions: {},
    };
  }
  return digits;
};

const createInitialMetrics = (): OcrConsolidatedMetrics => ({
  totalScansEvaluated: 0,
  totalAttemptsLogged: 0,
  digits: createInitialDigits(),
  lastUpdated: Date.now(),
});

class OcrDigitStatsStore {
  private metrics: OcrConsolidatedMetrics = createInitialMetrics();
  private isLoaded: boolean = false;
  private temporalBuffer: string[] = []; // Intentos acumulados en la sesión del escaneo actual

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: OcrConsolidatedMetrics = JSON.parse(raw);
        // Garantizar que todos los dígitos del 0 al 9 existan en la estructura
        const initial = createInitialDigits();
        for (let i = 0; i <= 9; i++) {
          if (parsed.digits && parsed.digits[i]) {
            initial[i] = {
              digit: i,
              hits: parsed.digits[i].hits || 0,
              misses: parsed.digits[i].misses || 0,
              confusions: parsed.digits[i].confusions || {},
            };
          }
        }
        this.metrics = {
          totalScansEvaluated: parsed.totalScansEvaluated || 0,
          totalAttemptsLogged: parsed.totalAttemptsLogged || 0,
          digits: initial,
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
      }
      this.isLoaded = true;
    } catch {
      this.metrics = createInitialMetrics();
    }
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      this.metrics.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metrics));
    } catch {
      // Ignorar errores de almacenamiento local (cuotas excedidas, etc.)
    }
  }

  /**
   * Registra un intento de lectura raw (dígitos analizados por el OCR) en el búfer temporal de la sesión activa.
   */
  public logAttempt(scannedCode: string): void {
    const digits = scannedCode.replace(/\D/g, '');
    if (digits.length >= 8) {
      // Tomar exactamente los primeros 8 dígitos o el bloque principal
      const clean = digits.slice(0, 8);
      // Evitar inundar con duplicados idénticos consecutivos en el mismo segundo
      if (this.temporalBuffer.length === 0 || this.temporalBuffer[this.temporalBuffer.length - 1] !== clean) {
        this.temporalBuffer.push(clean);
      }
    }
  }

  /**
   * Limpia el búfer temporal sin consolidar (ej. al cancelar o reiniciar el escáner).
   */
  public clearTemporalBuffer(): void {
    this.temporalBuffer = [];
  }

  /**
   * Consolida todos los intentos del búfer temporal contra el código real y definitivo de 8 dígitos de la carta encontrada.
   * Si no hubo intentos en el búfer (ej. ingreso manual directo), consolida un acierto directo a los 8 dígitos reales.
   */
  public consolidateCardSession(actualPasscode: string): void {
    if (!this.isLoaded) this.loadFromStorage();

    const cleanActual = actualPasscode.replace(/\D/g, '').padStart(8, '0').slice(-8);
    if (cleanActual.length !== 8) {
      this.clearTemporalBuffer();
      return;
    }

    const attemptsToEvaluate = this.temporalBuffer.length > 0 ? [...this.temporalBuffer] : [cleanActual];
    this.temporalBuffer = []; // Vaciar inmediatamente para la siguiente carta

    this.metrics.totalScansEvaluated += 1;
    this.metrics.totalAttemptsLogged += attemptsToEvaluate.length;

    for (const attempt of attemptsToEvaluate) {
      const cleanAttempt = attempt.padStart(8, '0').slice(-8);

      for (let pos = 0; pos < 8; pos++) {
        const readChar = cleanAttempt[pos];
        const actualChar = cleanActual[pos];

        const readDigit = parseInt(readChar, 10);
        const actualDigit = parseInt(actualChar, 10);

        if (isNaN(readDigit) || isNaN(actualDigit) || readDigit < 0 || readDigit > 9 || actualDigit < 0 || actualDigit > 9) {
          continue;
        }

        const metric = this.metrics.digits[readDigit];
        if (!metric) continue;

        if (readDigit === actualDigit) {
          // Acierto: el OCR interpretó correctamente el dígito en esta posición
          metric.hits += 1;
        } else {
          // Desacierto: el OCR interpretó readDigit pero el valor real era actualDigit
          metric.misses += 1;
          metric.confusions[actualDigit] = (metric.confusions[actualDigit] || 0) + 1;
        }
      }
    }

    this.persistToStorage();
  }

  /**
   * Obtiene la tasa de error histórica (0.0 a 1.0) para un dígito dado.
   * Si un dígito no tiene datos suficientes, devuelve una tasa neutra de 0.15.
   */
  public getDigitErrorRate(digitChar: string): number {
    if (!this.isLoaded) this.loadFromStorage();
    const d = parseInt(digitChar, 10);
    if (isNaN(d) || !this.metrics.digits[d]) return 0.15;

    const metric = this.metrics.digits[d];
    const total = metric.hits + metric.misses;
    if (total === 0) return 0.15; // Sin historial suficiente

    return metric.misses / total;
  }

  /**
   * Devuelve la lista ordenada de dígitos con los que más se confunde un dígito leído (de mayor a menor frecuencia observada).
   */
  public getDigitConfusionRanking(digitChar: string): string[] {
    if (!this.isLoaded) this.loadFromStorage();
    const d = parseInt(digitChar, 10);
    if (isNaN(d) || !this.metrics.digits[d]) return [];

    const confusions = this.metrics.digits[d].confusions;
    const sorted = Object.entries(confusions)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([targetDigit]) => targetDigit);

    return sorted;
  }

  /**
   * Devuelve el objeto consolidado completo de métricas (0 a 9).
   */
  public getMetrics(): OcrConsolidatedMetrics {
    if (!this.isLoaded) this.loadFromStorage();
    return JSON.parse(JSON.stringify(this.metrics));
  }

  /**
   * Devuelve el número de intentos pendientes en el búfer temporal actual.
   */
  public getPendingAttemptsCount(): number {
    return this.temporalBuffer.length;
  }

  /**
   * Reinicia todas las estadísticas consolidadas y el búfer temporal.
   */
  public resetMetrics(): void {
    this.metrics = createInitialMetrics();
    this.temporalBuffer = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignorar
      }
    }
  }
}

export const OcrDigitStats = new OcrDigitStatsStore();
