import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StorageLocation, UserCard, StorageLocationFormData, Deck, SleeveInventory } from '@/types/collection';
import { FilterState } from '@/components/deckbuilder/CardFilters';

/**
 * Hook personalizado useCollectionState
 * Encapsula todo el estado y lógica de negocio para la gestión de la colección física
 * de cartas, fundas, decks y contenedores, realizando peticiones a la base de datos a través de la API.
 */
export function useCollectionState() {
  const router = useRouter();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [inboxCards, setInboxCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab activo y listado de cartas de la colección completa
  const [activeTab, setActiveTab] = useState<'containers' | 'complete' | 'favorites' | 'sleeves'>('containers');
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
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [isManualCardOpen, setIsManualCardOpen] = useState(false);
  const [isYdkOpen, setIsYdkOpen] = useState(false);
  const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);
  const [isSleevesOpen, setIsSleevesOpen] = useState(false);

  // Estados para Constructor de Binders como Modal
  const [isBinderBuilderOpen, setIsBinderBuilderOpen] = useState(false);
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null);

  // Fundas (Sleeves)
  const [sleeves, setSleeves] = useState<SleeveInventory[]>([]);
  const [loadingSleeves, setLoadingSleeves] = useState(false);
  const [isSleeveFormOpen, setIsSleeveFormOpen] = useState(false);
  const [editingSleeve, setEditingSleeve] = useState<SleeveInventory | null>(null);

  // 1. Obtener contenedores, inbox y decks
  const fetchCollectionData = async () => {
    setLoading(true);
    try {
      const locRes = await fetch('/api/collection/storage');
      if (locRes.ok) {
        const locJson = await locRes.json();
        setLocations(locJson.data || []);
      }

      const inboxRes = await fetch('/api/collection/inbox');
      if (inboxRes.ok) {
        const inboxJson = await inboxRes.json();
        setInboxCards(inboxJson.data || []);
      }

      const decksRes = await fetch('/api/decks');
      if (decksRes.ok) {
        const decksJson = await decksRes.json();
        setDecks(decksJson.data || []);
      }
    } catch (err) {
      console.error('Error al cargar datos de colección:', err);
    } finally {
      setLoading(false);
    }
  };

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
        setAllCollectionCards(json.data || []);
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

  // Carga reactiva de cartas y fundas
  useEffect(() => {
    if (activeTab === 'complete' || activeTab === 'favorites') {
      const timer = setTimeout(() => {
        fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
      }, 400);
      return () => clearTimeout(timer);
    }
    if (activeTab === 'sleeves') {
      fetchSleeves();
    }
  }, [activeTab, allSearchQuery, allCollectionFilters, locationFilter, deckFilter, fetchAllCards, fetchSleeves]);

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

  // Toggle favorito
  const handleToggleFavorite = async (uc: UserCard) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uc.id, is_favorite: !uc.is_favorite })
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

  const handleOpenContainer = (loc: StorageLocation) => {
    if (loc.type === 'binder') {
      setSelectedBinderId(loc.id);
      setIsBinderBuilderOpen(true);
    } else {
      setSelectedLocation(loc);
      setIsInventoryOpen(true);
    }
  };

  const handleCloseBinderBuilder = () => {
    setIsBinderBuilderOpen(false);
    setSelectedBinderId(null);
    fetchCollectionData();
  };

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
    fetchCollectionData();
  }, []);

  return {
    locations,
    decks,
    setDecks,
    inboxCards,
    loading,
    activeTab,
    setActiveTab,
    allCollectionCards,
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
    sleeves,
    loadingSleeves,
    isSleeveFormOpen,
    setIsSleeveFormOpen,
    editingSleeve,
    setEditingSleeve,
    fetchCollectionData,
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
    handleCopyStorage,
    handleOpenContainer,
    handleDropDeck,
    isBinderBuilderOpen,
    setIsBinderBuilderOpen,
    selectedBinderId,
    setSelectedBinderId,
    handleCloseBinderBuilder
  };
}
