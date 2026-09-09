import { useState, useEffect, useCallback, useRef } from 'react';
import { StorageLocation, UserCard, SleeveInventory, Deck } from '@/types/collection';
import { useToast } from '@/components/ui/ToastProvider';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { getCachedContainerCards, setCachedContainerCards } from '@/lib/cache/containerCardsCache';
import { RightPanelMode, AISubView } from './types';
import { fetchContainerCardsApi, fetchGlobalCollectionDataApi } from './services/containerWorkspace.api';

// Sub-hooks de dominio (<200 LOC cada uno)
import { useContainerBinderPaging } from './hooks/useContainerBinderPaging';
import { useContainerHistoryActions } from './hooks/useContainerHistoryActions';
import { useContainerMultiSelection } from './hooks/useContainerMultiSelection';
import { useContainerBulkActions } from './hooks/useContainerBulkActions';
import { useContainerBulkImport } from './hooks/useContainerBulkImport';
import { useContainerSearch } from './hooks/useContainerSearch';
import { useContainerFilterSort } from './hooks/useContainerFilterSort';
import { useContainerCardMutations } from './hooks/useContainerCardMutations';
import { useContainerDragAndDrop } from './hooks/useContainerDragAndDrop';
import { useContainerVariants } from './hooks/useContainerVariants';
import { useContainerSplitAndMove } from './hooks/useContainerSplitAndMove';
import { useContainerDeckAssignment } from './hooks/useContainerDeckAssignment';
import { useContainerAnalysis } from './hooks/useContainerAnalysis';
import { useContainerNavigation } from './hooks/useContainerNavigation';

interface UseContainerWorkspaceStateProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  location: StorageLocation | null;
  locations?: StorageLocation[];
  onSelectLocation?: (location: StorageLocation) => void;
  sleeves?: SleeveInventory[];
  decks?: Deck[];
  allCollectionCards?: UserCard[];
  onMutate?: () => void;
}

