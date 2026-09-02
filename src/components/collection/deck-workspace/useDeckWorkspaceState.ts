'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageLocation, UserCard, SleeveInventory, Deck, DeckCardDetail } from '@/types/collection';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { useToast } from '@/components/ui/ToastProvider';
import { DeckSectionFilter, RightDeckMode, MobileDeckTab } from './types';

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

  // Fundas (Sleeves)
  const [availableSleeves, setAvailableSleeves] = useState<SleeveInventory[]>(sleeves);
  const [mainSleeveId, setMainSleeveId] = useState<string>('');
  const [extraSleeveId, setExtraSleeveId] = useState<string>('');
  const [poolSleeveId, setPoolSleeveId] = useState<string>('');
  const [isNewSleeveModalOpen, setIsNewSleeveModalOpen] = useState(false);
  const [targetSleeveSection, setTargetSleeveSection] = useState<'main_side' | 'extra' | 'pool' | null>(null);
  const [sleeveModalTab, setSleeveModalTab] = useState<'add_stock' | 'create'>('add_stock');
  const [sleeveModalInitialId, setSleeveModalInitialId] = useState<string | undefined>(undefined);
  const [sleeveModalSuggestedQty, setSleeveModalSuggestedQty] = useState<number | undefined>(undefined);
  const [sleeveModalSectionTotal, setSleeveModalSectionTotal] = useState<number | undefined>(undefined);

  const openSleeveModal = (
    section: 'main_side' | 'extra' | 'pool',
    tab: 'add_stock' | 'create' = 'add_stock',
    sleeveId?: string,
    suggestedQty?: number,
    sectionTotal?: number
  ) => {
    setTargetSleeveSection(section);
    setSleeveModalTab(tab);
    setSleeveModalInitialId(sleeveId);
    setSleeveModalSuggestedQty(suggestedQty);
    setSleeveModalSectionTotal(sectionTotal);
    setIsNewSleeveModalOpen(true);
  };

  // Modo del Panel Derecho: 'details' (Ficha Técnica) vs 'card' (Detalles de Carta)
  const [rightMode, setRightMode] = useState<RightDeckMode>('details');
  const [selectedCardDetail, setSelectedCardDetail] = useState<DeckCardDetail | null>(null);

  // Filtros del Panel Central
  const [searchFilter, setSearchFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState<DeckSectionFilter>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  // Search Panel (Panel Izquierdo) State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'global' | 'collection' | 'staged'>('global');
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

  // Estado inicial del formulario para detectar cambios sin guardar
  const [initialFormState, setInitialFormState] = useState<{
    name: string;
    format: string;
    isActive: boolean;
    storageLocationId: string;
    compartmentIndex: number;
    mainSleeveId: string;
    extraSleeveId: string;
    poolSleeveId: string;
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

  // Sincronizar sleeves externos
  useEffect(() => {
    if (sleeves && sleeves.length > 0) {
      setAvailableSleeves(sleeves);
    }
  }, [sleeves]);

  // Cargar datos cuando cambia el mazo activo
  useEffect(() => {
    if (!isOpen || !deck) return;

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
      setDeckCards(deck.cards);
    }

    // Cargar fundas asignadas al deck si existen
    let initMainSleeve = '';
    let initExtraSleeve = '';
    let initPoolSleeve = '';
    if (deck.sleeves && Array.isArray(deck.sleeves)) {
      const mainSl = deck.sleeves.find(s => ('section' in s ? s.section : s.section_type) === 'main' || ('section' in s ? s.section : s.section_type) === 'main_side');
      const extraSl = deck.sleeves.find(s => ('section' in s ? s.section : s.section_type) === 'extra');
      const poolSl = deck.sleeves.find(s => ('section' in s ? s.section : s.section_type) === 'pool' || ('section' in s ? s.section : s.section_type) === 'extras');
      initMainSleeve = mainSl?.sleeve_id || '';
      initExtraSleeve = extraSl?.sleeve_id || '';
      initPoolSleeve = poolSl?.sleeve_id || '';
    }
    setMainSleeveId(initMainSleeve);
    setExtraSleeveId(initExtraSleeve);
    setPoolSleeveId(initPoolSleeve);

    setInitialFormState({
      name: deck.name || '',
      format: deck.format || 'TCG',
      isActive: deck.is_active ?? true,
      storageLocationId: deck.storage_location_id || '',
      compartmentIndex: initialComp,
      mainSleeveId: initMainSleeve,
      extraSleeveId: initExtraSleeve,
      poolSleeveId: initPoolSleeve,
    });

    const fetchDeckDetails = async () => {
      setLoading(true);
      try {
        const [deckRes, cardsRes, sleevesRes] = await Promise.all([
          fetch(`/api/decks/${deck.id}`),
          fetch('/api/collection/cards'),
          fetch('/api/collection/sleeve-inventory')
        ]);

        if (deckRes.ok) {
          const json = await deckRes.json();
          if (json.data) {
            setDeckCards(json.data.cards || []);

            if (json.data.sleeves && Array.isArray(json.data.sleeves)) {
              const mainSl = json.data.sleeves.find((s: { section?: string; section_type?: string; sleeve_id?: string }) =>
                (s.section === 'main' || s.section === 'main_side' || s.section_type === 'main' || s.section_type === 'main_side')
              );
              const extraSl = json.data.sleeves.find((s: { section?: string; section_type?: string; sleeve_id?: string }) =>
                (s.section === 'extra' || s.section_type === 'extra')
              );
              const poolSl = json.data.sleeves.find((s: { section?: string; section_type?: string; sleeve_id?: string }) =>
                (s.section === 'pool' || s.section === 'extras' || s.section_type === 'pool' || s.section_type === 'extras')
              );
              const loadedMain = mainSl?.sleeve_id || '';
              const loadedExtra = extraSl?.sleeve_id || '';
              const loadedPool = poolSl?.sleeve_id || '';
              setMainSleeveId(loadedMain);
              setExtraSleeveId(loadedExtra);
              setPoolSleeveId(loadedPool);
              setInitialFormState(prev => prev ? {
                ...prev,
                mainSleeveId: loadedMain,
                extraSleeveId: loadedExtra,
                poolSleeveId: loadedPool,
              } : null);
            }
          }
        }

        if (cardsRes.ok) {
          const json = await cardsRes.json();
          const fetchedCards: UserCard[] = json.data || [];
          setUserCards(fetchedCards);

          // Si el deck no tenía carril registrado en la caja, deducirlo de las cartas
          const deckUserCard = fetchedCards.find((uc: UserCard) => uc.deck_id === deck.id && uc.storage_location_id === deck.storage_location_id);
          if (deckUserCard && deckUserCard.compartment_index !== undefined) {
            setCompartmentIndex(deckUserCard.compartment_index);
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
  }, [searchQuery, searchType, searchLimit, format, advancedFilters]);

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

  // Acciones de Gestión de Cartas en el Deck
  const handleAddCardToDeck = async (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'pool') => {
    if (!currentDeck) return;

    let sectionToUse: 'main' | 'extra' | 'side' | 'pool' = targetSection || 'main';
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

    const sectionNormalized = sectionToUse === 'pool' ? 'extras' : sectionToUse;

    try {
      const existing = deckCards.find(c => c.card_id === card.id && (c.section === sectionToUse || c.section === sectionNormalized));
      let updatedCards: DeckCardDetail[];

      if (existing) {
        updatedCards = deckCards.map(c => 
          c.card_id === card.id && (c.section === sectionToUse || c.section === sectionNormalized)
            ? { ...c, count: c.count + 1 }
            : c
        );
      } else {
        const newDetail: DeckCardDetail = {
          card_id: card.id,
          count: 1,
          section: sectionNormalized,
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

      setDeckCards(updatedCards);
      setHasMutated(true);
      toast.success(`Añadida copia de ${card.name} a ${sectionToUse.toUpperCase()}`);

      await fetch(`/api/decks/${currentDeck.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          section: sectionNormalized,
          count: 1,
        })
      });
    } catch (err) {
      console.error('Error al añadir carta al deck:', err);
      toast.error('No se pudo añadir la carta al deck');
    }
  };

  const handleRemoveCardFromDeck = async (cardId: number, section: 'main' | 'extra' | 'side' | 'pool') => {
    if (!currentDeck) return;

    const sectionNormalized = section === 'pool' ? 'extras' : section;

    try {
      const existing = deckCards.find(c => c.card_id === cardId && (c.section === section || c.section === sectionNormalized));
      if (!existing) return;

      let updatedCards: DeckCardDetail[];
      if (existing.count > 1) {
        updatedCards = deckCards.map(c => 
          c.card_id === cardId && (c.section === section || c.section === sectionNormalized)
            ? { ...c, count: c.count - 1 }
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
      toast.success('Carta retirada del deck');

      await fetch(`/api/decks/${currentDeck.id}/cards`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          section: sectionNormalized,
        })
      });
    } catch (err) {
      console.error('Error al remover carta del deck:', err);
      toast.error('No se pudo retirar la carta');
    }
  };

  const handleChangeCardSection = async (cardId: number, currentSection: string, targetSection: string) => {
    if (!currentDeck || currentSection === targetSection) return;

    const fromSec = currentSection === 'pool' ? 'extras' : currentSection;
    const toSec = targetSection === 'pool' ? 'extras' : targetSection;

    try {
      const card = deckCards.find(c => c.card_id === cardId && (c.section === currentSection || c.section === fromSec));
      if (!card) return;

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
        updatedCards = [...remainingCards, { ...card, section: toSec as 'main' | 'extra' | 'side' | 'pool' }];
      }

      setDeckCards(updatedCards);
      setSelectedCardDetail(prev => prev ? { ...prev, section: toSec as 'main' | 'extra' | 'side' | 'pool' } : null);
      setHasMutated(true);
      toast.success(`Carta movida a ${targetSection.toUpperCase()}`);

      await fetch(`/api/decks/${currentDeck.id}/cards/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          from_section: fromSec,
          to_section: toSec,
        })
      });
    } catch (err) {
      console.error('Error al mover sección de carta:', err);
      toast.error('No se pudo mover la carta de sección');
    }
  };

  // Guardar Cambios en Ficha Técnica y Fundas
  const handleSaveDeck = async () => {
    if (!currentDeck) return;
    setSavingDeck(true);

    try {
      const sleevesPayload: { sleeve_id: string; section: 'main_side' | 'extra' | 'pool' }[] = [];
      if (mainSleeveId) {
        sleevesPayload.push({ sleeve_id: mainSleeveId, section: 'main_side' });
      }
      if (extraSleeveId) {
        sleevesPayload.push({ sleeve_id: extraSleeveId, section: 'extra' });
      }
      if (poolSleeveId) {
        sleevesPayload.push({ sleeve_id: poolSleeveId, section: 'pool' });
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
        mainSleeveId: mainSleeveId,
        extraSleeveId: extraSleeveId,
        poolSleeveId: poolSleeveId,
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
      mainSleeveId !== initialFormState.mainSleeveId ||
      extraSleeveId !== initialFormState.extraSleeveId ||
      poolSleeveId !== initialFormState.poolSleeveId
    );
  }, [initialFormState, name, format, isActive, storageLocationId, compartmentIndex, mainSleeveId, extraSleeveId, poolSleeveId]);

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
      let targetSleeveId = mainSleeveId;
      if (targetSec === 'extra' || (targetSec === 'side' && isExtra)) {
        targetSleeveId = extraSleeveId;
      } else if (targetSec === 'pool' || targetSec === 'extras') {
        targetSleeveId = poolSleeveId;
      }
      const sectionSleeve = availableSleeves.find(s => s.id === targetSleeveId);

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
        sleeve_type: sectionSleeve ? 'single' : 'none',
        sleeve_brand: sectionSleeve ? sectionSleeve.brand : '',
        sleeve_color: sectionSleeve ? sectionSleeve.color_pattern : '',
        sleeve_condition: sectionSleeve ? (sectionSleeve.condition || 'good') : 'good',
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

  // Asignar ubicación física individual a una carta específica
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
    savingDeck,
    handleSaveDeck,
    isMetadataDirty,

    // Sleeves
    availableSleeves,
    setAvailableSleeves,
    mainSleeveId,
    setMainSleeveId,
    extraSleeveId,
    setExtraSleeveId,
    poolSleeveId,
    setPoolSleeveId,
    isNewSleeveModalOpen,
    setIsNewSleeveModalOpen,
    targetSleeveSection,
    setTargetSleeveSection,
    sleeveModalTab,
    setSleeveModalTab,
    sleeveModalInitialId,
    setSleeveModalInitialId,
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

    // Mobile & Navigation
    mobileTab,
    setMobileTab,
    isMobile,
    handleNavigatePrev,
    handleNavigateNext,

    // Card Actions
    handleAddCardToDeck,
    handleRemoveCardFromDeck,
    handleChangeCardSection,
    handleUpdateCardPhysicalLocation,
    handleUpdateUserCard,
    handleAddPhysicalCopyForCard,
    handleDeleteUserCard,
  };
}
