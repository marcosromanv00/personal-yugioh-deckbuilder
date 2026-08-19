/**
 * Sistema de Aprendizaje Continuo para el Escáner OCR de Yu-Gi-Oh! (Self-Learning OCR Memory)
 * 
 * Permite que el escáner recuerde correcciones manuales y resoluciones de autocorrección,
 * haciendo que el sistema sea inmune a fallos repetitivos y aprenda de cada escaneo.
 */

const STORAGE_KEY = 'yg_ocr_learned_corrections_v1';

export interface LearnedCorrection {
  rawScanned: string;
  actualPasscode: string;
  cardName: string;
  timestamp: number;
  hitCount: number;
}

class OcrLearningMemoryStore {
  private cache: Map<string, LearnedCorrection> = new Map();
  private isLoaded: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, LearnedCorrection> = JSON.parse(raw);
        Object.entries(parsed).forEach(([key, val]) => {
          this.cache.set(key, val);
        });
      }
      this.isLoaded = true;
    } catch {
      this.cache = new Map();
    }
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, LearnedCorrection> = {};
      this.cache.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }

  /**
   * Resuelve si un código escaneado tiene una corrección previamente aprendida.
   */
  public resolve(scannedCode: string): string {
    if (!this.isLoaded) this.loadFromStorage();
    const clean = scannedCode.replace(/\D/g, '').slice(0, 8);
    const learned = this.cache.get(clean);
    if (learned) {
      learned.hitCount = (learned.hitCount || 0) + 1;
      this.persistToStorage();
      return learned.actualPasscode;
    }
    return clean;
  }

  /**
   * Guarda un nuevo aprendizaje de corrección (ej. cuando el OCR leyó '28616929' pero la carta era '29616929').
   */
  public learnCorrection(scannedCode: string, actualPasscode: string, cardName: string): void {
    if (!this.isLoaded) this.loadFromStorage();
    const cleanScanned = scannedCode.replace(/\D/g, '').slice(0, 8);
    const cleanActual = actualPasscode.replace(/\D/g, '').slice(0, 8);

    if (!cleanScanned || !cleanActual) return;

    this.cache.set(cleanScanned, {
      rawScanned: cleanScanned,
      actualPasscode: cleanActual,
      cardName,
      timestamp: Date.now(),
      hitCount: 1,
    });

    this.persistToStorage();
  }

  /**
   * Devuelve todas las correcciones aprendidas por el usuario.
   */
  public getAllLearned(): LearnedCorrection[] {
    if (!this.isLoaded) this.loadFromStorage();
    return Array.from(this.cache.values());
  }

  /**
   * Limpia la memoria de aprendizaje si el usuario lo solicita.
   */
  public clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignorar
      }
    }
  }
}

export const OcrLearningMemory = new OcrLearningMemoryStore();