export const useContainerWorkspaceState = ({
  isOpen, onClose, location, locations = [], onSelectLocation,
  decks = [], allCollectionCards: initialCards = [], onMutate,
}: UseContainerWorkspaceStateProps) => {
  const toast = useToast();
  const { isIdealMode, syncData } = useIdealEnvironment();

  const isInbox = !location || location.id === 'inbox';
  const containerId = isInbox ? 'inbox' : location?.id;
  const containerType = isInbox ? 'box' : (location?.type || 'box');

  const [cards, setCards] = useState<UserCard[]>(() => {
    if (containerId) {
      const cached = getCachedContainerCards(containerId);
      if (cached && cached.length > 0) return cached;
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [hasMutated, setHasMutated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUserCard, setSelectedUserCard] = useState<UserCard | null>(null);
  const [rightMode, setRightMode] = useState<RightPanelMode>('details');
  const [aiSubView, setAiSubView] = useState<AISubView>('lane');
  const [allCollectionCards, setAllCollectionCards] = useState<UserCard[]>(() => initialCards || []);
  const [internalDecks, setInternalDecks] = useState<Deck[]>(() => decks || []);

  const selectedUserCardIdRef = useRef<string | null>(null);
  useEffect(() => { selectedUserCardIdRef.current = selectedUserCard?.id || null; }, [selectedUserCard?.id]);

  const fetchCards = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      if (isIdealMode && syncData?.idealCards) {
        const pId = (location as { physical_storage_location_id?: string } | null)?.physical_storage_location_id;
        const filtered = (syncData.idealCards as UserCard[]).filter(c => isInbox ? !c.storage_location_id : (c.storage_location_id === location?.id || (pId && c.storage_location_id === pId)));
        setCards(filtered);
        if (selectedUserCardIdRef.current) {
          const fresh = filtered.find(c => c.id === selectedUserCardIdRef.current);
          if (fresh) setSelectedUserCard(fresh);
        }
        return;
      }
      const data = await fetchContainerCardsApi(isInbox, containerId);
      setCards(data);
      if (containerId) setCachedContainerCards(containerId, data);
      if (selectedUserCardIdRef.current) {
        const fresh = data.find(c => c.id === selectedUserCardIdRef.current);
        if (fresh) setSelectedUserCard(fresh);
      }
    } catch (err) { console.error('Error al cargar cartas:', err); }
    finally { setLoading(false); }
  }, [isOpen, isInbox, containerId, isIdealMode, location, syncData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchCards();
      const globalData = await fetchGlobalCollectionDataApi();
      if (globalData.cards.length > 0) setAllCollectionCards(globalData.cards);
      toast.success('Estado del contenedor sincronizado', { title: 'Refrescado' });
    } catch { toast.error('No se pudo refrescar el contenedor', { title: 'Error' }); }
    finally { setIsRefreshing(false); }
  }, [fetchCards, toast]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchGlobalContext = async () => {
      try {
        await fetchCards();
        if (!initialCards.length || !decks.length) {
          const res = await fetchGlobalCollectionDataApi();
          if (!isMounted) return;
          if (res.cards.length) setAllCollectionCards(res.cards);
          if (res.decks.length) setInternalDecks(res.decks as Deck[]);
        }
      } catch (e) {
        console.warn('Error loading global collection context:', e);
      }
    };
    fetchGlobalContext();
    return () => { isMounted = false; };
  }, [isOpen, fetchCards, initialCards.length, decks.length]);

  // Sub-hooks de dominio
  const binderPaging = useContainerBinderPaging({ location, cards, isOpen });
  const history = useContainerHistoryActions({ setCards, selectedUserCard, setSelectedUserCard, isInbox, containerId, setHasMutated, toast });
  const search = useContainerSearch({ isOpen, cards });
  const multiSelect = useContainerMultiSelection({ cards, selectedUserCard, toast });
  const bulkActions = useContainerBulkActions({ cards, setCards, selectedCardIds: multiSelect.selectedCardIds, clearCardSelection: multiSelect.clearCardSelection, selectedUserCard, setSelectedUserCard, location, isInbox, pushHistoryAction: history.pushHistoryAction, setHasMutated, fetchCards, toast });
  const bulkImport = useContainerBulkImport({ location, isInbox, containerId, activeCompartment: 0, setHasMutated, fetchCards, toast });

  const mutations = useContainerCardMutations({
    cards, setCards, selectedUserCard, setSelectedUserCard, isInbox, containerId, containerType,
    activeCompartment: 0, currentBinderViewIndex: binderPaging.currentBinderViewIndex,
    pushHistoryAction: history.pushHistoryAction, setHasMutated, fetchCards, toast,
    addRecentCard: search.addRecentCard, isIdealMode,
    onOpenPicker: (c, uc, t) => dragAndDrop.openPicker(c, uc, t),
  });

  const dragAndDrop = useContainerDragAndDrop({
    cards, setCards, selectedUserCard, setSelectedUserCard, setHasMutated,
    handleAddCardToContainer: mutations.handleAddCardToContainer, toast,
  });

  const variants = useContainerVariants({
    cards, setCards, selectedUserCard, setSelectedUserCard, containerType,
    pushHistoryAction: history.pushHistoryAction, setHasMutated, fetchCards, toast,
  });

  const splitAndMove = useContainerSplitAndMove({
    cards, setCards, selectedUserCard, setSelectedUserCard, selectedCardIds: multiSelect.selectedCardIds,
    pushHistoryAction: history.pushHistoryAction, setHasMutated, fetchCards, toast,
  });

  const deckAssignment = useContainerDeckAssignment({
    location, locations, isInbox, internalDecks, setInternalDecks, onSelectLocation, onMutate, setHasMutated, fetchCards, toast,
  });

  const filterSort = useContainerFilterSort({
    cards, isInbox, internalDecks, activeClusterFilter: null,
    lanePatternReport: null, globalCollectionReport: null,
    onCompartmentSelectedForImport: bulkImport.setTargetCompartmentForImport,
  });

  const analysis = useContainerAnalysis({
    cards, allCollectionCards, selectedUserCard,
    activeLaneCards: filterSort.activeLaneCards, internalDecks, locations,
  });

  const navigation = useContainerNavigation({
    isOpen, isInbox, location, locations, onSelectLocation, onClose, hasMutated,
    canUndo: history.canUndo, canRedo: history.canRedo, handleUndo: history.handleUndo, handleRedo: history.handleRedo,
  });

  return {
    ...history,
    cards, setCards, loading, hasMutated, setHasMutated, isInbox, containerId, containerType, currentLocation: location, fetchCards, handleRefresh, isRefreshing,
    ...navigation,
    ...search,
    ...dragAndDrop,
    ...filterSort,
    ...binderPaging,
    selectedUserCard, setSelectedUserCard, rightMode, setRightMode, aiSubView, setAiSubView,
    ...variants,
    ...analysis,
    ...mutations,
    ...multiSelect,
    ...bulkActions,
    ...splitAndMove,
    ...deckAssignment,
    ...bulkImport,
    allCollectionCards, setAllCollectionCards,
    internalDecks,
  };
};
