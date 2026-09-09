import { useState, useRef, useCallback } from 'react';
import { Deck, StorageLocation, UserCard, DeckVariant } from '@/types/collection';
import { fetchDecksApi, fetchStorageLocationsApi, fetchCollectionCardsApi, fetchSleeveInventoryApi, fetchDeckSleevesApi } from '../../services/deckBuilder.api';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';

export function useDeckBuilderSaveLoadState(
  setAvailableSleeves: React.Dispatch<React.SetStateAction<import('@/types/collection').SleeveInventory[]>>,
  setSelectedMainSleeveId: (id: string) => void,
  setSelectedExtraSleeveId: (id: string) => void
) {
  const { isIdealMode, syncData } = useIdealEnvironment();

  const [format, setFormat] = useState<'Master Duel' | 'TCG' | 'Duel Links'>('TCG');
  const [saveFormat, setSaveFormat] = useState<'Master Duel' | 'TCG' | 'Duel Links'>('TCG');
  const [saveIsActive, setSaveIsActive] = useState<boolean>(false);
  const [deckName, setDeckName] = useState('Nuevo Deck TCG');
  const [isManualDeckName, setIsManualDeckName] = useState(false);
  const isManualDeckNameRef = useRef(false);
  const [deckDescription, setDeckDescription] = useState('');
  const [deckId, setDeckId] = useState<string | null>(null);
  const [loadedVariants, setLoadedVariants] = useState<DeckVariant[]>([]);
  const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [allUserCards, setAllUserCards] = useState<UserCard[]>([]);
  const [userInventoryCounts, setUserInventoryCounts] = useState<Record<number, number>>({});
  const [userProxyCounts, setUserProxyCounts] = useState<Record<number, number>>({});
  const [targetLocationId, setTargetLocationId] = useState<string>('inbox');
  const [selectedLaneIndex, setSelectedLaneIndex] = useState<number>(0);
  const [registerToInventory, setRegisterToInventory] = useState(false);
  const [cardsToRegister, setCardsToRegister] = useState<Record<number, boolean>>({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');

  const fetchDecksAndLocations = useCallback(async () => {
    setLoadingDecks(true);
    try {
      let fetchedDecks = await fetchDecksApi();
      if (isIdealMode && syncData?.idealDecks) fetchedDecks = [...(syncData.idealDecks as Deck[]), ...fetchedDecks];
      setSavedDecks(fetchedDecks);

      const locs = await fetchStorageLocationsApi();
      setLocations(locs);

      const rawCards = await fetchCollectionCardsApi();
      setAllUserCards(rawCards);
      const counts: Record<number, number> = {};
      const proxies: Record<number, number> = {};
      rawCards.forEach((uc) => {
        counts[uc.card_id] = (counts[uc.card_id] || 0) + (uc.quantity || 1);
        if (uc.is_proxy) proxies[uc.card_id] = (proxies[uc.card_id] || 0) + (uc.quantity || 1);
      });
      setUserInventoryCounts(counts);
      setUserProxyCounts(proxies);

      const sleevesList = await fetchSleeveInventoryApi();
      setAvailableSleeves(sleevesList);

      if (deckId) {
        const assigned = await fetchDeckSleevesApi(deckId);
        const main = assigned.find((a) => a.section_type === 'main_side');
        const extra = assigned.find((a) => a.section_type === 'extra');
        setSelectedMainSleeveId(main?.sleeve_id || '');
        setSelectedExtraSleeveId(extra?.sleeve_id || '');
      } else {
        setSelectedMainSleeveId('');
        setSelectedExtraSleeveId('');
      }
    } catch (e) {
      console.error('Error cargando decks o inventario:', e);
    } finally {
      setLoadingDecks(false);
    }
  }, [isIdealMode, syncData, deckId, setAvailableSleeves, setSelectedMainSleeveId, setSelectedExtraSleeveId]);

  const handleUpdateDeckName = (name: string, isManual = true) => {
    if (!name.trim()) {
      setIsManualDeckName(false);
      isManualDeckNameRef.current = false;
      setDeckName(deckId ? '' : 'Nuevo Deck TCG');
      return;
    }
    setDeckName(name);
    if (isManual) {
      setIsManualDeckName(true);
      isManualDeckNameRef.current = true;
    }
  };

  const handleResetDeckName = () => {
    setIsManualDeckName(false);
    isManualDeckNameRef.current = false;
    if (!deckId) setDeckName('Nuevo Deck TCG');
  };

  return {
    format, setFormat, saveFormat, setSaveFormat, saveIsActive, setSaveIsActive,
    deckName, setDeckName, isManualDeckName, setIsManualDeckName, isManualDeckNameRef,
    handleUpdateDeckName, handleResetDeckName,
    deckDescription, setDeckDescription, deckId, setDeckId, loadedVariants, setLoadedVariants,
    savedDecks, setSavedDecks, loadingDecks, setLoadingDecks, locations, setLocations,
    allUserCards, setAllUserCards, userInventoryCounts, setUserInventoryCounts,
    userProxyCounts, setUserProxyCounts, targetLocationId, setTargetLocationId,
    selectedLaneIndex, setSelectedLaneIndex, registerToInventory, setRegisterToInventory,
    cardsToRegister, setCardsToRegister, isSaveModalOpen, setIsSaveModalOpen,
    isLoadModalOpen, setIsLoadModalOpen, lastSavedSnapshot, setLastSavedSnapshot,
    fetchDecksAndLocations,
  };
}
