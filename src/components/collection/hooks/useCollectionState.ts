import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StorageLocation, UserCard, StorageLocationFormData, Deck, SleeveInventory, CardCondition, CardStatusFlag, SleeveType, SleeveCategory } from '@/types/collection';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { computeCrossContainerDuplicateMap } from '@/lib/collectionSuggestions';
import { invalidateContainerCardsCache } from '@/lib/cache/containerCardsCache';

/**
 * Hook personalizado useCollectionState
 * Encapsula todo el estado y lógica de negocio para la gestión de la colección física
 * de cartas, fundas, decks y contenedores, realizando peticiones a la base de datos a través de la API.
 */
export function useCollectionState() {
  const { isIdealMode, syncData } = useIdealEnvironment();

  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [inboxCards, setInboxCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab activo y listado de cartas de la colección completa
  const [activeTab, setActiveTab] = useState<'containers' | 'suggestions' | 'sleeves' | 'decks' | 'complete' | 'favorites' | 'valuation'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const validTabs = ['containers', 'suggestions', 'sleeves', 'decks', 'complete', 'favorites', 'valuation'];
      if (tabParam && validTabs.includes(tabParam)) {
        return tabParam as 'containers' | 'suggestions' | 'sleeves' | 'decks' | 'complete' | 'favorites' | 'valuation';
      }
    }
    return 'containers';
  });

  // Helper para sincronizar parámetros en URL sin recargar
  const updateUrlParams = useCallback((newParams: Record<string, string | null>) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
  }, []);

  const handleSetActiveTab = useCallback((tab: 'containers' | 'suggestions' | 'sleeves' | 'decks' | 'complete' | 'favorites' | 'valuation') => {
    setActiveTab(tab);
    updateUrlParams({ tab: tab === 'containers' ? null : tab });
  }, [updateUrlParams]);
  const [masterCollectionCards, setMasterCollectionCards] = useState<UserCard[]>([]);
  const [allCollectionCards, setAllCollectionCards] = useState<UserCard[]>([]);
  const [loadingAllCards, setLoadingAllCards] = useState(false);
  const [allCollectionFilters, setAllCollectionFilters] = useState<FilterState>({
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
    status: ''
  });
  const [allSearchQuery, setAllSearchQuery] = useState('');
  
  // Filtros de contenedor y deck
  const [locationFilter, setLocationFilter] = useState<string>(''); 
  const [deckFilter, setDeckFilter] = useState<string>(''); 

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [isManualCardOpen, setIsManualCardOpen] = useState(false);
  const [isYdkOpen, setIsYdkOpen] = useState(false);
  const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);
  const [isSleevesOpen, setIsSleevesOpen] = useState(false);
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);

  // Modal de Consolidación de Copias Dispersas / Duplicados
  const [isConsolidateOpen, setIsConsolidateOpen] = useState(false);
  const [consolidationCards, setConsolidationCards] = useState<UserCard[]>([]);
  const [consolidationTitle, setConsolidationTitle] = useState<string>('');

  // Estados anteriores conservados por compatibilidad
  const [isBinderBuilderOpen, setIsBinderBuilderOpen] = useState(false);
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Fundas (Sleeves)
  const [sleeves, setSleeves] = useState<SleeveInventory[]>([]);
  const [loadingSleeves, setLoadingSleeves] = useState(false);
  const [isSleeveFormOpen, setIsSleeveFormOpen] = useState(false);
  const [editingSleeve, setEditingSleeve] = useState<SleeveInventory | null>(null);
  const [sleeveFormTab, setSleeveFormTab] = useState<'add_stock' | 'create'>('create');
  const [sleeveFormInitialId, setSleeveFormInitialId] = useState<string | undefined>(undefined);
  const [sleeveFormInitialCategory, setSleeveFormInitialCategory] = useState<SleeveCategory | undefined>(undefined);

  const handleOpenAddStock = (sleeve?: SleeveInventory, category?: SleeveCategory) => {
    setEditingSleeve(null);
    setSleeveFormTab('add_stock');
    setSleeveFormInitialId(sleeve?.id);
    setSleeveFormInitialCategory(category || sleeve?.category);
    setIsSleeveFormOpen(true);
  };

  const handleOpenCreateSleeve = (category?: SleeveCategory) => {
    setEditingSleeve(null);
    setSleeveFormTab('create');
    setSleeveFormInitialId(undefined);
    setSleeveFormInitialCategory(category);
    setIsSleeveFormOpen(true);
  };

  // Modo de Selección Múltiple y Desglose de Copias en Colección
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [cardToSplit, setCardToSplit] = useState<UserCard | null>(null);

  // Prefetching en segundo plano de la colección completa
  const isPrefetchingFullRef = useRef(false);
  const prefetchFullCollection = useCallback(async () => {
    if (masterCollectionCards.length > 0 || isPrefetchingFullRef.current) return;
    isPrefetchingFullRef.current = true;
    try {
      const res = await fetch('/api/collection/cards');
      if (res.ok) {
        const json = await res.json();
        setMasterCollectionCards(json.data || []);
      }
    } catch (err) {
      console.warn('Error al precargar colección completa:', err);
    } finally {
      isPrefetchingFullRef.current = false;
    }
  }, [masterCollectionCards.length]);

  // 1. Obtener contenedores, inbox y decks en paralelo (carga ligera)
  const fetchCollectionDataSilently = useCallback(async (includeCards = false) => {
    try {
      const promises: Promise<Response>[] = [
        fetch('/api/collection/storage'),
        fetch('/api/collection/inbox'),
        fetch('/api/decks'),
      ];
      if (includeCards) {
        promises.push(fetch('/api/collection/cards'));
      }

      const results = await Promise.allSettled(promises);
      const [locRes, inboxRes, decksRes, cardsRes] = results;

      if (locRes && locRes.status === 'fulfilled' && locRes.value.ok) {
        const locJson = await locRes.value.json();
        setLocations(locJson.data || []);
      }

      if (inboxRes && inboxRes.status === 'fulfilled' && inboxRes.value.ok) {
        const inboxJson = await inboxRes.value.json();
        setInboxCards(inboxJson.data || []);
      }

      if (decksRes && decksRes.status === 'fulfilled' && decksRes.value.ok) {
        const decksJson = await decksRes.value.json();
        setDecks(decksJson.data || []);
      }

      if (cardsRes && cardsRes.status === 'fulfilled' && cardsRes.value.ok) {
        const cardsJson = await cardsRes.value.json();
        const allMaster: UserCard[] = cardsJson.data || [];
        setMasterCollectionCards(allMaster);
      }
    } catch (err) {
      console.error('Error al sincronizar datos de colección silenciosamente:', err);
    }
  }, []);

  // 1.1 Carga inicial con estado loading
  const fetchCollectionData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchCollectionDataSilently();
    } finally {
      setLoading(false);
    }
  }, [fetchCollectionDataSilently]);


  // 2. Cargar cartas filtradas (Colección Completa / Favoritas)
  const fetchAllCards = useCallback(async (query: string, filters: FilterState, favoritesOnly = false, locFilter = '', deckId = '') => {
    setLoadingAllCards(true);
    try {
      const url = '/api/collection/cards?';
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.type) params.append('type', filters.type);
      if (filters.attribute) params.append('attribute', filters.attribute);
      if (filters.race) params.append('race', filters.race);
      if (filters.level) params.append('level', filters.level);
      if (filters.atkMin) params.append('atkMin', filters.atkMin);
      if (filters.atkMax) params.append('atkMax', filters.atkMax);
      if (filters.defMin) params.append('defMin', filters.defMin);
      if (filters.defMax) params.append('defMax', filters.defMax);
      if (filters.archetype) params.append('archetype', filters.archetype);
      if (filters.rarity) params.append('rarity', filters.rarity);
      if (filters.status) params.append('status', filters.status);
      if (favoritesOnly) params.append('favorites', 'true');
      
      if (locFilter === 'inbox') {
        params.append('location_id', 'inbox');
      } else if (locFilter === 'in_deck') {
        params.append('location_id', 'in_deck');
        if (deckId) params.append('deck_id', deckId);
      } else if (locFilter) {
        params.append('location_id', locFilter);
      }

      const res = await fetch(url + params.toString());
      if (res.ok) {
        const json = await res.json();
        let fetchedCards: UserCard[] = json.data || [];

        // Sincronización con favoritos guardados localmente
        if (favoritesOnly && typeof window !== 'undefined') {
          const localFavsStr = localStorage.getItem('yg_favorite_cards');
          if (localFavsStr) {
            try {
              const localFavIds: number[] = JSON.parse(localFavsStr);
              if (localFavIds.length > 0) {
                // Si la BD no tiene marcadas todas las cartas de localStorage, traer la lista completa para filtrar o enriquecer
                if (fetchedCards.length === 0) {
                  const allRes = await fetch('/api/collection/cards');
                  if (allRes.ok) {
                    const allJson = await allRes.json();
                    const allCards: UserCard[] = allJson.data || [];
                    const matched = allCards.filter(c => c.card_id && localFavIds.includes(c.card_id));
                    if (matched.length > 0) {
                      fetchedCards = matched.map(c => ({ ...c, is_favorite: true }));
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing local favorites in collection:', e);
            }
          }
        }

        setAllCollectionCards(fetchedCards);
      }
    } catch (err) {
      console.error('Error al cargar colección completa:', err);
    } finally {
      setLoadingAllCards(false);
    }
  }, []);

  // 3. Obtener fundas
  const fetchSleeves = useCallback(async () => {
    setLoadingSleeves(true);
    try {
      const res = await fetch('/api/collection/sleeve-inventory');
      if (res.ok) {
        const json = await res.json();
        setSleeves(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar fundas:', err);
    } finally {
      setLoadingSleeves(false);
    }
  }, []);

  // Carga reactiva de cartas y fundas según tab activo
  useEffect(() => {
    if (activeTab === 'complete' || activeTab === 'favorites') {
      const timer = setTimeout(() => {
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
      }, 400);
      return () => clearTimeout(timer);
    }
    if (activeTab === 'sleeves') {
      queueMicrotask(() => {
        fetchSleeves();
      });
    }
    if (activeTab === 'valuation' || activeTab === 'suggestions') {
      queueMicrotask(() => {
        prefetchFullCollection();
      });
    }
  }, [activeTab, allSearchQuery, allCollectionFilters, locationFilter, deckFilter, fetchAllCards, fetchSleeves, prefetchFullCollection]);

  // Carga silenciosa inicial ligera: solo metadatos de almacenamiento, inbox y decks
  useEffect(() => {
    queueMicrotask(() => {
      fetchCollectionDataSilently();
    });
  }, [fetchCollectionDataSilently]);

  // Handler para abrir modal de consolidación directa de una carta
  const handleOpenConsolidateForCard = useCallback((cardId: number) => {
    const pool = masterCollectionCards.length > 0 ? masterCollectionCards : allCollectionCards;
    const matching = pool.filter(c => c.card_id === cardId);
    const cardName = matching[0]?.card_details?.name || `Carta #${cardId}`;
    setConsolidationCards(matching);
    setConsolidationTitle(`Consolidar Copias: ${cardName}`);
    setIsConsolidateOpen(true);
  }, [masterCollectionCards, allCollectionCards]);

  const handleCloseConsolidate = useCallback(() => {
    setIsConsolidateOpen(false);
    setConsolidationCards([]);
    setConsolidationTitle('');
  }, []);

  // Mapa de duplicados cruzados entre contenedores basado en el inventario maestro
  const crossContainerDuplicatesMap = useMemo(() => {
    const pool = masterCollectionCards.length > 0 ? masterCollectionCards : allCollectionCards;
    return computeCrossContainerDuplicateMap(pool, locations);
  }, [masterCollectionCards, allCollectionCards, locations]);

  // Borrar carta
  const handleDeleteCard = async (userCardId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta carta de tu colección?')) return;
    try {
      const res = await fetch(`/api/collection/cards?id=${userCardId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
        fetchCollectionData();
      }
    } catch (err) {
      console.error('Error al eliminar carta:', err);
    }
  };

  // Actualizar destino de la carta (bulk, venta, etc)
  const handleUpdateCardStatus = async (userCardId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userCardId, status_flag: newStatus })
      });
      if (res.ok) {
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
      }
    } catch (err) {
      console.error('Error al cambiar estado de carta:', err);
    }
  };

  // --- Lógica de Selección Múltiple y Acciones Bulk en Colección ---
  const selectedCards = useMemo(() => {
    return allCollectionCards.filter(c => selectedCardIds.includes(c.id));
  }, [allCollectionCards, selectedCardIds]);

  const selectedCardsCount = selectedCardIds.length;

  const selectedPhysicalCount = useMemo(() => {
    return selectedCards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [selectedCards]);

  const canSplitSingleCard = useMemo(() => {
    if (selectedCardIds.length === 1) {
      const target = allCollectionCards.find(c => c.id === selectedCardIds[0]);
      return (target?.quantity || 1) > 1;
    }
    return false;
  }, [selectedCardIds, allCollectionCards]);

  const toggleSelectCard = useCallback((id: string) => {
    setSelectedCardIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const selectAllCards = useCallback(() => {
    setSelectedCardIds(allCollectionCards.map(c => c.id));
  }, [allCollectionCards]);

  const clearCardSelection = useCallback(() => {
    setSelectedCardIds([]);
  }, []);

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

      if (res.ok) {
        clearCardSelection();
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
        fetchCollectionDataSilently();
      }
    } catch (e) {
      console.error('Error al mover lote en colección:', e);
    }
  };

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

      if (res.ok) {
        clearCardSelection();
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
      }
    } catch (e) {
      console.error('Error al cambiar estado en lote:', e);
    }
  };

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

      if (res.ok) {
        clearCardSelection();
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
      }
    } catch (e) {
      console.error('Error al cambiar condición en lote:', e);
    }
  };

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

      if (res.ok) {
        clearCardSelection();
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
        fetchCollectionDataSilently();
      }
    } catch (e) {
      console.error('Error al eliminar en lote:', e);
    }
  };

  const handleOpenSplitModal = (card?: UserCard) => {
    const target = card || (selectedCardIds.length === 1 ? allCollectionCards.find(c => c.id === selectedCardIds[0]) : null);
    if (target && (target.quantity || 1) > 1) {
      setCardToSplit(target);
      setIsSplitModalOpen(true);
    }
  };

  const handleCloseSplitModal = () => {
    setIsSplitModalOpen(false);
    setCardToSplit(null);
  };

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

      if (res.ok) {
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
      }
    } catch (e) {
      console.error('Error al separar copias en colección:', e);
    }
  };

  // Toggle favorito
  const handleToggleFavorite = async (uc: UserCard) => {
    const newFavState = !uc.is_favorite;
    
    // Actualizar localStorage
    if (typeof window !== 'undefined' && uc.card_id) {
      try {
        const stored = localStorage.getItem('yg_favorite_cards');
        const ids: number[] = stored ? JSON.parse(stored) : [];
        const updatedIds = newFavState
          ? Array.from(new Set([...ids, uc.card_id]))
          : ids.filter(id => id !== uc.card_id);
        localStorage.setItem('yg_favorite_cards', JSON.stringify(updatedIds));
      } catch (e) {
        console.error('Error updating local favorites:', e);
      }
    }

    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uc.id, is_favorite: newFavState })
      });
      if (res.ok) {
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
      }
    } catch (err) {
      console.error('Error al cambiar favorito:', err);
    }
  };

  // Eliminar fundas
  const handleDeleteSleeve = async (sleeve: SleeveInventory) => {
    if (!confirm(`¿Eliminar la funda "${sleeve.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/collection/sleeve-inventory?id=${sleeve.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'No se pudo eliminar la funda.');
        return;
      }
      fetchSleeves();
    } catch (err) {
      console.error('Error al eliminar funda:', err);
    }
  };

  const handleNewContainerClick = () => {
    setEditingLocation(null);
    setIsFormOpen(true);
  };

  const handleEditContainerClick = (loc: StorageLocation) => {
    setEditingLocation(loc);
    setIsFormOpen(true);
  };

  // Crear/Editar contenedor
  const handleSaveStorage = async (formData: StorageLocationFormData & { id?: string }) => {
    try {
      const isEditing = !!formData.id;
      const res = await fetch('/api/collection/storage', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { ...formData, id: formData.id } : formData),
      });
      if (res.ok) {
        fetchCollectionData();
      }
    } catch (err) {
      console.error(editingLocation ? 'Error al editar contenedor:' : 'Error al crear contenedor:', err);
    }
  };

  // Borrar contenedor
  const handleDeleteStorage = async (id: string) => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este contenedor?\nLas cartas que contiene volverán a la bandeja "Sin Clasificar" (Inbox).'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/collection/storage?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCollectionData();
      }
    } catch (err) {
      console.error('Error al eliminar contenedor:', err);
    }
  };

  // Borrar baraja
  const handleDeleteDeck = useCallback(async (deckId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/decks?id=${deckId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDecks(prev => prev.filter(d => d.id !== deckId));
        await fetchCollectionDataSilently();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al eliminar deck:', err);
      return false;
    }
  }, [fetchCollectionDataSilently]);

  // Duplicar contenedor
  const handleCopyStorage = async (loc: StorageLocation) => {
    try {
      const copyData = {
        name: `${loc.name} - Copia`,
        type: loc.type,
        sub_type: loc.sub_type,
        color_code: loc.color_code,
        dimensions: loc.dimensions || { width: 0, height: 0, depth: 0 },
        capacity: loc.capacity,
        grid_layout: loc.grid_layout,
        compartments: loc.compartments,
        render_style: loc.render_style,
        description: loc.description || '',
      };

      const res = await fetch('/api/collection/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyData),
      });
      if (res.ok) {
        fetchCollectionData();
      }
    } catch (err) {
      console.error('Error al duplicar contenedor:', err);
    }
  };

  const handleOpenContainer = useCallback((loc: StorageLocation) => {
    setSelectedLocation(loc);
    setIsWorkspaceOpen(true);
    updateUrlParams({ location_id: loc.id });
  }, [updateUrlParams]);

  const handleOpenInbox = useCallback(() => {
    const virtualInboxLocation: StorageLocation = {
      id: 'inbox',
      name: 'Sin Clasificar (Inbox)',
      type: 'box',
      sub_type: 'standard',
      color_code: '#f59e0b',
      dimensions: { width: 0, height: 0, depth: 0 },
      capacity: 9999,
      grid_layout: { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 1 },
      compartments: { count: 1, names: ['Inbox'] },
      render_style: 'grid',
      created_at: new Date().toISOString(),
    };
    setSelectedLocation(virtualInboxLocation);
    setIsWorkspaceOpen(true);
    updateUrlParams({ location_id: 'inbox' });
  }, [updateUrlParams]);

  const handleCloseWorkspace = useCallback((hasMutated?: boolean) => {
    setIsWorkspaceOpen(false);
    setSelectedLocation(null);
    updateUrlParams({ location_id: null });
    if (hasMutated) {
      invalidateContainerCardsCache();
      fetchCollectionDataSilently();
    }
  }, [updateUrlParams, fetchCollectionDataSilently]);

  // Re-abrir workspace de contenedor al recargar si existe location_id en la URL
  const initialLocCheckedRef = useRef(false);
  useEffect(() => {
    if (!initialLocCheckedRef.current && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const locId = params.get('location_id') || params.get('container_id');
      if (locId) {
        if (locId === 'inbox') {
          queueMicrotask(() => {
            handleOpenInbox();
          });
          initialLocCheckedRef.current = true;
        } else if (locations.length > 0) {
          const found = locations.find(l => l.id === locId);
          if (found) {
            queueMicrotask(() => {
              handleOpenContainer(found);
            });
            initialLocCheckedRef.current = true;
          }
        }
      }
    }
  }, [locations, handleOpenInbox, handleOpenContainer]);

  // Drag and Drop reubicar baraja
  const handleDropDeck = async (deckId: string, locationId: string | null) => {
    const previousDecks = decks;
    setDecks(prev =>
      prev.map(d => d.id === deckId ? { ...d, storage_location_id: locationId ?? undefined } : d)
    );
    try {
      const res = await fetch('/api/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deckId,
          storage_location_id: locationId
        })
      });
      if (!res.ok) {
        setDecks(previousDecks);
        console.error('Error al reubicar baraja: respuesta no OK');
      }
    } catch (err) {
      setDecks(previousDecks);
      console.error('Error al reubicar baraja:', err);
    }
  };

  // Carga inicial
  useEffect(() => {
    queueMicrotask(() => {
      fetchCollectionData();
    });
  }, [fetchCollectionData]);

  const effectiveLocations = isIdealMode && syncData?.idealContainers ? (syncData.idealContainers as StorageLocation[]) : locations;
  const effectiveAllCards = isIdealMode && syncData?.idealCards ? (syncData.idealCards as UserCard[]) : allCollectionCards;
  const effectiveInboxCards = isIdealMode && syncData?.idealCards ? (syncData.idealCards.filter(c => !c.storage_location_id) as UserCard[]) : inboxCards;
  const effectiveDecks = isIdealMode && syncData?.idealDecks ? (syncData.idealDecks as Deck[]) : decks;

  return {
    locations: effectiveLocations,
    decks: effectiveDecks,
    setDecks,
    inboxCards: effectiveInboxCards,
    loading,
    activeTab,
    setActiveTab: handleSetActiveTab,
    allCollectionCards: effectiveAllCards,
    loadingAllCards,
    allCollectionFilters,
    setAllCollectionFilters,
    allSearchQuery,
    setAllSearchQuery,
    locationFilter,
    setLocationFilter,
    deckFilter,
    setDeckFilter,
    isFormOpen,
    setIsFormOpen,
    isInventoryOpen,
    setIsInventoryOpen,
    isWorkspaceOpen,
    setIsWorkspaceOpen,
    selectedLocation,
    setSelectedLocation,
    editingLocation,
    setEditingLocation,
    isManualCardOpen,
    setIsManualCardOpen,
    isYdkOpen,
    setIsYdkOpen,
    isOrganizeOpen,
    setIsOrganizeOpen,
    isSleevesOpen,
    setIsSleevesOpen,
    isValuationModalOpen,
    setIsValuationModalOpen,
    sleeves,
    loadingSleeves,
    isSleeveFormOpen,
    setIsSleeveFormOpen,
    editingSleeve,
    setEditingSleeve,
    sleeveFormTab,
    setSleeveFormTab,
    sleeveFormInitialId,
    setSleeveFormInitialId,
    sleeveFormInitialCategory,
    setSleeveFormInitialCategory,
    handleOpenAddStock,
    handleOpenCreateSleeve,
    fetchCollectionData,
    fetchCollectionDataSilently,
    fetchAllCards,
    fetchSleeves,
    handleDeleteCard,
    handleUpdateCardStatus,
    handleToggleFavorite,
    handleDeleteSleeve,
    handleNewContainerClick,
    handleEditContainerClick,
    handleSaveStorage,
    handleDeleteStorage,
    handleDeleteDeck,
    handleCopyStorage,
    handleOpenContainer,
    handleOpenInbox,
    handleCloseWorkspace,
    handleDropDeck,
    isBinderBuilderOpen,
    setIsBinderBuilderOpen,
    selectedBinderId,
    setSelectedBinderId,
    handleCloseBinderBuilder: () => handleCloseWorkspace(true),

    // Multi-select & Bulk Actions
    isSelectMode,
    setIsSelectMode,
    selectedCardIds,
    selectedCards,
    selectedCardsCount,
    selectedPhysicalCount,
    canSplitSingleCard,
    toggleSelectCard,
    selectAllCards,
    clearCardSelection,
    handleBulkMove,
    handleBulkChangeStatus,
    handleBulkChangeCondition,
    handleBulkDelete,

    // Split Copy Modal
    isSplitModalOpen,
    cardToSplit,
    handleOpenSplitModal,
    handleCloseSplitModal,
    handleSplitCopies,

    // Master Collection Cards (siempre completo, no alterado por búsquedas locales)
    masterCollectionCards,
    prefetchFullCollection,

    // Consolidation Modal Directo
    isConsolidateOpen,
    consolidationCards,
    consolidationTitle,
    handleOpenConsolidateForCard,
    handleCloseConsolidate,

    // Cross-container duplicates map
    crossContainerDuplicatesMap,
  };
}

