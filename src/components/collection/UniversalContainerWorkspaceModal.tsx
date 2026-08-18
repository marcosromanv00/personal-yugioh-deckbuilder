'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Upload, 
  Box, 
  Layers, 
  Sparkles, 
  Trash2, 
  ArrowLeft, 
  Info, 
  Check, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Package,
  Tag,
  ArrowRight,
  TrendingUp,
  Compass,
  Filter,
  ChevronDown,
  Swords,
  Link2,
  Unlink,
  Settings,
  Boxes,
  Globe
} from 'lucide-react';
import { StorageLocation, UserCard, SleeveInventory, Deck, CompartmentsConfig } from '@/types/collection';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { SearchPanel } from '@/components/deckbuilder/components/SearchPanel';
import { PhysicalCardPickerModal } from './PhysicalCardPickerModal';
import { PickListConsolidationModal } from './PickListConsolidationModal';
import { PremiumDropdown, DropdownOption } from '@/components/ui/PremiumDropdown';
import { getSleeveColorHex } from '@/lib/sleeves';
import { 
  getCategoryBadgeStyle, 
  findDispersedCardsAcrossLocations, 
  getLanguageDisplay,
  DispersedCardSummary 
} from '@/lib/collectionUtils';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { usePanelResize } from '@/components/deckbuilder/hooks/usePanelResize';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { 
  analyzeCardClassification, 
  analyzeLanePatterns, 
  analyzeGlobalCollectionPatterns,
  LaneCluster,
  BestRecommendation 
} from '@/lib/cardClassificationEngine';


interface UniversalContainerWorkspaceModalProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  location: StorageLocation | null;
  locations?: StorageLocation[];
  onSelectLocation?: (location: StorageLocation) => void;
  sleeves?: SleeveInventory[];
  decks?: Deck[];
  onDeckClick?: (deck: Deck) => void;
  onMutate?: () => void;
}

