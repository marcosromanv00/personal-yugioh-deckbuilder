import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StorageLocation, UserCard, SleeveInventory, Deck, CompartmentsConfig, CardCondition, CardStatusFlag, SleeveType } from '@/types/collection';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { useToast } from '@/components/ui/ToastProvider';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { 
  analyzeCardClassification, 
  analyzeLanePatterns, 
  analyzeGlobalCollectionPatterns,
  LaneCluster,
  BestRecommendation 
} from '@/lib/cardClassificationEngine';
import { findDispersedCardsAcrossLocations } from '@/lib/collectionUtils';
import { sanitizeBulkInput } from '@/lib/bulkSanitizer';
import { computeCrossContainerDuplicateMap } from '@/lib/collectionSuggestions';
import { GridCardGroup, DeckInContainer, RightPanelMode, AISubView, DetailsCopiesMode, MobileTab } from './types';

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
  isOpen,
  onClose,
  location,
  locations = [],
  onSelectLocation,
  decks = [],
  allCollectionCards: initialAllCollectionCards = [],
  onMutate,
}: UseContainerWorkspaceStateProps) => {
  const toast = useToast();
  const { isIdealMode, syncData } = useIdealEnvironment();

  // Estado local de cartas del contenedor
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMutated, setHasMutated] = useState(false);

  // Drag & Drop
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [isDragOverCenter, setIsDragOverCenter] = useState(false);

  // Selector de Copia Física Modal State
  const [pickerCard, setPickerCard] = useState<Card | null>(null);
  const [pickerUserCards, setPickerUserCards] = useState<UserCard[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingBinderTarget, setPendingBinderTarget] = useState<{ page?: number; slot?: number } | null>(null);

  // Modo del panel izquierdo
  const [leftTab, setLeftTab] = useState<'search' | 'import'>('search');

  // Estados de Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchScope, setSearchScope] = useState<'global' | 'collection' | 'staged'>('global');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid');
  const [searchLimit, setSearchLimit] = useState(45);
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

  // Click-to-place / Selected search card
  const [selectedSearchCard, setSelectedSearchCard] = useState<Card | null>(null);

  // Modal de Asignación de Mazos a Carriles
  const [isAssignDeckModalOpen, setIsAssignDeckModalOpen] = useState(false);
  const [assignCompartmentIdx, setAssignCompartmentIdx] = useState<number>(0);
  const [selectedDeckIdToAssign, setSelectedDeckIdToAssign] = useState<string>('');
  const [shouldMoveCardsOnAssign, setShouldMoveCardsOnAssign] = useState<boolean>(true);
  const [shouldRenameCompartmentOnAssign, setShouldRenameCompartmentOnAssign] = useState<boolean>(false);
  const [isAssigningDeck, setIsAssigningDeck] = useState<boolean>(false);

  // Panel derecho: Carta activa para edición/inspección
  const [selectedUserCard, setSelectedUserCard] = useState<UserCard | null>(null);
  
  // Modos del Panel Derecho
  const [rightMode, setRightMode] = useState<RightPanelMode>('details');
  const [aiSubView, setAiSubView] = useState<AISubView>('lane');
  const [detailsCopiesMode, setDetailsCopiesMode] = useState<DetailsCopiesMode>('grouped');
  const [isVariantsExpanded, setIsVariantsExpanded] = useState<boolean>(false);

  // Modo de Selección Múltiple y Acciones en Bloque
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [cardToSplit, setCardToSplit] = useState<UserCard | null>(null);

  // Modal de Movimiento Individual de Variante
  const [isMoveVariantModalOpen, setIsMoveVariantModalOpen] = useState<boolean>(false);
  const [variantToMove, setVariantToMove] = useState<UserCard | null>(null);

  // Estados para Modal de Ruta de Recolección (Pick-List)
  const [isPickListOpen, setIsPickListOpen] = useState<boolean>(false);
  const [selectedClusterForPickList, setSelectedClusterForPickList] = useState<LaneCluster | null>(null);
  const [selectedDispersedForPickList, setSelectedDispersedForPickList] = useState<UserCard[] | null>(null);
  const [pickListTitle, setPickListTitle] = useState<string>('');
  const [pickListSubtitle, setPickListSubtitle] = useState<string>('');

  // Filtro por cluster/patrón detectado en el carril
  const [activeClusterFilter, setActiveClusterFilter] = useState<string | null>(null);
  const [expandedClusterSubId, setExpandedClusterSubId] = useState<string | null>(null);

  // Contexto global de colección para precisión analítica
  const [allCollectionCards, setAllCollectionCards] = useState<UserCard[]>(() => initialAllCollectionCards || []);
  const [internalDecks, setInternalDecks] = useState<Deck[]>(() => decks || []);

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      const fetchGlobalContext = async () => {
        try {
          const needsCards = !initialAllCollectionCards || initialAllCollectionCards.length === 0;
          const needsDecks = !decks || decks.length === 0;
          if (!needsCards && !needsDecks) return;

          const promises: Promise<Response>[] = [];
          if (needsCards) promises.push(fetch('/api/collection/cards'));
          if (needsDecks) promises.push(fetch('/api/decks'));

          const results = await Promise.all(promises);
          if (!isMounted) return;

          let idx = 0;
          if (needsCards) {
            const res = results[idx++];
            if (res && res.ok) {
              const json = await res.json();
              setAllCollectionCards(json.data || []);
            }
          }
          if (needsDecks) {
            const res = results[idx++];
            if (res && res.ok) {
              const json = await res.json();
              setInternalDecks(json.data || []);
            }
          }
        } catch (e) {
          console.warn('Error loading global collection context:', e);
        }
      };
      fetchGlobalContext();
      return () => { isMounted = false; };
    }
  }, [isOpen, initialAllCollectionCards, decks]);

  // Paginación y filtros internos del contenedor (panel central)
  const [containerSearch, setContainerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('registration_asc');
  const [activeCompartment, setActiveCompartment] = useState<number>(-1);
  const [selectedDeckFilter, setSelectedDeckFilter] = useState<string>('all');
  const [currentGridPage, setCurrentGridPage] = useState(1);
  const [currentBinderViewIndex, setCurrentBinderViewIndex] = useState(0);

  // Importación YDK / Bulk
  const [ydkText, setYdkText] = useState('');
  const [ydkFileName, setYdkFileName] = useState('');
  const [importSubTab, setImportSubTab] = useState<'ydk' | 'id_list'>('ydk');
  const [splitCopiesImport] = useState<boolean>(true);
  const [targetCompartmentForImport, setTargetCompartmentForImport] = useState<number>(0);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importError, setImportError] = useState('');

  // Mobile Tabs
  const [mobileTab, setMobileTab] = useState<MobileTab>('center');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isInbox = !location || location.id === 'inbox';
  const containerId = isInbox ? 'inbox' : location?.id;
  const containerType = isInbox ? 'box' : (location?.type || 'box');

  const selectedUserCardIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedUserCardIdRef.current = selectedUserCard?.id || null;
  }, [selectedUserCard?.id]);

  // Cargar cartas de este contenedor específico de forma estable para acciones de usuario
  const fetchCards = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      if (isIdealMode && syncData?.idealCards) {
        const physicalLocId = (location as { physical_storage_location_id?: string } | null)?.physical_storage_location_id;
        const targetId = location?.id;

        const filtered = (syncData.idealCards as UserCard[]).filter(c => {
          if (isInbox) return !c.storage_location_id;
          return (
            c.storage_location_id === targetId ||
            (physicalLocId && c.storage_location_id === physicalLocId)
          );
        });

        setCards(filtered);
        if (selectedUserCardIdRef.current) {
          const fresh = filtered.find(c => c.id === selectedUserCardIdRef.current);
          if (fresh) setSelectedUserCard(fresh);
        }
        return;
      }

      const url = isInbox 
        ? '/api/collection/inbox' 
        : `/api/collection/cards?location_id=${containerId}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const data: UserCard[] = json.data || [];
        setCards(data);
        if (selectedUserCardIdRef.current) {
          const fresh = data.find(c => c.id === selectedUserCardIdRef.current);
          if (fresh) setSelectedUserCard(fresh);
        }
      }
    } catch (err) {
      console.error('Error al cargar cartas del contenedor:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, isInbox, containerId, isIdealMode, location, syncData]);

  // Carga inicial al montar el contenedor
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const loadInitialCards = async () => {
      try {
        if (isIdealMode && syncData?.idealCards) {
          const physicalLocId = (location as { physical_storage_location_id?: string } | null)?.physical_storage_location_id;
          const targetId = location?.id;

          const filtered = (syncData.idealCards as UserCard[]).filter(c => {
            if (isInbox) return !c.storage_location_id;
            return (
              c.storage_location_id === targetId ||
              (physicalLocId && c.storage_location_id === physicalLocId)
            );
          });

          if (isMounted) {
            setCards(filtered);
            if (selectedUserCardIdRef.current) {
              const fresh = filtered.find(c => c.id === selectedUserCardIdRef.current);
              if (fresh) setSelectedUserCard(fresh);
            }
          }
          return;
        }

        const url = isInbox 
          ? '/api/collection/inbox' 
          : `/api/collection/cards?location_id=${containerId}`;
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const json = await res.json();
          const data: UserCard[] = json.data || [];
          setCards(data);
          if (selectedUserCardIdRef.current) {
            const fresh = data.find(c => c.id === selectedUserCardIdRef.current);
            if (fresh) setSelectedUserCard(fresh);
          }
        }
      } catch (err) {
        console.error('Error al cargar cartas del contenedor:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialCards();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isInbox, containerId, isIdealMode, location, syncData]);

  // Decks detectados físicamente en las cartas de este contenedor
  const decksInContainer = useMemo<DeckInContainer[]>(() => {
    const map = new Map<string, DeckInContainer>();
    cards.forEach(c => {
      if (c.deck_id) {
        const targetDeck = internalDecks.find(d => d.id === c.deck_id);
        const dName = c.deck_details?.name || targetDeck?.name || 'Mazo';
        const existing = map.get(c.deck_id) || {
          id: c.deck_id,
          name: dName,
          format: targetDeck?.format,
          totalCards: (targetDeck?.cards || []).reduce((sum, cd) => sum + cd.count, 0),
          countInContainer: 0,
          compartments: new Set<number>()
        };
        existing.countInContainer += (c.quantity || 1);
        existing.compartments.add(c.compartment_index || 0);
        map.set(c.deck_id, existing);
      }
    });
    return Array.from(map.values());
  }, [cards, internalDecks]);

  // Mazos presentes en el carril activo
  const decksInActiveLane = useMemo(() => {
    if (activeCompartment === -1) return decksInContainer;
    return decksInContainer.filter(d => d.compartments.has(activeCompartment));
  }, [decksInContainer, activeCompartment]);

  // Conteo total de cartas físicas en el contenedor
  const totalPhysicalCards = useMemo(() => {
    return cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [cards]);

  // Cartas del carril activo
  const activeLaneCards = useMemo(() => {
    if (activeCompartment === -1) return cards;
    return cards.filter(c => (c.compartment_index || 0) === activeCompartment);
  }, [cards, activeCompartment]);

  // Pool unificado que garantiza la inclusión de la colección completa y las cartas del contenedor activo
  const consolidatedPool = useMemo(() => {
    if (allCollectionCards.length === 0) return cards;
    const cardMap = new Map<string, UserCard>();
    allCollectionCards.forEach(c => cardMap.set(c.id, c));
    cards.forEach(c => cardMap.set(c.id, c));
    return Array.from(cardMap.values());
  }, [allCollectionCards, cards]);

  // Diagnóstico y clasificación en tiempo real de la carta activa
  const classificationReport = useMemo(() => {
    if (!selectedUserCard) return null;
    return analyzeCardClassification(
      selectedUserCard,
      consolidatedPool,
      internalDecks.length > 0 ? internalDecks : (decks || []),
      locations
    );
  }, [selectedUserCard, consolidatedPool, internalDecks, decks, locations]);

  // Análisis de patrones del carril activo
  const lanePatternReport = useMemo(() => {
    return analyzeLanePatterns(
      activeLaneCards,
      consolidatedPool,
      internalDecks.length > 0 ? internalDecks : (decks || []),
      locations
    );
  }, [activeLaneCards, consolidatedPool, internalDecks, decks, locations]);

  // Análisis global de toda la colección
  const globalCollectionReport = useMemo(() => {
    return analyzeGlobalCollectionPatterns(
      consolidatedPool,
      internalDecks.length > 0 ? internalDecks : (decks || []),
      locations
    );
  }, [consolidatedPool, internalDecks, decks, locations]);

  // Detección de cartas de la colección divididas en múltiples contenedores o idiomas
  const allDispersedCards = useMemo(() => {
    return findDispersedCardsAcrossLocations(consolidatedPool, locations);
  }, [consolidatedPool, locations]);

  // Mapa de duplicados cruzados entre contenedores para badges de alerta
  const crossContainerDuplicatesMap = useMemo(() => {
    return computeCrossContainerDuplicateMap(consolidatedPool, locations);
  }, [consolidatedPool, locations]);

  // Diagnóstico de dispersión para la carta activa seleccionada
  const currentCardDispersedInfo = useMemo(() => {
    if (!selectedUserCard) return null;
    return allDispersedCards.find(d => d.cardId === selectedUserCard.card_id) || null;
  }, [selectedUserCard, allDispersedCards]);

  const handleSelectCompartment = (compIndex: number) => {
    setActiveCompartment(compIndex);
    if (compIndex !== -1) {
      setTargetCompartmentForImport(compIndex);
    }
  };

  // Parser para listas numéricas de cantidad + ID
  const parseQuantityIdList = (text: string): number[] => {
    const lines = text.split(/\r?\n/);
    const result: number[] = [];

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

      // Reemplazar caracteres no numéricos por espacio
      const cleanLine = trimmed.replace(/[^\d]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!cleanLine) continue;

      const tokens = cleanLine.split(' ').filter(Boolean);
      if (tokens.length === 1) {
        const id = parseInt(tokens[0], 10);
        if (!isNaN(id) && id > 100) {
          result.push(id);
        }
      } else if (tokens.length === 2) {
        const v1 = parseInt(tokens[0], 10);
        const v2 = parseInt(tokens[1], 10);

        if (!isNaN(v1) && !isNaN(v2)) {
          if (v1 <= 100 && v2 > 100) {
            for (let i = 0; i < v1; i++) result.push(v2);
          } else if (v2 <= 100 && v1 > 100) {
            for (let i = 0; i < v2; i++) result.push(v1);
          } else {
            result.push(v1);
            result.push(v2);
          }
        }
      } else if (tokens.length > 2) {
        let i = 0;
        while (i < tokens.length) {
          const v = parseInt(tokens[i], 10);
          const nextV = i + 1 < tokens.length ? parseInt(tokens[i + 1], 10) : null;
          if (v <= 100 && nextV !== null && nextV > 100) {
            for (let k = 0; k < v; k++) result.push(nextV);
            i += 2;
          } else if (v > 100) {
            result.push(v);
            i += 1;
          } else {
            i += 1;
          }
        }
      }
    }

    return result;
  };

  // Ejecutar búsqueda en panel izquierdo
  const executeSearch = useCallback(async (
    query: string,
    type: string,
    adv: FilterState,
    scope: 'global' | 'collection' | 'staged',
    favs: boolean,
    limitVal: number
  ) => {
    setIsSearching(true);
    try {
      if (scope === 'staged') {
        const rawList = cards.filter(uc => !uc.binder_page || !uc.binder_slot);
        let filtered = rawList;
        if (query) {
          const qLower = query.toLowerCase();
          filtered = filtered.filter(uc => uc.card_details?.name.toLowerCase().includes(qLower));
        }
        const seen = new Set<number>();
        const mappedCards: Card[] = [];
        for (const uc of filtered) {
          if (!uc.card_id || seen.has(uc.card_id)) continue;
          seen.add(uc.card_id);
          mappedCards.push({
            id: uc.card_id,
            name: uc.card_details?.name || 'Carta Yu-Gi-Oh!',
            type: uc.card_details?.type || 'Monster',
            desc: uc.card_details?.desc || '',
            race: uc.card_details?.race,
            attribute: uc.card_details?.attribute,
            atk: uc.card_details?.atk,
            def: uc.card_details?.def,
            level: uc.card_details?.level,
            image_url: uc.card_details?.image_url || '',
            image_url_small: uc.card_details?.image_url_small || '',
            archetype: uc.card_details?.archetype,
          });
        }
        setSearchResults(mappedCards);
        setIsSearching(false);
        return;
      }

      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (type !== 'All') params.append('type', type);
      if (adv.type) params.append('type', adv.type);
      if (adv.attribute) params.append('attribute', adv.attribute);
      if (adv.race) params.append('race', adv.race);
      if (adv.level) params.append('level', adv.level);
      if (adv.atkMin) params.append('atkMin', adv.atkMin);
      if (adv.atkMax) params.append('atkMax', adv.atkMax);
      if (adv.defMin) params.append('defMin', adv.defMin);
      if (adv.defMax) params.append('defMax', adv.defMax);
      if (adv.archetype) params.append('archetype', adv.archetype);
      if (adv.rarity) params.append('rarity', adv.rarity);
      if (favs) params.append('favorites', 'true');
      params.append('limit', String(limitVal));

      const endpoint = scope === 'collection' ? '/api/collection/cards?' : '/api/cards?';
      const res = await fetch(endpoint + params.toString());
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        let mapped: Card[] = [];
        if (scope === 'collection') {
          const groupedMap = new Map<number, { first: UserCard; items: UserCard[] }>();
          for (const uc of (data as UserCard[])) {
            if (!uc.card_id) continue;
            if (!groupedMap.has(uc.card_id)) {
              groupedMap.set(uc.card_id, { first: uc, items: [uc] });
            } else {
              groupedMap.get(uc.card_id)!.items.push(uc);
            }
          }

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
        } else {
          mapped = data;
        }
        setSearchResults(mapped);
      }
    } catch (err) {
      console.error('Error al buscar cartas:', err);
    } finally {
      setIsSearching(false);
    }
  }, [cards]);

  useEffect(() => {
    if (leftTab === 'search' && isOpen) {
      const timer = setTimeout(() => {
        executeSearch(searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [leftTab, searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit, executeSearch, isOpen]);

  // Seleccionar copia física única
  const handleSelectPhysicalCopy = async (
    userCard: UserCard,
    action: 'move' | 'proxy' = 'move',
    page?: number,
    slot?: number
  ) => {
    try {
      if (action === 'proxy' && userCard.deck_id) {
        await fetch('/api/collection/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_id: userCard.card_id,
            deck_id: userCard.deck_id,
            deck_section: userCard.deck_section || 'main',
            is_proxy: true,
            quantity: 1,
            rarity: userCard.rarity || 'Common',
            condition: userCard.condition || 'Near Mint',
            status_flag: 'in_deck',
          }),
        });
      }

      const effectiveCompartment = activeCompartment === -1 ? 0 : activeCompartment;

      const payload: Record<string, unknown> = {
        id: userCard.id,
        storage_location_id: isInbox ? null : containerId,
        deck_id: null,
        deck_section: null,
        compartment_index: effectiveCompartment,
      };

      if (containerType === 'binder') {
        if (page && slot) {
          payload.binder_page = page;
          payload.binder_slot = slot;
        } else {
          payload.binder_page = currentBinderViewIndex === 0 ? 1 : currentBinderViewIndex * 2;
          payload.binder_slot = 1;
        }
      }

      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          action === 'proxy'
            ? `${userCard.card_details?.name || 'Carta física'} movida a ${isInbox ? 'Inbox' : location?.name || 'este contenedor'} (marcador proxy dejado en deck)`
            : `${userCard.card_details?.name || 'Carta física'} ubicada en ${isInbox ? 'Inbox' : location?.name || 'este contenedor'}`,
          { title: '¡Copia asignada!' }
        );
        setHasMutated(true);
        fetchCards();
      } else {
        toast.error('Error al actualizar la ubicación de la carta física', { title: 'Error' });
      }
    } catch (err) {
      console.error('Error al mover la copia física:', err);
      toast.error('Error de conexión al procesar la selección', { title: 'Error' });
    }
  };

  // Añadir carta al contenedor
  const handleAddCardToContainer = async (card: Card | HoverCardBase, page?: number, slot?: number) => {
    try {
      const cardObj = card as Card;
      if (cardObj.userCardsGroup && cardObj.userCardsGroup.length > 0) {
        if (cardObj.userCardsGroup.length > 1 || cardObj.userCardsGroup.some(uc => uc.deck_id || uc.deck_details)) {
          setPickerCard(cardObj);
          setPickerUserCards(cardObj.userCardsGroup);
          setPendingBinderTarget(page && slot ? { page, slot } : null);
          setIsPickerOpen(true);
          return;
        } else if (cardObj.userCardsGroup.length === 1) {
          await handleSelectPhysicalCopy(cardObj.userCardsGroup[0], 'move', page, slot);
          return;
        }
      }

      if (containerType === 'binder' && page && slot) {
        const existingUnplaced = cards.find(
          c => c.card_id === card.id && (!c.binder_page || !c.binder_slot)
        );
        if (existingUnplaced) {
          const updated = { ...existingUnplaced, binder_page: page, binder_slot: slot };
          setCards(prev => prev.map(c => c.id === existingUnplaced.id ? updated : c));
          setSelectedUserCard(updated);
          setHasMutated(true);
          await fetch('/api/collection/cards', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: existingUnplaced.id, binder_page: page, binder_slot: slot }),
          });
          fetchCards();
          toast.success(`${card.name} ubicada en Pág. ${page}, Slot ${slot}`, { title: '¡Posición asignada!' });
          return;
        }
      }

      const effectiveCompartment = activeCompartment === -1 ? 0 : activeCompartment;

      const payload: Record<string, unknown> = {
        card_id: card.id,
        storage_location_id: isInbox ? null : containerId,
        quantity: 1,
        rarity: 'Common',
        condition: 'Near Mint',
        status_flag: 'collection',
        sleeve_type: 'none',
        compartment_index: effectiveCompartment,
      };

      if (containerType === 'binder') {
        if (page && slot) {
          payload.binder_page = page;
          payload.binder_slot = slot;
        } else {
          payload.binder_page = currentBinderViewIndex === 0 ? 1 : currentBinderViewIndex * 2;
          payload.binder_slot = 1;
        }
      }

      const res = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const insertedCard: UserCard = json.data;
        if (insertedCard) {
          setCards(prev => [insertedCard, ...prev]);
          setSelectedUserCard(insertedCard);
        }
        setHasMutated(true);
        fetchCards();
        if (page && slot) {
          toast.success(`${card.name} colocada en Pág. ${page}, Slot ${slot}`, { title: '¡Carta añadida!' });
        } else {
          toast.success(`${card.name} añadida al contenedor`, { title: '¡Carta añadida!' });
        }
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || 'Error al añadir la carta', { title: 'Error' });
      }
    } catch (err) {
      console.error('Error al agregar carta al contenedor:', err);
      toast.error('Error de conexión al añadir la carta', { title: 'Error' });
    }
  };

  // Drag & Drop handlers
  const handleDragCardStart = useCallback((e: React.DragEvent, card: Card) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedCard(card);
  }, []);

  const handleDropCardToBinderSlot = useCallback(async (e: React.DragEvent, page: number, slot: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;

    interface DragPayload {
      type?: string;
      userCardId?: string;
      cardId?: number;
      fromPage?: number;
      fromSlot?: number;
      card?: Card;
      id?: number;
      name?: string;
      type_name?: string;
    }

    let payload: DragPayload;
    try { payload = JSON.parse(raw) as DragPayload; } catch { return; }

    // Caso 1: Arrastrar carta existente en el binder (desde otro slot o pendiente)
    if (payload.type === 'binder_slot_card' && payload.userCardId) {
      const sourceCard = cards.find(c => c.id === payload.userCardId);
      if (!sourceCard) {
        setDraggedCard(null);
        return;
      }

      // Si se suelta en el mismo slot en el que ya está, no hacer nada
      if (sourceCard.binder_page === page && sourceCard.binder_slot === slot) {
        setDraggedCard(null);
        return;
      }

      const targetCard = cards.find(c => c.binder_page === page && c.binder_slot === slot);

      if (targetCard) {
        // SWAP / INTERCAMBIO ENTRE SLOTS
        const sourceOldPage = sourceCard.binder_page;
        const sourceOldSlot = sourceCard.binder_slot;

        // Actualización optimista de cards
        setCards(prev => prev.map(c => {
          if (c.id === sourceCard.id) return { ...c, binder_page: page, binder_slot: slot };
          if (c.id === targetCard.id) return { ...c, binder_page: sourceOldPage, binder_slot: sourceOldSlot };
          return c;
        }));

        if (selectedUserCard?.id === sourceCard.id) {
          setSelectedUserCard(prev => prev ? { ...prev, binder_page: page, binder_slot: slot } : null);
        } else if (selectedUserCard?.id === targetCard.id) {
          setSelectedUserCard(prev => prev ? { ...prev, binder_page: sourceOldPage, binder_slot: sourceOldSlot } : null);
        }

        setHasMutated(true);
        setDraggedCard(null);

        try {
          await Promise.all([
            fetch('/api/collection/cards', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: sourceCard.id, binder_page: page, binder_slot: slot }),
            }),
            fetch('/api/collection/cards', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: targetCard.id, binder_page: sourceOldPage, binder_slot: sourceOldSlot }),
            }),
          ]);
          toast.success(`Cartas intercambiadas entre slots`, { title: '¡Slots intercambiados!' });
        } catch (err) {
          console.error('Error swapping binder slots:', err);
          toast.error('Error al guardar el intercambio de slots', { title: 'Error' });
        }
        return;
      } else {
        // MOVER A SLOT VACÍO
        setCards(prev => prev.map(c => c.id === sourceCard.id ? { ...c, binder_page: page, binder_slot: slot } : c));
        if (selectedUserCard?.id === sourceCard.id) {
          setSelectedUserCard(prev => prev ? { ...prev, binder_page: page, binder_slot: slot } : null);
        }

        setHasMutated(true);
        setDraggedCard(null);

        try {
          await fetch('/api/collection/cards', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: sourceCard.id, binder_page: page, binder_slot: slot }),
          });
          toast.success(`Carta colocada en Pág. ${page}, Slot ${slot}`, { title: '¡Ubicación actualizada!' });
        } catch (err) {
          console.error('Error moving card to empty slot:', err);
          toast.error('Error al mover carta al slot', { title: 'Error' });
        }
        return;
      }
    }

    // Caso 2: Carta arrastrada desde el buscador o staged
    const cardData: Card = (payload.card || payload) as Card;
    const existing = cards.find(c => c.binder_page === page && c.binder_slot === slot);
    if (existing) {
      toast.warning(`Slot ${slot} (Pág. ${page}) ya está ocupado. Arrastra una carta existente para intercambiarla.`, { title: 'Slot ocupado' });
      setDraggedCard(null);
      return;
    }
    await handleAddCardToContainer(cardData, page, slot);
    setDraggedCard(null);
  }, [cards, selectedUserCard, handleAddCardToContainer, toast]);

  const handleDropCardToBox = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverCenter(false);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    let card: Card;
    try { card = JSON.parse(raw) as Card; } catch { return; }
    await handleAddCardToContainer(card);
    setDraggedCard(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, containerId, isInbox, activeCompartment, toast]);

  // Actualizar propiedades de la carta en tiempo real
  const handleUpdateCard = async (updatedFields: Partial<UserCard>) => {
    if (!selectedUserCard) return;

    const updated = { ...selectedUserCard, ...updatedFields };
    setSelectedUserCard(updated);
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    setHasMutated(true);

    try {
      await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUserCard.id,
          ...updatedFields,
        }),
      });
    } catch (err) {
      console.error('Error al guardar cambios de la carta:', err);
    }
  };

  // Mover todas las copias de esta carta en este contenedor a otro contenedor o inbox
  const handleMoveCard = async (newLocationId: string | null) => {
    if (!selectedUserCard) return;
    const targetLoc = newLocationId === 'inbox' ? null : newLocationId;
    const comp = selectedUserCard.compartment_index || 0;
    const variantsInThisContainer = cards.filter(
      c => c.card_id === selectedUserCard.card_id && (c.compartment_index || 0) === comp
    );
    const variantIds = variantsInThisContainer.map(v => v.id);

    setCards(prev => prev.filter(c => !variantIds.includes(c.id)));
    setSelectedUserCard(null);
    setHasMutated(true);

    try {
      await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_ids: variantIds,
          storage_location_id: targetLoc,
          binder_page: null,
          binder_slot: null,
        }),
      });
      toast.success(`Todas las copias se movieron al nuevo contenedor`, { title: '¡Carta trasladada!' });
      fetchCards();
    } catch (err) {
      console.error('Error al mover carta completa:', err);
    }
  };

  // Quitar la carta del slot y enviarla a la bandeja de pendientes del binder
  const handleSendToStaged = async () => {
    if (!selectedUserCard) return;
    const cardId = selectedUserCard.id;

    // Actualización optimista
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, binder_page: undefined, binder_slot: undefined } : c));
    setSelectedUserCard(prev => prev ? { ...prev, binder_page: undefined, binder_slot: undefined } : null);
    setHasMutated(true);

    try {
      await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cardId,
          binder_page: null,
          binder_slot: null,
        }),
      });
      toast.success('Carta enviada a la bandeja de pendientes', { title: '¡Enviada a Pendientes!' });
    } catch (err) {
      console.error('Error al enviar carta a pendientes:', err);
      toast.error('Error al enviar a pendientes', { title: 'Error' });
    }
  };

  // Asignar carta directamente a un mazo activo
  const handleAssignToDeck = async (deckId: string, deckName: string, section: string = 'main') => {
    if (!selectedUserCard) return;
    await handleUpdateCard({
      deck_id: deckId,
      deck_section: section as 'main' | 'extra' | 'side',
      status_flag: 'in_deck'
    });
    toast.success(`Carta asignada a ${deckName} (${section.toUpperCase()})`, { title: '¡Mazo asignado!' });
  };

  // Aplicar recomendación inteligente de 1 clic
  const handleApplyRecommendation = async (rec: BestRecommendation) => {
    if (!selectedUserCard) return;
    const updates: Partial<UserCard> = {
      status_flag: rec.suggestedStatusFlag,
    };
    if (rec.suggestedDeckId) {
      updates.deck_id = rec.suggestedDeckId;
      updates.deck_section = 'main';
    }
    if (rec.suggestedLocationId && rec.suggestedLocationId !== selectedUserCard.storage_location_id) {
      updates.storage_location_id = rec.suggestedLocationId;
      updates.binder_page = undefined;
      updates.binder_slot = undefined;
      await handleUpdateCard(updates);
      setCards(prev => prev.filter(c => c.id !== selectedUserCard.id));
      setSelectedUserCard(null);
    } else {
      await handleUpdateCard(updates);
    }
    toast.success(rec.title, { title: '✨ Clasificación Aplicada' });
  };

  // Eliminar carta de la colección
  const handleDeleteCard = async () => {
    if (!selectedUserCard) return;
    if (!confirm(`¿Eliminar "${selectedUserCard.card_details?.name || 'esta carta'}" de la colección?`)) return;

    const cardIdToDelete = selectedUserCard.id;
    setSelectedUserCard(null);
    setCards(prev => prev.filter(c => c.id !== cardIdToDelete));
    setHasMutated(true);

    try {
      await fetch(`/api/collection/cards?id=${cardIdToDelete}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error al eliminar carta:', err);
    }
  };

  // Importación YDK / Bulk Handler
  const handleYdkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedText = sanitizeBulkInput(ydkText, importSubTab === 'id_list');
    setYdkText(cleanedText);

    if (!cleanedText.trim()) {
      setImportError('Por favor selecciona un archivo .ydk o pega el listado de cartas');
      return;
    }

    setImportLoading(true);
    setImportError('');
    setImportSuccessMsg('');

    try {
      const effectiveCompartment = location?.compartments && location.compartments.count > 1
        ? targetCompartmentForImport
        : (activeCompartment === -1 ? 0 : activeCompartment);

      const bodyPayload: Record<string, unknown> = {
        storage_location_id: isInbox ? null : containerId,
        compartment_index: effectiveCompartment,
        split_individual: splitCopiesImport,
      };

      if (importSubTab === 'id_list') {
        const parsedCardIds = parseQuantityIdList(ydkText);
        if (parsedCardIds.length === 0) {
          throw new Error('No se identificaron IDs numéricos válidos. Formato esperado: "1 61280937" (cantidad e ID por línea)');
        }
        bodyPayload.cardIds = parsedCardIds;
      } else {
        bodyPayload.ydkText = ydkText;
      }

      const res = await fetch('/api/collection/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al procesar la importación');
      }

      const count = json.insertedCount || json.parsedCount || 0;
      setImportSuccessMsg(`¡Éxito! Se importaron ${count} cartas.`);
      toast.success(`${count} cartas importadas correctamente`, { title: '¡Importación completada!' });
      setHasMutated(true);
      setYdkText('');
      setYdkFileName('');
      await fetchCards();
    } catch (err: unknown) {
      const e = err as Error;
      setImportError(e.message || 'Error al importar cartas');
      toast.error(e.message || 'Error al importar cartas', { title: 'Error de importación' });
    } finally {
      setImportLoading(false);
    }
  };

  // Obtener todas las variantes de la carta activa en el panel derecho
  const activeVariants = useMemo(() => {
    if (!selectedUserCard) return [];
    const comp = selectedUserCard.compartment_index || 0;
    return cards.filter(c => c.card_id === selectedUserCard.card_id && (c.compartment_index || 0) === comp);
  }, [cards, selectedUserCard]);

  const totalCopiesInContainer = useMemo(() => {
    return activeVariants.reduce((sum, v) => sum + (v.quantity || 1), 0);
  }, [activeVariants]);

  // Actualizar una variante específica por id
  const handleUpdateVariantById = async (variantId: string, updatedFields: Partial<UserCard>) => {
    setCards(prev => prev.map(c => c.id === variantId ? { ...c, ...updatedFields } : c));
    if (selectedUserCard?.id === variantId) {
      setSelectedUserCard(prev => prev ? { ...prev, ...updatedFields } : null);
    }
    setHasMutated(true);

    try {
      await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: variantId,
          ...updatedFields,
        }),
      });
    } catch (err) {
      console.error('Error al actualizar variante:', err);
    }
  };

  // Añadir una nueva variante / rareza para la carta seleccionada
  const handleAddNewVariant = async () => {
    if (!selectedUserCard) return;

    try {
      const payload: Record<string, unknown> = {
        card_id: selectedUserCard.card_id,
        storage_location_id: selectedUserCard.storage_location_id,
        compartment_index: selectedUserCard.compartment_index || 0,
        quantity: 1,
        rarity: 'Common',
        condition: 'Near Mint',
        status_flag: selectedUserCard.status_flag || 'collection',
        sleeve_type: 'none',
      };

      const res = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const insertedCard: UserCard = json.data;
        setCards(prev => [insertedCard, ...prev]);
        setHasMutated(true);
        toast.success(`Nueva variante añadida`, { title: '¡Variante creada!' });
        fetchCards();
      }
    } catch (err) {
      console.error('Error al añadir variante:', err);
    }
  };

  // Eliminar una variante específica
  const handleDeleteVariantById = async (variantId: string) => {
    if (!confirm('¿Eliminar esta variante/rareza de la colección?')) return;

    setCards(prev => prev.filter(c => c.id !== variantId));
    if (selectedUserCard?.id === variantId) {
      const remaining = cards.filter(c => c.id !== variantId && c.card_id === selectedUserCard.card_id);
      setSelectedUserCard(remaining[0] || null);
    }
    setHasMutated(true);

    try {
      await fetch(`/api/collection/cards?id=${variantId}`, {
        method: 'DELETE',
      });
      fetchCards();
    } catch (err) {
      console.error('Error al eliminar variante:', err);
    }
  };

  // Abrir Modal de Movimiento de Variante
  const handleOpenMoveVariantModal = (variant: UserCard) => {
    setVariantToMove(variant);
    setIsMoveVariantModalOpen(true);
  };

  const handleCloseMoveVariantModal = () => {
    setIsMoveVariantModalOpen(false);
    setVariantToMove(null);
  };

  // Ejecutar movimiento individual de variante a otro contenedor/carril
  const handleConfirmMoveVariant = async (
    variantId: string,
    quantityToMove: number,
    targetLocationId: string | null,
    targetCompartmentIndex: number
  ) => {
    const targetVariant = cards.find(c => c.id === variantId);
    if (!targetVariant) return;

    const currentQty = targetVariant.quantity || 1;
    const isMovingAll = quantityToMove >= currentQty;

    // Actualización optimista de estado
    if (isMovingAll) {
      setCards(prev => prev.filter(c => c.id !== variantId));
      if (selectedUserCard?.id === variantId) {
        const remaining = cards.filter(c => c.id !== variantId && c.card_id === targetVariant.card_id);
        setSelectedUserCard(remaining[0] || null);
      }
    } else {
      const newQty = currentQty - quantityToMove;
      setCards(prev => prev.map(c => c.id === variantId ? { ...c, quantity: newQty } : c));
      if (selectedUserCard?.id === variantId) {
        setSelectedUserCard(prev => prev ? { ...prev, quantity: newQty } : null);
      }
    }

    setHasMutated(true);

    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'split_and_move',
          user_card_id: variantId,
          split_quantity: quantityToMove,
          target_storage_location_id: targetLocationId,
          target_compartment_index: targetCompartmentIndex,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al mover variante');
      }

      toast.success(
        `${quantityToMove} copia(s) movida(s) correctamente`,
        { title: '¡Variante trasladada!' }
      );
      fetchCards();
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error moving variant:', e);
      toast.error(e.message || 'Error al trasladar variante', { title: 'Error' });
      fetchCards();
    }
  };

  // --- Lógica de Selección Múltiple y Desglose de Copias ---

  // Obtener array de UserCards seleccionadas
  const selectedCards = useMemo(() => {
    return cards.filter(c => selectedCardIds.includes(c.id));
  }, [cards, selectedCardIds]);

  const selectedCardsCount = selectedCardIds.length;

  const selectedPhysicalCount = useMemo(() => {
    return selectedCards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [selectedCards]);

  const canSplitSingleCard = useMemo(() => {
    if (selectedCardIds.length === 1) {
      const target = cards.find(c => c.id === selectedCardIds[0]);
      return (target?.quantity || 1) > 1;
    }
    if (selectedUserCard && (selectedUserCard.quantity || 1) > 1) {
      return true;
    }
    return false;
  }, [selectedCardIds, cards, selectedUserCard]);

  // Alternar selección de una carta individual
  const toggleSelectCard = useCallback((id: string) => {
    setSelectedCardIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // Alternar selección de un grupo de cartas (ej. en GridView)
  const toggleSelectGroup = useCallback((group: GridCardGroup) => {
    const groupIds = group.allVariants.map(v => v.id);
    setSelectedCardIds(prev => {
      const allSelected = groupIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !groupIds.includes(id));
      } else {
        const set = new Set([...prev, ...groupIds]);
        return Array.from(set);
      }
    });
  }, []);

  // Seleccionar todas las cartas filtradas visibles
  const selectAllFilteredCards = useCallback((filteredList?: UserCard[]) => {
    const targetCards = filteredList || cards;
    const allIds = targetCards.map(c => c.id);
    setSelectedCardIds(Array.from(new Set(allIds)));
  }, [cards]);

  // Limpiar selección de cartas
  const clearCardSelection = useCallback(() => {
    setSelectedCardIds([]);
  }, []);

  // Mover en bloque
  const handleBulkMove = async (targetLocationId: string | null, targetCompartmentIndex: number = 0) => {
    if (selectedCardIds.length === 0) return;
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_update',
          card_ids: selectedCardIds,
          updates: {
            storage_location_id: targetLocationId,
            compartment_index: targetCompartmentIndex,
          }
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al mover cartas');
      }

      // Si el destino es diferente al contenedor actual, removerlas de la vista local
      const currentLocId = isInbox ? null : (location?.id || null);
      if (targetLocationId !== currentLocId) {
        setCards(prev => prev.filter(c => !selectedCardIds.includes(c.id)));
      } else {
        setCards(prev => prev.map(c => 
          selectedCardIds.includes(c.id) ? { ...c, compartment_index: targetCompartmentIndex } : c
        ));
      }

      setHasMutated(true);
      toast.success(`${selectedCardIds.length} cartas movidas correctamente`, { title: '¡Mover en Bloque!' });
      clearCardSelection();
      fetchCards();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || 'Error al mover lote de cartas', { title: 'Error' });
    }
  };

  // Cambiar estado en bloque
  const handleBulkChangeStatus = async (newStatus: CardStatusFlag) => {
    if (selectedCardIds.length === 0) return;
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_update',
          card_ids: selectedCardIds,
          updates: {
            status_flag: newStatus,
          }
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al cambiar estado');
      }

      setCards(prev => prev.map(c =>
        selectedCardIds.includes(c.id) ? { ...c, status_flag: newStatus } : c
      ));

      setHasMutated(true);
      toast.success(`Estado actualizado para ${selectedCardIds.length} cartas`, { title: '¡Estado en Bloque!' });
      clearCardSelection();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || 'Error al cambiar estado en lote', { title: 'Error' });
    }
  };

  // Cambiar condición y/o fundas en bloque
  const handleBulkChangeCondition = async (newCondition: CardCondition, sleeveType?: SleeveType) => {
    if (selectedCardIds.length === 0) return;
    try {
      const updates: Record<string, unknown> = { condition: newCondition };
      if (sleeveType !== undefined) {
        updates.sleeve_type = sleeveType;
      }

      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_update',
          card_ids: selectedCardIds,
          updates,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al actualizar condición');
      }

      setCards(prev => prev.map(c => {
        if (!selectedCardIds.includes(c.id)) return c;
        return {
          ...c,
          condition: newCondition,
          ...(sleeveType !== undefined ? { sleeve_type: sleeveType } : {})
        };
      }));

      setHasMutated(true);
      toast.success(`Condición actualizada para ${selectedCardIds.length} cartas`, { title: '¡Condición en Bloque!' });
      clearCardSelection();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || 'Error al actualizar condición en lote', { title: 'Error' });
    }
  };

  // Eliminar en bloque
  const handleBulkDelete = async () => {
    if (selectedCardIds.length === 0) return;
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedCardIds,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al eliminar cartas');
      }

      setCards(prev => prev.filter(c => !selectedCardIds.includes(c.id)));
      if (selectedUserCard && selectedCardIds.includes(selectedUserCard.id)) {
        setSelectedUserCard(null);
      }

      setHasMutated(true);
      toast.success(`${selectedCardIds.length} cartas eliminadas de la colección`, { title: '¡Eliminado en Bloque!' });
      clearCardSelection();
      fetchCards();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || 'Error al eliminar lote de cartas', { title: 'Error' });
    }
  };

  // Abrir Modal de Desglose de Copias
  const handleOpenSplitModal = (card?: UserCard) => {
    const target = card || (selectedCardIds.length === 1 ? cards.find(c => c.id === selectedCardIds[0]) : selectedUserCard);
    if (target && (target.quantity || 1) > 1) {
      setCardToSplit(target);
      setIsSplitModalOpen(true);
    } else {
      toast.info('Para separar copias necesitas seleccionar una carta con al menos 2 copias', { title: 'Copias insuficientes' });
    }
  };

  const handleCloseSplitModal = () => {
    setIsSplitModalOpen(false);
    setCardToSplit(null);
  };

  // Ejecutar separación de copias
  const handleSplitCopies = async (userCardId: string, splitQuantity: number) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'split_copy',
          user_card_id: userCardId,
          split_quantity: splitQuantity,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al separar copias');
      }

      const { updatedSource, newRecord } = json;

      setCards(prev => {
        const next = prev.map(c => c.id === userCardId ? updatedSource : c);
        if (newRecord) {
          return [newRecord, ...next];
        }
        return next;
      });

      if (newRecord) {
        setSelectedUserCard(newRecord);
      }

      setHasMutated(true);
      toast.success(`Se separaron ${splitQuantity} copia(s) a un nuevo registro independiente`, { title: '¡Copia Individual Creada!' });
      fetchCards();
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || 'Error al separar copias', { title: 'Error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setYdkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setYdkText(evt.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  // Abrir modal de asignación de mazo a carril
  const handleOpenAssignDeckModal = (compartmentIdx: number) => {
    setAssignCompartmentIdx(compartmentIdx);
    const activeLoc = location;
    const existingDeckId = activeLoc?.compartments?.deck_ids?.[compartmentIdx] || '';
    setSelectedDeckIdToAssign(existingDeckId || (internalDecks[0]?.id || ''));
    setShouldMoveCardsOnAssign(true);
    setShouldRenameCompartmentOnAssign(false);
    setIsAssignDeckModalOpen(true);
  };

  // Guardar asignación de mazo a carril en Supabase / API
  const handleSaveDeckAssignment = async () => {
    const activeLoc = location;
    if (!activeLoc || isInbox) return;
    setIsAssigningDeck(true);
    try {
      const existingComp = activeLoc.compartments || { count: 1, names: ['Principal'] };
      const currentDeckIds = [...(existingComp.deck_ids || Array(existingComp.count).fill(null))];
      while (currentDeckIds.length < existingComp.count) {
        currentDeckIds.push(null);
      }
      
      const newDeckId = selectedDeckIdToAssign || null;
      currentDeckIds[assignCompartmentIdx] = newDeckId;

      const currentNames = [...existingComp.names];
      if (shouldRenameCompartmentOnAssign && newDeckId) {
        const targetDeck = internalDecks.find(d => d.id === newDeckId);
        if (targetDeck) {
          currentNames[assignCompartmentIdx] = `Mazo: ${targetDeck.name}`;
        }
      }

      const updatedCompartments: CompartmentsConfig = {
        ...existingComp,
        names: currentNames,
        deck_ids: currentDeckIds
      };

      const updatedLocation: StorageLocation = {
        ...activeLoc,
        compartments: updatedCompartments
      };

      const res = await fetch('/api/collection/storage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeLoc.id,
          name: activeLoc.name,
          type: activeLoc.type,
          sub_type: activeLoc.sub_type,
          color_code: activeLoc.color_code,
          dimensions: activeLoc.dimensions,
          capacity: activeLoc.capacity,
          grid_layout: activeLoc.grid_layout,
          compartments: updatedCompartments,
          render_style: activeLoc.render_style,
          description: activeLoc.description
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al guardar asignación de mazo');
      }

      onSelectLocation?.(updatedLocation);
      onMutate?.();

      if (newDeckId) {
        await fetch('/api/decks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newDeckId,
            storage_location_id: activeLoc.id
          })
        });

        setInternalDecks(prev =>
          prev.map(d => (d.id === newDeckId ? { ...d, storage_location_id: activeLoc.id } : d))
        );
      }

      const previousDeckInLane = existingComp.deck_ids?.[assignCompartmentIdx];
      if (previousDeckInLane && previousDeckInLane !== newDeckId) {
        const isStillInOtherLane = currentDeckIds.some((dId, idx) => idx !== assignCompartmentIdx && dId === previousDeckInLane);
        if (!isStillInOtherLane) {
          await fetch('/api/decks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: previousDeckInLane,
              storage_location_id: null
            })
          });
          setInternalDecks(prev =>
            prev.map(d => (d.id === previousDeckInLane ? { ...d, storage_location_id: undefined } : d))
          );
        }
      }

      if (shouldMoveCardsOnAssign && newDeckId) {
        await fetch('/api/collection/cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'move_deck_cards',
            target_deck_id: newDeckId,
            target_storage_location_id: activeLoc.id,
            target_compartment_index: assignCompartmentIdx
          })
        });
        await fetchCards();
      }

      // Si el nuevo deck estaba antes en otro contenedor, limpiarlo de ese contenedor
      if (newDeckId) {
        const prevContainer = locations.find(l => l.id !== activeLoc.id && l.compartments?.deck_ids?.includes(newDeckId));
        if (prevContainer && prevContainer.compartments?.deck_ids) {
          const cleanedPrevDeckIds = prevContainer.compartments.deck_ids.map(dId => dId === newDeckId ? null : dId);
          await fetch('/api/collection/storage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...prevContainer,
              compartments: {
                ...prevContainer.compartments,
                deck_ids: cleanedPrevDeckIds
              }
            })
          });
        }
      }

      const assignedDeck = internalDecks.find(d => d.id === newDeckId);
      if (newDeckId && assignedDeck) {
        toast.success(`Mazo "${assignedDeck.name}" asignado al Carril ${assignCompartmentIdx + 1}`, { title: '¡Mazo Asignado!' });
      } else {
        toast.info(`Carril ${assignCompartmentIdx + 1} desvinculado`, { title: 'Desvinculación' });
      }

      setHasMutated(true);
      if (onMutate) onMutate();
      setIsAssignDeckModalOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error al asignar mazo a carril:', error);
      toast.error(error.message || 'No se pudo asignar el mazo');
    } finally {
      setIsAssigningDeck(false);
    }
  };

  // Mover mazo a otro carril, a otro contenedor o a Sin Clasificar
  const handleMoveDeckCards = async (deckId: string, targetCompIdx: number = 0, targetLocationId?: string | null) => {
    const activeLoc = location;
    if (!activeLoc || isInbox) return;

    // Si targetLocationId es undefined, se asume el contenedor actual
    const destLocId = targetLocationId !== undefined ? targetLocationId : activeLoc.id;

    try {
      if (destLocId === activeLoc.id) {
        // Movimiento dentro del mismo contenedor a otro carril
        const res = await fetch('/api/collection/cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'move_deck_cards',
            target_deck_id: deckId,
            target_storage_location_id: activeLoc.id,
            target_compartment_index: targetCompIdx
          })
        });
        if (!res.ok) throw new Error('Error al mover cartas');

        // Actualizar yg_storage_locations si tiene deck_ids
        if (activeLoc.compartments) {
          const currentDeckIds = [...(activeLoc.compartments.deck_ids || Array(activeLoc.compartments.count).fill(null))];
          while (currentDeckIds.length <= targetCompIdx) currentDeckIds.push(null);
          const cleanedDeckIds = currentDeckIds.map((dId, idx) => idx === targetCompIdx ? deckId : (dId === deckId ? null : dId));
          
          await fetch('/api/collection/storage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeLoc.id,
              name: activeLoc.name,
              type: activeLoc.type,
              sub_type: activeLoc.sub_type,
              color_code: activeLoc.color_code,
              dimensions: activeLoc.dimensions,
              capacity: activeLoc.capacity,
              grid_layout: activeLoc.grid_layout,
              compartments: {
                ...activeLoc.compartments,
                deck_ids: cleanedDeckIds
              },
              render_style: activeLoc.render_style,
              description: activeLoc.description
            })
          });
        }

        const targetName = activeLoc.compartments?.names?.[targetCompIdx] || `Carril ${targetCompIdx + 1}`;
        toast.success(`Mazo movido a ${targetName}`, { title: '¡Mazo Reubicado!' });
      } else if (destLocId === null) {
        // Mover a "Sin clasificar" (desvincular del contenedor)
        await fetch(`/api/decks/${deckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storage_location_id: null,
            compartment_index: 0
          })
        });

        await fetch('/api/collection/cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'move_deck_cards',
            target_deck_id: deckId,
            target_storage_location_id: null,
            target_compartment_index: 0
          })
        });

        // Limpiar de deck_ids en activeLoc
        if (activeLoc.compartments) {
          const currentDeckIds = [...(activeLoc.compartments.deck_ids || [])];
          const cleanedDeckIds = currentDeckIds.map(dId => dId === deckId ? null : dId);
          await fetch('/api/collection/storage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeLoc.id,
              name: activeLoc.name,
              type: activeLoc.type,
              sub_type: activeLoc.sub_type,
              color_code: activeLoc.color_code,
              dimensions: activeLoc.dimensions,
              capacity: activeLoc.capacity,
              grid_layout: activeLoc.grid_layout,
              compartments: {
                ...activeLoc.compartments,
                deck_ids: cleanedDeckIds
              },
              render_style: activeLoc.render_style,
              description: activeLoc.description
            })
          });
        }

        setInternalDecks(prev => prev.map(d => d.id === deckId ? { ...d, storage_location_id: undefined } : d));
        toast.success('Mazo desvinculado y enviado a Sin Clasificar', { title: 'Mazo Desvinculado' });
      } else {
        // Mover a otro contenedor
        const targetContainer = locations.find(l => l.id === destLocId);

        await fetch(`/api/decks/${deckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storage_location_id: destLocId,
            compartment_index: targetCompIdx
          })
        });

        await fetch('/api/collection/cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'move_deck_cards',
            target_deck_id: deckId,
            target_storage_location_id: destLocId,
            target_compartment_index: targetCompIdx
          })
        });

        // Limpiar de activeLoc
        if (activeLoc.compartments) {
          const currentDeckIds = [...(activeLoc.compartments.deck_ids || [])];
          const cleanedDeckIds = currentDeckIds.map(dId => dId === deckId ? null : dId);
          await fetch('/api/collection/storage', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeLoc.id,
              name: activeLoc.name,
              type: activeLoc.type,
              sub_type: activeLoc.sub_type,
              color_code: activeLoc.color_code,
              dimensions: activeLoc.dimensions,
              capacity: activeLoc.capacity,
              grid_layout: activeLoc.grid_layout,
              compartments: {
                ...activeLoc.compartments,
                deck_ids: cleanedDeckIds
              },
              render_style: activeLoc.render_style,
              description: activeLoc.description
            })
          });
        }

        setInternalDecks(prev => prev.map(d => d.id === deckId ? { ...d, storage_location_id: destLocId } : d));
        toast.success(`Mazo trasladado a ${targetContainer?.name || 'otro contenedor'}`, { title: 'Mazo Trasladado' });
      }

      setHasMutated(true);
      if (onMutate) onMutate();
      await fetchCards();
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error al mover cartas de mazo:', error);
      toast.error(error.message || 'No se pudo mover el mazo');
    }
  };

  // Filtrado y Ordenamiento de cartas en el panel central
  const filteredCards = useMemo(() => {
    const list = cards.filter(c => {
      const nameMatch = !containerSearch || (c.card_details?.name.toLowerCase().includes(containerSearch.toLowerCase()) ?? false);
      const statusMatch = statusFilter === 'all' || c.status_flag === statusFilter;
      const compMatch = isInbox || activeCompartment === -1 || (c.compartment_index || 0) === activeCompartment;
      
      let clusterMatch = true;
      if (activeClusterFilter) {
        let matched = false;
        const cardMatchesCluster = (
          userCardIds?: string[], 
          cardIds?: number[], 
          archetypeName?: string
        ): boolean => {
          if (c.id && userCardIds?.some(id => String(id) === String(c.id))) return true;
          if (c.card_id != null && cardIds?.some(id => String(id) === String(c.card_id))) return true;
          if (archetypeName && c.card_details?.archetype) {
            return c.card_details.archetype.trim().toLowerCase() === archetypeName.trim().toLowerCase();
          }
          return false;
        };

        if (lanePatternReport) {
          const cluster = lanePatternReport.clusters.find(cl => cl.id === activeClusterFilter);
          if (cluster) {
            clusterMatch = cardMatchesCluster(cluster.userCardIds, cluster.cardIds, cluster.archetypeName);
            matched = true;
          } else {
            for (const cl of lanePatternReport.clusters) {
              const sub = cl.subArchetypes?.find(s => s.id === activeClusterFilter);
              if (sub) {
                clusterMatch = cardMatchesCluster(sub.userCardIds, sub.cardIds, sub.archetypeName);
                matched = true;
                break;
              }
            }
          }
        }
        if (!matched && globalCollectionReport) {
          const gCluster = globalCollectionReport.globalClusters.find(cl => cl.id === activeClusterFilter);
          if (gCluster) {
            clusterMatch = cardMatchesCluster(gCluster.userCardIds, gCluster.cardIds, gCluster.archetypeName);
            matched = true;
          } else {
            for (const cl of globalCollectionReport.globalClusters) {
              const sub = cl.subArchetypes?.find(s => s.id === activeClusterFilter);
              if (sub) {
                clusterMatch = cardMatchesCluster(sub.userCardIds, sub.cardIds, sub.archetypeName);
                matched = true;
                break;
              }
            }
          }
        }
      }

      let deckMatch = true;
      if (selectedDeckFilter === 'unassigned') {
        deckMatch = !c.deck_id;
      } else if (selectedDeckFilter !== 'all') {
        deckMatch = c.deck_id === selectedDeckFilter;
      }

      return nameMatch && statusMatch && compMatch && clusterMatch && deckMatch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'registration_asc') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === 'registration_desc') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'name_asc') {
        return (a.card_details?.name || '').localeCompare(b.card_details?.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.card_details?.name || '').localeCompare(a.card_details?.name || '');
      }
      if (sortBy === 'id_asc') {
        return (a.card_id || 0) - (b.card_id || 0);
      }
      if (sortBy === 'type') {
        return (a.card_details?.type || '').localeCompare(b.card_details?.type || '');
      }
      return 0;
    });
  }, [cards, containerSearch, statusFilter, sortBy, isInbox, activeCompartment, activeClusterFilter, lanePatternReport, globalCollectionReport, selectedDeckFilter]);

  // Agrupar cartas por card_id + carril para mostrar solo 1 tarjeta por tipo en la galería central
  const groupedGridCards = useMemo<GridCardGroup[]>(() => {
    const groupsMap = new Map<string, GridCardGroup>();

    for (const uc of filteredCards) {
      const comp = uc.compartment_index || 0;
      const key = `${uc.card_id}_${comp}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          card_id: uc.card_id,
          compartment_index: comp,
          card_details: uc.card_details,
          totalQuantity: uc.quantity || 1,
          representativeUserCard: uc,
          allVariants: [uc],
        });
      } else {
        const group = groupsMap.get(key)!;
        group.totalQuantity += (uc.quantity || 1);
        group.allVariants.push(uc);
      }
    }

    return Array.from(groupsMap.values());
  }, [filteredCards]);

  const displayedGridCards = groupedGridCards;

  // Paginación para la grilla
  const CARDS_PER_GRID_PAGE = 30;
  const totalGridPages = Math.max(1, Math.ceil(displayedGridCards.length / CARDS_PER_GRID_PAGE));
  const paginatedGridCards = useMemo(() => {
    const start = (currentGridPage - 1) * CARDS_PER_GRID_PAGE;
    return displayedGridCards.slice(start, start + CARDS_PER_GRID_PAGE);
  }, [displayedGridCards, currentGridPage]);

  // Configuración de Binder
  const rows = location?.grid_layout?.rows || 3;
  const cols = location?.grid_layout?.cols || 3;
  const pocketsPerPage = rows * cols;
  const totalBinderPages = location?.grid_layout?.total_pages || 40;
  const totalBinderViews = Math.ceil(totalBinderPages / 2);
  const leftPageNum = currentBinderViewIndex === 0 ? null : currentBinderViewIndex * 2;
  const rightPageNum = currentBinderViewIndex * 2 + 1 <= totalBinderPages ? currentBinderViewIndex * 2 + 1 : null;

  const leftPageCards = useMemo(() => {
    if (!leftPageNum) return [];
    return cards.filter(c => c.binder_page === leftPageNum);
  }, [cards, leftPageNum]);

  const rightPageCards = useMemo(() => {
    if (!rightPageNum) return [];
    return cards.filter(c => c.binder_page === rightPageNum);
  }, [cards, rightPageNum]);

  // Lista de todos los contenedores disponibles incluyendo el Inbox para navegación
  const allContainers = useMemo<StorageLocation[]>(() => {
    const inboxLoc: StorageLocation = {
      id: 'inbox',
      name: 'Sin Clasificar',
      type: 'box',
      sub_type: 'standard',
      color_code: '#f59e0b',
      dimensions: { width: 0, height: 0, depth: 0 },
      capacity: 9999,
      grid_layout: { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 1 },
      compartments: { count: 1, names: ['Inbox'] },
      render_style: 'grid',
      created_at: '',
    };
    return [inboxLoc, ...locations];
  }, [locations]);

  const currentContainerIndex = useMemo(() => {
    if (isInbox) return 0;
    if (!location) return 0;
    const idx = allContainers.findIndex(c => c.id === location.id);
    return idx >= 0 ? idx : 0;
  }, [allContainers, isInbox, location]);

  const prevContainer = useMemo(() => {
    if (allContainers.length <= 1) return null;
    const prevIdx = (currentContainerIndex - 1 + allContainers.length) % allContainers.length;
    return allContainers[prevIdx];
  }, [allContainers, currentContainerIndex]);

  const nextContainer = useMemo(() => {
    if (allContainers.length <= 1) return null;
    const nextIdx = (currentContainerIndex + 1) % allContainers.length;
    return allContainers[nextIdx];
  }, [allContainers, currentContainerIndex]);

  const handleNavigatePrev = useCallback(() => {
    if (prevContainer && onSelectLocation) {
      onSelectLocation(prevContainer);
    }
  }, [prevContainer, onSelectLocation]);

  const handleNavigateNext = useCallback(() => {
    if (nextContainer && onSelectLocation) {
      onSelectLocation(nextContainer);
    }
  }, [nextContainer, onSelectLocation]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape') {
        onClose(hasMutated);
      } else if (e.key === 'ArrowLeft') {
        handleNavigatePrev();
      } else if (e.key === 'ArrowRight') {
        handleNavigateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasMutated, onClose, handleNavigatePrev, handleNavigateNext]);

  return {
    // Basic state
    cards,
    setCards,
    loading,
    hasMutated,
    setHasMutated,
    isMobile,
    mobileTab,
    setMobileTab,
    isInbox,
    containerId,
    containerType,
    currentLocation: location,
    fetchCards,

    // Navigation
    prevContainer,
    nextContainer,
    handleNavigatePrev,
    handleNavigateNext,

    // Search panel
    leftTab,
    setLeftTab,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchScope,
    setSearchScope,
    onlyFavorites,
    setOnlyFavorites,
    searchResults,
    isSearching,
    searchViewMode,
    setSearchViewMode,
    searchLimit,
    setSearchLimit,
    advancedFilters,
    setAdvancedFilters,
    selectedSearchCard,
    setSelectedSearchCard,

    // Drag & Drop
    draggedCard,
    dragOverSlot,
    setDragOverSlot,
    isDragOverCenter,
    setIsDragOverCenter,
    handleDragCardStart,
    handleDropCardToBinderSlot,
    handleDropCardToBox,

    // Center panel filters & data
    containerSearch,
    setContainerSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    activeCompartment,
    handleSelectCompartment,
    selectedDeckFilter,
    setSelectedDeckFilter,
    decksInContainer,
    decksInActiveLane,
    totalPhysicalCards,
    filteredCards,
    displayedGridCards,
    paginatedGridCards,
    currentGridPage,
    setCurrentGridPage,
    totalGridPages,

    // Binder views
    rows,
    cols,
    pocketsPerPage,
    totalBinderViews,
    currentBinderViewIndex,
    setCurrentBinderViewIndex,
    leftPageNum,
    rightPageNum,
    leftPageCards,
    rightPageCards,

    // Selected user card (inspector)
    selectedUserCard,
    setSelectedUserCard,
    rightMode,
    setRightMode,
    aiSubView,
    setAiSubView,
    detailsCopiesMode,
    setDetailsCopiesMode,
    isVariantsExpanded,
    setIsVariantsExpanded,
    activeVariants,
    totalCopiesInContainer,

    // AI & Pattern Reports
    classificationReport,
    lanePatternReport,
    globalCollectionReport,
    allDispersedCards,
    currentCardDispersedInfo,
    activeClusterFilter,
    setActiveClusterFilter,
    expandedClusterSubId,
    setExpandedClusterSubId,

    // Card Mutations & Actions
    handleAddCardToContainer,
    handleSelectPhysicalCopy,
    handleUpdateCard,
    handleMoveCard,
    handleSendToStaged,
    handleAssignToDeck,
    handleApplyRecommendation,
    handleDeleteCard,
    handleUpdateVariantById,
    handleAddNewVariant,
    handleDeleteVariantById,

    // Multi-Selection & Bulk Actions
    isSelectMode,
    setIsSelectMode,
    selectedCardIds,
    selectedCards,
    selectedCardsCount,
    selectedPhysicalCount,
    canSplitSingleCard,
    toggleSelectCard,
    toggleSelectGroup,
    selectAllFilteredCards,
    clearCardSelection,
    handleBulkMove,
    handleBulkChangeStatus,
    handleBulkChangeCondition,
    handleBulkDelete,

    // Split Modal
    isSplitModalOpen,
    cardToSplit,
    handleOpenSplitModal,
    handleCloseSplitModal,
    handleSplitCopies,

    // Variant Move Modal
    isMoveVariantModalOpen,
    variantToMove,
    handleOpenMoveVariantModal,
    handleCloseMoveVariantModal,
    handleConfirmMoveVariant,

    // Physical Picker Modal
    pickerCard,
    pickerUserCards,
    isPickerOpen,
    setIsPickerOpen,
    setPickerCard,
    setPickerUserCards,
    pendingBinderTarget,
    setPendingBinderTarget,

    // Deck Assignment Modal
    isAssignDeckModalOpen,
    setIsAssignDeckModalOpen,
    assignCompartmentIdx,
    setAssignCompartmentIdx,
    selectedDeckIdToAssign,
    setSelectedDeckIdToAssign,
    shouldMoveCardsOnAssign,
    setShouldMoveCardsOnAssign,
    shouldRenameCompartmentOnAssign,
    setShouldRenameCompartmentOnAssign,
    isAssigningDeck,
    internalDecks,
    handleOpenAssignDeckModal,
    handleSaveDeckAssignment,
    handleMoveDeckCards,

    // Pick-List Modal
    isPickListOpen,
    setIsPickListOpen,
    selectedClusterForPickList,
    setSelectedClusterForPickList,
    selectedDispersedForPickList,
    setSelectedDispersedForPickList,
    pickListTitle,
    setPickListTitle,
    pickListSubtitle,
    setPickListSubtitle,

    // YDK / Bulk Import
    ydkText,
    setYdkText,
    ydkFileName,
    importSubTab,
    setImportSubTab,
    targetCompartmentForImport,
    setTargetCompartmentForImport,
    importLoading,
    importSuccessMsg,
    importError,
    handleYdkImport,
    handleFileUpload,
    allCollectionCards,
    setAllCollectionCards,
    crossContainerDuplicatesMap,
  };
};
