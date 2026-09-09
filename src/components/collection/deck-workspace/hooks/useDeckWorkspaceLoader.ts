import { useState, useEffect } from 'react';
import { Deck, UserCard, SleeveInventory, StorageLocation, DeckCardDetail } from '@/types/collection';
import { enrichDeckCardsWithPhysicalCopies } from '../deckWorkspacePhysical.utils';
import { parseSleevesList } from '../deckWorkspace.utils';

interface UseDeckWorkspaceLoaderParams {
  isOpen: boolean;
  deck: Deck | null;
  locations: StorageLocation[];
  sleeves: SleeveInventory[];
  setCurrentDeck: (d: Deck | null) => void;
  setName: (n: string) => void;
  setFormat: (f: string) => void;
  setIsActive: (a: boolean) => void;
  setStorageLocationId: (id: string) => void;
  setCompartmentIndex: (idx: number) => void;
  setDeckCards: (cards: DeckCardDetail[]) => void;
  setInitialDeckCards: (cards: DeckCardDetail[]) => void;
  setUserCards: (cards: UserCard[]) => void;
  setAvailableSleeves: (s: SleeveInventory[]) => void;
  setLoading: (l: boolean) => void;
  setInitialFormState: (st: Record<string, unknown> | null) => void;
  sleeveSetters: {
    setMainProtection: (p: 'single' | 'double' | 'triple') => void;
    setMainSleeveFitId: (id: string) => void;
    setMainSleeveId: (id: string) => void;
    setMainSleeveOverId: (id: string) => void;
    setExtraProtection: (p: 'single' | 'double' | 'triple') => void;
    setExtraSleeveFitId: (id: string) => void;
    setExtraSleeveId: (id: string) => void;
    setExtraSleeveOverId: (id: string) => void;
    setPoolProtection: (p: 'single' | 'double' | 'triple') => void;
    setPoolSleeveFitId: (id: string) => void;
    setPoolSleeveId: (id: string) => void;
    setPoolSleeveOverId: (id: string) => void;
  };
}

export function useDeckWorkspaceLoader({
  isOpen, deck, locations, sleeves, setCurrentDeck, setName, setFormat, setIsActive,
  setStorageLocationId, setCompartmentIndex, setDeckCards, setInitialDeckCards, setUserCards,
  setAvailableSleeves, setLoading, setInitialFormState, sleeveSetters,
}: UseDeckWorkspaceLoaderParams) {
  const [prevTrackedDeckId, setPrevTrackedDeckId] = useState<string | null>(null);

  if (isOpen && deck && prevTrackedDeckId !== deck.id) {
    setPrevTrackedDeckId(deck.id);
    setCurrentDeck(deck);
    setName(deck.name || '');
    setFormat(deck.format || 'TCG');
    setIsActive(deck.is_active ?? true);
    setStorageLocationId(deck.storage_location_id || '');

    const targetLoc = locations.find((l) => l.id === deck.storage_location_id);
    let initialComp = 0;
    if (targetLoc?.compartments?.deck_ids && Array.isArray(targetLoc.compartments.deck_ids)) {
      const idxInLoc = targetLoc.compartments.deck_ids.indexOf(deck.id);
      if (idxInLoc >= 0) initialComp = idxInLoc;
    }
    setCompartmentIndex(initialComp);

    if (deck.cards && Array.isArray(deck.cards)) {
      const enriched = enrichDeckCardsWithPhysicalCopies(deck.cards, [], deck.id);
      setDeckCards(enriched);
      setInitialDeckCards(enriched);
    }

    const initParsed = parseSleevesList(deck.sleeves);
    sleeveSetters.setMainProtection(initParsed.mainProt);
    sleeveSetters.setMainSleeveFitId(initParsed.mainFit);
    sleeveSetters.setMainSleeveId(initParsed.mainReg);
    sleeveSetters.setMainSleeveOverId(initParsed.mainOver);
    sleeveSetters.setExtraProtection(initParsed.extraProt);
    sleeveSetters.setExtraSleeveFitId(initParsed.extraFit);
    sleeveSetters.setExtraSleeveId(initParsed.extraReg);
    sleeveSetters.setExtraSleeveOverId(initParsed.extraOver);
    sleeveSetters.setPoolProtection(initParsed.poolProt);
    sleeveSetters.setPoolSleeveFitId(initParsed.poolFit);
    sleeveSetters.setPoolSleeveId(initParsed.poolReg);
    sleeveSetters.setPoolSleeveOverId(initParsed.poolOver);

    setInitialFormState({
      name: deck.name || '',
      format: deck.format || 'TCG',
      isActive: deck.is_active ?? true,
      storageLocationId: deck.storage_location_id || '',
      compartmentIndex: initialComp,
      mainProtection: initParsed.mainProt,
      mainSleeveFitId: initParsed.mainFit,
      mainSleeveId: initParsed.mainReg,
      mainSleeveOverId: initParsed.mainOver,
      extraProtection: initParsed.extraProt,
      extraSleeveFitId: initParsed.extraFit,
      extraSleeveId: initParsed.extraReg,
      extraSleeveOverId: initParsed.extraOver,
      poolProtection: initParsed.poolProt,
      poolSleeveFitId: initParsed.poolFit,
      poolSleeveId: initParsed.poolReg,
      poolSleeveOverId: initParsed.poolOver,
    });
  } else if (!isOpen && prevTrackedDeckId !== null) {
    setPrevTrackedDeckId(null);
  }

  useEffect(() => {
    if (!isOpen || !deck) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [deckRes, cardsRes, sleevesRes] = await Promise.all([
          fetch(`/api/decks/${deck.id}`),
          fetch('/api/collection/cards'),
          fetch('/api/collection/sleeve-inventory'),
        ]);

        let fetchedCards: UserCard[] = [];
        if (cardsRes.ok) {
          const json = await cardsRes.json();
          fetchedCards = json.data || [];
          setUserCards(fetchedCards);
        }

        if (deckRes.ok) {
          const json = await deckRes.json();
          if (json.data) {
            const loaded = json.data.cards || [];
            const enriched = enrichDeckCardsWithPhysicalCopies(loaded, fetchedCards, deck.id);
            setDeckCards(enriched);
            setInitialDeckCards(enriched);

            if (json.data.sleeves && Array.isArray(json.data.sleeves)) {
              const loadedParsed = parseSleevesList(json.data.sleeves);
              sleeveSetters.setMainProtection(loadedParsed.mainProt);
              sleeveSetters.setMainSleeveFitId(loadedParsed.mainFit);
              sleeveSetters.setMainSleeveId(loadedParsed.mainReg);
              sleeveSetters.setMainSleeveOverId(loadedParsed.mainOver);
              sleeveSetters.setExtraProtection(loadedParsed.extraProt);
              sleeveSetters.setExtraSleeveFitId(loadedParsed.extraFit);
              sleeveSetters.setExtraSleeveId(loadedParsed.extraReg);
              sleeveSetters.setExtraSleeveOverId(loadedParsed.extraOver);
              sleeveSetters.setPoolProtection(loadedParsed.poolProt);
              sleeveSetters.setPoolSleeveFitId(loadedParsed.poolFit);
              sleeveSetters.setPoolSleeveId(loadedParsed.poolReg);
              sleeveSetters.setPoolSleeveOverId(loadedParsed.poolOver);
            }
          }
        }

        if (sleevesRes.ok) {
          const json = await sleevesRes.json();
          setAvailableSleeves(json.data || []);
        }
      } catch (err) {
        console.error('Error al cargar datos del workspace de deck:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [isOpen, deck]);
}
