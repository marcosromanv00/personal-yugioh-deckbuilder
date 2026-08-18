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
  Filter,
  ChevronDown,
  Swords,
  Link2,
  Unlink,
  Settings,
  Shield,
  Edit3,
  ExternalLink
} from 'lucide-react';
import { StorageLocation, UserCard, SleeveInventory, Deck, DeckCardDetail, DeckSleeve } from '@/types/collection';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { SearchPanel } from '@/components/deckbuilder/components/SearchPanel';
import { SleeveInventoryFormModal } from './SleeveInventoryFormModal';
import { getSleeveColorHex } from '@/lib/sleeves';
import { useToast } from '@/components/ui/ToastProvider';
import { usePanelResize } from '@/components/deckbuilder/hooks/usePanelResize';
import Link from 'next/link';

interface UniversalDeckWorkspaceModalProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  deck: Deck | null;
  decks?: Deck[];
  onSelectDeck?: (deck: Deck) => void;
  locations?: StorageLocation[];
  sleeves?: SleeveInventory[];
  onSuccess?: () => void;
}

export const UniversalDeckWorkspaceModal: React.FC<UniversalDeckWorkspaceModalProps> = ({
  isOpen,
  onClose,
  deck,
  decks = [],
  onSelectDeck,
  locations = [],
  sleeves = [],
  onSuccess,
}) => {
  const toast = useToast();
  const panelResize = usePanelResize(422, 384);

  // Deck Activo y Lista de Cartas
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(deck);
  const [deckCards, setDeckCards] = useState<DeckCardDetail[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMutated, setHasMutated] = useState(false);

  // Ficha Técnica Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState('TCG');
  const [isActive, setIsActive] = useState(true);
  const [storageLocationId, setStorageLocationId] = useState<string>('');
  const [savingDeck, setSavingDeck] = useState(false);

  // Fundas (Sleeves)
  const [availableSleeves, setAvailableSleeves] = useState<SleeveInventory[]>(sleeves);
  const [mainSleeveId, setMainSleeveId] = useState<string>('');
  const [extraSleeveId, setExtraSleeveId] = useState<string>('');
  const [isNewSleeveModalOpen, setIsNewSleeveModalOpen] = useState(false);
  const [targetSleeveSection, setTargetSleeveSection] = useState<'main_side' | 'extra' | null>(null);

  // Modo del Panel Derecho: 'details' (Ficha Técnica) vs 'card' (Detalles de Carta)
  const [rightMode, setRightMode] = useState<'details' | 'card'>('details');
  const [selectedCardDetail, setSelectedCardDetail] = useState<DeckCardDetail | null>(null);

  // Filtros del Panel Central
  const [searchFilter, setSearchFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'main' | 'extra' | 'side' | 'pool'>('all');
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
  const [searchLimit, setSearchLimit] = useState(60);

  // Mobile Tabs
  const [mobileTab, setMobileTab] = useState<'left' | 'center' | 'right'>('center');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sincronizar deck inicial
  useEffect(() => {
    if (deck) {
      setCurrentDeck(deck);
      setName(deck.name || '');
      setFormat(deck.format || 'TCG');
      setIsActive(deck.is_active !== false);
      setStorageLocationId(deck.storage_location_id || '');
      setDeckCards(deck.cards || []);
    }
  }, [deck]);

  // Cargar fundas y cartas físicas asociadas a este deck
  const fetchDeckData = useCallback(async () => {
    if (!currentDeck?.id || !isOpen) return;
    setLoading(true);
    try {
      const [sleevesRes, userCardsRes, allSleevesRes] = await Promise.all([
        fetch(`/api/decks/${currentDeck.id}/sleeves`),
        fetch(`/api/collection/cards?deck_id=${currentDeck.id}`),
        fetch('/api/collection/sleeve-inventory')
      ]);

      if (sleevesRes.ok) {
        const json = await sleevesRes.json();
        const deckSleeves: DeckSleeve[] = json.data || [];
        const mainS = deckSleeves.find(s => s.section_type === 'main_side');
        const extraS = deckSleeves.find(s => s.section_type === 'extra');
        setMainSleeveId(mainS?.sleeve_id || '');
        setExtraSleeveId(extraS?.sleeve_id || '');
      }

      if (userCardsRes.ok) {
        const json = await userCardsRes.json();
        setUserCards(json.data || []);
      }

      if (allSleevesRes.ok) {
        const json = await allSleevesRes.json();
        setAvailableSleeves(json.data || []);
      }
    } catch (err) {
      console.warn('Error al cargar datos del deck:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDeck?.id, isOpen]);

  useEffect(() => {
    if (isOpen && currentDeck?.id) {
      fetchDeckData();
    }
  }, [isOpen, currentDeck?.id, fetchDeckData]);

  // Navegación entre decks disponibles
  const currentDeckIndex = useMemo(() => {
    if (!currentDeck || decks.length === 0) return 0;
    const idx = decks.findIndex(d => d.id === currentDeck.id);
    return idx >= 0 ? idx : 0;
  }, [decks, currentDeck]);

  const prevDeck = useMemo(() => {
    if (decks.length <= 1) return null;
    const prevIdx = (currentDeckIndex - 1 + decks.length) % decks.length;
    return decks[prevIdx];
  }, [decks, currentDeckIndex]);

  const nextDeck = useMemo(() => {
    if (decks.length <= 1) return null;
    const nextIdx = (currentDeckIndex + 1) % decks.length;
    return decks[nextIdx];
  }, [decks, currentDeckIndex]);

  const handleNavigatePrev = () => {
    if (prevDeck && onSelectDeck) {
      onSelectDeck(prevDeck);
    }
  };

  const handleNavigateNext = () => {
    if (nextDeck && onSelectDeck) {
      onSelectDeck(nextDeck);
    }
  };

  // Keyboard navigation & escape
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
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (type && type !== 'All') params.append('type', type);
      if (adv.attribute) params.append('attribute', adv.attribute);
      if (adv.race) params.append('race', adv.race);
      if (adv.level) params.append('level', adv.level);
      if (adv.atkMin) params.append('atkMin', adv.atkMin);
      if (adv.atkMax) params.append('atkMax', adv.atkMax);
      if (adv.defMin) params.append('defMin', adv.defMin);
      if (adv.defMax) params.append('defMax', adv.defMax);
      if (limitVal) params.append('limit', String(limitVal));

      const endpoint = scope === 'collection' ? '/api/collection/cards' : '/api/cards';
      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        let list: Card[] = [];
        if (scope === 'collection') {
          const userCardsData: UserCard[] = json.data || [];
          const seen = new Set<number>();
          for (const uc of userCardsData) {
            if (!uc.card_id || seen.has(uc.card_id)) continue;
            seen.add(uc.card_id);
            list.push({
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
        } else {
          list = json.data || [];
        }
        setSearchResults(list);
      }
    } catch (e) {
      console.error('Error buscando cartas:', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const debounceTimer = setTimeout(() => {
      executeSearch(searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit);
    }, 280);
    return () => clearTimeout(debounceTimer);
  }, [isOpen, searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit, executeSearch]);

  // Secciones del Deck desglosadas
  const mainCards = useMemo(() => deckCards.filter(c => c.section === 'main'), [deckCards]);
  const extraCards = useMemo(() => deckCards.filter(c => c.section === 'extra'), [deckCards]);
  const sideCards = useMemo(() => deckCards.filter(c => c.section === 'side'), [deckCards]);
  const poolCards = useMemo(() => deckCards.filter(c => c.section === 'pool'), [deckCards]);

  const totalMainCount = useMemo(() => mainCards.reduce((s, c) => s + c.count, 0), [mainCards]);
  const totalExtraCount = useMemo(() => extraCards.reduce((s, c) => s + c.count, 0), [extraCards]);
  const totalSideCount = useMemo(() => sideCards.reduce((s, c) => s + c.count, 0), [sideCards]);
  const totalPoolCount = useMemo(() => poolCards.reduce((s, c) => s + c.count, 0), [poolCards]);
  const totalDeckCount = totalMainCount + totalExtraCount + totalSideCount + totalPoolCount;

  // Filtrado de cartas en el panel central
  const filteredCenterCards = useMemo(() => {
    let list = deckCards;
    if (sectionFilter !== 'all') {
      list = list.filter(c => c.section === sectionFilter);
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      list = list.filter(c => c.card_details?.name.toLowerCase().includes(q));
    }
    if (sortBy === 'name_asc') {
      list = [...list].sort((a, b) => (a.card_details?.name || '').localeCompare(b.card_details?.name || ''));
    } else if (sortBy === 'type') {
      list = [...list].sort((a, b) => (a.card_details?.type || '').localeCompare(b.card_details?.type || ''));
    }
    return list;
  }, [deckCards, sectionFilter, searchFilter, sortBy]);

  // Agregar carta al deck desde el buscador
  const handleAddCardToDeck = async (card: Card, targetSection?: 'main' | 'extra' | 'side' | 'pool') => {
    if (!currentDeck) return;
    
    // Determinar sección por defecto
    let section: 'main' | 'extra' | 'side' | 'pool' = targetSection || 'main';
    if (!targetSection) {
      const EXTRA_TYPES = ['Fusion Monster', 'Link Monster', 'Synchro Monster', 'XYZ Monster', 'Pendulum Effect Fusion Monster'];
      if (EXTRA_TYPES.some(t => card.type?.includes(t))) {
        section = 'extra';
      }
    }

    setDeckCards(prev => {
      const existing = prev.find(c => c.card_id === card.id && c.section === section);
      if (existing) {
        if (existing.count >= 3) {
          toast.info('Límite de 3 copias alcanzado para esta carta', { title: 'Límite de Playset' });
          return prev;
        }
        return prev.map(c => c.card_id === card.id && c.section === section ? { ...c, count: c.count + 1 } : c);
      }
      return [
        ...prev,
        {
          card_id: card.id,
          count: 1,
          section,
          card_details: {
            name: card.name,
            type: card.type || 'Monster',
            desc: card.desc || '',
            race: card.race || undefined,
            attribute: card.attribute || undefined,
            atk: card.atk !== null && card.atk !== undefined ? card.atk : undefined,
            def: card.def !== null && card.def !== undefined ? card.def : undefined,
            level: card.level !== null && card.level !== undefined ? card.level : undefined,
            image_url: card.image_url || '',
            image_url_small: card.image_url_small || card.image_url || '',
          }
        }
      ];
    });

    setHasMutated(true);
    toast.success(`${card.name} agregada a ${section.toUpperCase()}`, { title: 'Carta Añadida' });
  };

  // Quitar carta del deck
  const handleRemoveCardFromDeck = (cardId: number, section: string) => {
    setDeckCards(prev => {
      const existing = prev.find(c => c.card_id === cardId && c.section === section);
      if (!existing) return prev;
      if (existing.count > 1) {
        return prev.map(c => c.card_id === cardId && c.section === section ? { ...c, count: c.count - 1 } : c);
      }
      return prev.filter(c => !(c.card_id === cardId && c.section === section));
    });

    if (selectedCardDetail?.card_id === cardId && selectedCardDetail.section === section) {
      setSelectedCardDetail(null);
    }
    setHasMutated(true);
  };

  // Cambiar sección de una carta (ej: mover a Cartas Extra / Pool)
  const handleChangeCardSection = (cardId: number, fromSection: string, toSection: 'main' | 'extra' | 'side' | 'pool') => {
    if (fromSection === toSection) return;
    setDeckCards(prev => {
      const source = prev.find(c => c.card_id === cardId && c.section === fromSection);
      if (!source) return prev;

      const filtered = prev.filter(c => !(c.card_id === cardId && c.section === fromSection));
      const targetExisting = filtered.find(c => c.card_id === cardId && c.section === toSection);

      if (targetExisting) {
        return filtered.map(c => c.card_id === cardId && c.section === toSection ? { ...c, count: Math.min(3, c.count + source.count) } : c);
      }
      return [...filtered, { ...source, section: toSection }];
    });

    if (selectedCardDetail?.card_id === cardId) {
      setSelectedCardDetail(prev => prev ? { ...prev, section: toSection } : null);
    }
    setHasMutated(true);
    toast.info(`Carta movida a ${toSection.toUpperCase()}`);
  };

  // Guardar Ficha Técnica y Receta del Deck
  const handleSaveDeck = async () => {
    if (!currentDeck) return;
    setSavingDeck(true);
    try {
      // 1. Actualizar metadatos y lista de cartas en yg_decks
      const mappedCards = deckCards.map(c => ({
        id: c.card_id,
        count: c.count,
        section: c.section,
        proxy_count: c.proxy_count || 0,
        name: c.card_details?.name,
        type: c.card_details?.type,
        image_url: c.card_details?.image_url
      }));

      const deckRes = await fetch('/api/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDeck.id,
          name,
          format,
          is_active: isActive,
          storage_location_id: storageLocationId || null,
          cards: mappedCards
        })
      });

      if (!deckRes.ok) {
        throw new Error('Error al actualizar el deck');
      }

      // 2. Guardar fundas asignadas
      if (mainSleeveId) {
        await fetch(`/api/decks/${currentDeck.id}/sleeves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sleeve_id: mainSleeveId,
            section_type: 'main_side',
            quantity_used: totalMainCount + totalSideCount
          })
        });
      }

      if (extraSleeveId) {
        await fetch(`/api/decks/${currentDeck.id}/sleeves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sleeve_id: extraSleeveId,
            section_type: 'extra',
            quantity_used: totalExtraCount
          })
        });
      }

      toast.success(`Ficha técnica y receta de "${name}" guardadas`, { title: '¡Deck Actualizado!' });
      setHasMutated(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error guardando deck:', e);
      toast.error(e.message || 'No se pudo guardar el deck');
    } finally {
      setSavingDeck(false);
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

  if (!isOpen || !currentDeck) return null;

  const currentBaseLocation = locations.find(l => l.id === storageLocationId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center py-1 sm:py-2 px-2 sm:px-4 bg-black/80 backdrop-blur-md overflow-hidden font-sans select-none"
      onClick={() => onClose(hasMutated)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-[98vw] max-w-[1720px] h-[96vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ CABECERA SUPERIOR DEL WORKSPACE ═══ */}
        <header className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 flex items-center justify-between gap-4 shrink-0 z-30">
          
          {/* Navegación y Título del Deck */}
          <div className="flex items-center gap-3 min-w-0">
            {decks.length > 1 && (
              <div className="flex items-center gap-1 shrink-0 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleNavigatePrev}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Mazo anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNavigateNext}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Siguiente mazo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Swords className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">
                  {name || currentDeck.name}
                </h2>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shrink-0">
                  {format}
                </span>
                {isActive ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shrink-0">
                    Activo
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                    Reserva
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                Total: <b>{totalDeckCount} cartas</b> (Main: {totalMainCount} • Extra: {totalExtraCount} • Side: {totalSideCount} • Reserva: {totalPoolCount})
              </p>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/deckbuilder?deck=${currentDeck.id}`}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Abrir en el constructor completo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abrir en Taller</span>
            </Link>

            <button
              onClick={() => onClose(hasMutated)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ═══ CUERPO PRINCIPAL DE 3 PANELES ═══ */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* ─── PANEL IZQUIERDO: BUSCADOR & IMPORTADOR BULK ─── */}
          <div 
            style={!isMobile ? { width: `${panelResize.leftPanelWidth}px` } : {}}
            className={`${mobileTab === 'left' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex-col h-full overflow-hidden z-20`}
          >
            <div className="flex-1 overflow-hidden flex flex-col">
              <SearchPanel
                leftPanelOpen={true}
                setLeftPanelOpen={() => {}}
                leftPanelWidth={panelResize.leftPanelWidth}
                isMobile={isMobile}
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
                format={format as 'TCG' | 'Master Duel' | 'Duel Links'}
                addCardToDeck={(card) => handleAddCardToDeck(card as Card, sectionFilter !== 'all' ? sectionFilter : undefined)}
                openPreviewForCard={(card) => {
                  const existing = deckCards.find(c => c.card_id === card.id);
                  if (existing) {
                    setSelectedCardDetail(existing);
                    setRightMode('card');
                  } else {
                    handleAddCardToDeck(card as Card, sectionFilter !== 'all' ? sectionFilter : undefined);
                  }
                  if (isMobile) setMobileTab('right');
                }}
                handleDragCardStart={() => {}}
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

          {/* ─── PANEL CENTRAL: GRID DEL DECK Y SECCIONES BIEN DIVIDIDAS ─── */}
          <main className={`${mobileTab === 'center' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative`}>
            
            {/* Barra Superior de Filtros y Secciones */}
            <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 flex items-center justify-between gap-2 shrink-0 flex-nowrap overflow-x-auto scrollbar-none">
              
              {/* Buscador dentro del Deck */}
              <div className="relative flex-1 min-w-32 max-w-xs shrink">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrar en deck..."
                  className="w-full pl-8.5 pr-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Selector de Ordenamiento Modernizado */}
              <div className="relative flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl px-3 py-1.5 shadow-2xs transition-colors shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-red-500 shrink-0 mr-1.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-transparent pr-5 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer tracking-tight"
                >
                  <option value="default" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Orden: Por Defecto</option>
                  <option value="name_asc" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Nombre (A → Z)</option>
                  <option value="type" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">Tipo de Carta</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Pestañas de Secciones del Deck */}
            <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/30 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSectionFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  sectionFilter === 'all'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Todas ({totalDeckCount})
              </button>

              <button
                type="button"
                onClick={() => setSectionFilter('main')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  sectionFilter === 'main'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Swords className="w-3 h-3 text-red-400" />
                <span>Main Deck ({totalMainCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSectionFilter('extra')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  sectionFilter === 'extra'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Extra Deck ({totalExtraCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSectionFilter('side')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  sectionFilter === 'side'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Side Deck ({totalSideCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSectionFilter('pool')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  sectionFilter === 'pool'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Package className="w-3 h-3 text-cyan-400" />
                <span>Reserva / Cartas Extra ({totalPoolCount})</span>
              </button>
            </div>

            {/* Cuadrícula de Cartas con División por Secciones */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 scrollbar-thin">
              {filteredCenterCards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-zinc-600 space-y-3">
                  <Swords className="w-12 h-12 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-wider">No hay cartas en esta sección</p>
                  <p className="text-[11px] max-w-xs">
                    Usa el buscador del panel izquierdo para agregar cartas a tu mazo o a tu reserva de cartas extra.
                  </p>
                </div>
              ) : (
                <>
                  {/* SECCIÓN 1: MAIN DECK */}
                  {(sectionFilter === 'all' || sectionFilter === 'main') && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-red-500/20 dark:border-red-500/20 pb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <Swords className="w-3 h-3" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Main Deck
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                            {totalMainCount} / 40-60 cartas
                          </span>
                        </div>
                      </div>

                      {mainCards.length === 0 ? (
                        <div className="py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center text-zinc-400">
                          <p className="text-xs font-bold">Main Deck vacío</p>
                          <p className="text-[10.5px] mt-0.5">Agrega cartas desde el buscador izquierdo.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                          {mainCards.map((cardDetail, idx) => {
                            const isSelected = selectedCardDetail?.card_id === cardDetail.card_id && selectedCardDetail.section === cardDetail.section;
                            const physicalCards = userCards.filter(uc => uc.card_id === cardDetail.card_id);
                            const hasPhysical = physicalCards.length > 0;
                            const cardLocationId = physicalCards[0]?.storage_location_id;
                            const cardLoc = cardLocationId ? locations.find(l => l.id === cardLocationId) : null;

                            return (
                              <div
                                key={`main-${cardDetail.card_id}-${idx}`}
                                onClick={() => {
                                  setSelectedCardDetail(cardDetail);
                                  setRightMode('card');
                                  if (isMobile) setMobileTab('right');
                                }}
                                className={`relative aspect-[3/4.4] bg-white dark:bg-zinc-900 rounded-xl border p-1 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-2xs group ${
                                  isSelected
                                    ? 'border-red-500 ring-2 ring-red-500/40 shadow-md scale-[1.02]'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                                }`}
                              >
                                <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                  <img
                                    src={cardDetail.card_details?.image_url_small || cardDetail.card_details?.image_url}
                                    alt={cardDetail.card_details?.name || 'Carta'}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                                  />
                                  <div className="absolute top-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-xs">
                                    {cardDetail.count}x
                                  </div>
                                </div>
                                <div className="mt-1 px-0.5 text-center min-w-0">
                                  <p className="text-[9.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-500 transition-colors">
                                    {cardDetail.card_details?.name}
                                  </p>
                                  <div className="mt-0.5">
                                    {hasPhysical ? (
                                      <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                                        📍 {cardLoc ? cardLoc.name : (storageLocationId ? (currentBaseLocation?.name || 'En Deckbox') : 'Sin clasificar')}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                                        ⚠️ Solo Receta
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECCIÓN 2: EXTRA DECK */}
                  {(sectionFilter === 'all' || sectionFilter === 'extra') && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between border-b border-purple-500/20 dark:border-purple-500/20 pb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Sparkles className="w-3 h-3" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Extra Deck
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                            {totalExtraCount} / 15 cartas
                          </span>
                        </div>
                      </div>

                      {extraCards.length === 0 ? (
                        <div className="py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center text-zinc-400">
                          <p className="text-xs font-bold">Extra Deck vacío</p>
                          <p className="text-[10.5px] mt-0.5">Agrega monstruos Fusión, Sincronía, Xyz o Enlace.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                          {extraCards.map((cardDetail, idx) => {
                            const isSelected = selectedCardDetail?.card_id === cardDetail.card_id && selectedCardDetail.section === cardDetail.section;
                            const physicalCards = userCards.filter(uc => uc.card_id === cardDetail.card_id);
                            const hasPhysical = physicalCards.length > 0;
                            const cardLocationId = physicalCards[0]?.storage_location_id;
                            const cardLoc = cardLocationId ? locations.find(l => l.id === cardLocationId) : null;

                            return (
                              <div
                                key={`extra-${cardDetail.card_id}-${idx}`}
                                onClick={() => {
                                  setSelectedCardDetail(cardDetail);
                                  setRightMode('card');
                                  if (isMobile) setMobileTab('right');
                                }}
                                className={`relative aspect-[3/4.4] bg-white dark:bg-zinc-900 rounded-xl border p-1 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-2xs group ${
                                  isSelected
                                    ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-md scale-[1.02]'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-800'
                                }`}
                              >
                                <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                  <img
                                    src={cardDetail.card_details?.image_url_small || cardDetail.card_details?.image_url}
                                    alt={cardDetail.card_details?.name || 'Carta'}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                                  />
                                  <div className="absolute top-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-xs">
                                    {cardDetail.count}x
                                  </div>
                                  <div className="absolute top-1 left-1">
                                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-purple-900/90 text-purple-200 border border-purple-700/50">
                                      Extra
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-1 px-0.5 text-center min-w-0">
                                  <p className="text-[9.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-purple-500 transition-colors">
                                    {cardDetail.card_details?.name}
                                  </p>
                                  <div className="mt-0.5">
                                    {hasPhysical ? (
                                      <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                                        📍 {cardLoc ? cardLoc.name : (storageLocationId ? (currentBaseLocation?.name || 'En Deckbox') : 'Sin clasificar')}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                                        ⚠️ Solo Receta
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECCIÓN 3: SIDE DECK */}
                  {(sectionFilter === 'all' || sectionFilter === 'side') && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between border-b border-amber-500/20 dark:border-amber-500/20 pb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Shield className="w-3 h-3" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Side Deck
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            {totalSideCount} / 15 cartas
                          </span>
                        </div>
                      </div>

                      {sideCards.length === 0 ? (
                        <div className="py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center text-zinc-400">
                          <p className="text-xs font-bold">Side Deck vacío</p>
                          <p className="text-[10.5px] mt-0.5">Agrega cartas de banquillo para enfrentamientos competitivos.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                          {sideCards.map((cardDetail, idx) => {
                            const isSelected = selectedCardDetail?.card_id === cardDetail.card_id && selectedCardDetail.section === cardDetail.section;
                            const physicalCards = userCards.filter(uc => uc.card_id === cardDetail.card_id);
                            const hasPhysical = physicalCards.length > 0;
                            const cardLocationId = physicalCards[0]?.storage_location_id;
                            const cardLoc = cardLocationId ? locations.find(l => l.id === cardLocationId) : null;

                            return (
                              <div
                                key={`side-${cardDetail.card_id}-${idx}`}
                                onClick={() => {
                                  setSelectedCardDetail(cardDetail);
                                  setRightMode('card');
                                  if (isMobile) setMobileTab('right');
                                }}
                                className={`relative aspect-[3/4.4] bg-white dark:bg-zinc-900 rounded-xl border p-1 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-2xs group ${
                                  isSelected
                                    ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-md scale-[1.02]'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-800'
                                }`}
                              >
                                <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                  <img
                                    src={cardDetail.card_details?.image_url_small || cardDetail.card_details?.image_url}
                                    alt={cardDetail.card_details?.name || 'Carta'}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                                  />
                                  <div className="absolute top-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-xs">
                                    {cardDetail.count}x
                                  </div>
                                  <div className="absolute top-1 left-1">
                                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-amber-900/90 text-amber-200 border border-amber-700/50">
                                      Side
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-1 px-0.5 text-center min-w-0">
                                  <p className="text-[9.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-500 transition-colors">
                                    {cardDetail.card_details?.name}
                                  </p>
                                  <div className="mt-0.5">
                                    {hasPhysical ? (
                                      <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                                        📍 {cardLoc ? cardLoc.name : (storageLocationId ? (currentBaseLocation?.name || 'En Deckbox') : 'Sin clasificar')}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                                        ⚠️ Solo Receta
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECCIÓN 4: RESERVA / CARTAS EXTRA (POOL) */}
                  {(sectionFilter === 'all' || sectionFilter === 'pool') && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 dark:border-cyan-500/20 pb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                            <Package className="w-3 h-3" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Reserva / Cartas Extra del Arquetipo
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                            {totalPoolCount} cartas
                          </span>
                        </div>
                      </div>

                      {poolCards.length === 0 ? (
                        <div className="py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center text-center text-zinc-400">
                          <p className="text-xs font-bold">Reserva de cartas extra vacía</p>
                          <p className="text-[10.5px] mt-0.5">Guarda aquí piezas de repuesto, tech cards o cartas que no entran en la lista activa.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                          {poolCards.map((cardDetail, idx) => {
                            const isSelected = selectedCardDetail?.card_id === cardDetail.card_id && selectedCardDetail.section === cardDetail.section;
                            const physicalCards = userCards.filter(uc => uc.card_id === cardDetail.card_id);
                            const hasPhysical = physicalCards.length > 0;
                            const cardLocationId = physicalCards[0]?.storage_location_id;
                            const cardLoc = cardLocationId ? locations.find(l => l.id === cardLocationId) : null;

                            return (
                              <div
                                key={`pool-${cardDetail.card_id}-${idx}`}
                                onClick={() => {
                                  setSelectedCardDetail(cardDetail);
                                  setRightMode('card');
                                  if (isMobile) setMobileTab('right');
                                }}
                                className={`relative aspect-[3/4.4] bg-white dark:bg-zinc-900 rounded-xl border p-1 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-2xs group ${
                                  isSelected
                                    ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-md scale-[1.02]'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-cyan-300 dark:hover:border-cyan-800'
                                }`}
                              >
                                <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                  <img
                                    src={cardDetail.card_details?.image_url_small || cardDetail.card_details?.image_url}
                                    alt={cardDetail.card_details?.name || 'Carta'}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                                  />
                                  <div className="absolute top-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-xs">
                                    {cardDetail.count}x
                                  </div>
                                  <div className="absolute top-1 left-1">
                                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-cyan-900/90 text-cyan-200 border border-cyan-700/50">
                                      Reserva
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-1 px-0.5 text-center min-w-0">
                                  <p className="text-[9.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-cyan-500 transition-colors">
                                    {cardDetail.card_details?.name}
                                  </p>
                                  <div className="mt-0.5">
                                    {hasPhysical ? (
                                      <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">
                                        📍 {cardLoc ? cardLoc.name : (storageLocationId ? (currentBaseLocation?.name || 'En Deckbox') : 'Sin clasificar')}
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 font-bold block">
                                        ⚠️ Solo Receta
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
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

          {/* ─── PANEL DERECHO: SWITCH ENTRE FICHA TÉCNICA Y DETALLES DE CARTA ─── */}
          <div 
            style={!isMobile ? { width: `${panelResize.rightPanelWidth}px` } : {}}
            className={`${mobileTab === 'right' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex-col h-full overflow-y-auto p-4 sm:p-5 z-20 space-y-4`}
          >
            {/* Switch Segmentado: FICHA TÉCNICA / DETALLES DE CARTA */}
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
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>FICHA TÉCNICA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightMode('card')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                    rightMode === 'card'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>DETALLES</span>
                </button>
              </div>

              {selectedCardDetail && rightMode === 'card' && (
                <button
                  onClick={() => setSelectedCardDetail(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                  title="Deseleccionar carta"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MODO 1: FICHA TÉCNICA DEL DECK (POR DEFECTO)
                ═══════════════════════════════════════════════════════════════════ */}
            {rightMode === 'details' ? (
              <div className="space-y-4">
                {/* Nombre de la Baraja */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300">
                    Nombre de la Baraja:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none shadow-2xs"
                  />
                </div>

                {/* Formato y Estado */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300">
                      Formato:
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none cursor-pointer"
                    >
                      <option value="TCG">TCG</option>
                      <option value="Master Duel">Master Duel</option>
                      <option value="OCG">OCG</option>
                      <option value="Speed Duel">Speed Duel</option>
                      <option value="Edison">Edison</option>
                      <option value="GOAT">GOAT</option>
                      <option value="Casual">Casual</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300">
                      Estado:
                    </label>
                    <select
                      value={isActive ? 'active' : 'recipe'}
                      onChange={(e) => setIsActive(e.target.value === 'active')}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none cursor-pointer"
                    >
                      <option value="active">Activo (Mazo armado)</option>
                      <option value="recipe">Inactivo (Receta)</option>
                    </select>
                  </div>
                </div>

                {/* Contenedor Físico Principal (Deckbox / Caja) */}
                <div className="space-y-1.5 p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs">
                  <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-red-500" />
                    <span>Contenedor Físico Base:</span>
                  </label>
                  <select
                    value={storageLocationId}
                    onChange={(e) => setStorageLocationId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Sin almacenar (Sólo Receta Digital) --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        📦 {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed mt-1">
                    Las cartas principales de este mazo se registrarán como guardadas aquí, salvo que indiques una ubicación separada para ciertas cartas.
                  </p>
                </div>

                {/* Asignación de Fundas (Sleeves) */}
                <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-500" />
                      <span>Fundas Asignadas (Sleeves)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSleeveSection('main_side');
                        setIsNewSleeveModalOpen(true);
                      }}
                      className="text-[10.5px] font-mono font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nueva Funda</span>
                    </button>
                  </div>

                  {/* Fundas Main / Side */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold block">
                      Main & Side Deck ({totalMainCount + totalSideCount} cartas):
                    </label>
                    <select
                      value={mainSleeveId}
                      onChange={(e) => setMainSleeveId(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Sin Funda Asignada --</option>
                      {availableSleeves.map(s => (
                        <option key={s.id} value={s.id}>
                          🛡️ {s.name} ({s.brand} - {s.color_pattern}) [{s.quantity_total} totales]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fundas Extra Deck */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold block">
                      Extra Deck ({totalExtraCount} cartas):
                    </label>
                    <select
                      value={extraSleeveId}
                      onChange={(e) => setExtraSleeveId(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Sin Funda Asignada --</option>
                      {availableSleeves.map(s => (
                        <option key={s.id} value={s.id}>
                          🛡️ {s.name} ({s.brand} - {s.color_pattern}) [{s.quantity_total} totales]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Resumen Físico y Ratios */}
                <div className="p-3.5 bg-zinc-100/60 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 text-xs">
                  <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">
                    Resumen de Ubicaciones Físicas:
                  </span>
                  <div className="space-y-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span>En Contenedor Base:</span>
                      <b className="text-zinc-900 dark:text-zinc-100">
                        {currentBaseLocation ? `${currentBaseLocation.name}` : 'Sin asignar'}
                      </b>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartas Extra / Reserva:</span>
                      <b className="text-cyan-600 dark:text-cyan-400">{totalPoolCount} cartas</b>
                    </div>
                  </div>
                </div>

                {/* Botón Guardar Ficha Técnica */}
                <button
                  type="button"
                  onClick={handleSaveDeck}
                  disabled={savingDeck}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingDeck ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Ficha Técnica</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* ═══════════════════════════════════════════════════════════════════
                  MODO 2: DETALLES DE CARTA SELECCIONADA
                  ═══════════════════════════════════════════════════════════════════ */
              selectedCardDetail ? (
                <div className="space-y-4">
                  {/* Vista Previa de la Carta */}
                  <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <img
                        src={selectedCardDetail.card_details?.image_url_small || selectedCardDetail.card_details?.image_url}
                        alt={selectedCardDetail.card_details?.name || 'Carta'}
                        className="w-16 h-24 object-cover rounded-lg shadow-sm shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                          {selectedCardDetail.card_details?.name}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">
                          {selectedCardDetail.card_details?.type}
                        </span>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {selectedCardDetail.count} Copias en {selectedCardDetail.section.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cambiar Sección en el Deck */}
                  <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
                    <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 block">
                      Sección en el Deck:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'main')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedCardDetail.section === 'main'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                        }`}
                      >
                        ⚔️ Main Deck
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'extra')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedCardDetail.section === 'extra'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                        }`}
                      >
                        🔮 Extra Deck
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'side')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedCardDetail.section === 'side'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                        }`}
                      >
                        🛡️ Side Deck
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'pool')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedCardDetail.section === 'pool'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                        }`}
                      >
                        📦 Cartas Extra / Pool
                      </button>
                    </div>
                  </div>

                  {/* Ubicación Física Específica de esta Carta */}
                  <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5 shadow-2xs">
                    <span className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Ubicación Física de esta Carta:</span>
                    </span>

                    {selectedPhysicalUserCards.length === 0 ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Esta carta no tiene copias físicas registradas en tu inventario.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedPhysicalUserCards.map((uc, i) => {
                          const currentCardLoc = uc.storage_location_id ? locations.find(l => l.id === uc.storage_location_id) : null;
                          return (
                            <div key={uc.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                  Copia #{i + 1} ({uc.rarity})
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  {currentCardLoc ? currentCardLoc.name : (currentBaseLocation?.name || 'En Deckbox')}
                                </span>
                              </div>
                              <select
                                value={uc.storage_location_id || ''}
                                onChange={(e) => handleUpdateCardPhysicalLocation(uc.id, e.target.value || null, 0)}
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-none cursor-pointer"
                              >
                                <option value="">📦 Ubicación Base del Deck ({currentBaseLocation?.name || 'Deckbox'})</option>
                                {locations.map(l => (
                                  <option key={l.id} value={l.id}>
                                    📁 {l.name} ({l.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quitar Carta del Deck */}
                  <button
                    type="button"
                    onClick={() => handleRemoveCardFromDeck(selectedCardDetail.card_id, selectedCardDetail.section)}
                    className="w-full py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar 1 Copia del Deck</span>
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-500 space-y-2">
                  <Info className="w-10 h-10 mb-1 opacity-40 text-zinc-400" />
                  <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                    Ninguna carta seleccionada
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-xs">
                    Haz clic en cualquier carta de la cuadrícula para inspeccionar sus copias físicas, moverla de sección o asignarle una ubicación física separada.
                  </p>
                </div>
              )
            )}
          </div>

        </div>

        {/* Modal para Crear Nueva Funda */}
        <SleeveInventoryFormModal
          isOpen={isNewSleeveModalOpen}
          onClose={() => {
            setIsNewSleeveModalOpen(false);
            setTargetSleeveSection(null);
          }}
          onSuccess={async () => {
            const sleevesRes = await fetch('/api/collection/sleeve-inventory');
            if (sleevesRes.ok) {
              const json = await sleevesRes.json();
              setAvailableSleeves(json.data || []);
            }
          }}
        />

      </motion.div>
    </div>
  );
};
