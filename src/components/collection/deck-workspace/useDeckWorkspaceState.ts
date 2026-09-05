'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageLocation, UserCard, SleeveInventory, Deck, DeckCardDetail, SleeveCategory, DeckCardPhysicalCopy } from '@/types/collection';
import { Card, HoverCardBase, SearchScope } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { useToast } from '@/components/ui/ToastProvider';
import { DeckSectionFilter, RightDeckMode, MobileDeckTab } from './types';
import { enrichDeckCardsWithPhysicalCopies } from './deckWorkspacePhysical.utils';
import { useDeckPhysicalSync } from './useDeckPhysicalSync';
import { useRecentCardsHistory } from '@/components/deckbuilder/hooks/useRecentCardsHistory';

interface UseDeckWorkspaceStateProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  deck: Deck | null;
  decks?: Deck[];
  onSelectDeck?: (deck: Deck) => void;
  locations?: StorageLocation[];
  sleeves?: SleeveInventory[];
  onSuccess?: () => void;
}

export const isExtraDeckCardType = (cardOrType?: string | { type?: string; card_details?: { type?: string } } | null): boolean => {
  if (!cardOrType) return false;
  const rawType = typeof cardOrType === 'string'
    ? cardOrType
    : cardOrType.card_details?.type || cardOrType.type || '';
  const t = rawType.toLowerCase();
  return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
};

export const parseSleevesList = (
  sleevesList?: { section?: string; section_type?: string; sleeve_id?: string; sleeve_details?: { category?: string } }[]
) => {
  let mainFit = '';
  let mainReg = '';
  let mainOver = '';
  let extraFit = '';
  let extraReg = '';
  let extraOver = '';
  let poolFit = '';
  let poolReg = '';
  let poolOver = '';

  if (Array.isArray(sleevesList)) {
    for (const sl of sleevesList) {
      const sec = sl.section || sl.section_type || '';
      const id = sl.sleeve_id || '';
      const cat = sl.sleeve_details?.category;

      if (sec.startsWith('main')) {
        if (sec.endsWith('_fit') || cat === 'fit') mainFit = id;
        else if (sec.endsWith('_over') || cat === 'over') mainOver = id;
        else mainReg = id;
      } else if (sec.startsWith('extra')) {
        if (sec.endsWith('_fit') || cat === 'fit') extraFit = id;
        else if (sec.endsWith('_over') || cat === 'over') extraOver = id;
        else extraReg = id;
      } else if (sec.startsWith('pool') || sec.startsWith('extras')) {
        if (sec.endsWith('_fit') || cat === 'fit') poolFit = id;
        else if (sec.endsWith('_over') || cat === 'over') poolOver = id;
        else poolReg = id;
      }
    }
  }

  const mainCount = (mainFit ? 1 : 0) + (mainReg ? 1 : 0) + (mainOver ? 1 : 0);
  const extraCount = (extraFit ? 1 : 0) + (extraReg ? 1 : 0) + (extraOver ? 1 : 0);
  const poolCount = (poolFit ? 1 : 0) + (poolReg ? 1 : 0) + (poolOver ? 1 : 0);

  return {
    mainFit, mainReg, mainOver,
    mainProt: (mainOver || mainCount >= 3 ? 'triple' : mainCount === 2 ? 'double' : 'single') as 'single' | 'double' | 'triple',
    extraFit, extraReg, extraOver,
    extraProt: (extraOver || extraCount >= 3 ? 'triple' : extraCount === 2 ? 'double' : 'single') as 'single' | 'double' | 'triple',
    poolFit, poolReg, poolOver,
    poolProt: (poolOver || poolCount >= 3 ? 'triple' : poolCount === 2 ? 'double' : 'single') as 'single' | 'double' | 'triple',
  };
};