export const UniversalContainerWorkspaceModal: React.FC<UniversalContainerWorkspaceModalProps> = ({
  isOpen,
  onClose,
  location,
  locations = [],
  onSelectLocation,
  sleeves = [],
  decks = [],
  onDeckClick,
  onMutate,
}) => {
  const { theme } = useTheme();
  const toast = useToast();
  const panelResize = usePanelResize(422, 384);

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

  // Modo del panel izquierdo: 'search' | 'import'
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

  // Estado local del contenedor activo (para reflejar actualizaciones en tiempo real)
  const [currentLocation, setCurrentLocation] = useState<StorageLocation | null>(location);
  useEffect(() => {
    setCurrentLocation(location);
  }, [location]);

  // Modal de Asignación de Mazos a Carriles
  const [isAssignDeckModalOpen, setIsAssignDeckModalOpen] = useState(false);
  const [assignCompartmentIdx, setAssignCompartmentIdx] = useState<number>(0);
  const [selectedDeckIdToAssign, setSelectedDeckIdToAssign] = useState<string>('');
  const [shouldMoveCardsOnAssign, setShouldMoveCardsOnAssign] = useState<boolean>(true);
  const [shouldRenameCompartmentOnAssign, setShouldRenameCompartmentOnAssign] = useState<boolean>(false);
  const [isAssigningDeck, setIsAssigningDeck] = useState<boolean>(false);

  // Panel derecho: Carta activa para edición/inspección
  const [selectedUserCard, setSelectedUserCard] = useState<UserCard | null>(null);
  
  // Modo del Panel Derecho: 'details' (Detalles / Copias) vs 'analysis' (Análisis IA & Patrones)
  const [rightMode, setRightMode] = useState<'details' | 'analysis'>('details');
  const [aiSubView, setAiSubView] = useState<'lane' | 'card' | 'collection'>('lane');

  // Modo de visualización de copias en el inspector de carta: 'grouped' vs 'breakdown' (Desglosada)
  const [detailsCopiesMode, setDetailsCopiesMode] = useState<'grouped' | 'breakdown'>('grouped');
  // Acordeón de variantes en el inspector (empieza colapsado para no ser invasivo)
  const [isVariantsExpanded, setIsVariantsExpanded] = useState<boolean>(false);

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
  const [allCollectionCards, setAllCollectionCards] = useState<UserCard[]>([]);
  const [internalDecks, setInternalDecks] = useState<Deck[]>(decks || []);

  useEffect(() => {
    if (decks && decks.length > 0) {
      setInternalDecks(decks);
    }
  }, [decks]);

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      const fetchGlobalContext = async () => {
        try {
          const [cardsRes, decksRes] = await Promise.all([
            fetch('/api/collection/cards'),
            fetch('/api/decks')
          ]);
          if (cardsRes.ok && isMounted) {
            const json = await cardsRes.json();
            setAllCollectionCards(json.data || []);
          }
          if (decksRes.ok && isMounted) {
            const json = await decksRes.json();
            setInternalDecks(json.data || []);
          }
        } catch (e) {
          console.warn('Error loading global collection context:', e);
        }
      };
      fetchGlobalContext();
      return () => { isMounted = false; };
    }
  }, [isOpen]);

  // Paginación y filtros internos del contenedor (panel central)
  const [containerSearch, setContainerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('registration_asc');
  const [activeCompartment, setActiveCompartment] = useState<number>(-1);
  const [selectedDeckFilter, setSelectedDeckFilter] = useState<string>('all');
  const [currentGridPage, setCurrentGridPage] = useState(1);
  const [currentBinderViewIndex, setCurrentBinderViewIndex] = useState(0);

  // Decks detectados físicamente en las cartas de este contenedor
  const decksInContainer = useMemo(() => {
    const map = new Map<string, { id: string; name: string; format?: string; totalCards: number; countInContainer: number; compartments: Set<number> }>();
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

  // Mazos presentes en el carril activo (o todos si activeCompartment === -1)
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

  // Opciones para el filtro de mazos
  const deckFilterOptions = useMemo<DropdownOption<string>[]>(() => {
    const opts: DropdownOption<string>[] = [
      {
        value: 'all',
        label: activeCompartment === -1 ? 'Todos los mazos' : 'Mazos en este carril',
        badge: activeCompartment === -1 ? decksInContainer.length : decksInActiveLane.length,
        icon: <Swords className="w-3.5 h-3.5 text-red-500" />
      }
    ];
    decksInActiveLane.forEach(d => {
      opts.push({
        value: d.id,
        label: d.name,
        badge: `${d.countInContainer}`,
        icon: <Swords className="w-3.5 h-3.5 text-amber-500" />,
        description: `${d.countInContainer} de ${d.totalCards} cartas físicas`
      });
    });
    opts.push({
      value: 'unassigned',
      label: 'Sin mazo (Cartas sueltas)',
      icon: <Package className="w-3.5 h-3.5 text-zinc-400" />
    });
    return opts;
  }, [activeCompartment, decksInContainer, decksInActiveLane]);

  // Opciones para el filtro de estado
  const statusFilterOptions: DropdownOption<string>[] = useMemo(() => [
    { value: 'all', label: 'Todos los estados' },
    { value: 'collection', label: 'En Colección', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
    { value: 'trade_sale', label: 'Venta / Trade', icon: <Tag className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'bulk', label: 'Bulk (Sobrantes)', icon: <Package className="w-3.5 h-3.5 text-zinc-400" /> },
    { value: 'workshop', label: 'Taller / Activo', icon: <Settings className="w-3.5 h-3.5 text-purple-500" /> },
  ], []);

  // Opciones para el filtro de ordenamiento
  const sortOptions: DropdownOption<string>[] = useMemo(() => [
    { value: 'registration_asc', label: 'Registro (1º → N)', icon: <ArrowUpDown className="w-3.5 h-3.5 text-red-500" /> },
    { value: 'registration_desc', label: 'Recientes primero', icon: <ArrowUpDown className="w-3.5 h-3.5 text-red-500" /> },
    { value: 'name_asc', label: 'Nombre (A → Z)' },
    { value: 'name_desc', label: 'Nombre (Z → A)' },
    { value: 'id_asc', label: 'Passcode ID (0 → 9)' },
    { value: 'type', label: 'Tipo de Carta' },
  ], []);

  // Opciones para el dropdown de carriles (> 5 carriles)
  const carrilDropdownOptions = useMemo<DropdownOption<number>[]>(() => {
    const loc = currentLocation || location;
    if (!loc?.compartments) return [];
    const opts: DropdownOption<number>[] = [
      {
        value: -1,
        label: 'Todos los carriles',
        badge: totalPhysicalCards,
        icon: <Layers className="w-3.5 h-3.5 text-purple-500" />
      }
    ];
    loc.compartments.names.forEach((compName, idx) => {
      const compCount = cards.filter(c => (c.compartment_index || 0) === idx).reduce((sum, c) => sum + (c.quantity || 1), 0);
      const laneDecks = decksInContainer.filter(d => d.compartments.has(idx));
      const deckSummary = laneDecks.length > 0 ? `${laneDecks.length} mazo(s): ${laneDecks.map(d => d.name).join(', ')}` : undefined;
      opts.push({
        value: idx,
        label: compName || `Carril ${idx + 1}`,
        badge: compCount,
        description: deckSummary,
        icon: <Box className="w-3.5 h-3.5 text-purple-400" />
      });
    });
    return opts;
  }, [currentLocation, location, totalPhysicalCards, cards, decksInContainer]);

  // Diagnóstico y clasificación en tiempo real de la carta activa
  const classificationReport = useMemo(() => {
    if (!selectedUserCard) return null;
    return analyzeCardClassification(
      selectedUserCard,
      allCollectionCards.length > 0 ? allCollectionCards : cards,
      internalDecks.length > 0 ? internalDecks : (decks || []),
      locations
    );
  }, [selectedUserCard, allCollectionCards, cards, internalDecks, decks, locations]);

  // Análisis de patrones del carril activo
  const lanePatternReport = useMemo(() => {
    return analyzeLanePatterns(
      activeLaneCards,
      allCollectionCards.length > 0 ? allCollectionCards : cards,
      internalDecks.length > 0 ? internalDecks : (decks || []),
      locations
    );
  }, [activeLaneCards, allCollectionCards, cards, internalDecks, decks, locations]);

  // Análisis global de toda la colección
  const globalCollectionReport = useMemo(() => {
    return analyzeGlobalCollectionPatterns(
      allCollectionCards.length > 0 ? allCollectionCards : cards,
      internalDecks.length > 0 ? internalDecks : (decks || []),
      locations
    );
  }, [allCollectionCards, cards, internalDecks, decks, locations]);

  // Detección de cartas de la colección divididas en múltiples contenedores o idiomas
  const allDispersedCards = useMemo(() => {
    const pool = allCollectionCards.length > 0 ? allCollectionCards : cards;
    return findDispersedCardsAcrossLocations(pool, locations);
  }, [allCollectionCards, cards, locations]);

  // Diagnóstico de dispersión para la carta activa seleccionada
  const currentCardDispersedInfo = useMemo(() => {
    if (!selectedUserCard) return null;
    return allDispersedCards.find(d => d.cardId === selectedUserCard.card_id) || null;
  }, [selectedUserCard, allDispersedCards]);

  // Importación YDK / Bulk
  const [ydkText, setYdkText] = useState('');
  const [ydkFileName, setYdkFileName] = useState('');
  const [importSubTab, setImportSubTab] = useState<'ydk' | 'id_list'>('ydk');
  const [splitCopiesImport] = useState<boolean>(true);
  const [targetCompartmentForImport, setTargetCompartmentForImport] = useState<number>(0);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importError, setImportError] = useState('');

  const handleSelectCompartment = (compIndex: number) => {
    setActiveCompartment(compIndex);
    if (compIndex !== -1) {
      setTargetCompartmentForImport(compIndex);
    }
  };

  // Parser para listas numéricas de cantidad + ID (ej: "1 61280937" o "3 89631139")
  const parseQuantityIdList = (text: string): number[] => {
    const lines = text.split('\n');
    const result: number[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#') || line.startsWith('!')) continue;

      const tokens = line.split(/[\s,xX]+/).filter(Boolean);
      if (tokens.length === 1) {
        const id = parseInt(tokens[0], 10);
        if (!isNaN(id) && id > 100) {
          result.push(id);
        }
      } else if (tokens.length >= 2) {
        const v1 = parseInt(tokens[0], 10);
        const v2 = parseInt(tokens[1], 10);

        if (!isNaN(v1) && !isNaN(v2)) {
          let qty = 1;
          let cardId = 0;

          if (v1 > 1000) {
            cardId = v1;
            qty = Math.min(v2, 100);
          } else if (v2 > 1000) {
            qty = Math.min(v1, 100);
            cardId = v2;
          }

          if (cardId > 0 && qty > 0) {
            for (let i = 0; i < qty; i++) {
              result.push(cardId);
            }
          }
        }
      }
    }

    return result;
  };

  // Mobile Tabs
  const [mobileTab, setMobileTab] = useState<'left' | 'center' | 'right'>('center');
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

  const { isIdealMode, syncData } = useIdealEnvironment();
  const selectedUserCardIdRef = React.useRef<string | null>(null);
  selectedUserCardIdRef.current = selectedUserCard?.id || null;

  // Cargar cartas de este contenedor específico de forma estable
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
  }, [isOpen, isInbox, containerId, isIdealMode, location?.id]);

  useEffect(() => {
    if (isOpen) {
      setHasMutated(false);
      setSelectedUserCard(null);
      setSelectedSearchCard(null);
      setCurrentGridPage(1);
      setCurrentBinderViewIndex(0);
      setActiveClusterFilter(null);
      setActiveCompartment(-1);
      setSelectedDeckFilter('all');
      setStatusFilter('all');
      setContainerSearch('');
      fetchCards();
    }
  }, [isOpen, location?.id]);

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

  // Seleccionar copia física única (desde el modal o selección directa)
  const handleSelectPhysicalCopy = async (
    userCard: UserCard,
    action: 'move' | 'proxy' = 'move',
    page?: number,
    slot?: number
  ) => {
    try {
      if (action === 'proxy' && userCard.deck_id) {
        // Crear marcador proxy en el deck original
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

      // Mover la carta física a este contenedor
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

  // Añadir carta al contenedor (o asignar posición si ya existe sin ubicación en binder)
  const handleAddCardToContainer = async (card: Card | HoverCardBase, page?: number, slot?: number) => {
    try {
      const cardObj = card as Card;
      // Si la carta proviene de "MI COLECCIÓN" y tiene un grupo de copias físicas
      if (cardObj.userCardsGroup && cardObj.userCardsGroup.length > 0) {
        // Si hay más de 1 copia física O si alguna copia está asignada a un deck, abrir el selector
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

      // Para binders: verificar si la carta ya está en el contenedor sin posición asignada
      if (containerType === 'binder' && page && slot) {
        const existingUnplaced = cards.find(
          c => c.card_id === card.id && (!c.binder_page || !c.binder_slot)
        );
        if (existingUnplaced) {
          // Actualizar la posición de la carta existente en lugar de duplicar
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
        setCards(prev => [insertedCard, ...prev]);
        setSelectedUserCard(insertedCard);
        setHasMutated(true);
        if (isMobile) setMobileTab('right');
        // Refetch para obtener card_details completo
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
    let card: Card;
    try { card = JSON.parse(raw) as Card; } catch { return; }
    // Check if slot already has a card
    const existing = cards.find(c => c.binder_page === page && c.binder_slot === slot);
    if (existing) {
      toast.warning(`Slot ${slot} (Pág. ${page}) ya está ocupado. Selecciónalo para moverlo.`, { title: 'Slot ocupado' });
      return;
    }
    await handleAddCardToContainer(card, page, slot);
    setDraggedCard(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, toast]);

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

    // Actualización optimista inmediata
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

  // Mover carta a otro contenedor o inbox
  const handleMoveCard = async (newLocationId: string | null) => {
    if (!selectedUserCard) return;
    const targetLoc = newLocationId === 'inbox' ? null : newLocationId;
    await handleUpdateCard({ storage_location_id: targetLoc, binder_page: undefined, binder_slot: undefined });
    setCards(prev => prev.filter(c => c.id !== selectedUserCard.id));
    setSelectedUserCard(null);
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
    if (!ydkText.trim()) {
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
    const activeLoc = currentLocation || location;
    const existingDeckId = activeLoc?.compartments?.deck_ids?.[compartmentIdx] || '';
    setSelectedDeckIdToAssign(existingDeckId || (internalDecks[0]?.id || ''));
    setShouldMoveCardsOnAssign(true);
    setShouldRenameCompartmentOnAssign(false);
    setIsAssignDeckModalOpen(true);
  };

  // Guardar asignación de mazo a carril en Supabase / API
  const handleSaveDeckAssignment = async () => {
    const activeLoc = currentLocation || location;
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

      setCurrentLocation(updatedLocation);

      // 2. Si se asignó un mazo nuevo, persistir su storage_location_id en yg_decks
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

      // Si el carril tenía otro deck antes que ya no está en ningún carril de este contenedor, desvincular
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

      // 3. Mover cartas físicas si el usuario marcó el checkbox
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

  // Mover todas las cartas de un mazo a otro carril
  const handleMoveDeckCards = async (deckId: string, targetCompIdx: number) => {
    const activeLoc = currentLocation || location;
    if (!activeLoc || isInbox) return;
    try {
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
      const targetName = activeLoc.compartments?.names?.[targetCompIdx] || `Carril ${targetCompIdx + 1}`;
      toast.success(`Cartas del mazo movidas a ${targetName}`, { title: '¡Mazo Reubicado!' });
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
        if (lanePatternReport) {
          const cluster = lanePatternReport.clusters.find(cl => cl.id === activeClusterFilter);
          if (cluster) {
            clusterMatch = cluster.userCardIds.includes(c.id);
            matched = true;
          } else {
            for (const cl of lanePatternReport.clusters) {
              const sub = cl.subArchetypes?.find(s => s.id === activeClusterFilter);
              if (sub) {
                clusterMatch = sub.userCardIds.includes(c.id);
                matched = true;
                break;
              }
            }
          }
        }
        if (!matched && globalCollectionReport) {
          const gCluster = globalCollectionReport.globalClusters.find(cl => cl.id === activeClusterFilter);
          if (gCluster) {
            clusterMatch = gCluster.userCardIds.includes(c.id);
            matched = true;
          } else {
            for (const cl of globalCollectionReport.globalClusters) {
              const sub = cl.subArchetypes?.find(s => s.id === activeClusterFilter);
              if (sub) {
                clusterMatch = sub.userCardIds.includes(c.id);
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
  }, [cards, containerSearch, statusFilter, sortBy, isInbox, activeCompartment, activeClusterFilter, lanePatternReport, selectedDeckFilter]);

  // Agrupar cartas por card_id + carril para mostrar solo 1 tarjeta por tipo en la galería central
  const groupedGridCards = useMemo(() => {
    const groupsMap = new Map<string, {
      card_id: number;
      compartment_index: number;
      card_details?: UserCard['card_details'];
      totalQuantity: number;
      representativeUserCard: UserCard;
      allVariants: UserCard[];
    }>();

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

  // Tarjetas a mostrar en la cuadrícula (siempre agrupadas limpiamente por tipo en el contenedor)
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center py-2 sm:py-4 px-6 sm:px-12 bg-black/80 backdrop-blur-md overflow-hidden font-sans select-none"
      onClick={() => onClose(hasMutated)}
    >
      {/* VENTANA FLOTANTE — hereda tema del sistema (dark/light) con ancho ajustado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`${theme === 'dark' ? 'dark' : ''} w-full max-w-[82vw] xl:max-w-360 2xl:max-w-380 h-[92vh] max-h-240 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 select-auto text-zinc-900 dark:text-zinc-100`}
      >
        {/* BOTÓN NAVEGACIÓN ANTERIOR (FLECHA IZQUIERDA) — posicionada dentro para heredar z-context */}
        {prevContainer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigatePrev();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-50 -ml-3 p-3 rounded-2xl bg-zinc-900 hover:bg-red-600 border border-zinc-700 hover:border-red-500 text-zinc-200 hover:text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group flex items-center gap-2"
            title={`Anterior: ${prevContainer.name} (←)`}
            aria-label="Contenedor anterior"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-40 transition-all duration-300 text-xs font-bold font-mono">
              {prevContainer.name}
            </span>
          </button>
        )}

        {/* BOTÓN NAVEGACIÓN SIGUIENTE (FLECHA DERECHA) */}
        {nextContainer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateNext();
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-50 -mr-3 p-3 rounded-2xl bg-zinc-900 hover:bg-red-600 border border-zinc-700 hover:border-red-500 text-zinc-200 hover:text-white shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group flex items-center gap-2"
            title={`Siguiente: ${nextContainer.name} (→)`}
            aria-label="Siguiente contenedor"
          >
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-40 transition-all duration-300 text-xs font-bold font-mono">
              {nextContainer.name}
            </span>
            <ChevronRight className="w-5 h-5 shrink-0" />
          </button>
        )}
        {/* ═══ HEADER DEL ESPACIO DE TRABAJO ═══ */}
        <header className="h-16 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 lg:px-6 flex items-center justify-between gap-4 z-30 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onClose(hasMutated)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Volver a la colección (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: isInbox ? '#f59e0b' : (location?.color_code || '#dc2626') }}
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white truncate flex items-center gap-2">
                <span>{isInbox ? 'Sin Clasificar (Inbox)' : location?.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono uppercase tracking-wider font-bold">
                  {isInbox ? 'Bandeja Inbox' : containerType.toUpperCase()}
                </span>
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate hidden sm:block">
                {totalPhysicalCards} {totalPhysicalCards === 1 ? 'carta física registrada' : 'cartas físicas registradas'} ({groupedGridCards.length} en galería) • Capacidad: {isInbox ? 'Ilimitada' : `${location?.capacity || 0} slots`}
              </p>
            </div>
          </div>
        </div>

        {/* NAVEGADOR DE PESTAÑAS PARA MÓVIL */}
        <div className="flex lg:hidden bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0 text-xs font-black">
          <button
            onClick={() => setMobileTab('left')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${mobileTab === 'left' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}
          >
            Buscador
          </button>
          <button
            onClick={() => setMobileTab('center')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${mobileTab === 'center' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}
          >
            Cartas ({cards.length})
          </button>
          <button
            onClick={() => setMobileTab('right')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${mobileTab === 'right' ? 'bg-red-600 text-white' : 'text-zinc-400'}`}
          >
            Detalles
          </button>
        </div>

        {/* BOTÓN CERRAR */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onClose(hasMutated)}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ═══ CUERPO PRINCIPAL DE 3 PANELES ═══ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ─── PANEL IZQUIERDO: BUSCADOR & IMPORTADOR (REDIMENSIONABLE) ─── */}
        <div 
          style={!isMobile ? { width: `${panelResize.leftPanelWidth}px` } : {}}
          className={`${mobileTab === 'left' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex-col h-full overflow-hidden z-20`}
        >
          {/* Panel de Búsqueda e Importación Bulk Integrado */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <SearchPanel
              leftPanelOpen={true}
              setLeftPanelOpen={() => {}}
              leftPanelWidth={panelResize.leftPanelWidth}
              isMobile={isMobile}
              showStagedTab={containerType === 'binder'}
              stagedCardsCount={cards.filter(c => !c.binder_page || !c.binder_slot).length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchScope={searchScope}
              setSearchScope={setSearchScope}
              onlyFavorites={onlyFavorites}
              setOnlyFavorites={setOnlyFavorites}
              searchType={searchType}
              setSearchType={setSearchType}
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
              searchResults={searchResults}
              isSearching={isSearching}
              searchViewMode={searchViewMode}
              setSearchViewMode={setSearchViewMode}
              searchLimit={searchLimit}
              setSearchLimit={setSearchLimit}
              format="Master Duel"
              addCardToDeck={(card) => {
                if (containerType === 'binder') {
                  setSelectedSearchCard(card);
                } else {
                  handleAddCardToContainer(card);
                }
              }}
              openPreviewForCard={(card) => {
                const existing = cards.find(c => c.card_id === card.id);
                if (existing) {
                  setSelectedUserCard(existing);
                } else {
                  handleAddCardToContainer(card);
                }
                if (isMobile) setMobileTab('right');
              }}
              handleDragCardStart={(e, cardData) => handleDragCardStart(e, cardData as Card)}
              handleCardMouseEnter={() => {}}
              handleCardMouseLeave={() => {}}
            />
          </div>
        </div>

        {/* DIVIDER REDIMENSIONABLE IZQUIERDO */}
        {!isMobile && (
          <div
            onMouseDown={panelResize.startResizeLeft}
            className="w-1.5 hover:w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 dark:hover:bg-red-500 cursor-col-resize self-stretch shrink-0 transition-all z-30 opacity-70 hover:opacity-100"
            title="Arrastra para cambiar el ancho del panel izquierdo"
          />
        )}

        {/* ─── PANEL CENTRAL: VISUALIZADOR DE CONTENEDOR (GRID / BINDER) ─── */}
        <main 
          onDragOver={(e) => {
            if (containerType !== 'binder') {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              if (!isDragOverCenter) setIsDragOverCenter(true);
            }
          }}
          onDragLeave={(e) => {
            if (containerType !== 'binder') {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDragOverCenter(false);
              }
            }
          }}
          onDrop={(e) => {
            if (containerType !== 'binder') {
              handleDropCardToBox(e);
            }
          }}
          className={`${mobileTab === 'center' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative transition-colors ${
            isDragOverCenter && containerType !== 'binder' ? 'ring-2 ring-red-500/80 bg-red-500/5' : ''
          }`}
        >
          {/* Overlay Drag & Drop para Contenedores Tipo Caja / Inbox */}
          <AnimatePresence>
            {isDragOverCenter && containerType !== 'binder' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-50 bg-zinc-950/85 backdrop-blur-xs border-2 border-dashed border-red-500 rounded-2xl flex flex-col items-center justify-center text-red-200 pointer-events-none p-6 text-center m-2 shadow-2xl"
              >
                <Plus className="w-12 h-12 text-red-500 animate-bounce mb-3" />
                <p className="text-sm font-black uppercase tracking-wider text-zinc-100">
                  Soltar carta para añadir a {isInbox ? 'Sin Clasificar' : location?.name || 'este contenedor'}
                </p>
                <p className="text-xs text-zinc-400 mt-1 font-mono">Se agregará una copia automáticamente a tu caja</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* ── Barra Superior Consolidada y Escalable ── */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 relative z-30 overflow-visible">
            {/* Fila 1: Buscador y Selector de Carriles */}
            <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/60 flex-wrap sm:flex-nowrap relative z-30 overflow-visible">
              {/* Buscador dentro del contenedor */}
              <div className="relative flex-1 min-w-36 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={containerSearch}
                  onChange={(e) => setContainerSearch(e.target.value)}
                  placeholder="Filtrar cartas..."
                  className="w-full pl-8.5 pr-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Selector de Carriles (Si el contenedor tiene más de 1 carril) */}
              {(currentLocation || location)?.compartments && (currentLocation || location)!.compartments.count > 1 ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Si tiene <= 5 carriles: Tabs ultracompactos tipo pill */}
                  {(currentLocation || location)!.compartments.count <= 5 ? (
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCompartment(-1);
                          setActiveClusterFilter(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none ${
                          activeCompartment === -1
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                        }`}
                      >
                        Todos ({totalPhysicalCards})
                      </button>
                      {(currentLocation || location)!.compartments.names.map((compName, idx) => {
                        const compCount = cards.filter(c => (c.compartment_index || 0) === idx).reduce((sum, c) => sum + (c.quantity || 1), 0);
                        const laneDecks = decksInContainer.filter(d => d.compartments.has(idx));
                        const isActive = activeCompartment === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              handleSelectCompartment(idx);
                              setActiveClusterFilter(null);
                            }}
                            title={`${compName || `Carril ${idx + 1}`}: ${compCount} cartas (${laneDecks.length} mazos)`}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                              isActive
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span>C{idx + 1}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                              isActive ? 'bg-red-800 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {compCount}
                            </span>
                            {laneDecks.length > 0 && (
                              <span className={`text-[10px] ${isActive ? 'text-amber-300' : 'text-zinc-600 dark:text-zinc-400'}`} title={`${laneDecks.length} mazo(s) en este carril`}>
                                ⚔️{laneDecks.length > 1 ? laneDecks.length : ''}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Si tiene > 5 carriles: Dropdown de Carriles Escalable */
                    <PremiumDropdown
                      options={carrilDropdownOptions}
                      value={activeCompartment}
                      onChange={(val) => {
                        handleSelectCompartment(val);
                        setActiveClusterFilter(null);
                      }}
                      icon={<Layers className="w-3.5 h-3.5 text-red-500" />}
                      menuWidth="w-64"
                      size="sm"
                    />
                  )}

                  {/* Botón de Gestión de Mazos y Carriles */}
                  <button
                    type="button"
                    onClick={() => {
                      setAssignCompartmentIdx(activeCompartment === -1 ? 0 : activeCompartment);
                      setIsAssignDeckModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 select-none group"
                    title="Ver y gestionar los mazos distribuidos en esta caja"
                  >
                    <Swords className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
                    <span className="hidden sm:inline">Mazos ({decksInContainer.length})</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Fila 2: Filtros Secundarios (Mazo, Estado, Orden) */}
            <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-xs relative z-20 overflow-visible flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 shrink-0">
                {/* Filtro por Mazo específico dentro del contenedor/carril */}
                {decksInContainer.length > 0 && (
                  <PremiumDropdown
                    options={deckFilterOptions}
                    value={selectedDeckFilter}
                    onChange={(val) => setSelectedDeckFilter(val)}
                    icon={<Swords className="w-3.5 h-3.5 text-red-500" />}
                    menuWidth="w-64"
                    size="sm"
                  />
                )}

                {/* Filtro de Estado */}
                <PremiumDropdown
                  options={statusFilterOptions}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  size="sm"
                  menuWidth="w-48"
                />

                {/* Filtro de Orden */}
                <PremiumDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  icon={<ArrowUpDown className="w-3.5 h-3.5 text-red-500" />}
                  menuWidth="w-56"
                  size="sm"
                />
              </div>

              {/* Resumen de cartas mostradas */}
              <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0 hidden sm:block">
                Mostrando <strong>{displayedGridCards.length}</strong> {displayedGridCards.length === 1 ? 'tipo único' : 'tipos únicos'} ({filteredCards.reduce((sum, c) => sum + (c.quantity || 1), 0)} cartas físicas)
              </div>
            </div>
          </div>

          {/* Banner de Click to Place para Binders */}
          <AnimatePresence>
            {selectedSearchCard && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="m-3 p-3 bg-red-950/80 border border-red-500/40 rounded-xl flex items-center justify-between text-xs text-red-200 shadow-md shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>
                    Colocando <strong>{selectedSearchCard.name}</strong>. Haz clic en una casilla para ubicarla.
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSearchCard(null)}
                  className="px-2.5 py-1 rounded bg-red-900 hover:bg-red-800 text-red-100 font-bold"
                >
                  Cancelar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contenido Visual: Grid estándar vs Binder Book */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
                <p className="text-xs font-mono">Cargando cartas del contenedor...</p>
              </div>
            ) : containerType === 'binder' ? (
              /* VISTA BINDER POCKETS */
              <div className="h-full flex flex-col items-center justify-between">
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
                  {/* Página Izquierda */}
                  <div className="bg-zinc-100 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-widest font-bold">
                      {leftPageNum ? `Página ${leftPageNum}` : 'Portada Interior'}
                    </div>
                    <div
                      className="grid gap-2 aspect-3/4"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: pocketsPerPage }).map((_, idx) => {
                        const slotNum = idx + 1;
                        const cardInSlot = leftPageCards.find(c => c.binder_slot === slotNum);
                        const slotKey = `L-${leftPageNum}-${slotNum}`;
                        const isDragOver = dragOverSlot === slotKey;
                        return (
                          <div
                            key={slotNum}
                            onClick={() => {
                              if (selectedSearchCard && leftPageNum) {
                                handleAddCardToContainer(selectedSearchCard, leftPageNum, slotNum);
                                setSelectedSearchCard(null);
                              } else if (cardInSlot) {
                                setSelectedUserCard(cardInSlot);
                                if (isMobile) setMobileTab('right');
                              }
                            }}
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverSlot(slotKey); }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={(e) => leftPageNum ? handleDropCardToBinderSlot(e, leftPageNum, slotNum) : undefined}
                            className={`rounded-lg border aspect-3/4 relative flex items-center justify-center p-1 cursor-pointer transition-all ${
                              isDragOver
                                ? 'border-solid border-green-400 bg-green-900/20 scale-105'
                                : cardInSlot
                                ? 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-red-500 shadow-xs'
                                : selectedSearchCard
                                ? 'border-dashed border-purple-500/60 bg-purple-950/20 hover:bg-purple-950/40 animate-pulse'
                                : 'border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30'
                            }`}
                          >
                            {cardInSlot?.card_details ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cardInSlot.card_details.image_url_small || cardInSlot.card_details.image_url}
                                  alt={cardInSlot.card_details.name}
                                  className="w-full h-full object-cover rounded"
                                />
                                <div className="absolute top-1 right-1 bg-zinc-950/90 text-purple-300 font-mono text-[9px] px-1 rounded border border-purple-500/30 font-bold">
                                  {cardInSlot.quantity}x
                                </div>
                                {/* Barra inferior de Categoría */}
                                <div 
                                  className={`absolute bottom-0.5 left-1 right-1 h-1 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(cardInSlot.status_flag).barColorClass}`}
                                  title={`Estado: ${getCategoryBadgeStyle(cardInSlot.status_flag).label}`}
                                />
                              </>
                            ) : (
                              <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                                {draggedCard && !cardInSlot ? '＋' : selectedSearchCard ? 'Colocar' : slotNum}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Página Derecha */}
                  <div className="bg-zinc-100 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-widest font-bold">
                      {rightPageNum ? `Página ${rightPageNum}` : 'Contraportada'}
                    </div>
                    <div
                      className="grid gap-2 aspect-3/4"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: pocketsPerPage }).map((_, idx) => {
                        const slotNum = idx + 1;
                        const cardInSlot = rightPageCards.find(c => c.binder_slot === slotNum);
                        const slotKey = `R-${rightPageNum}-${slotNum}`;
                        const isDragOver = dragOverSlot === slotKey;
                        return (
                          <div
                            key={slotNum}
                            onClick={() => {
                              if (selectedSearchCard && rightPageNum) {
                                handleAddCardToContainer(selectedSearchCard, rightPageNum, slotNum);
                                setSelectedSearchCard(null);
                              } else if (cardInSlot) {
                                setSelectedUserCard(cardInSlot);
                                if (isMobile) setMobileTab('right');
                              }
                            }}
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverSlot(slotKey); }}
                            onDragLeave={() => setDragOverSlot(null)}
                            onDrop={(e) => rightPageNum ? handleDropCardToBinderSlot(e, rightPageNum, slotNum) : undefined}
                            className={`rounded-lg border aspect-3/4 relative flex items-center justify-center p-1 cursor-pointer transition-all ${
                              isDragOver
                                ? 'border-solid border-green-400 bg-green-900/20 scale-105'
                                : cardInSlot
                                ? 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 hover:border-red-500 shadow-xs'
                                : selectedSearchCard
                                ? 'border-dashed border-purple-500/60 bg-purple-950/20 hover:bg-purple-950/40 animate-pulse'
                                : 'border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30'
                            }`}
                          >
                            {cardInSlot?.card_details ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cardInSlot.card_details.image_url_small || cardInSlot.card_details.image_url}
                                  alt={cardInSlot.card_details.name}
                                  className="w-full h-full object-cover rounded"
                                />
                                <div className="absolute top-1 right-1 bg-zinc-950/90 text-purple-300 font-mono text-[9px] px-1 rounded border border-purple-500/30 font-bold">
                                  {cardInSlot.quantity}x
                                </div>
                                {/* Barra inferior de Categoría */}
                                <div 
                                  className={`absolute bottom-0.5 left-1 right-1 h-1 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(cardInSlot.status_flag).barColorClass}`}
                                  title={`Estado: ${getCategoryBadgeStyle(cardInSlot.status_flag).label}`}
                                />
                              </>
                            ) : (
                              <span className="text-[9px] font-mono text-zinc-600">
                                {selectedSearchCard ? 'Colocar' : slotNum}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Controles de página para Binder */}
                <div className="flex items-center gap-4 mt-4">
                  <button
                    disabled={currentBinderViewIndex <= 0}
                    onClick={() => setCurrentBinderViewIndex(p => Math.max(0, p - 1))}
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    Vista {currentBinderViewIndex + 1} de {totalBinderViews}
                  </span>
                  <button
                    disabled={currentBinderViewIndex >= totalBinderViews - 1}
                    onClick={() => setCurrentBinderViewIndex(p => Math.min(totalBinderViews - 1, p + 1))}
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* VISTA GRID RESPONSIVA (BOX, TIN, DRAWER, INBOX) */
              filteredCards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                  <Box className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-3" />
                  <h3 className="text-sm font-black uppercase text-zinc-600 dark:text-zinc-300">
                    No hay cartas en este contenedor
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mt-1">
                    Usa el panel izquierdo para buscar cartas individuales o importar un archivo .YDK / lista en bloque.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                    {paginatedGridCards.map((group) => {
                      const uc = group.representativeUserCard;
                      const isSelected = selectedUserCard?.card_id === group.card_id;
                      const sleeveColor = uc.sleeve_type !== 'none' && uc.sleeve_color ? getSleeveColorHex(uc.sleeve_color) : undefined;
                      return (
                        <motion.div
                          key={`${group.card_id}_${group.compartment_index}`}
                          whileHover={{ y: -3, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedUserCard(uc);
                            if (isMobile) setMobileTab('right');
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedUserCard(uc);
                            if (isMobile) setMobileTab('right');
                          }}
                          className={`relative rounded-xl p-1.5 border transition-all cursor-pointer overflow-hidden group shadow-sm ${
                            isSelected
                              ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500/50 shadow-md'
                              : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                          }`}
                          style={{
                            borderColor: isSelected ? undefined : sleeveColor,
                          }}
                        >
                          <div className="aspect-3/4 rounded-lg overflow-hidden relative bg-zinc-950">
                            {uc.card_details && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={uc.card_details.image_url_small || uc.card_details.image_url}
                                alt={uc.card_details.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                            <div className="absolute top-1 right-1 bg-zinc-950/90 text-white font-mono text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 font-black shadow-xs">
                              {group.totalQuantity}x
                            </div>
                            {uc.is_proxy && (
                              <div className="absolute top-1 left-1 bg-red-600 text-white font-mono text-[8px] px-1 py-0.5 rounded font-black uppercase shadow-xs">
                                Proxy
                              </div>
                            )}
                          </div>
                          <div className="mt-1.5 px-1">
                            <h4 className="text-[11px] font-black text-zinc-200 truncate group-hover:text-red-400 transition-colors">
                              {uc.card_details?.name || 'Carta'}
                            </h4>
                            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mt-0.5">
                              <span className="truncate">
                                {group.allVariants.length > 1 ? `${group.allVariants.length} Variantes` : (uc.rarity || 'Common')}
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-zinc-400">
                                <span>{getLanguageDisplay(uc.language).flag}</span>
                                <span>{getLanguageDisplay(uc.language).badge}</span>
                              </span>
                            </div>
                            {/* Barra inferior de Categoría */}
                            <div 
                              className={`w-full h-1 mt-1.5 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(uc.status_flag).barColorClass}`}
                              title={`Estado: ${getCategoryBadgeStyle(uc.status_flag).label} (${getCategoryBadgeStyle(uc.status_flag).description})`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Paginación de la grid */}
                  {totalGridPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
                      <button
                        disabled={currentGridPage <= 1}
                        onClick={() => setCurrentGridPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        ← Anterior
                      </button>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Página {currentGridPage} de {totalGridPages}
                      </span>
                      <button
                        disabled={currentGridPage >= totalGridPages}
                        onClick={() => setCurrentGridPage(p => Math.min(totalGridPages, p + 1))}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </main>

        {/* DIVIDER REDIMENSIONABLE DERECHO */}
        {!isMobile && (
          <div
            onMouseDown={panelResize.startResizeRight}
            className="w-1.5 hover:w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 dark:hover:bg-red-500 cursor-col-resize self-stretch shrink-0 transition-all z-30 opacity-70 hover:opacity-100"
            title="Arrastra para cambiar el ancho del panel derecho"
          />
        )}

        {/* ─── PANEL DERECHO: INSPECTOR Y ASISTENTE IA DE PATRONES ─── */}
        <div 
          style={!isMobile ? { width: `${panelResize.rightPanelWidth}px` } : {}}
          className={`${mobileTab === 'right' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex-col h-full overflow-y-auto p-4 sm:p-5 z-20 space-y-4`}
        >
          {/* Header del Panel Derecho con Segmented Switch: DETALLES / ANÁLISIS */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-2 shrink-0">
            <div className="flex-1 grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setRightMode('details')}
                className={`py-1.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  rightMode === 'details'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>DETALLES</span>
              </button>
              <button
                type="button"
                onClick={() => setRightMode('analysis')}
                className={`py-1.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                  rightMode === 'analysis'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>ANÁLISIS</span>
              </button>
            </div>

            {selectedUserCard && (
              <button
                onClick={() => setSelectedUserCard(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                title="Cerrar carta seleccionada"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              MODO 1: ANÁLISIS IA & PATRONES
              ═══════════════════════════════════════════════════════════════════ */}
          {rightMode === 'analysis' ? (
            <div className="space-y-3.5">
              {/* Selector de sub-vistas del Asistente IA */}
              <div className="grid grid-cols-3 p-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-xl gap-1 border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAiSubView('lane')}
                  className={`py-1.5 px-1 rounded-lg text-[10.5px] font-mono font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                    aiSubView === 'lane'
                      ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>Carril</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiSubView('card')}
                  className={`py-1.5 px-1 rounded-lg text-[10.5px] font-mono font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                    aiSubView === 'card'
                      ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Tag className="w-3 h-3 text-amber-400" />
                  <span>Carta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiSubView('collection')}
                  className={`py-1.5 px-1 rounded-lg text-[10.5px] font-mono font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                    aiSubView === 'collection'
                      ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Colección</span>
                </button>
              </div>

              {/* ── SUB-VISTA: PATRONES Y COINCIDENCIAS DEL CARRIL ── */}
              {aiSubView === 'lane' && (
                <div className="space-y-3.5">
                  {/* Tarjeta de Mazo Asignado al Carril (Si aplica) */}
                  {activeCompartment !== -1 && (
                    (() => {
                      const activeLoc = currentLocation || location;
                      const assignedDeckId = activeLoc?.compartments?.deck_ids?.[activeCompartment];
                      const assignedDeck = assignedDeckId ? internalDecks.find(d => d.id === assignedDeckId) : null;

                      if (assignedDeck) {
                        const deckCardsInLane = activeLaneCards.filter(c => c.deck_id === assignedDeck.id || c.deck_details?.name === assignedDeck.name);
                        const totalDeckCardsCount = (assignedDeck.cards || []).reduce((sum, c) => sum + c.count, 0) || 40;
                        const physicalCardsPresent = deckCardsInLane.reduce((sum, c) => sum + (c.quantity || 1), 0);
                        const percentagePresent = Math.min(100, Math.round((physicalCardsPresent / Math.max(1, totalDeckCardsCount)) * 100));

                        return (
                          <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-2xl space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-black uppercase text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Swords className="w-3 h-3" />
                                <span>Mazo Asignado</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenAssignDeckModal(activeCompartment)}
                                className="text-[10.5px] font-mono font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Settings className="w-3 h-3" />
                                <span>Configurar</span>
                              </button>
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span>{assignedDeck.name}</span>
                                <span className="text-[10px] font-mono text-zinc-500">({assignedDeck.format || 'Master Duel'})</span>
                              </h4>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                                Este carril está configurado como la ubicación física de este mazo.
                              </p>
                            </div>

                            {/* Barra de progreso de presencia física */}
                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                                <span className="text-zinc-600 dark:text-zinc-400">Presencia Física en Carril:</span>
                                <span className="text-red-600 dark:text-red-400 font-black">{physicalCardsPresent} / {totalDeckCardsCount} cartas ({percentagePresent}%)</span>
                              </div>
                              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-600 rounded-full transition-all duration-300"
                                  style={{ width: `${percentagePresent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="p-3 bg-zinc-100/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">
                              ¿Guardas un mazo aquí?
                            </span>
                            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium truncate">
                              Asigna un mazo a este carril para rastrear sus cartas físicas.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignDeckModal(activeCompartment)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span>Asignar</span>
                          </button>
                        </div>
                      );
                    })()
                  )}

                  {/* Resumen del Carril */}
                  <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/40">
                        {activeCompartment === -1 ? 'Todo el Contenedor' : `Carril ${activeCompartment + 1}`}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">
                        {lanePatternReport.totalCards} cartas ({lanePatternReport.uniqueCards} únicas)
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      {lanePatternReport.dominantTheme} ({lanePatternReport.dominantPercentage}%)
                    </h4>
                    <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {lanePatternReport.summaryRecommendation}
                    </p>
                  </div>

                  {/* Coincidencias y Clusters Detectados */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-500" />
                        <span>Grupos Detectados ({lanePatternReport.clusters.length})</span>
                      </span>
                      {activeClusterFilter && (
                        <button
                          type="button"
                          onClick={() => setActiveClusterFilter(null)}
                          className="text-[10px] font-mono text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer"
                        >
                          Limpiar filtro
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {lanePatternReport.clusters.map(cluster => {
                        const isFiltered = activeClusterFilter === cluster.id;
                        return (
                          <div
                            key={cluster.id}
                            onClick={() => setActiveClusterFilter(isFiltered ? null : cluster.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 shadow-2xs ${
                              isFiltered
                                ? 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-900 dark:text-red-200'
                                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {cluster.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                                {cluster.count} cartas ({cluster.percentage}%)
                              </span>
                            </div>
                            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                              {cluster.description}
                            </p>

                            {/* Desglose de Sub-Arquetipos (Colapsable/Expandible) */}
                            {cluster.subArchetypes && cluster.subArchetypes.length > 0 && (
                              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                                    Sub-arquetipos ({cluster.subArchetypes.length}):
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedClusterSubId(p => p === cluster.id ? null : cluster.id)}
                                    className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                  >
                                    <span>{expandedClusterSubId === cluster.id ? '▲ Ocultar' : '▼ Ver todos'}</span>
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {(expandedClusterSubId === cluster.id ? cluster.subArchetypes : cluster.subArchetypes.slice(0, 4)).map(sub => {
                                    const isSubFiltered = activeClusterFilter === sub.id;
                                    return (
                                      <div
                                        key={sub.id}
                                        onClick={() => setActiveClusterFilter(isSubFiltered ? null : sub.id)}
                                        className={`px-2 py-0.8 rounded-lg text-[9.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                          isSubFiltered
                                            ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-purple-400 dark:hover:border-purple-600'
                                        }`}
                                        title={`${sub.count} cartas (${sub.uniqueCount} únicas) de ${sub.archetypeName}. Haz clic para filtrar cuadrícula.`}
                                      >
                                        <span className="truncate max-w-28">{sub.archetypeName}</span>
                                        <span className={`px-1 py-0.2 rounded text-[8.5px] font-black ${isSubFiltered ? 'bg-purple-800 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                                          {sub.count}
                                        </span>
                                        {expandedClusterSubId === cluster.id && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedClusterForPickList({
                                                id: sub.id,
                                                name: `Sub-Arquetipo: ${sub.archetypeName}`,
                                                category: 'archetype',
                                                count: sub.count,
                                                uniqueCount: sub.uniqueCount,
                                                percentage: 0,
                                                color: 'purple',
                                                cardIds: sub.cardIds,
                                                userCardIds: sub.userCardIds,
                                                description: `${sub.count} cartas (${sub.uniqueCount} únicas) del sub-arquetipo ${sub.archetypeName}.`,
                                              });
                                              setSelectedDispersedForPickList(null);
                                              setPickListTitle(`Ruta: ${sub.archetypeName}`);
                                              setPickListSubtitle(`${sub.count} cartas físicas (${sub.uniqueCount} únicas)`);
                                              setIsPickListOpen(true);
                                            }}
                                            className="ml-0.5 p-0.5 hover:bg-red-500 hover:text-white rounded text-zinc-400"
                                            title="Ruta de recolección para este sub-arquetipo"
                                          >
                                            <Boxes className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {expandedClusterSubId !== cluster.id && cluster.subArchetypes.length > 4 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedClusterSubId(cluster.id)}
                                      className="px-1.5 py-0.8 text-[9.5px] font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                                    >
                                      +{cluster.subArchetypes.length - 4} más...
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                              {cluster.suggestedAction && (
                                <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  💡 {cluster.suggestedAction}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClusterForPickList(cluster);
                                    setSelectedDispersedForPickList(null);
                                    setPickListTitle(`Ruta: ${cluster.name}`);
                                    setPickListSubtitle(cluster.description);
                                    setIsPickListOpen(true);
                                  }}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Abrir lista de recolección física para este grupo"
                                >
                                  <Boxes className="w-3 h-3" />
                                  <span>Ruta</span>
                                </button>
                                <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isFiltered 
                                    ? 'bg-red-600 text-white' 
                                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                                }`}>
                                  {isFiltered ? 'Filtro Activo' : 'Filtrar grid'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cartas Fuera de Lugar (Foils / Staples desprotegidos) */}
                  {lanePatternReport.misplacedCards.length > 0 && (
                    <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-black text-amber-700 dark:text-amber-400 uppercase">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Cartas Fuera de Lugar ({lanePatternReport.misplacedCards.length})</span>
                      </div>
                      <div className="space-y-2">
                        {lanePatternReport.misplacedCards.map((m, idx) => (
                          <div key={idx} className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="min-w-0">
                              <h6 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{m.cardName}</h6>
                              <p className="text-[9.5px] text-amber-600 dark:text-amber-400 font-mono">
                                {m.rarity} • Sugerido: {m.suggestedLocationName}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!m.suggestedLocationId) return;
                                try {
                                  await fetch('/api/collection/cards', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: m.userCardId,
                                      storage_location_id: m.suggestedLocationId,
                                      status_flag: 'collection'
                                    })
                                  });
                                  setCards(prev => prev.filter(c => c.id !== m.userCardId));
                                  toast.success(`${m.cardName} movida a ${m.suggestedLocationName}`, { title: '¡Carta reubicada!' });
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              Mover
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SUB-VISTA: DIAGNÓSTICO DE LA CARTA ACTIVA ── */}
              {aiSubView === 'card' && (
                classificationReport && selectedUserCard ? (
                  <div className="space-y-3.5">
                    {/* Header de la Carta */}
                    <div className="flex gap-3 items-start bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedUserCard.card_details?.image_url_small || selectedUserCard.card_details?.image_url}
                        alt={selectedUserCard.card_details?.name || ''}
                        className="w-16 rounded-lg shadow-sm shrink-0 border border-zinc-200 dark:border-zinc-800"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                          {selectedUserCard.card_details?.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">
                          {selectedUserCard.card_details?.type}
                        </p>
                        {selectedUserCard.card_details?.archetype && (
                          <span className="inline-block text-[9.5px] font-mono text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 px-1.5 py-0.5 rounded">
                            {selectedUserCard.card_details.archetype}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tarjeta de Sugerencia Principal */}
                    <div className={`p-3.5 rounded-2xl border ${
                      classificationReport.bestRecommendation.badgeColor === 'emerald'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                        : classificationReport.bestRecommendation.badgeColor === 'amber'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                        : classificationReport.bestRecommendation.badgeColor === 'blue'
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/40 text-blue-900 dark:text-blue-200'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200'
                    } space-y-2 shadow-2xs`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-white/80 dark:bg-zinc-900/80 border border-current">
                          {classificationReport.bestRecommendation.badgeLabel}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Sugerencia IA</span>
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                        {classificationReport.bestRecommendation.title}
                      </h4>
                      <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {classificationReport.bestRecommendation.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleApplyRecommendation(classificationReport.bestRecommendation)}
                        className="w-full mt-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{classificationReport.bestRecommendation.actionLabel}</span>
                      </button>
                    </div>

                    {/* Decks Activos que requieren esta carta */}
                    <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completar Decks Activos</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {classificationReport.deckMatches.length} mazo(s)
                        </span>
                      </div>

                      {classificationReport.deckMatches.length > 0 ? (
                        <div className="space-y-2">
                          {classificationReport.deckMatches.map(deck => (
                            <div key={deck.deckId} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-2xs">
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  {deck.deckName}
                                </h5>
                                <p className="text-[10px] font-mono text-zinc-500">
                                  Sección: <span className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{deck.section}</span> • Faltan: <span className="font-black text-zinc-800 dark:text-zinc-200">{deck.neededCopies}x</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAssignToDeck(deck.deckId, deck.deckName, deck.section)}
                                className="shrink-0 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                              >
                                <span>Asignar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic py-0.5">
                          Ningún mazo activo en tu biblioteca requiere esta carta actualmente.
                        </p>
                      )}
                    </div>

                    {/* Playset y Excedente */}
                    <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Regla de Playset (3 copias):</span>
                        <span className={`font-mono font-bold ${classificationReport.surplus.isSurplus ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
                          {classificationReport.surplus.isSurplus ? `+${classificationReport.surplus.surplusCopies}x Excedente` : `${classificationReport.surplus.totalPhysicalInInventory}/3`}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-zinc-500">
                        {classificationReport.surplus.isSurplus 
                          ? 'Tienes más de 3 copias físicas de esta carta en tu colección. Las copias sobrantes pueden venderse o cambiarse.' 
                          : 'Dentro del límite reglamentario de 3 copias para jugar.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs">
                    <Tag className="w-8 h-8 text-zinc-400 mx-auto opacity-50" />
                    <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase">Selecciona una carta</h4>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                      Haz clic en cualquier carta de la cuadrícula para ver su diagnóstico individual y destino recomendado.
                    </p>
                  </div>
                )
              )}

              {/* ── SUB-VISTA: OPORTUNIDADES GLOBALES DE LA COLECCIÓN ── */}
              {aiSubView === 'collection' && (
                <div className="space-y-3.5">
                  {/* Resumen Global */}
                  <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/40">
                        Colección Total
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">
                        {allCollectionCards.length || cards.length} cartas
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      Diagnóstico & Agrupaciones Globales
                    </h4>
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px] font-mono">
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 block text-[9px]">Grupos/Cores:</span>
                        <span className="font-black text-purple-600 dark:text-purple-400 text-xs">
                          {globalCollectionReport.globalClusters.length}
                        </span>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 block text-[9px]">Decks Listos:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                          {globalCollectionReport.deckOpportunities.filter(d => d.readyToAssignCount > 0).length}
                        </span>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 block text-[9px]">Dispersas:</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
                          {allDispersedCards.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grupos y Arquetipos Detectados en Toda la Colección */}
                  <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-mono font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-500" />
                        <span>Agrupaciones Globales ({globalCollectionReport.globalClusters.length})</span>
                      </h5>
                    </div>

                    <div className="space-y-2">
                      {globalCollectionReport.globalClusters.map((cluster) => (
                        <div key={cluster.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{cluster.name}</span>
                            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                              {cluster.count} cartas ({cluster.percentage}%)
                            </span>
                          </div>
                          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            {cluster.description}
                          </p>

                          {/* Desglose de Sub-Arquetipos Globales (Colapsable/Expandible) */}
                          {cluster.subArchetypes && cluster.subArchetypes.length > 0 && (
                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                                  Sub-arquetipos ({cluster.subArchetypes.length}):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedClusterSubId(p => p === cluster.id ? null : cluster.id)}
                                  className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                >
                                  <span>{expandedClusterSubId === cluster.id ? '▲ Ocultar' : '▼ Ver todos'}</span>
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {(expandedClusterSubId === cluster.id ? cluster.subArchetypes : cluster.subArchetypes.slice(0, 4)).map(sub => {
                                  return (
                                    <div
                                      key={sub.id}
                                      className="px-2 py-0.8 rounded-lg text-[9.5px] font-mono font-bold border bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-2xs"
                                      title={`${sub.count} cartas (${sub.uniqueCount} únicas) de ${sub.archetypeName} en la colección.`}
                                    >
                                      <span className="truncate max-w-28">{sub.archetypeName}</span>
                                      <span className="px-1 py-0.2 rounded text-[8.5px] font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {sub.count}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedClusterForPickList({
                                            id: sub.id,
                                            name: `Sub-Arquetipo Global: ${sub.archetypeName}`,
                                            category: 'archetype',
                                            count: sub.count,
                                            uniqueCount: sub.uniqueCount,
                                            percentage: 0,
                                            color: 'purple',
                                            cardIds: sub.cardIds,
                                            userCardIds: sub.userCardIds,
                                            description: `${sub.count} cartas (${sub.uniqueCount} únicas) del sub-arquetipo ${sub.archetypeName} en toda la colección.`,
                                          });
                                          setSelectedDispersedForPickList(null);
                                          setPickListTitle(`Ruta Global: ${sub.archetypeName}`);
                                          setPickListSubtitle(`${sub.count} cartas físicas (${sub.uniqueCount} únicas) en toda la colección.`);
                                          setIsPickListOpen(true);
                                        }}
                                        className="ml-0.5 p-0.5 hover:bg-red-500 hover:text-white rounded text-zinc-400"
                                        title="Ruta global de recolección para este sub-arquetipo"
                                      >
                                        <Boxes className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                                {expandedClusterSubId !== cluster.id && cluster.subArchetypes.length > 4 && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedClusterSubId(cluster.id)}
                                    className="px-1.5 py-0.8 text-[9.5px] font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                                  >
                                    +{cluster.subArchetypes.length - 4} más...
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            {cluster.suggestedAction && (
                              <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                💡 {cluster.suggestedAction}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClusterForPickList(cluster);
                                setSelectedDispersedForPickList(null);
                                setPickListTitle(`Ruta Global: ${cluster.name}`);
                                setPickListSubtitle(cluster.description);
                                setIsPickListOpen(true);
                              }}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                              title="Iniciar recolección física de este grupo"
                            >
                              <Boxes className="w-3.5 h-3.5" />
                              <span>Ruta de Recolección</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cartas Dispersas / Fragmentadas en Múltiples Ubicaciones */}
                  {allDispersedCards.length > 0 && (
                    <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Cartas Dispersas ({allDispersedCards.length})</span>
                        </h5>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Copias de la misma carta divididas en diferentes cajas, carpetas o idiomas.
                      </p>

                      <div className="space-y-2">
                        {allDispersedCards.slice(0, 10).map((disp) => (
                          <div key={disp.cardId} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="min-w-0">
                              <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {disp.cardName}
                              </h6>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                                <span className="font-bold text-amber-600 dark:text-amber-400">{disp.totalCopies}x copias</span>
                                <span>•</span>
                                <span>{disp.distinctLocationsCount} ubicaciones</span>
                                <span>•</span>
                                <span>{disp.languagesList.map(l => getLanguageDisplay(l).badge).join(', ')}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const allCardsForDisp = (allCollectionCards.length > 0 ? allCollectionCards : cards).filter(c => c.card_id === disp.cardId);
                                setSelectedDispersedForPickList(allCardsForDisp);
                                setSelectedClusterForPickList(null);
                                setPickListTitle(`Reunir ${disp.cardName}`);
                                setPickListSubtitle(`Consolidar las ${disp.totalCopies} copias divididas en ${disp.distinctLocationsCount} ubicaciones.`);
                                setIsPickListOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                            >
                              <Boxes className="w-3 h-3" />
                              <span>Reunir</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mazos con Piezas Disponibles */}
                  {globalCollectionReport.deckOpportunities.length > 0 && (
                    <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs">
                      <h5 className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mazos con Piezas Listas</span>
                      </h5>

                      <div className="space-y-2">
                        {globalCollectionReport.deckOpportunities.slice(0, 4).map(deck => (
                          <div key={deck.deckId} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{deck.deckName}</span>
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {deck.readyToAssignCount}/{deck.totalNeeded} listas
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {deck.completionPossibleNow ? '✨ ¡Todas las cartas necesarias están en tu colección!' : `Tienes ${deck.readyToAssignCount} de las cartas faltantes.`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════
               MODO 2: INSPECTOR TRADICIONAL DE DETALLES Y VARIANTES (SWITCH OFF)
               ═══════════════════════════════════════════════════════════════════ */
            selectedUserCard && selectedUserCard.card_details ? (
              <div className="space-y-4">
                {/* Vista previa de carta con Badge de Categoría */}
                <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5">
                  <div className="flex gap-3.5 items-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedUserCard.card_details.image_url_small || selectedUserCard.card_details.image_url}
                      alt={selectedUserCard.card_details.name}
                      className="w-20 rounded-xl shadow-md shrink-0 border border-zinc-200 dark:border-zinc-800"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs font-black text-zinc-900 dark:text-white leading-snug">
                        {selectedUserCard.card_details.name}
                      </h4>
                      <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono uppercase font-semibold">
                        {selectedUserCard.card_details.type}
                      </p>
                      {selectedUserCard.card_details.archetype && (
                        <span className="inline-block text-[9.5px] font-mono text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-2 py-0.5 rounded-md mt-1 font-bold">
                          {selectedUserCard.card_details.archetype}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge de Categoría Actual */}
                  {(() => {
                    const cat = getCategoryBadgeStyle(selectedUserCard.status_flag);
                    return (
                      <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${cat.badgeBgClass} ${cat.borderColorClass}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${cat.dotColorClass} shrink-0`} />
                          <div className="min-w-0">
                            <span className={`text-[11px] font-mono font-black uppercase ${cat.textColorClass} block truncate`}>
                              {cat.label}
                            </span>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                              {cat.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Alerta de Copias Dispersas en Otras Ubicaciones / Idiomas */}
                {currentCardDispersedInfo && currentCardDispersedInfo.locations.length > 1 && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-mono font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Copias en otros lugares ({currentCardDispersedInfo.totalCopies}x total)</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-md">
                        {currentCardDispersedInfo.distinctLocationsCount} ubicaciones
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                      Tienes copias de esta carta distribuidas en otras cajas, carpetas o idiomas:
                    </p>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {currentCardDispersedInfo.locations.map((loc, lIdx) => (
                        <div key={lIdx} className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-[10.5px] font-mono">
                          <span className="text-zinc-700 dark:text-zinc-300 truncate">
                            📦 {loc.locationName} ({loc.compartmentName})
                          </span>
                          <span className="font-black text-amber-700 dark:text-amber-400 shrink-0">
                            {loc.copiesCount}x ({loc.languages.map(l => getLanguageDisplay(l).badge).join(', ')})
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const allCardsForThis = (allCollectionCards.length > 0 ? allCollectionCards : cards).filter(c => c.card_id === selectedUserCard.card_id);
                        setSelectedDispersedForPickList(allCardsForThis);
                        setSelectedClusterForPickList(null);
                        setPickListTitle(`Reunir: ${selectedUserCard.card_details?.name || 'Carta'}`);
                        setPickListSubtitle(`Consolida las ${currentCardDispersedInfo.totalCopies} copias de esta carta en una sola ubicación.`);
                        setIsPickListOpen(true);
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Ruta para reunir todas las copias aquí</span>
                    </button>
                  </div>
                )}

                {/* Sección de Copias: Selector Agrupada vs Desglosada */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30 shadow-2xs">
                  <div className="p-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/60">
                    <span className="flex items-center gap-1.5 text-xs font-mono font-black text-zinc-800 dark:text-zinc-200">
                      <Layers className="w-3.5 h-3.5 text-red-500" />
                      <span>Copias ({totalCopiesInContainer} en este contenedor)</span>
                    </span>
                    {/* Switcher Agrupada vs Desglosada exclusivo para vista detalle de carta */}
                    <div className="flex items-center p-0.5 bg-zinc-200/80 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDetailsCopiesMode('grouped')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          detailsCopiesMode === 'grouped'
                            ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-2xs font-black'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                        title="Vista Agrupada: Resumen compacto de copias y rarezas"
                      >
                        <Boxes className="w-3 h-3" />
                        <span>Agrupada</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailsCopiesMode('breakdown')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          detailsCopiesMode === 'breakdown'
                            ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-2xs font-black'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                        title="Vista Desglosada: Desglose completo de cada copia y variante física"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Desglosada</span>
                      </button>
                    </div>
                  </div>

                  {detailsCopiesMode === 'grouped' ? (
                    /* Vista Agrupada: Resumen y Acordeón */
                    <div className="p-3 space-y-2.5 bg-white dark:bg-zinc-950">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-500 dark:text-zinc-400">Total físico:</span>
                        <span className="font-black text-zinc-900 dark:text-zinc-100">{totalCopiesInContainer}x {totalCopiesInContainer === 1 ? 'copia' : 'copias'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-500 dark:text-zinc-400">Variantes/Rarezas:</span>
                        <span className="font-black text-purple-600 dark:text-purple-400">{activeVariants.length} registradas</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsVariantsExpanded(p => !p)}
                        className="w-full py-1.5 px-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span>Editar rarezas / cantidades</span>
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-mono">{isVariantsExpanded ? '▲ Ocultar' : '▼ Expandir'}</span>
                      </button>

                      {isVariantsExpanded && (
                        <div className="space-y-3 pt-2">
                          {activeVariants.map((v, idx) => (
                            <div key={v.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                                <span className="text-[11px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase">
                                  Variante #{idx + 1} ({v.quantity || 1} {v.quantity === 1 ? 'copia' : 'copias'})
                                </span>
                                {activeVariants.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVariantById(v.id)}
                                    className="text-[10px] text-red-500 hover:text-red-400 font-mono font-bold hover:underline cursor-pointer"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                    Copias:
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={v.quantity || 1}
                                    onChange={(e) => handleUpdateVariantById(v.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                    Rareza:
                                  </label>
                                  <PremiumDropdown
                                    value={v.rarity || 'Common'}
                                    onChange={(val) => handleUpdateVariantById(v.id, { rarity: val })}
                                    align="full"
                                    size="sm"
                                    options={[
                                      { value: 'Common', label: 'Common (Común)' },
                                      { value: 'Rare', label: 'Rare (Rara)' },
                                      { value: 'Super Rare', label: 'Super Rare' },
                                      { value: 'Ultra Rare', label: 'Ultra Rare' },
                                      { value: 'Secret Rare', label: 'Secret Rare' },
                                      { value: 'Ultimate Rare', label: 'Ultimate Rare' },
                                      { value: 'Ghost Rare', label: 'Ghost Rare' },
                                      { value: 'Starlight Rare', label: 'Starlight Rare' },
                                      { value: "Collector's Rare", label: "Collector's Rare" },
                                      { value: 'Quarter Century Secret Rare', label: '25th Quarter Century' },
                                    ]}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                    Condición:
                                  </label>
                                  <PremiumDropdown
                                    value={v.condition || 'Near Mint'}
                                    onChange={(val) => handleUpdateVariantById(v.id, { condition: val as UserCard['condition'] })}
                                    align="full"
                                    size="sm"
                                    options={[
                                      { value: 'Near Mint', label: 'Near Mint (NM)' },
                                      { value: 'Lightly Played', label: 'Lightly Played (LP)' },
                                      { value: 'Moderately Played', label: 'Moderately Played (MP)' },
                                      { value: 'Heavily Played', label: 'Heavily Played (HP)' },
                                      { value: 'Damaged', label: 'Damaged (DMG)' },
                                    ]}
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                    Funda / Sleeving:
                                  </label>
                                  <PremiumDropdown
                                    value={v.sleeve_type || 'none'}
                                    onChange={(val) => handleUpdateVariantById(v.id, { sleeve_type: val as UserCard['sleeve_type'] })}
                                    align="full"
                                    size="sm"
                                    options={[
                                      { value: 'none', label: 'Sin Funda' },
                                      { value: 'single', label: 'Funda Simple' },
                                      { value: 'double', label: 'Funda Doble' },
                                      { value: 'triple', label: 'Funda Triple' },
                                    ]}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleAddNewVariant}
                            className="w-full py-2 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>➕ Añadir variante / rareza diferente</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Vista Desglosada: Todas las variantes desplegadas directamente */
                    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-950">
                      <div className="space-y-3">
                        {activeVariants.map((v, idx) => (
                          <div key={v.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                              <span className="text-[11px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase">
                                Variante #{idx + 1} ({v.quantity || 1} {v.quantity === 1 ? 'copia' : 'copias'})
                              </span>
                              {activeVariants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariantById(v.id)}
                                  className="text-[10px] text-red-500 hover:text-red-400 font-mono font-bold hover:underline cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                  Copias:
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={v.quantity || 1}
                                  onChange={(e) => handleUpdateVariantById(v.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                  Rareza:
                                </label>
                                <PremiumDropdown
                                  value={v.rarity || 'Common'}
                                  onChange={(val) => handleUpdateVariantById(v.id, { rarity: val })}
                                  align="full"
                                  size="sm"
                                  options={[
                                    { value: 'Common', label: 'Common (Común)' },
                                    { value: 'Rare', label: 'Rare (Rara)' },
                                    { value: 'Super Rare', label: 'Super Rare' },
                                    { value: 'Ultra Rare', label: 'Ultra Rare' },
                                    { value: 'Secret Rare', label: 'Secret Rare' },
                                    { value: 'Ultimate Rare', label: 'Ultimate Rare' },
                                    { value: 'Ghost Rare', label: 'Ghost Rare' },
                                    { value: 'Starlight Rare', label: 'Starlight Rare' },
                                    { value: "Collector's Rare", label: "Collector's Rare" },
                                    { value: 'Quarter Century Secret Rare', label: '25th Quarter Century' },
                                  ]}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                  Condición:
                                </label>
                                <PremiumDropdown
                                  value={v.condition || 'Near Mint'}
                                  onChange={(val) => handleUpdateVariantById(v.id, { condition: val as UserCard['condition'] })}
                                  align="full"
                                  size="sm"
                                  options={[
                                    { value: 'Near Mint', label: 'Near Mint (NM)' },
                                    { value: 'Lightly Played', label: 'Lightly Played (LP)' },
                                    { value: 'Moderately Played', label: 'Moderately Played (MP)' },
                                    { value: 'Heavily Played', label: 'Heavily Played (HP)' },
                                    { value: 'Damaged', label: 'Damaged (DMG)' },
                                  ]}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                                  Funda / Sleeving:
                                </label>
                                <PremiumDropdown
                                  value={v.sleeve_type || 'none'}
                                  onChange={(val) => handleUpdateVariantById(v.id, { sleeve_type: val as UserCard['sleeve_type'] })}
                                  align="full"
                                  size="sm"
                                  options={[
                                    { value: 'none', label: 'Sin Funda' },
                                    { value: 'single', label: 'Funda Simple' },
                                    { value: 'double', label: 'Funda Doble' },
                                    { value: 'triple', label: 'Funda Triple' },
                                  ]}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddNewVariant}
                        className="w-full py-2 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>➕ Añadir variante / rareza diferente</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Destino / Status flag */}
                <div>
                  <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Destino / Clasificación
                  </label>
                  <PremiumDropdown
                    value={selectedUserCard.status_flag || 'collection'}
                    onChange={(val) => handleUpdateCard({ status_flag: val as UserCard['status_flag'] })}
                    align="full"
                    size="md"
                    options={[
                      { value: 'collection', label: 'Colección Permanente' },
                      { value: 'trade_sale', label: 'Venta / Trade' },
                      { value: 'bulk', label: 'Bulk (Sobrantes)' },
                      { value: 'workshop', label: 'Taller / Decks Activos' },
                    ]}
                  />
                </div>

                {/* Carril / Compartimento */}
                {location?.compartments && location.compartments.count > 1 && (
                  <div>
                    <label className="text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Carril / Compartimento</span>
                    </label>
                    <PremiumDropdown
                      value={selectedUserCard.compartment_index ?? 0}
                      onChange={(val) => handleUpdateCard({ compartment_index: val })}
                      align="full"
                      size="md"
                      options={location.compartments.names.map((compName, idx) => ({
                        value: idx,
                        label: `📦 ${compName || `Carril ${idx + 1}`}`,
                      }))}
                    />
                  </div>
                )}

                {/* Mover de Contenedor */}
                <div>
                  <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Mover a Contenedor
                  </label>
                  <PremiumDropdown
                    value={selectedUserCard.storage_location_id || 'inbox'}
                    onChange={(val) => handleMoveCard(val)}
                    align="full"
                    size="md"
                    options={[
                      { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
                      ...locations.map((loc) => ({
                        value: loc.id,
                        label: `📦 ${loc.name} (${loc.type})`,
                      })),
                    ]}
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Notas adicionales
                  </label>
                  <input
                    type="text"
                    value={selectedUserCard.notes || ''}
                    onChange={(e) => handleUpdateCard({ notes: e.target.value })}
                    placeholder="1st edition, foil bleed, etc."
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none shadow-2xs"
                  />
                </div>

                {/* Botón Eliminar */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={handleDeleteCard}
                    className="w-full py-2.5 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar de Colección</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500 space-y-2">
                <Info className="w-10 h-10 mb-1 opacity-40 text-zinc-400" />
                <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                  Ninguna carta seleccionada
                </h4>
                <p className="text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-xs">
                  Haz clic en una carta de la cuadrícula para inspeccionar sus copias, rarezas y propiedades.
                </p>
              </div>
            )
          )}
        </div>

      </div>

      {/* Modal de Selección de Copias Físicas */}
      <PhysicalCardPickerModal
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setPickerCard(null);
          setPickerUserCards([]);
          setPendingBinderTarget(null);
        }}
        card={pickerCard}
        userCards={pickerUserCards}
        targetContainerName={isInbox ? 'Sin Clasificar (Inbox)' : location?.name}
        onSelectCopy={(uc, action) => {
          handleSelectPhysicalCopy(
            uc,
            action,
            pendingBinderTarget?.page,
            pendingBinderTarget?.slot
          );
        }}
      />

      {/* ═══ MODAL PARA GESTIÓN DE MAZOS Y CARRILES ═══ */}
      <AnimatePresence>
        {isAssignDeckModalOpen && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 font-sans"
            onClick={() => setIsAssignDeckModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Gestión de Mazos y Carriles
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {(currentLocation || location)?.name || 'Caja'} • {decksInContainer.length} {decksInContainer.length === 1 ? 'mazo registrado' : 'mazos registrados'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssignDeckModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sección 1: Distribución Actual de Mazos por Carril */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-red-500" />
                    <span>Distribución por Carril</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {cards.length} cartas físicas en caja
                  </span>
                </div>

                <div className="space-y-2">
                  {((currentLocation || location)?.compartments?.names || ['Principal']).map((compName, idx) => {
                    const compCount = cards.filter(c => (c.compartment_index || 0) === idx).reduce((sum, c) => sum + (c.quantity || 1), 0);
                    const laneDecks = decksInContainer.filter(d => d.compartments.has(idx));
                    const moveOptions = ((currentLocation || location)?.compartments?.names || [])
                      .map((name, targetIdx) => targetIdx !== idx ? ({
                        value: targetIdx,
                        label: `Mover a ${name || `Carril ${targetIdx + 1}`}`,
                        icon: <Box className="w-3.5 h-3.5 text-zinc-400" />
                      }) : null)
                      .filter(Boolean) as DropdownOption<number>[];

                    return (
                      <div 
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                              {compName || `Carril ${idx + 1}`}
                            </span>
                            <span className="text-[10.5px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {compCount} cartas
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAssignCompartmentIdx(idx);
                              setSelectedDeckIdToAssign(internalDecks[0]?.id || '');
                            }}
                            className="text-[10.5px] text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer"
                          >
                            ➕ Añadir mazo a C{idx + 1}
                          </button>
                        </div>

                        {/* Listado de Mazos en este carril */}
                        {laneDecks.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            {laneDecks.map(d => (
                              <div 
                                key={d.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Swords className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{d.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">
                                      {d.countInContainer} de {d.totalCards} cartas físicas en este carril
                                    </p>
                                  </div>
                                </div>

                                {/* Acciones de Mazo (Mover a otro carril con PremiumDropdown) */}
                                {(currentLocation || location)?.compartments && (currentLocation || location)!.compartments.count > 1 && moveOptions.length > 0 && (
                                  <div className="shrink-0 ml-2">
                                    <PremiumDropdown
                                      options={moveOptions}
                                      value={-1}
                                      onChange={(targetIdx) => {
                                        if (targetIdx !== -1) {
                                          handleMoveDeckCards(d.id, targetIdx);
                                        }
                                      }}
                                      placeholder="Mover mazo a..."
                                      menuWidth="w-52"
                                      align="right"
                                      size="sm"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono italic">
                            Sin mazos vinculados ({compCount} cartas sueltas / staples)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 2: Vincular o Importar Nuevo Mazo a un Carril */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <span className="text-[11px] font-mono font-black uppercase tracking-wider text-zinc-500 block">
                  Vincular Mazo Existente a un Carril
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Selector de Carril */}
                  {(currentLocation || location)?.compartments && (currentLocation || location)!.compartments.count > 1 && (
                    <div>
                      <label className="text-[10.5px] font-mono font-black text-zinc-500 uppercase block mb-1">
                        Carril Destino:
                      </label>
                      <PremiumDropdown
                        options={((currentLocation || location)?.compartments?.names || []).map((name, i) => ({
                          value: i,
                          label: name || `Carril ${i + 1}`,
                          icon: <Box className="w-3.5 h-3.5 text-zinc-400" />
                        }))}
                        value={assignCompartmentIdx}
                        onChange={(i) => setAssignCompartmentIdx(i)}
                        className="w-full"
                        menuWidth="w-full"
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Selector de Mazo */}
                  <div className={(currentLocation || location)?.compartments && (currentLocation || location)!.compartments.count > 1 ? '' : 'sm:col-span-2'}>
                    <label className="text-[10.5px] font-mono font-black text-zinc-500 uppercase block mb-1">
                      Mazo a Vincular:
                    </label>
                    <PremiumDropdown
                      options={internalDecks.map((d) => ({
                        value: d.id,
                        label: d.name,
                        badge: (d.cards || []).reduce((sum, c) => sum + c.count, 0),
                        icon: <Swords className="w-3.5 h-3.5 text-red-500" />
                      }))}
                      value={selectedDeckIdToAssign}
                      onChange={(deckId) => setSelectedDeckIdToAssign(deckId)}
                      placeholder="-- Seleccionar Mazo --"
                      className="w-full"
                      menuWidth="w-full"
                      size="sm"
                    />
                  </div>
                </div>

                {/* Opción de mover cartas físicas automáticamente */}
                {selectedDeckIdToAssign && (
                  <label className="flex items-start gap-2 cursor-pointer select-none bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <input
                      type="checkbox"
                      checked={shouldMoveCardsOnAssign}
                      onChange={(e) => setShouldMoveCardsOnAssign(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        Mover automáticamente las cartas físicas de este mazo a este carril
                      </span>
                      <span className="text-[10.5px] text-zinc-500 block leading-tight">
                        Asigna la ubicación física de todas las copias de este mazo para que queden registradas en este carril.
                      </span>
                    </div>
                  </label>
                )}

                {/* Botones de Acción */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAssignDeckModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDeckAssignment}
                    disabled={isAssigningDeck || !selectedDeckIdToAssign}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
                  >
                    {isAssigningDeck ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Asignando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Vincular Mazo al Carril</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Ruta de Recolección (Pick-List) Interactiva */}
      <PickListConsolidationModal
        isOpen={isPickListOpen}
        onClose={() => {
          setIsPickListOpen(false);
          setSelectedClusterForPickList(null);
          setSelectedDispersedForPickList(null);
        }}
        cluster={selectedClusterForPickList}
        selectedCards={selectedDispersedForPickList || undefined}
        title={pickListTitle}
        subtitle={pickListSubtitle}
        allCollectionCards={allCollectionCards.length > 0 ? allCollectionCards : cards}
        locations={locations}
        defaultTargetLocationId={isInbox ? 'inbox' : location?.id}
        defaultTargetCompartmentIndex={activeCompartment === -1 ? 0 : activeCompartment}
        onSuccess={() => {
          setHasMutated(true);
          fetchCards();
          // Recargar contexto global
          fetch('/api/collection/cards')
            .then(res => res.json())
            .then(json => {
              if (json.data) setAllCollectionCards(json.data);
            })
            .catch(console.warn);
        }}
      />

      </motion.div>
    </div>
  );
};
