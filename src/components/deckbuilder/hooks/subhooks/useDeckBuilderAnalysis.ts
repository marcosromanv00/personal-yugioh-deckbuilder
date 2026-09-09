import { useState, useMemo, useCallback } from 'react';
import { DeckCard, Replacement } from '../../types';
import { computeBanlistAlerts } from '@/lib/deck/banlist.utils';
import { analyzeDeckApi, syncMetaApi } from '../../services/deckBuilder.api';

interface UseDeckBuilderAnalysisParams {
  deckCards: DeckCard[];
  format: 'Master Duel' | 'TCG' | 'Duel Links';
  deckId: string | null;
  setDeckName: (name: string) => void;
  isManualDeckNameRef: React.MutableRefObject<boolean>;
  fetchSidebarBreakdown: (archetype: string) => Promise<void>;
}

export function useDeckBuilderAnalysis({
  deckCards,
  format,
  deckId,
  setDeckName,
  isManualDeckNameRef,
  fetchSidebarBreakdown,
}: UseDeckBuilderAnalysisParams) {
  const [inferredArchetype, setInferredArchetype] = useState('');
  const [detectedArchetypes, setDetectedArchetypes] = useState<{ name: string; count: number }[]>([]);
  const [activeArchetypeTab, setActiveArchetypeTab] = useState<string>('');
  const [replacements, setReplacements] = useState<Record<number, Replacement[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeReplacementCardId, setActiveReplacementCardId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const banlistAlerts = useMemo(
    () => computeBanlistAlerts(deckCards, format),
    [deckCards, format]
  );

  const analyzeDeck = useCallback(async (currentCards: DeckCard[], currentFormat: string) => {
    setIsAnalyzing(true);
    try {
      const payload = currentCards.map((c) => ({
        id: c.id,
        name: c.name,
        count: c.count,
        section: c.section,
      }));
      const json = await analyzeDeckApi(payload, currentFormat);
      const detected = json.detectedArchetypes || [];
      setDetectedArchetypes(detected);
      const primaryArch = json.archetype || (detected.length > 0 ? detected[0].name : 'Híbrido / Staples');
      setInferredArchetype(primaryArch);

      setActiveArchetypeTab((prev) => {
        if (prev && detected.some((d) => d.name === prev)) return prev;
        return detected.length > 0 ? detected[0].name : primaryArch;
      });

      setReplacements(json.replacements || {});

      if (!isManualDeckNameRef.current && !deckId) {
        if (currentCards.length === 0) {
          setDeckName('Nuevo Deck TCG');
        } else if (detected.length >= 2 && detected[0].count >= 2 && detected[1].count >= 2) {
          setDeckName(`${detected[0].name} ${detected[1].name}`);
        } else if (detected.length >= 1 && detected[0].count >= 2) {
          setDeckName(`Deck ${detected[0].name}`);
        } else if (detected.length >= 1) {
          setDeckName(detected[0].name);
        } else {
          setDeckName('Nuevo Deck TCG');
        }
      }
    } catch (e) {
      console.error('Error analizando deck:', e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [deckId, isManualDeckNameRef, setDeckName]);

  const triggerSync = useCallback(async (silent = false) => {
    setIsSyncing(true);
    try {
      const res = await syncMetaApi();
      if (res.ok) {
        if (!silent && res.message) alert(res.message);
        analyzeDeck(deckCards, format);
        if (inferredArchetype && inferredArchetype !== 'Híbrido / Staples') {
          fetchSidebarBreakdown(inferredArchetype);
        }
      } else if (!silent) {
        alert(`Error al sincronizar: ${res.error || 'Intente de nuevo'}`);
      }
    } catch (e) {
      console.error('Error sincronizando:', e);
      if (!silent) alert('Error de red al intentar sincronizar el meta.');
    } finally {
      setIsSyncing(false);
    }
  }, [analyzeDeck, deckCards, format, inferredArchetype, fetchSidebarBreakdown]);

  return {
    inferredArchetype,
    detectedArchetypes,
    activeArchetypeTab,
    setActiveArchetypeTab,
    banlistAlerts,
    replacements,
    isAnalyzing,
    activeReplacementCardId,
    setActiveReplacementCardId,
    isSyncing,
    analyzeDeck,
    triggerSync,
  };
}
