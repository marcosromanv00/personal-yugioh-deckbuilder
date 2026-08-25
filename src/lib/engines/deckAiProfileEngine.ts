import { DeckCard } from '@/components/deckbuilder/types';
import { generateExordioDeckAnalysis, ExordioAnalysisResult } from './exordioAnalytics';
import { analyzeDeckDnaAndEngines, DeckDnaAnalysisResult } from './advancedSynergyEngine';

export const CURRENT_META_VERSION = '2026-08-LIVE';
const PROFILE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días de vigencia antes de refrescar análisis de meta
const CACHE_STORAGE_KEY = 'yg_deck_ai_profiles_v1';

export interface DeckAIProfile {
  deckId: string | 'active-draft';
  lastCalculatedAt: number;
  deckHash: string;
  format: 'TCG' | 'Master Duel' | 'Duel Links';
  metaVersion: string;
  isStale: boolean;

  // 1. ADN Táctico y Sinergias
  inferredArchetype: string;
  secondaryEngines: string[];
  gameplan: 'going_2nd_otk' | 'control_trap' | 'midrange_fusion' | 'combo_board';
  dna: {
    dominantAttributes: { attribute: string; count: number }[];
    dominantRaces: { race: string; count: number }[];
    monsterSpellTrapRatio: { monsters: number; spells: number; traps: number; extra: number };
    rankAndLevelDistribution: Record<number, number>;
  };
  activeEnablers: {
    hasMachineDuplicationTargets: boolean;
    hasLightMachineSearchTargets: boolean;
    hasContactFusionCapability: boolean;
    hasRank5Enablers: boolean;
    hasTherionEquipTargets: boolean;
    hasSuperPolyTargets: boolean;
    hasDiscardSynergy: boolean;
  };
  compatibleEngines: {
    archetype: string;
    affinityScore: number;
    strategicRationale: string;
    cardCountOwned?: number;
  }[];

  // 2. Snapshot Completo de Análisis Exordio
  exordioAnalysis: ExordioAnalysisResult;
}

/**
 * Genera un hash rápido para detectar cambios en las cartas del mazo o formato.
 */
export function computeDeckHash(deckCards: Array<{ id?: number; card_id?: number; count?: number; section?: string }>, format: string = 'TCG'): string {
  if (!deckCards || deckCards.length === 0) return `empty_${format}`;
  
  const sortedSignature = deckCards
    .map((c) => `${c.id || c.card_id || 0}:${c.count || 1}:${c.section || 'main'}`)
    .sort()
    .join('|');

  return `${format}_${sortedSignature}`;
}

// In-Memory Fast Cache
const memoryProfileCache = new Map<string, DeckAIProfile>();

/**
 * Lee la caché persistente desde localStorage de forma segura.
 */
function readPersistentCache(): Record<string, DeckAIProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DeckAIProfile>;
  } catch (err) {
    console.warn('Error leyendo caché de Fichas IA:', err);
    return {};
  }
}

/**
 * Guarda una Ficha IA en localStorage y en memoria.
 */
export function saveDeckAIProfile(profile: DeckAIProfile): void {
  const key = profile.deckId || 'active-draft';
  memoryProfileCache.set(key, profile);

  if (typeof window !== 'undefined') {
    try {
      const all = readPersistentCache();
      all[key] = profile;
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn('Error guardando Ficha IA en almacenamiento persistente:', err);
    }
  }
}

/**
 * Obtiene la Ficha IA guardada si es válida y coincide con el hash actual de cartas.
 */
export function getCachedDeckAIProfile(
  deckId: string | 'active-draft',
  currentCards: DeckCard[],
  format: 'TCG' | 'Master Duel' | 'Duel Links' = 'TCG'
): { profile: DeckAIProfile | null; isStale: boolean } {
  const key = deckId || 'active-draft';
  const currentHash = computeDeckHash(currentCards, format);

  // 1. Consultar memoria
  let candidate = memoryProfileCache.get(key);

  // 2. Consultar almacenamiento persistente si no está en memoria
  if (!candidate) {
    const persisted = readPersistentCache();
    if (persisted[key]) {
      candidate = persisted[key];
      memoryProfileCache.set(key, candidate);
    }
  }

  if (!candidate) {
    return { profile: null, isStale: true };
  }

  // 3. Comprobar si las cartas han cambiado
  if (candidate.deckHash !== currentHash) {
    return { profile: { ...candidate, isStale: true }, isStale: true };
  }

  // 4. Comprobar TTL y versión de meta
  const isTimeStale = Date.now() - candidate.lastCalculatedAt > PROFILE_TTL_MS;
  const isVersionStale = candidate.metaVersion !== CURRENT_META_VERSION;
  const isFormatStale = candidate.format !== format;

  const isStale = isTimeStale || isVersionStale || isFormatStale;

  return {
    profile: {
      ...candidate,
      isStale,
    },
    isStale,
  };
}

/**
 * Calcula y genera una Ficha IA completa para un mazo.
 */
export function buildDeckAIProfile(
  deckId: string | 'active-draft',
  deckCards: DeckCard[],
  format: 'TCG' | 'Master Duel' | 'Duel Links' = 'TCG',
  inferredArchetypeOverride?: string
): DeckAIProfile {
  const hash = computeDeckHash(deckCards, format);
  
  // 1. Análisis de ADN y Motores compatibles
  const dnaResult: DeckDnaAnalysisResult = analyzeDeckDnaAndEngines(deckCards, inferredArchetypeOverride);

  // 2. Análisis Exordio completo (Métricas, radar, cartas clave, simulaciones)
  const exordioAnalysis = generateExordioDeckAnalysis(deckCards, dnaResult.inferredArchetype);

  const profile: DeckAIProfile = {
    deckId: deckId || 'active-draft',
    lastCalculatedAt: Date.now(),
    deckHash: hash,
    format,
    metaVersion: CURRENT_META_VERSION,
    isStale: false,
    inferredArchetype: dnaResult.inferredArchetype,
    secondaryEngines: dnaResult.secondaryEngines,
    gameplan: dnaResult.gameplan,
    dna: dnaResult.dna,
    activeEnablers: dnaResult.activeEnablers,
    compatibleEngines: dnaResult.compatibleEngines,
    exordioAnalysis,
  };

  saveDeckAIProfile(profile);
  return profile;
}

// Debounce timer para actualizaciones en segundo plano
let backgroundCalcTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Programa una actualización en segundo plano de la Ficha IA sin congelar la interfaz.
 */
export function scheduleBackgroundProfileUpdate(
  deckId: string | 'active-draft',
  deckCards: DeckCard[],
  format: 'TCG' | 'Master Duel' | 'Duel Links' = 'TCG',
  onUpdated?: (profile: DeckAIProfile) => void,
  debounceMs: number = 300
): void {
  if (backgroundCalcTimer) {
    clearTimeout(backgroundCalcTimer);
  }

  backgroundCalcTimer = setTimeout(() => {
    try {
      const updated = buildDeckAIProfile(deckId, deckCards, format);
      if (onUpdated) {
        onUpdated(updated);
      }
    } catch (err) {
      console.warn('Error en cálculo en segundo plano de Ficha IA:', err);
    }
  }, debounceMs);
}
