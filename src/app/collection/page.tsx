'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StorageLocation, UserCard, StorageLocationFormData, Deck, SleeveInventory } from '@/types/collection';
import { StorageContainerCard, AddContainerCard } from '@/components/collection/StorageContainerCard';
import { StorageFormModal } from '@/components/collection/StorageFormModal';
import { GamifiedInventoryModal } from '@/components/collection/GamifiedInventoryModal';
import { YdkUploadModal } from '@/components/collection/YdkUploadModal';
import { SmartOrganizeModal } from '@/components/collection/SmartOrganizeModal';
import { SleevingAdvisorModal } from '@/components/collection/SleevingAdvisorModal';
import { ManualCardAdderModal } from '@/components/collection/ManualCardAdderModal';
import { SleeveInventoryCard, AddSleeveCard } from '@/components/collection/SleeveInventoryCard';
import { SleeveInventoryFormModal } from '@/components/collection/SleeveInventoryFormModal';
import Link from 'next/link';
import { 
  Box, 
  Upload, 
  Sparkles, 
  Shield, 
  Inbox, 
  RefreshCw,
  Plus,
  Layers,
  HelpCircle,
  Search,
  Trash,
  Heart,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { CardFilters, FilterState } from '@/components/deckbuilder/CardFilters';

export default function CollectionPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [inboxCards, setInboxCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Colección completa y Filtros
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
  // Location + Deck filter
  const [locationFilter, setLocationFilter] = useState<string>(''); // '' = all, 'inbox' = unclassified, 'in_deck' = any deck, locationId = specific container
  const [deckFilter, setDeckFilter] = useState<string>(''); // deck UUID when locationFilter = 'in_deck'

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [isManualCardOpen, setIsManualCardOpen] = useState(false);
  const [isYdkOpen, setIsYdkOpen] = useState(false);
  const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);
  const [isSleevesOpen, setIsSleevesOpen] = useState(false);

  // Sleeves inventory state
  const [sleeves, setSleeves] = useState<SleeveInventory[]>([]);
  const [loadingSleeves, setLoadingSleeves] = useState(false);
  const [isSleeveFormOpen, setIsSleeveFormOpen] = useState(false);
  const [editingSleeve, setEditingSleeve] = useState<SleeveInventory | null>(null);

  const fetchCollectionData = async () => {
    setLoading(true);
    try {
      // 1. Obtener contenedores
      const locRes = await fetch('/api/collection/storage');
      if (locRes.ok) {
        const locJson = await locRes.json();
        setLocations(locJson.data || []);
      }

      // 2. Obtener bandeja Inbox
      const inboxRes = await fetch('/api/collection/inbox');
      if (inboxRes.ok) {
        const inboxJson = await inboxRes.json();
        setInboxCards(inboxJson.data || []);
      }

      // 3. Obtener Decks
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
      // Location filter
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

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchCollectionData();
    });
  }, []);

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
    setSelectedLocation(loc);
    setIsInventoryOpen(true);
  };

  // Drag & Drop deck handler
  const handleDragStart = (e: React.DragEvent, deckId: string) => {
    e.dataTransfer.setData('text/plain', deckId);
  };

  const handleDropDeck = async (deckId: string, locationId: string | null) => {
    // Optimistic update: actualizar estado local sin recargar toda la página
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
        // Revertir si la API falla
        setDecks(previousDecks);
        console.error('Error al reubicar baraja: respuesta no OK');
      }
    } catch (err) {
      setDecks(previousDecks);
      console.error('Error al reubicar baraja:', err);
    }
  };

  const totalCardsInCollection = locations.reduce((acc, l) => acc + (l.occupied_cards || 0), 0) + inboxCards.length;

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(224,25%,6%)] text-[hsl(210,40%,98%)] font-sans antialiased">
      
      {/* HEADER DE LA APP */}
      <header className="border-b border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/90 backdrop-blur-md sticky top-0 z-40 py-4 px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[hsl(263,85%,64%)] to-[hsl(180,80%,45%)] flex items-center justify-center font-bold text-xl shadow-lg shadow-[hsl(263,85%,64%)]/20">
            YG
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Mi Colección</h1>
            <p className="text-xs text-[hsl(215,15%,70%)]">Gestión de Almacenamiento y Binders</p>
          </div>
        </div>

        {/* NAVEGACIÓN DE VISTAS */}
        <div className="flex gap-2 bg-[hsl(224,25%,6%)] p-1 rounded-xl border border-[hsl(224,15%,16%)]">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg font-medium text-xs text-[hsl(215,15%,70%)] hover:text-white transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            🛠️ Constructor
          </Link>
          <Link
            href="/?tab=breakdowns"
            className="px-4 py-2 rounded-lg font-medium text-xs text-[hsl(215,15%,70%)] hover:text-white transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            📊 Breakdowns Meta
          </Link>
          <button
            className="px-4 py-2 rounded-lg font-medium text-xs bg-zinc-800 text-white transition-all duration-300 cursor-default flex items-center gap-1"
          >
            📦 Mi Colección
          </button>
        </div>

        {/* ACCIONES COMPACTAS DE COLECCIÓN */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManualCardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Añadir Carta Manual</span>
          </button>

          <button
            onClick={() => setIsYdkOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Importar .YDK</span>
          </button>

          <button
            onClick={() => setIsOrganizeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Organizador Inteligente</span>
          </button>

          <button
            onClick={() => setIsSleevesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Recomendador Fundas</span>
          </button>

          <button
            onClick={handleNewContainerClick}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[hsl(263,85%,64%)] text-white hover:bg-[hsl(263,85%,58%)] rounded-xl text-xs font-bold transition-all shadow-md shadow-[hsl(263,85%,64%)]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Contenedor</span>
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* Banner Bandeja Sin Clasificar (Unsorted Inbox) */}
        {inboxCards.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-900/30 text-amber-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">
                  Bandeja &quot;Sin Clasificar&quot; ({inboxCards.length} cartas)
                </h3>
                <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                  Tienes cartas importadas pendientes de ser asignadas a un Binder, Lata o Deckbox.
                </p>
              </div>
            </div>
 
            <button
              onClick={() => setIsOrganizeOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-md shadow-amber-500/10"
            >
              <Sparkles className="w-4 h-4" />
              <span>Distribuir Automáticamente</span>
            </button>
          </div>
        )}
 
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SECCIÓN IZQUIERDA: CONTENEDORES / COLECCIÓN COMPLETA (Col-span 8) */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between border-b border-[hsl(224,15%,16%)] pb-2.5 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('containers')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'containers' 
                      ? 'border-[hsl(263,85%,64%)] text-white' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>Almacenamiento ({locations.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('complete')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'complete' 
                      ? 'border-[hsl(263,85%,64%)] text-white' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Colección Completa ({totalCardsInCollection})</span>
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'favorites' 
                      ? 'border-pink-500 text-pink-400' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-pink-500 text-pink-500' : ''}`} />
                  <span>Favoritas</span>
                </button>
                <button
                  onClick={() => setActiveTab('sleeves')}
                  className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'sleeves' 
                      ? 'border-cyan-400 text-cyan-300' 
                      : 'border-transparent text-[hsl(215,15%,70%)] hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Mis Fundas ({sleeves.length})</span>
                </button>
              </div>
              
              <button
                onClick={() => {
                  fetchCollectionData();
                  if (activeTab === 'complete' || activeTab === 'favorites') fetchAllCards(allSearchQuery, allCollectionFilters, activeTab === 'favorites', locationFilter, deckFilter);
                  if (activeTab === 'sleeves') fetchSleeves();
                }}
                className="p-1.5 rounded-lg bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] text-[hsl(215,15%,70%)] hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                title="Refrescar todo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeTab === 'containers' ? (
              loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                  <p className="text-xs font-mono text-slate-500">Cargando contenedores...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {locations.map((loc) => (
                    <StorageContainerCard
                      key={loc.id}
                      location={loc}
                      decks={decks}
                      onClick={handleOpenContainer}
                      onEdit={handleEditContainerClick}
                      onCopy={handleCopyStorage}
                      onDelete={handleDeleteStorage}
                      onDropDeck={handleDropDeck}
                    />
                  ))}

                  <AddContainerCard onClick={handleNewContainerClick} />
                </div>
              )
            ) : (
              /* COMPLETE / FAVORITES COLLECTION VIEW */
              <div className="space-y-6">
                {/* Tab header for favorites mode */}
                {activeTab === 'favorites' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-pink-950/20 border border-pink-900/30">
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                    <span className="text-xs font-semibold text-pink-300">Mostrando sólo cartas marcadas como favoritas</span>
                  </div>
                )}

                {/* Search header for all cards */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, rareza, notas..."
                    value={allSearchQuery}
                    onChange={(e) => setAllSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] text-slate-100 rounded-xl text-xs focus:outline-none transition-colors"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-[hsl(215,15%,70%)]" />
                </div>

                {/* Location + Deck filter */}
                {activeTab === 'complete' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[10px] uppercase font-bold text-slate-400">Ubicación:</span>
                    </div>
                    <div className="relative">
                      <select
                        value={locationFilter}
                        onChange={(e) => {
                          setLocationFilter(e.target.value);
                          setDeckFilter('');
                        }}
                        className="pl-3 pr-7 py-1.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-slate-600 text-xs text-slate-200 rounded-lg focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                      >
                        <option value="">Todas las ubicaciones</option>
                        <option value="inbox">📥 Sin Clasificar (Inbox)</option>
                        <option value="in_deck">⚔️ En Deck</option>
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>📦 {l.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                    {locationFilter === 'in_deck' && (
                      <div className="relative">
                        <select
                          value={deckFilter}
                          onChange={(e) => setDeckFilter(e.target.value)}
                          className="pl-3 pr-7 py-1.5 bg-[hsl(224,25%,6%)] border border-purple-500/40 text-xs text-purple-200 rounded-lg focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Todos los decks</option>
                          {decks.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
                      </div>
                    )}
                    {locationFilter && (
                      <button
                        onClick={() => { setLocationFilter(''); setDeckFilter(''); }}
                        className="text-[10px] text-slate-500 hover:text-white underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                )}

                <CardFilters
                  filters={allCollectionFilters}
                  onFilterChange={setAllCollectionFilters}
                  onReset={() => setAllCollectionFilters({
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
                  })}
                  showRarity={true}
                  showCollectionOptions={true}
                />

                {loadingAllCards ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                    <p className="text-xs font-mono text-slate-500">Cargando colección completa...</p>
                  </div>
                ) : allCollectionCards.length === 0 ? (
                  <div className="text-center py-20 bg-[hsl(224,22%,10%)] rounded-2xl border border-[hsl(224,15%,16%)] text-slate-500 text-sm">
                    {activeTab === 'favorites'
                      ? 'No tienes cartas marcadas como favoritas. ¡Pulsa el corazón en cualquier carta para agregarla!'
                      : 'No se encontraron cartas en tu colección con los filtros seleccionados.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allCollectionCards.map((uc) => {
                      const storedIn = locations.find(l => l.id === uc.storage_location_id);
                      return (
                        <div 
                          key={uc.id}
                          className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-purple-500/40 transition-all duration-300 relative group"
                        >
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={uc.card_details?.image_url_small || uc.card_details?.image_url || 'https://images.ygoprodeck.com/images/cards/placeholder.jpg'}
                              alt={uc.card_details?.name || 'Yugioh Card'}
                              className="w-full h-44 object-contain rounded-md shadow-md mb-2 group-hover:scale-103 transition-transform"
                            />
                            {uc.quantity > 1 && (
                              <span className="absolute top-1.5 right-1.5 bg-purple-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow font-mono">
                                x{uc.quantity}
                              </span>
                            )}
                            {uc.is_proxy && (
                              <span className="absolute top-1.5 left-1.5 bg-red-600/90 text-white font-bold text-[9px] px-1.5 py-0.2 rounded font-mono uppercase">
                                PROXY
                              </span>
                            )}
                            {/* Favorite toggle button */}
                            <button
                              onClick={() => handleToggleFavorite(uc)}
                              className={`absolute bottom-3.5 right-1.5 p-1 rounded-full transition-all cursor-pointer ${
                                uc.is_favorite
                                  ? 'text-pink-500 opacity-100'
                                  : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-pink-400'
                              }`}
                              title={uc.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                            >
                              <Heart className={`w-4 h-4 ${uc.is_favorite ? 'fill-pink-500' : ''}`} />
                            </button>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-xs text-slate-200 line-clamp-1 group-hover:text-purple-300 transition-colors" title={uc.card_details?.name}>
                                {uc.card_details?.name || 'Cargando...'}
                              </h4>
                              
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-medium">
                                  {uc.rarity || 'Common'}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 font-mono">
                                  {uc.condition || 'NM'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5">
                              {/* Location Badge */}
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 text-[9px]">Ubicación:</span>
                                {storedIn ? (
                                  <span className="font-semibold text-cyan-400 text-[9px] truncate max-w-22.5" title={storedIn.name}>
                                    📦 {storedIn.name}
                                  </span>
                                ) : (
                                  <span className="font-semibold text-amber-500 text-[9px]">
                                    📥 Inbox
                                  </span>
                                )}
                              </div>

                              {/* Deck Badge if assigned */}
                              {(uc.deck_details?.name || uc.deck_id) && (
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 text-[9px]">Deck:</span>
                                  <span className="font-semibold text-purple-400 text-[9px] truncate max-w-28" title={`${uc.deck_details?.name || 'Deck'} (${uc.deck_section || 'Main'})`}>
                                    ⚔️ {uc.deck_details?.name || 'Deck'} {uc.deck_section ? `(${uc.deck_section.toUpperCase()})` : ''}
                                  </span>
                                </div>
                              )}

                              {/* Status Badge */}
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 text-[9px]">Destino:</span>
                                <select
                                  value={uc.status_flag}
                                  onChange={(e) => handleUpdateCardStatus(uc.id, e.target.value)}
                                  className="bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded px-1 py-0.2 focus:outline-none"
                                >
                                  <option value="collection">Colección</option>
                                  <option value="trade_sale">Venta</option>
                                  <option value="workshop">Taller</option>
                                  <option value="bulk">Bulk</option>
                                </select>
                              </div>

                              {uc.notes && (
                                <p className="text-[9px] text-slate-500 line-clamp-1 italic">
                                  &quot;{uc.notes}&quot;
                                </p>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-end gap-1.5 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDeleteCard(uc.id)}
                                  className="p-1 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                                  title="Eliminar carta"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN DERECHA: DECKS DRAGGABLE PANEL (Col-span 4) */}
          <div className="lg:col-span-4 bg-[hsl(224,22%,10%)]/75 border border-[hsl(224,15%,16%)] rounded-2xl p-5 space-y-4">
            <div className="border-b border-[hsl(224,15%,16%)] pb-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Mis Barajas</span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                Arrastra una baraja activa y suéltala sobre un Deckbox.
              </p>
            </div>

            {decks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No tienes barajas guardadas en la base de datos. Crea una en el constructor.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-130 overflow-y-auto pr-1 scrollbar-thin">
                {decks.map((deck) => {
                  const storedIn = locations.find(l => l.id === deck.storage_location_id);
                  const isActive = deck.is_active !== false;

                  return (
                    <div
                      key={deck.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deck.id)}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow shadow-black ${
                        isActive
                          ? 'bg-slate-950 border-slate-850 hover:border-purple-500/50 cursor-grab active:cursor-grabbing'
                          : 'bg-slate-950/50 border-slate-900 opacity-75 hover:opacity-100 hover:border-slate-700 cursor-grab'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-200 truncate">{deck.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono uppercase">
                            {deck.format}
                          </span>
                          <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                            isActive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40' : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}>
                            {isActive ? 'Activo' : 'Inactivo (Receta)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          {deck.cards?.reduce((acc: number, c: import('@/types/collection').DeckCardDetail) => acc + c.count, 0) || 0} cartas
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {storedIn ? (
                          <span className="text-[9px] font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded-md truncate max-w-24">
                            📦 {storedIn.name}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold bg-amber-950/30 text-amber-500 border border-amber-900/10 px-2 py-0.5 rounded-md">
                            Sin almacenar
                          </span>
                        )}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const newActive = !isActive;
                            // Optimistic update: sin recargar página completa
                            const previousDecks = decks;
                            setDecks(prev =>
                              prev.map(d => d.id === deck.id ? { ...d, is_active: newActive } : d)
                            );
                            try {
                              const res = await fetch('/api/decks', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: deck.id, is_active: newActive })
                              });
                              if (!res.ok) setDecks(previousDecks);
                            } catch (err) {
                              setDecks(previousDecks);
                              console.error('Error al cambiar estado activo del deck:', err);
                            }
                          }}
                          className="text-[8.5px] font-mono text-slate-400 hover:text-purple-300 underline cursor-pointer"
                        >
                          {isActive ? 'Marcar Inactivo' : 'Marcar Activo'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Modales */}
      <StorageFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={handleSaveStorage}
        initialData={editingLocation}
      />

      <GamifiedInventoryModal
        location={selectedLocation}
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />

      <YdkUploadModal
        isOpen={isYdkOpen}
        onClose={() => setIsYdkOpen(false)}
        onSuccess={fetchCollectionData}
      />

      <SmartOrganizeModal
        isOpen={isOrganizeOpen}
        onClose={() => setIsOrganizeOpen(false)}
        onSuccess={fetchCollectionData}
      />

      <SleevingAdvisorModal
        isOpen={isSleevesOpen}
        onClose={() => setIsSleevesOpen(false)}
      />

      <ManualCardAdderModal
        isOpen={isManualCardOpen}
        onClose={() => setIsManualCardOpen(false)}
        locations={locations}
        onSuccess={fetchCollectionData}
      />

      <SleeveInventoryFormModal
        isOpen={isSleeveFormOpen}
        onClose={() => { setIsSleeveFormOpen(false); setEditingSleeve(null); }}
        onSuccess={fetchSleeves}
        editingSleeve={editingSleeve}
      />
    </div>
  );
}