export function useDeckWorkspaceState({
  isOpen,
  onClose,
  deck,
  decks = [],
  onSelectDeck,
  locations = [],
  sleeves = [],
  onSuccess,
}: UseDeckWorkspaceStateProps) {
  const toast = useToast();

  // Deck Activo y Lista de Cartas
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(deck || null);
  const [deckCards, setDeckCards] = useState<DeckCardDetail[]>(deck?.cards || []);
  const [initialDeckCards, setInitialDeckCards] = useState<DeckCardDetail[]>(deck?.cards || []);
  const [savingDeckCards, setSavingDeckCards] = useState(false);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMutated, setHasMutated] = useState(false);

  // Ficha Técnica Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState('TCG');
  const [isActive, setIsActive] = useState(true);
  const [storageLocationId, setStorageLocationId] = useState<string>('');
  const [compartmentIndex, setCompartmentIndex] = useState<number>(0);
  const [savingDeck, setSavingDeck] = useState(false);

  // Fundas (Sleeves) - Sistema Multicapa (Fit, Regular, Over)
  const [availableSleeves, setAvailableSleeves] = useState<SleeveInventory[]>(sleeves);

  // Main & Side Deck Sleeves
  const [mainProtection, setMainProtection] = useState<'single' | 'double' | 'triple'>('single');
  const [mainSleeveFitId, setMainSleeveFitId] = useState<string>('');
  const [mainSleeveId, setMainSleeveId] = useState<string>('');
  const [mainSleeveOverId, setMainSleeveOverId] = useState<string>('');

  // Extra Deck Sleeves
  const [extraProtection, setExtraProtection] = useState<'single' | 'double' | 'triple'>('single');
  const [extraSleeveFitId, setExtraSleeveFitId] = useState<string>('');
  const [extraSleeveId, setExtraSleeveId] = useState<string>('');
  const [extraSleeveOverId, setExtraSleeveOverId] = useState<string>('');

  // Pool Sleeves
  const [poolProtection, setPoolProtection] = useState<'single' | 'double' | 'triple'>('single');
  const [poolSleeveFitId, setPoolSleeveFitId] = useState<string>('');
  const [poolSleeveId, setPoolSleeveId] = useState<string>('');
  const [poolSleeveOverId, setPoolSleeveOverId] = useState<string>('');

  const [isNewSleeveModalOpen, setIsNewSleeveModalOpen] = useState(false);
  const [targetSleeveSection, setTargetSleeveSection] = useState<'main_side' | 'extra' | 'pool' | null>(null);
  const [sleeveModalTab, setSleeveModalTab] = useState<'add_stock' | 'create'>('add_stock');
  const [sleeveModalInitialId, setSleeveModalInitialId] = useState<string | undefined>(undefined);
  const [sleeveModalInitialCategory, setSleeveModalInitialCategory] = useState<SleeveCategory | undefined>(undefined);
  const [sleeveModalSuggestedQty, setSleeveModalSuggestedQty] = useState<number | undefined>(undefined);
  const [sleeveModalSectionTotal, setSleeveModalSectionTotal] = useState<number | undefined>(undefined);

  const openSleeveModal = (
    section: 'main_side' | 'extra' | 'pool',
    tab: 'add_stock' | 'create' = 'add_stock',
    sleeveId?: string,
    suggestedQty?: number,
    sectionTotal?: number,
    initialCategory?: SleeveCategory
  ) => {
    setTargetSleeveSection(section);
    setSleeveModalTab(tab);
    setSleeveModalInitialId(sleeveId);
    setSleeveModalInitialCategory(initialCategory);
    setSleeveModalSuggestedQty(suggestedQty);
    setSleeveModalSectionTotal(sectionTotal);
    setIsNewSleeveModalOpen(true);
  };

  const sleevesPayload = useMemo(() => {
    const payload: { sleeve_id: string; section: string }[] = [];
    if (mainProtection === 'triple' || mainProtection === 'double') {
      if (mainSleeveFitId) payload.push({ sleeve_id: mainSleeveFitId, section: 'main_side_fit' });
      if (mainSleeveId) payload.push({ sleeve_id: mainSleeveId, section: 'main_side_regular' });
      if (mainSleeveOverId) payload.push({ sleeve_id: mainSleeveOverId, section: 'main_side_over' });
    } else {
      if (mainSleeveId) payload.push({ sleeve_id: mainSleeveId, section: 'main_side_regular' });
    }
    if (extraProtection === 'triple' || extraProtection === 'double') {
      if (extraSleeveFitId) payload.push({ sleeve_id: extraSleeveFitId, section: 'extra_fit' });
      if (extraSleeveId) payload.push({ sleeve_id: extraSleeveId, section: 'extra_regular' });
      if (extraSleeveOverId) payload.push({ sleeve_id: extraSleeveOverId, section: 'extra_over' });
    } else {
      if (extraSleeveId) payload.push({ sleeve_id: extraSleeveId, section: 'extra_regular' });
    }
    if (poolProtection === 'triple' || poolProtection === 'double') {
      if (poolSleeveFitId) payload.push({ sleeve_id: poolSleeveFitId, section: 'pool_fit' });
      if (poolSleeveId) payload.push({ sleeve_id: poolSleeveId, section: 'pool_regular' });
      if (poolSleeveOverId) payload.push({ sleeve_id: poolSleeveOverId, section: 'pool_over' });
    } else {
      if (poolSleeveId) payload.push({ sleeve_id: poolSleeveId, section: 'pool_regular' });
    }
    return payload;
  }, [
    mainProtection, mainSleeveFitId, mainSleeveId, mainSleeveOverId,
    extraProtection, extraSleeveFitId, extraSleeveId, extraSleeveOverId,
    poolProtection, poolSleeveFitId, poolSleeveId, poolSleeveOverId,
  ]);

  const physicalSync = useDeckPhysicalSync({
    currentDeck,
    deckCards,
    setDeckCards,
    userCards,
    setUserCards,
    setHasMutated,
    storageLocationId,
    compartmentIndex,
    name,
    format,
    isActive,
    sleevesPayload,
    onSuccess,
    setInitialDeckCards,
  });

  // Modo del Panel Derecho: 'details' (Ficha Técnica) vs 'card' (Detalles de Carta)
  const [rightMode, setRightMode] = useState<RightDeckMode>('details');
  const [selectedCardDetail, _setSelectedCardDetail] = useState<DeckCardDetail | null>(null);

  // Historial Unificado de Cartas Recientes
  const { recentCards, addRecentCard, clearRecentCards } = useRecentCardsHistory();

  const setSelectedCardDetail = useCallback(
    (action: React.SetStateAction<DeckCardDetail | null>) => {
      _setSelectedCardDetail((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        if (next) {
          addRecentCard(next);
        }
        return next;
      });
    },
    [addRecentCard]
  );

  // Filtros del Panel Central
  const [searchFilter, setSearchFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState<DeckSectionFilter>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  // Search Panel (Panel Izquierdo) State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('global');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchType, setSearchType] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    type: '',
    attribute: '',
    race: '',
    level: '',
    atkMin: '',
    atkMax: '',
    defMin: '',
    defMax: '',
    archetype: '',
    rarity: '',
    status: '',
  });
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid');
  const [searchLimit, setSearchLimit] = useState(50);
  const [dropCopyPickerState, setDropCopyPickerState] = useState<{
    card: Card;
    targetSection: 'main' | 'extra' | 'side' | 'pool' | 'extras';
    copies: UserCard[];
  } | null>(null);

  // Estado inicial del formulario para detectar cambios sin guardar
  const [initialFormState, setInitialFormState] = useState<{
    name: string;
    format: string;
    isActive: boolean;
    storageLocationId: string;
    compartmentIndex: number;
    mainProtection: 'single' | 'double' | 'triple';
    mainSleeveFitId: string;
    mainSleeveId: string;
    mainSleeveOverId: string;
    extraProtection: 'single' | 'double' | 'triple';
    extraSleeveFitId: string;
    extraSleeveId: string;
    extraSleeveOverId: string;
    poolProtection: 'single' | 'double' | 'triple';
    poolSleeveFitId: string;
    poolSleeveId: string;
    poolSleeveOverId: string;
  } | null>(null);

  // Mobile Tabs
  const [mobileTab, setMobileTab] = useState<MobileDeckTab>('center');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sincronizar sleeves externos mediante ajuste de estado en render (React 19 Zero-Effect)
  const [prevExternalSleeves, setPrevExternalSleeves] = useState<SleeveInventory[]>(sleeves);
  if (sleeves && sleeves.length > 0 && sleeves !== prevExternalSleeves) {
    setPrevExternalSleeves(sleeves);
    setAvailableSleeves(sleeves);
  }

  // Ajuste síncrono del estado del formulario durante el render al cambiar de deck (React 19 Zero-Effect)
  const [prevTrackedDeckId, setPrevTrackedDeckId] = useState<string | null>(null);
  if (isOpen && deck && prevTrackedDeckId !== deck.id) {
    setPrevTrackedDeckId(deck.id);
    setCurrentDeck(deck);
    setName(deck.name || '');
    setFormat(deck.format || 'TCG');
    setIsActive(deck.is_active ?? true);
    setStorageLocationId(deck.storage_location_id || '');

    // Calcular carril inicial según la ubicación o cartas asignadas
    const targetLoc = locations.find(l => l.id === deck.storage_location_id);
    let initialComp = 0;
    if (targetLoc?.compartments?.deck_ids && Array.isArray(targetLoc.compartments.deck_ids)) {
      const idxInLoc = targetLoc.compartments.deck_ids.indexOf(deck.id);
      if (idxInLoc >= 0) {
        initialComp = idxInLoc;
      }
    }
    setCompartmentIndex(initialComp);

    setRightMode('details');
    setSelectedCardDetail(null);
    setSectionFilter('all');
    setSearchFilter('');
    if (deck.cards && Array.isArray(deck.cards)) {
      const enriched = enrichDeckCardsWithPhysicalCopies(deck.cards, userCards, deck.id);
      setDeckCards(enriched);
      setInitialDeckCards(enriched);
    }

    // Cargar fundas asignadas al deck si existen (soporte multicapa)
    const initParsed = parseSleevesList(deck.sleeves);
    setMainProtection(initParsed.mainProt);
    setMainSleeveFitId(initParsed.mainFit);
    setMainSleeveId(initParsed.mainReg);
    setMainSleeveOverId(initParsed.mainOver);

    setExtraProtection(initParsed.extraProt);
    setExtraSleeveFitId(initParsed.extraFit);
    setExtraSleeveId(initParsed.extraReg);
    setExtraSleeveOverId(initParsed.extraOver);

    setPoolProtection(initParsed.poolProt);
    setPoolSleeveFitId(initParsed.poolFit);
    setPoolSleeveId(initParsed.poolReg);
    setPoolSleeveOverId(initParsed.poolOver);

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

  // Carga asíncrona de detalles externos de la API
  useEffect(() => {
    if (!isOpen || !deck) return;

    const fetchDeckDetails = async () => {
      setLoading(true);
      try {
        const [deckRes, cardsRes, sleevesRes] = await Promise.all([
          fetch(`/api/decks/${deck.id}`),
          fetch('/api/collection/cards'),
          fetch('/api/collection/sleeve-inventory')
        ]);

        let fetchedCards: UserCard[] = [];
        if (cardsRes.ok) {
          const json = await cardsRes.json();
          fetchedCards = json.data || [];
          setUserCards(fetchedCards);

          // Si el deck no tenía carril registrado en la caja, deducirlo de las cartas
          const deckUserCard = fetchedCards.find((uc: UserCard) => uc.deck_id === deck.id && uc.storage_location_id === deck.storage_location_id);
          if (deckUserCard && deckUserCard.compartment_index !== undefined) {
            setCompartmentIndex(deckUserCard.compartment_index);
          }
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
              setMainProtection(loadedParsed.mainProt);
              setMainSleeveFitId(loadedParsed.mainFit);
              setMainSleeveId(loadedParsed.mainReg);
              setMainSleeveOverId(loadedParsed.mainOver);

              setExtraProtection(loadedParsed.extraProt);
              setExtraSleeveFitId(loadedParsed.extraFit);
              setExtraSleeveId(loadedParsed.extraReg);
              setExtraSleeveOverId(loadedParsed.extraOver);

              setPoolProtection(loadedParsed.poolProt);
              setPoolSleeveFitId(loadedParsed.poolFit);
              setPoolSleeveId(loadedParsed.poolReg);
              setPoolSleeveOverId(loadedParsed.poolOver);

              setInitialFormState(prev => prev ? {
                ...prev,
                mainProtection: loadedParsed.mainProt,
                mainSleeveFitId: loadedParsed.mainFit,
                mainSleeveId: loadedParsed.mainReg,
                mainSleeveOverId: loadedParsed.mainOver,
                extraProtection: loadedParsed.extraProt,
                extraSleeveFitId: loadedParsed.extraFit,
                extraSleeveId: loadedParsed.extraReg,
                extraSleeveOverId: loadedParsed.extraOver,
                poolProtection: loadedParsed.poolProt,
                poolSleeveFitId: loadedParsed.poolFit,
                poolSleeveId: loadedParsed.poolReg,
                poolSleeveOverId: loadedParsed.poolOver,
              } : null);
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

    fetchDeckDetails();
  }, [isOpen, deck]);

  // Navegación Anterior / Siguiente Deck
  const currentDeckIndex = useMemo(() => {
    if (!currentDeck || !decks.length) return -1;
    return decks.findIndex(d => d.id === currentDeck.id);
  }, [currentDeck, decks]);

  const handleNavigatePrev = () => {
    if (currentDeckIndex > 0 && onSelectDeck) {
      onSelectDeck(decks[currentDeckIndex - 1]);
    }
  };

  const handleNavigateNext = () => {
    if (currentDeckIndex >= 0 && currentDeckIndex < decks.length - 1 && onSelectDeck) {
      onSelectDeck(decks[currentDeckIndex + 1]);
    }
  };

  // Búsqueda en panel izquierdo
  const executeSearch = useCallback(async () => {
    if (searchScope === 'recent') {
      setIsSearching(true);
      try {
        const q = searchQuery.trim().toLowerCase();
        let list = recentCards;
        if (q) {
          list = list.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            String(c.id).includes(q) ||
            (c.desc && c.desc.toLowerCase().includes(q)) ||
            (c.archetype && c.archetype.toLowerCase().includes(q))
          );
        }
        const typeToUse = searchType !== 'All' ? searchType : advancedFilters.type;
        if (typeToUse) {
          list = list.filter((c) => c.type === typeToUse);
        }
        if (advancedFilters.attribute) {
          list = list.filter((c) => c.attribute?.toLowerCase() === advancedFilters.attribute.toLowerCase());
        }
        if (advancedFilters.race) {
          list = list.filter((c) => c.race?.toLowerCase() === advancedFilters.race.toLowerCase());
        }
        if (advancedFilters.level) {
          list = list.filter((c) => c.level === parseInt(advancedFilters.level));
        }
        if (advancedFilters.archetype) {
          list = list.filter((c) => c.archetype?.toLowerCase().includes(advancedFilters.archetype.toLowerCase()));
        }
        setSearchResults(list);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    if (searchScope === 'collection') {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (searchType !== 'All') params.set('type', searchType);
        if (searchLimit) params.set('limit', String(searchLimit));
        if (advancedFilters.attribute) params.set('attribute', advancedFilters.attribute);
        if (advancedFilters.race) params.set('race', advancedFilters.race);
        if (advancedFilters.level) params.set('level', advancedFilters.level);
        if (advancedFilters.archetype) params.set('archetype', advancedFilters.archetype);

        const res = await fetch(`/api/collection/cards?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const data: UserCard[] = json.data || [];
          const groupedMap = new Map<number, { first: UserCard; items: UserCard[] }>();
          for (const uc of data) {
            if (!uc.card_id) continue;
            if (!groupedMap.has(uc.card_id)) {
              groupedMap.set(uc.card_id, { first: uc, items: [uc] });
            } else {
              groupedMap.get(uc.card_id)!.items.push(uc);
            }
          }
          const mapped: Card[] = [];
          groupedMap.forEach(({ first, items }, cardId) => {
            mapped.push({
              id: cardId,
              name: first.card_details?.name || 'Carta',
              type: first.card_details?.type || 'Monster',
              desc: first.card_details?.desc || '',
              race: first.card_details?.race,
              attribute: first.card_details?.attribute,
              atk: first.card_details?.atk,
              def: first.card_details?.def,
              level: first.card_details?.level,
              image_url: first.card_details?.image_url || '',
              image_url_small: first.card_details?.image_url_small || '',
              archetype: first.card_details?.archetype,
              userCardsGroup: items,
            });
          });
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error('Error al buscar cartas en mi colección:', err);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (searchType !== 'All') params.set('type', searchType);
      if (searchLimit) params.set('limit', String(searchLimit));
      if (format) params.set('format', format);

      if (advancedFilters.attribute) params.set('attribute', advancedFilters.attribute);
      if (advancedFilters.race) params.set('race', advancedFilters.race);
      if (advancedFilters.level) params.set('level', advancedFilters.level);
      if (advancedFilters.archetype) params.set('archetype', advancedFilters.archetype);

      const res = await fetch(`/api/cards?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error('Error al buscar cartas en panel izquierdo:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchType, searchLimit, format, advancedFilters, searchScope, recentCards]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      executeSearch();
    }, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, executeSearch]);

  // Totales por Sección
  const totalMainCount = useMemo(() => {
    return deckCards.filter(c => c.section === 'main').reduce((sum, c) => sum + c.count, 0);
  }, [deckCards]);

  const totalExtraCount = useMemo(() => {
    return deckCards.filter(c => c.section === 'extra').reduce((sum, c) => sum + c.count, 0);
  }, [deckCards]);

  const totalSideCount = useMemo(() => {
    return deckCards.filter(c => c.section === 'side').reduce((sum, c) => sum + c.count, 0);
  }, [deckCards]);

  const sideMainCount = useMemo(() => {
    return deckCards.filter(c => c.section === 'side' && !isExtraDeckCardType(c)).reduce((sum, c) => sum + c.count, 0);
  }, [deckCards]);

  const sideExtraCount = useMemo(() => {
    return deckCards.filter(c => c.section === 'side' && isExtraDeckCardType(c)).reduce((sum, c) => sum + c.count, 0);
  }, [deckCards]);

  const totalPoolCount = useMemo(() => {
    return deckCards.filter(c => c.section === 'pool' || c.section === 'extras').reduce((sum, c) => sum + c.count, 0);
  }, [deckCards]);

  const mainRequiredSleeves = totalMainCount + sideMainCount;
  const extraRequiredSleeves = totalExtraCount + sideExtraCount;
  const poolRequiredSleeves = totalPoolCount;

  const totalDeckCount = totalMainCount + totalExtraCount + totalSideCount + totalPoolCount;

  // Detección de arquetipos en el mazo activo
  const detectedArchetypes = useMemo(() => {
    const map = new Map<string, number>();
    deckCards.forEach((c) => {
      const arch = c.card_details?.archetype?.trim();
      if (arch) {
        map.set(arch, (map.get(arch) || 0) + (c.count || 1));
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [deckCards]);

  const inferredArchetype = useMemo(() => {
    if (detectedArchetypes.length > 0) {
      return detectedArchetypes[0].name;
    }
    return 'Híbrido / Staples';
  }, [detectedArchetypes]);

  // Cartas Filtradas y Ordenadas del Panel Central
  const filteredCenterCards = useMemo(() => {
    let result = [...deckCards];

    if (sectionFilter !== 'all') {
      result = result.filter(c => 
        c.section === sectionFilter || 
        (sectionFilter === 'pool' && c.section === 'extras')
      );
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(c => 
        c.card_details?.name.toLowerCase().includes(q) ||
        c.card_details?.archetype?.toLowerCase().includes(q) ||
        c.card_details?.type?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.card_details?.name || '').localeCompare(b.card_details?.name || ''));
    } else if (sortBy === 'type') {
      result.sort((a, b) => (a.card_details?.type || '').localeCompare(b.card_details?.type || ''));
    }

    return result;
  }, [deckCards, sectionFilter, searchFilter, sortBy]);
  // Subgrupos por sección
  const mainCards = useMemo(() => filteredCenterCards.filter(c => c.section === 'main'), [filteredCenterCards]);
  const extraCards = useMemo(() => filteredCenterCards.filter(c => c.section === 'extra'), [filteredCenterCards]);
  const sideCards = useMemo(() => filteredCenterCards.filter(c => c.section === 'side'), [filteredCenterCards]);
  const poolCards = useMemo(() => filteredCenterCards.filter(c => c.section === 'pool' || c.section === 'extras'), [filteredCenterCards]);

  // Acciones de Gestión de Cartas en el Deck (Solo mutación local hasta confirmación del usuario)
  const handleAddCardToDeck = (
    card: Card,
    targetSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras',
    selectedCopy?: UserCard
  ) => {
    if (!currentDeck) return;

    let sectionToUse: 'main' | 'extra' | 'side' | 'pool' | 'extras' = targetSection || 'main';
    if (!targetSection) {
      const typeLower = (card.type || '').toLowerCase();
      if (
        typeLower.includes('fusion') ||
        typeLower.includes('synchro') ||
        typeLower.includes('xyz') ||
        typeLower.includes('link')
      ) {
        sectionToUse = 'extra';
      }
    }

    const sectionNormalized = (sectionToUse === 'pool' || sectionToUse === 'extras') ? 'extras' : sectionToUse;
    const existing = deckCards.find(c => c.card_id === card.id && (c.section === sectionToUse || c.section === sectionNormalized || (sectionNormalized === 'extras' && (c.section === 'pool' || c.section === 'extras'))));
    let updatedCards: DeckCardDetail[];

    // selectedCopy → existing (has a real user_card_id in inventory)
    // no selectedCopy → staged placeholder (needs future registration)
    const newCopy: DeckCardPhysicalCopy = selectedCopy
      ? {
          user_card_id: selectedCopy.id,
          storage_location_id: selectedCopy.storage_location_id,
          rarity: selectedCopy.rarity,
          condition: selectedCopy.condition,
          is_proxy: selectedCopy.is_proxy,
          is_in_active_deck: true,
          active_deck_id: currentDeck.id,
          compartment_index: selectedCopy.compartment_index,
          binder_page: selectedCopy.binder_page,
          binder_slot: selectedCopy.binder_slot,
          source_status: 'existing' as const,
        }
      : { source_status: 'staged' as const };

    if (existing) {
      updatedCards = deckCards.map(c => {
        if (c.card_id === card.id && (c.section === sectionToUse || c.section === sectionNormalized || (sectionNormalized === 'extras' && (c.section === 'pool' || c.section === 'extras')))) {
          const currentCopies = c.physical_copies || [];
          const updatedCopies = [...currentCopies, newCopy];
          const newCount = c.count + 1;
          const stagedCount = updatedCopies.filter((cp) => cp.source_status === 'staged').length;
          return {
            ...c,
            count: newCount,
            physical_copies: updatedCopies,
            pending_count: stagedCount,
          };
        }
        return c;
      });
    } else {
      const initialCopies = [newCopy];
      const newDetail: DeckCardDetail = {
        card_id: card.id,
        count: 1,
        section: sectionNormalized,
        physical_copies: initialCopies,
        pending_count: selectedCopy ? 0 : 1,
        card_details: {
          name: card.name,
          type: card.type,
          desc: card.desc,
          atk: card.atk ?? undefined,
          def: card.def ?? undefined,
          level: card.level ?? undefined,
          race: card.race ?? undefined,
          attribute: card.attribute ?? undefined,
          archetype: card.archetype,
          image_url: card.image_url,
          image_url_small: card.image_url_small,
        },
      };
      updatedCards = [...deckCards, newDetail];
    }

    if (selectedCopy) {
      physicalSync.setAssignedUserCardIds(prev => prev.includes(selectedCopy.id) ? prev : [...prev, selectedCopy.id]);
      physicalSync.setUnassignedUserCardIds(prev => prev.filter(id => id !== selectedCopy.id));
    }

    setDeckCards(updatedCards);
    setHasMutated(true);
    addRecentCard(card);
    const displaySec = sectionNormalized === 'extras' ? 'RESERVA / POOL' : sectionNormalized.toUpperCase();
    toast.success(`+1 ${card.name} en ${displaySec}${selectedCopy ? ` (${selectedCopy.rarity || 'Common'})` : ' (Pendiente)'}`);
  };

  const handleRemoveCardFromDeck = (cardId: number, section: 'main' | 'extra' | 'side' | 'pool' | 'extras') => {
    if (!currentDeck) return;

    const sectionNormalized = (section === 'pool' || section === 'extras') ? 'extras' : section;
    const existing = deckCards.find(c => c.card_id === cardId && (c.section === section || c.section === sectionNormalized));
    if (!existing) return;

    addRecentCard(existing);

    const currentCopies = [...(existing.physical_copies || [])];
    let poppedCopy: DeckCardPhysicalCopy | undefined;
    if (currentCopies.length > 0) {
      // Prefer to pop a staged placeholder first (LIFO within staged group)
      const lastStagedIdx = currentCopies.map((cp, i) => ({ cp, i })).filter(({ cp }) => cp.source_status === 'staged').pop()?.i;
      if (lastStagedIdx !== undefined) {
        poppedCopy = currentCopies.splice(lastStagedIdx, 1)[0];
      } else {
        poppedCopy = currentCopies.pop();
        if (poppedCopy?.user_card_id) {
          const uid = poppedCopy.user_card_id;
          if (physicalSync.assignedUserCardIds.includes(uid)) {
            physicalSync.setAssignedUserCardIds(prev => prev.filter(id => id !== uid));
          } else {
            physicalSync.setUnassignedUserCardIds(prev => prev.includes(uid) ? prev : [...prev, uid]);
          }
        }
      }
    }

    let updatedCards: DeckCardDetail[];
    if (existing.count > 1) {
      const newCount = existing.count - 1;
      const stagedCount = currentCopies.filter((cp) => cp.source_status === 'staged').length;
      updatedCards = deckCards.map(c => 
        c.card_id === cardId && (c.section === section || c.section === sectionNormalized)
          ? {
              ...c,
              count: newCount,
              physical_copies: currentCopies,
              pending_count: stagedCount,
            }
          : c
      );
    } else {
      updatedCards = deckCards.filter(c => !(c.card_id === cardId && (c.section === section || c.section === sectionNormalized)));
      if (selectedCardDetail?.card_id === cardId && (selectedCardDetail.section === section || selectedCardDetail.section === sectionNormalized)) {
        setSelectedCardDetail(null);
        setRightMode('details');
      }
    }

    setDeckCards(updatedCards);
    setHasMutated(true);
    toast.info(poppedCopy ? 'Copia física retirada (se enviará a Inbox al guardar)' : 'Carta retirada (Cambios pendientes)');
  };

  const handleChangeCardSection = (cardId: number, currentSection: string, targetSection: string) => {
    if (!currentDeck) return;

    const fromSec = (currentSection === 'pool' || currentSection === 'extras') ? 'extras' : currentSection;
    const toSec = (targetSection === 'pool' || targetSection === 'extras') ? 'extras' : targetSection;

    if (fromSec === toSec) return;

    const card = deckCards.find(c => c.card_id === cardId && (c.section === currentSection || c.section === fromSec));
    if (!card) return;

    addRecentCard(card);

    const remainingCards = deckCards.filter(c => !(c.card_id === cardId && (c.section === currentSection || c.section === fromSec)));
    const targetExisting = remainingCards.find(c => c.card_id === cardId && (c.section === targetSection || c.section === toSec));

    let updatedCards: DeckCardDetail[];
    if (targetExisting) {
      updatedCards = remainingCards.map(c => 
        c.card_id === cardId && (c.section === targetSection || c.section === toSec)
          ? { ...c, count: c.count + card.count }
          : c
      );
    } else {
      updatedCards = [...remainingCards, { ...card, section: toSec as 'main' | 'extra' | 'side' | 'pool' | 'extras' }];
    }

    setDeckCards(updatedCards);
    setSelectedCardDetail(prev => prev ? { ...prev, section: toSec as 'main' | 'extra' | 'side' | 'pool' | 'extras' } : null);
    setHasMutated(true);
    const displayTarget = toSec === 'extras' ? 'RESERVA / POOL' : toSec.toUpperCase();
    toast.success(`Carta movida a ${displayTarget} (Cambios pendientes)`);
  };

  // Drag and drop entre paneles y secciones
  const handleDragCardStart = (
    e: React.DragEvent,
    cardData: {
      id: number;
      name: string;
      type?: string;
      image_url?: string;
      archetype?: string;
      fromSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras';
    }
  ) => {
    const payload = JSON.stringify({
      id: cardData.id,
      name: cardData.name,
      type: cardData.type || 'Monster',
      image_url: cardData.image_url || '',
      archetype: cardData.archetype,
      fromSection: cardData.fromSection,
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', String(cardData.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropCardOnSection = async (
    e: React.DragEvent,
    targetSection: 'main' | 'extra' | 'side' | 'pool' | 'extras'
  ) => {
    e.preventDefault();
    const jsonStr = e.dataTransfer.getData('application/json');
    if (jsonStr) {
      try {
        const cardObj = JSON.parse(jsonStr);
        if (cardObj && cardObj.id) {
          const fromSec = cardObj.fromSection;
          const toSec = (targetSection === 'pool' || targetSection === 'extras') ? 'extras' : targetSection;
          const fromSecNorm = (fromSec === 'pool' || fromSec === 'extras') ? 'extras' : fromSec;

          if (fromSecNorm) {
            if (fromSecNorm !== toSec) {
              await handleChangeCardSection(cardObj.id, fromSec, targetSection);
            }
          } else {
            // Dragged from Search or Collection
            const fullCard: Card = {
              id: cardObj.id,
              name: cardObj.name,
              type: cardObj.type,
              desc: '',
              image_url: cardObj.image_url,
              image_url_small: cardObj.image_url,
              archetype: cardObj.archetype,
              fromScope: cardObj.fromScope,
              userCardsGroup: cardObj.userCardsGroup,
            };

            if (cardObj.fromScope === 'collection') {
              const copies = (cardObj.userCardsGroup && cardObj.userCardsGroup.length > 0)
                ? cardObj.userCardsGroup
                : userCards.filter(uc => uc.card_id === cardObj.id);
              if (copies.length > 0) {
                setDropCopyPickerState({ card: fullCard, targetSection, copies });
                return;
              }
            }

            await handleAddCardToDeck(fullCard, targetSection);
          }
          return;
        }
      } catch (err) {
        console.error('Error al procesar carta soltada:', err);
      }
    }

    const rawId = e.dataTransfer.getData('text/plain');
    if (rawId) {
      const cardId = parseInt(rawId);
      if (!isNaN(cardId)) {
        const fullCard: Card = {
          id: cardId,
          name: `Carta #${cardId}`,
          type: 'Monster',
          desc: '',
          image_url: `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`,
        };
        await handleAddCardToDeck(fullCard, targetSection);
      }
    }
  };

  // Guardar Cambios en Ficha Técnica y Fundas
  const handleSaveDeck = async () => {
    if (!currentDeck) return;
    setSavingDeck(true);

    try {
      const sleevesPayload: { sleeve_id: string; section: string }[] = [];

      // Main & Side Sleeves
      if (mainProtection === 'triple') {
        if (mainSleeveFitId) sleevesPayload.push({ sleeve_id: mainSleeveFitId, section: 'main_side_fit' });
        if (mainSleeveId) sleevesPayload.push({ sleeve_id: mainSleeveId, section: 'main_side_regular' });
        if (mainSleeveOverId) sleevesPayload.push({ sleeve_id: mainSleeveOverId, section: 'main_side_over' });
      } else if (mainProtection === 'double') {
        if (mainSleeveFitId) sleevesPayload.push({ sleeve_id: mainSleeveFitId, section: 'main_side_fit' });
        if (mainSleeveId) sleevesPayload.push({ sleeve_id: mainSleeveId, section: 'main_side_regular' });
        if (mainSleeveOverId) sleevesPayload.push({ sleeve_id: mainSleeveOverId, section: 'main_side_over' });
      } else {
        if (mainSleeveId) sleevesPayload.push({ sleeve_id: mainSleeveId, section: 'main_side_regular' });
      }

      // Extra Deck Sleeves
      if (extraProtection === 'triple') {
        if (extraSleeveFitId) sleevesPayload.push({ sleeve_id: extraSleeveFitId, section: 'extra_fit' });
        if (extraSleeveId) sleevesPayload.push({ sleeve_id: extraSleeveId, section: 'extra_regular' });
        if (extraSleeveOverId) sleevesPayload.push({ sleeve_id: extraSleeveOverId, section: 'extra_over' });
      } else if (extraProtection === 'double') {
        if (extraSleeveFitId) sleevesPayload.push({ sleeve_id: extraSleeveFitId, section: 'extra_fit' });
        if (extraSleeveId) sleevesPayload.push({ sleeve_id: extraSleeveId, section: 'extra_regular' });
        if (extraSleeveOverId) sleevesPayload.push({ sleeve_id: extraSleeveOverId, section: 'extra_over' });
      } else {
        if (extraSleeveId) sleevesPayload.push({ sleeve_id: extraSleeveId, section: 'extra_regular' });
      }

      // Pool Sleeves
      if (poolProtection === 'triple') {
        if (poolSleeveFitId) sleevesPayload.push({ sleeve_id: poolSleeveFitId, section: 'pool_fit' });
        if (poolSleeveId) sleevesPayload.push({ sleeve_id: poolSleeveId, section: 'pool_regular' });
        if (poolSleeveOverId) sleevesPayload.push({ sleeve_id: poolSleeveOverId, section: 'pool_over' });
      } else if (poolProtection === 'double') {
        if (poolSleeveFitId) sleevesPayload.push({ sleeve_id: poolSleeveFitId, section: 'pool_fit' });
        if (poolSleeveId) sleevesPayload.push({ sleeve_id: poolSleeveId, section: 'pool_regular' });
        if (poolSleeveOverId) sleevesPayload.push({ sleeve_id: poolSleeveOverId, section: 'pool_over' });
      } else {
        if (poolSleeveId) sleevesPayload.push({ sleeve_id: poolSleeveId, section: 'pool_regular' });
      }

      const res = await fetch(`/api/decks/${currentDeck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || currentDeck.name,
          format: format,
          is_active: isActive,
          storage_location_id: storageLocationId || null,
          compartment_index: compartmentIndex,
          storageLocationId: storageLocationId || null,
          compartmentIndex: compartmentIndex,
          sleeves: sleevesPayload,
        })
      });

      if (!res.ok) throw new Error('Error al actualizar el deck');

      toast.success('Ficha técnica del mazo guardada correctamente');
      setHasMutated(true);
      setInitialFormState({
        name: name.trim() || currentDeck.name,
        format: format,
        isActive: isActive,
        storageLocationId: storageLocationId || '',
        compartmentIndex: compartmentIndex,
        mainProtection,
        mainSleeveFitId,
        mainSleeveId,
        mainSleeveOverId,
        extraProtection,
        extraSleeveFitId,
        extraSleeveId,
        extraSleeveOverId,
        poolProtection,
        poolSleeveFitId,
        poolSleeveId,
        poolSleeveOverId,
      });

      // Refrescar fundas y cartas tras guardar
      try {
        const [sleevesRes, cardsRes] = await Promise.all([
          fetch('/api/collection/sleeve-inventory'),
          fetch('/api/collection/cards'),
        ]);
        if (sleevesRes.ok) {
          const json = await sleevesRes.json();
          setAvailableSleeves(json.data || []);
        }
        if (cardsRes.ok) {
          const json = await cardsRes.json();
          setUserCards(json.data || []);
        }
      } catch (refreshErr) {
        console.warn('Error al refrescar fundas post-guardado:', refreshErr);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error al guardar el deck:', err);
      toast.error('No se pudo guardar la ficha técnica del deck');
    } finally {
      setSavingDeck(false);
    }
  };

  // Detectar si la ficha técnica del mazo tiene cambios sin guardar
  const isMetadataDirty = useMemo(() => {
    if (!initialFormState) return false;
    return (
      name !== initialFormState.name ||
      format !== initialFormState.format ||
      isActive !== initialFormState.isActive ||
      storageLocationId !== initialFormState.storageLocationId ||
      compartmentIndex !== initialFormState.compartmentIndex ||
      mainProtection !== initialFormState.mainProtection ||
      mainSleeveFitId !== initialFormState.mainSleeveFitId ||
      mainSleeveId !== initialFormState.mainSleeveId ||
      mainSleeveOverId !== initialFormState.mainSleeveOverId ||
      extraProtection !== initialFormState.extraProtection ||
      poolProtection !== initialFormState.poolProtection ||
      poolSleeveFitId !== initialFormState.poolSleeveFitId ||
      poolSleeveId !== initialFormState.poolSleeveId ||
      poolSleeveOverId !== initialFormState.poolSleeveOverId
    );
  }, [
    initialFormState,
    name,
    format,
    isActive,
    storageLocationId,
    compartmentIndex,
    mainProtection,
    mainSleeveFitId,
    mainSleeveId,
    mainSleeveOverId,
    extraProtection,
    extraSleeveFitId,
    extraSleeveId,
    extraSleeveOverId,
    poolProtection,
    poolSleeveFitId,
    poolSleeveId,
    poolSleeveOverId,
  ]);

  // Detectar si la lista de cartas del mazo tiene cambios sin guardar
  const isDeckListDirty = useMemo(() => {
    if (physicalSync.assignedUserCardIds.length > 0 || physicalSync.unassignedUserCardIds.length > 0) {
      return true;
    }
    const serialize = (cards: DeckCardDetail[]) =>
      cards.map(c => ({
        id: c.card_id,
        count: c.count,
        section: (c.section === 'pool' || c.section === 'extras') ? 'extras' : c.section,
        assignedCount: c.physical_copies?.length || 0,
      })).sort((a, b) => a.id - b.id || a.section.localeCompare(b.section));

    return JSON.stringify(serialize(deckCards)) !== JSON.stringify(serialize(initialDeckCards));
  }, [deckCards, initialDeckCards, physicalSync.assignedUserCardIds, physicalSync.unassignedUserCardIds]);

  const handleSaveDeckCards = async () => {
    if (!currentDeck) return;
    setSavingDeckCards(true);
    try {
      const payloadCards = deckCards.map(c => ({
        id: c.card_id,
        count: c.count,
        section: (c.section === 'pool' || c.section === 'extras') ? 'extras' : c.section,
        name: c.card_details?.name,
        type: c.card_details?.type,
        image_url: c.card_details?.image_url,
      }));

      const res = await fetch('/api/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDeck.id,
          storage_location_id: storageLocationId || null,
          compartment_index: compartmentIndex,
          cards: payloadCards,
        })
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al guardar la lista de cartas');
      }

      setInitialDeckCards(deckCards);
      setHasMutated(true);
      toast.success('¡Lista de cartas del mazo guardada correctamente!');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error al guardar lista de cartas:', error);
      toast.error(error.message || 'Error al guardar las cartas del deck');
    } finally {
      setSavingDeckCards(false);
    }
  };

  const handleDiscardDeckCards = () => {
    setDeckCards(initialDeckCards);
    toast.info('Cambios en la lista de cartas descartados');
  };

  // Actualizar metadatos de una copia física (rareza, condición, proxy, notas, funda, ubicación)
  const handleUpdateUserCard = async (userCardId: string, fields: Partial<UserCard>) => {
    setUserCards(prev => prev.map(uc => uc.id === userCardId ? { ...uc, ...fields } : uc));
    setHasMutated(true);

    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCardId,
          ...fields,
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar copia física');
      toast.success('Detalles de la copia física actualizados');
    } catch (err) {
      console.error('Error al actualizar copia física:', err);
      toast.error('No se pudo actualizar la copia física');
    }
  };

  // Registrar una nueva copia física o proxy directamente desde el constructor
  const handleAddPhysicalCopyForCard = async (cardId: number, isProxy: boolean = false) => {
    try {
      const targetSec = selectedCardDetail?.section || 'main';
      const isExtra = isExtraDeckCardType(selectedCardDetail?.card_details?.type);

      let targetProt = mainProtection;
      let targetFitId = mainSleeveFitId;
      let targetRegId = mainSleeveId;
      let targetOverId = mainSleeveOverId;

      if (targetSec === 'extra' || (targetSec === 'side' && isExtra)) {
        targetProt = extraProtection;
        targetFitId = extraSleeveFitId;
        targetRegId = extraSleeveId;
        targetOverId = extraSleeveOverId;
      } else if (targetSec === 'pool' || targetSec === 'extras') {
        targetProt = poolProtection;
        targetFitId = poolSleeveFitId;
        targetRegId = poolSleeveId;
        targetOverId = poolSleeveOverId;
      }

      const regularSlv = availableSleeves.find(s => s.id === targetRegId);
      const fitSlv = availableSleeves.find(s => s.id === targetFitId);
      const overSlv = availableSleeves.find(s => s.id === targetOverId);

      const payload: Record<string, unknown> = {
        card_id: cardId,
        storage_location_id: storageLocationId || null,
        compartment_index: compartmentIndex || 0,
        quantity: 1,
        rarity: isProxy ? 'Proxy' : 'Common',
        condition: 'Near Mint',
        status_flag: 'in_deck',
        deck_id: currentDeck?.id || null,
        deck_section: targetSec,
        is_proxy: isProxy,
        sleeve_type: targetProt,
        sleeve_fit_id: targetFitId || null,
        sleeve_regular_id: targetRegId || null,
        sleeve_over_id: targetOverId || null,
        sleeve_brand: regularSlv ? regularSlv.brand : '',
        sleeve_color: regularSlv ? regularSlv.color_pattern : '',
        sleeve_inner_brand: fitSlv ? fitSlv.brand : null,
        sleeve_inner_color: fitSlv ? fitSlv.color_pattern : null,
        sleeve_outer_brand: overSlv ? overSlv.brand : null,
        sleeve_outer_color: overSlv ? overSlv.color_pattern : null,
      };

      const res = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const newCard: UserCard = json.data;
        if (newCard) {
          setUserCards(prev => [newCard, ...prev]);
        }
        setHasMutated(true);
        toast.success(isProxy ? 'Proxy registrada en tu colección' : 'Copia física registrada');
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || 'Error al registrar la copia física');
      }
    } catch (err) {
      console.error('Error al registrar copia:', err);
      toast.error('Error de conexión al registrar la copia');
    }
  };

  // Eliminar copia física de la colección
  const handleDeleteUserCard = async (userCardId: string) => {
    if (!confirm('¿Eliminar esta copia física de tu colección?')) return;

    setUserCards(prev => prev.filter(uc => uc.id !== userCardId));
    setHasMutated(true);

    try {
      await fetch(`/api/collection/cards?id=${userCardId}`, { method: 'DELETE' });
      toast.success('Copia eliminada de la colección');
    } catch (err) {
      console.error('Error al eliminar copia física:', err);
      toast.error('No se pudo eliminar la copia física');
    }
  };

  // Estado para modal de confirmación inteligente de reubicación física
  const [pendingRelocation, setPendingRelocation] = useState<{
    userCard: UserCard;
    targetLocationId: string | null;
    targetCompartmentIdx: number;
    targetLocationName: string;
  } | null>(null);
  const [relocatingLoading, setRelocatingLoading] = useState(false);

  // Asignar ubicación física individual a una carta específica (sin confirmación o post-confirmación)
  const handleUpdateCardPhysicalLocation = async (userCardId: string, locationId: string | null, compartmentIdx: number = 0) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCardId,
          storage_location_id: locationId,
          compartment_index: compartmentIdx,
          binder_page: null,
          binder_slot: null
        })
      });

      if (!res.ok) throw new Error('Error al mover carta física');
      
      setUserCards(prev => prev.map(uc => uc.id === userCardId ? { ...uc, storage_location_id: locationId, compartment_index: compartmentIdx } : uc));
      toast.success('Ubicación física de la carta actualizada');
      setHasMutated(true);
    } catch (err) {
      console.error('Error al actualizar ubicación de carta:', err);
      toast.error('No se pudo actualizar la ubicación de la carta');
    }
  };

  // Solicitar reubicación física: Si la carta pertenece al mazo y se traslada a otra ubicación externa, abre el modal de confirmación
  const handleRequestRelocateCard = (userCard: UserCard, locationId: string | null, compartmentIdx: number = 0) => {
    const isAssignedToDeck = Boolean(userCard.deck_id || deckCards.some(dc => dc.card_id === userCard.card_id));
    const targetLoc = locations.find(l => l.id === locationId);
    const targetName = locationId === 'inbox' 
      ? 'Bandeja Sin Clasificar (Inbox)' 
      : targetLoc 
      ? targetLoc.name 
      : !locationId 
      ? `Ubicación Base del Mazo (${currentDeck?.name || 'Deckbox'})` 
      : 'Ubicación Externa';

    // Si no está asignada al mazo o se está moviendo a la ubicación base del mazo, aplicar directamente
    if (!isAssignedToDeck || !locationId || locationId === storageLocationId) {
      handleUpdateCardPhysicalLocation(userCard.id, locationId, compartmentIdx);
      return;
    }

    // Activar confirmación inteligente
    setPendingRelocation({
      userCard,
      targetLocationId: locationId,
      targetCompartmentIdx: compartmentIdx,
      targetLocationName: targetName,
    });
  };

  // Opción 1: Quitar de la receta del mazo y mover físicamente
  const handleConfirmRelocateAndRemoveFromDeck = async () => {
    if (!pendingRelocation || !currentDeck) return;
    setRelocatingLoading(true);

    const { userCard, targetLocationId: locId, targetCompartmentIdx: compIdx, targetLocationName: locName } = pendingRelocation;
    const cardId = userCard.card_id;
    const qtyToSubtract = userCard.quantity || 1;

    try {
      // 1. Actualizar copia física en yg_user_cards (desvincular deck_id y asignar nueva ubicación)
      const resCard = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCard.id,
          storage_location_id: locId,
          compartment_index: compIdx,
          deck_id: null,
          deck_section: null,
          status_flag: 'collection',
          binder_page: null,
          binder_slot: null,
        }),
      });

      if (!resCard.ok) throw new Error('Error al mover la copia física');

      // 2. Actualizar estado local de userCards
      setUserCards(prev => prev.map(uc => uc.id === userCard.id ? {
        ...uc,
        storage_location_id: locId,
        compartment_index: compIdx,
        deck_id: null,
        deck_section: null,
        status_flag: 'collection',
      } : uc));

      // 3. Restar del mazo en deck_cards
      const existingInDeck = deckCards.find(c => c.card_id === cardId);
      if (existingInDeck) {
        const newCount = Math.max(0, existingInDeck.count - qtyToSubtract);
        let updatedDeckCards: DeckCardDetail[];

        if (newCount === 0) {
          updatedDeckCards = deckCards.filter(c => c.card_id !== cardId || c.section !== existingInDeck.section);
          if (selectedCardDetail?.card_id === cardId) {
            setSelectedCardDetail(null);
            setRightMode('details');
          }
        } else {
          updatedDeckCards = deckCards.map(c => 
            c.card_id === cardId && c.section === existingInDeck.section
              ? { ...c, count: newCount }
              : c
          );
        }

        setDeckCards(updatedDeckCards);

        // Sincronizar con API del mazo
        if (newCount === 0) {
          await fetch(`/api/decks/${currentDeck.id}/cards?card_id=${cardId}&section=${existingInDeck.section}`, {
            method: 'DELETE',
          });
        } else {
          await fetch(`/api/decks/${currentDeck.id}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              card_id: cardId,
              section: existingInDeck.section,
              count: -qtyToSubtract,
            }),
          });
        }
      }

      setHasMutated(true);
      toast.success(`Carta movida a "${locName}" y retirada del mazo`);
      setPendingRelocation(null);
    } catch (err) {
      console.error('Error al desvincular y mover carta:', err);
      toast.error('No se pudo completar la reubicación');
    } finally {
      setRelocatingLoading(false);
    }
  };

  // Opción 2: Solo mover físicamente (mantener en el mazo)
  const handleConfirmRelocateOnly = async () => {
    if (!pendingRelocation) return;
    setRelocatingLoading(true);

    const { userCard, targetLocationId: locId, targetCompartmentIdx: compIdx, targetLocationName: locName } = pendingRelocation;

    try {
      await handleUpdateCardPhysicalLocation(userCard.id, locId, compIdx);
      toast.success(`Ubicación actualizada a "${locName}" (permanece en la lista del mazo)`);
      setPendingRelocation(null);
    } catch (err) {
      console.error('Error al reubicar carta físicamente:', err);
    } finally {
      setRelocatingLoading(false);
    }
  };

  const handleCancelRelocate = () => {
    setPendingRelocation(null);
  };

  // Ubicación física de la carta seleccionada
  const selectedPhysicalUserCards = useMemo(() => {
    if (!selectedCardDetail) return [];
    return userCards.filter(uc => uc.card_id === selectedCardDetail.card_id);
  }, [userCards, selectedCardDetail]);

  return {
    currentDeck,
    deckCards,
    userCards,
    setUserCards,
    loading,
    hasMutated,
    setHasMutated,

    // Form
    name,
    setName,
    format,
    setFormat,
    isActive,
    setIsActive,
    storageLocationId,
    setStorageLocationId,
    compartmentIndex,
    setCompartmentIndex,
    savingDeck: savingDeck || physicalSync.isSavingSync,
    handleSaveDeck: physicalSync.handleTriggerSave,
    isMetadataDirty,
    isDeckListDirty,
    savingDeckCards: savingDeckCards || physicalSync.isSavingSync,
    handleSaveDeckCards: physicalSync.handleTriggerSave,
    handleDiscardDeckCards,

    // Sleeves (Multicapa)
    availableSleeves,
    setAvailableSleeves,
    mainProtection,
    setMainProtection,
    mainSleeveFitId,
    setMainSleeveFitId,
    mainSleeveId,
    setMainSleeveId,
    mainSleeveOverId,
    setMainSleeveOverId,

    extraProtection,
    setExtraProtection,
    extraSleeveFitId,
    setExtraSleeveFitId,
    extraSleeveId,
    setExtraSleeveId,
    extraSleeveOverId,
    setExtraSleeveOverId,

    poolProtection,
    setPoolProtection,
    poolSleeveFitId,
    setPoolSleeveFitId,
    poolSleeveId,
    setPoolSleeveId,
    poolSleeveOverId,
    setPoolSleeveOverId,

    isNewSleeveModalOpen,
    setIsNewSleeveModalOpen,
    targetSleeveSection,
    setTargetSleeveSection,
    sleeveModalTab,
    setSleeveModalTab,
    sleeveModalInitialId,
    setSleeveModalInitialId,
    sleeveModalInitialCategory,
    setSleeveModalInitialCategory,
    sleeveModalSuggestedQty,
    sleeveModalSectionTotal,
    openSleeveModal,

    // Right Mode & Selected Card
    rightMode,
    setRightMode,
    selectedCardDetail,
    setSelectedCardDetail,
    selectedPhysicalUserCards,
    detectedArchetypes,
    inferredArchetype,

    // Center Filters & Tabs
    searchFilter,
    setSearchFilter,
    sectionFilter,
    setSectionFilter,
    sortBy,
    setSortBy,
    filteredCenterCards,
    mainCards,
    extraCards,
    sideCards,
    poolCards,
    totalMainCount,
    totalExtraCount,
    totalSideCount,
    sideMainCount,
    sideExtraCount,
    totalPoolCount,
    mainRequiredSleeves,
    extraRequiredSleeves,
    poolRequiredSleeves,
    totalDeckCount,

    // Search Panel
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
    onlyFavorites,
    setOnlyFavorites,
    searchType,
    setSearchType,
    advancedFilters,
    setAdvancedFilters,
    searchResults,
    isSearching,
    searchViewMode,
    setSearchViewMode,
    searchLimit,
    setSearchLimit,
    recentCards,
    addRecentCard,
    clearRecentCards,

    // Mobile & Navigation
    mobileTab,
    setMobileTab,
    isMobile,
    handleNavigatePrev,
    handleNavigateNext,

    // Physical Sync & Staging
    assignedUserCardIds: physicalSync.assignedUserCardIds,
    unassignedUserCardIds: physicalSync.unassignedUserCardIds,
    assignDrawerSection: physicalSync.assignDrawerSection,
    setAssignDrawerSection: physicalSync.setAssignDrawerSection,
    isSyncModalOpen: physicalSync.isSyncModalOpen,
    setIsSyncModalOpen: physicalSync.setIsSyncModalOpen,
    isSavingSync: physicalSync.isSavingSync,
    stageAssignUserCard: physicalSync.stageAssignUserCard,
    stageUnassignUserCard: physicalSync.stageUnassignUserCard,
    mainPhysicalCount: physicalSync.mainPhysicalCount,
    mainPendingCount: physicalSync.mainPendingCount,
    extraPhysicalCount: physicalSync.extraPhysicalCount,
    extraPendingCount: physicalSync.extraPendingCount,
    sidePhysicalCount: physicalSync.sidePhysicalCount,
    sidePendingCount: physicalSync.sidePendingCount,
    poolPhysicalCount: physicalSync.poolPhysicalCount,
    poolPendingCount: physicalSync.poolPendingCount,
    totalPendingCount: physicalSync.totalPendingCount,
    pendingCardsForDrawer: physicalSync.pendingCardsForDrawer,
    allPendingCards: physicalSync.allPendingCards,
    unassignedUserCards: physicalSync.unassignedUserCards,
    executeAtomicSave: physicalSync.executeAtomicSave,
    handleTriggerSave: physicalSync.handleTriggerSave,

    // Card Actions
    handleAddCardToDeck,
    handleRemoveCardFromDeck,
    handleChangeCardSection,
    handleDragCardStart,
    handleDropCardOnSection,
    dropCopyPickerState,
    setDropCopyPickerState,
    handleUpdateCardPhysicalLocation,
    handleRequestRelocateCard,
    pendingRelocation,
    relocatingLoading,
    handleConfirmRelocateAndRemoveFromDeck,
    handleConfirmRelocateOnly,
    handleCancelRelocate,
    handleUpdateUserCard,
    handleAddPhysicalCopyForCard,
    handleDeleteUserCard,
  };
}
