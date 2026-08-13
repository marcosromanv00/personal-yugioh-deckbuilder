/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Trash, AlertTriangle, TrendingUp, Sparkles, Loader2, RefreshCw, Save, FolderOpen, LayoutGrid, List, Heart, Printer, X, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { StorageLocation } from '@/types/collection';
import { CardFilters, FilterState } from './CardFilters';


interface ArchetypeItem {
  name: string;
  cardCount: number;
  tier: string;
  description: string;
  playstyle: string;
  popularityScore: number;
}

interface BreakdownCardItem {
  id: number;
  name: string;
  type: string;
  average_copies: number;
  image_url?: string;
  image_url_small?: string;
  is_main_deck: boolean;
  usage_percent: number;
}

interface Card {
  id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  image_url_small?: string;
  archetype?: string;
  ban_master_duel?: string;
  ban_tcg?: string;
  ban_duel_links?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  race?: string | null;
  attribute?: string | null;
}

interface DeckCard {
  id: number;
  name: string;
  count: number;
  section: 'main' | 'extra' | 'side' | 'extras';
  type: string;
  image_url: string;
  archetype?: string;
  ban_master_duel?: string;
  ban_tcg?: string;
  ban_duel_links?: string;
}


interface BanlistAlert {
  cardId: number;
  cardName: string;
  status: 'Forbidden' | 'Limited' | 'Semi-Limited';
  message: string;
}

interface Replacement {
  id: number;
  name: string;
  type: string;
  image_url: string;
  similarityScore: number;
  reason: string;
}

interface HistoryItem {
  id: number;
  name: string;
  type: string;
  image_url: string;
  archetype?: string;
  action: 'added' | 'removed';
  timestamp: number;
}

export default function DeckBuilder() {
  // Formato y Deck
  const [format, setFormat] = useState<'Master Duel' | 'TCG' | 'Duel Links'>('Master Duel');
  const [saveFormat, setSaveFormat] = useState<'Master Duel' | 'TCG' | 'Duel Links'>('Master Duel');
  const [saveIsActive, setSaveIsActive] = useState<boolean>(true);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [deckName, setDeckName] = useState('Mi Deck Yu-Gi-Oh!');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckId, setDeckId] = useState<string | null>(null);

  // Portal de exploración (Archetype Hub)
  const [activeView, setActiveView] = useState<'builder' | 'breakdowns'>('builder');
  const [archetypesList, setArchetypesList] = useState<ArchetypeItem[]>([]);
  const [isFetchingArchetypes, setIsFetchingArchetypes] = useState(false);
  const [archetypeSearchQuery, setArchetypeSearchQuery] = useState('');

  // Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    type: '',
    attribute: '',
    race: '',
    level: '',
    atkMin: '',
    atkMax: '',
    defMin: '',
    defMax: '',
    archetype: ''
  });


  // Análisis del Deck en tiempo real
  const [inferredArchetype, setInferredArchetype] = useState('');
  const [detectedArchetypes, setDetectedArchetypes] = useState<{ name: string; count: number }[]>([]);
  const [activeArchetypeTab, setActiveArchetypeTab] = useState<string>('');

  const [banlistAlerts, setBanlistAlerts] = useState<BanlistAlert[]>([]);
  const [replacements, setReplacements] = useState<Record<number, Replacement[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Reemplazo e info de carta activa
  const [activeReplacementCardId, setActiveReplacementCardId] = useState<number | null>(null);

  // Sincronización en caliente
  const [isSyncing, setIsSyncing] = useState(false);

  // Modales de Base de Datos e Inventario
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [savedDecks, setSavedDecks] = useState<import('@/types/collection').Deck[]>([]);

  const [loadingDecks, setLoadingDecks] = useState(false);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [userInventoryCounts, setUserInventoryCounts] = useState<Record<number, number>>({});
  const [targetLocationId, setTargetLocationId] = useState<string>('inbox');
  const [registerToInventory, setRegisterToInventory] = useState(false);
  const [cardsToRegister, setCardsToRegister] = useState<Record<number, boolean>>({});

  // Historial de cartas
  const [cardHistory, setCardHistory] = useState<HistoryItem[]>([]);

  // Estado y lógica para la vista técnica de carta en Hover
  const [favoriteCardIds, setFavoriteCardIds] = useState<number[]>([]);
  const [searchScope, setSearchScope] = useState<'global' | 'collection'>('global');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [hoveredCard, setHoveredCard] = useState<{ id: number; name: string; type?: string; image_url?: string; [key: string]: any } | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [modalActionMessage, setModalActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  // Ref to track if cursor is still hovering — prevents modal from opening after cursor leaves
  const isHoveringRef = useRef(false);
  const isPreviewOpenRef = useRef(false);

  const closePreview = useCallback(() => {
    isHoveringRef.current = false;
    isPreviewOpenRef.current = false;
    setIsPreviewOpen(false);
  }, []);

  // Cargar favoritos al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yg_favorite_cards');
      if (stored) {
        try {
          setFavoriteCardIds(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing favorite cards:', e);
        }
      }
    }
  }, []);

  const handleToggleFavorite = (cardId: number) => {
    setFavoriteCardIds(prev => {
      const updated = prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId];
      localStorage.setItem('yg_favorite_cards', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCardMouseEnter = useCallback((card: { id: number; name: string; type?: string; image_url?: string; [key: string]: any }) => {
    if (isPreviewOpen) return;

    isHoveringRef.current = true;

    setHoverTimer(prev => {
      if (prev) clearTimeout(prev);

      const timer = setTimeout(async () => {
        // Abort if cursor left before the 1.5s timer fired
        if (!isHoveringRef.current) return;

        setIsPreviewOpen(true);
        isPreviewOpenRef.current = true;
        setIsLoadingPreview(true);
        setHoveredCard(card);
        setModalActionMessage(null);

        try {
          const res = await fetch(`/api/cards?id=${card.id}`);
          // Second check: abort if cursor left while fetching
          if (!isHoveringRef.current) {
            setIsPreviewOpen(false);
            isPreviewOpenRef.current = false;
            setIsLoadingPreview(false);
            return;
          }
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.length > 0) {
              setPreviewCard(json.data[0]);
            } else {
              setPreviewCard({ type: 'Unknown', image_url: '', ...card } as Card);
            }
          } else {
            setPreviewCard({ type: 'Unknown', image_url: '', ...card } as Card);
          }
        } catch (err) {
          console.error('Error fetching preview card details:', err);
          setPreviewCard({ type: 'Unknown', image_url: '', ...card } as Card);
        } finally {
          setIsLoadingPreview(false);
        }
      }, 1500);

      return timer;
    });
  }, [isPreviewOpen]);

  const handleCardMouseLeave = useCallback(() => {
    // Mark cursor as gone — cancels any in-flight or pending open
    // BUT only if the preview modal is not open, to avoid immediate cancelation when mouse overlay blocks the card
    if (!isPreviewOpenRef.current) {
      isHoveringRef.current = false;
    }
    setHoverTimer(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      setHoverTimer(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
    };
  }, []);

  const handleAddProxy = async (cardId: number) => {
    setIsActionLoading(true);
    setModalActionMessage(null);
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: cardId,
          quantity: 1,
          is_proxy: true,
          status_flag: 'collection',
          rarity: 'Common',
          condition: 'Near Mint',
          language: 'en'
        })
      });
      if (res.ok) {
        setUserInventoryCounts(prev => ({
          ...prev,
          [cardId]: (prev[cardId] || 0) + 1
        }));
        setModalActionMessage({ text: '¡Agregada como proxy exitosamente!', type: 'success' });
      } else {
        const errJson = await res.json();
        setModalActionMessage({ text: `Error: ${errJson.error || 'No se pudo agregar'}`, type: 'error' });
      }
    } catch (e) {
      console.error('Error adding proxy:', e);
      setModalActionMessage({ text: 'Error de red al agregar proxy.', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveFromCollection = async (cardId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar todas las copias de esta carta de tu colección?')) return;
    setIsActionLoading(true);
    setModalActionMessage(null);
    try {
      const res = await fetch(`/api/collection/cards?card_id=${cardId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUserInventoryCounts(prev => {
          const updated = { ...prev };
          delete updated[cardId];
          return updated;
        });
        setModalActionMessage({ text: '¡Carta eliminada de la colección!', type: 'success' });
      } else {
        const errJson = await res.json();
        setModalActionMessage({ text: `Error: ${errJson.error || 'No se pudo eliminar'}`, type: 'error' });
      }
    } catch (e) {
      console.error('Error removing from collection:', e);
      setModalActionMessage({ text: 'Error de red al eliminar.', type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getBanlistBadge = (card: { ban_tcg?: string; ban_master_duel?: string; ban_duel_links?: string }) => {
    const status = 
      format === 'TCG' ? card.ban_tcg :
      format === 'Master Duel' ? card.ban_master_duel :
      card.ban_duel_links;

    if (!status || status === 'Unlimited') return null;

    if (status === 'Forbidden') {
      return (
        <div 
          className="absolute top-1 left-1 bg-black border-[3px] border-red-650 text-red-500 font-sans font-black text-[12px] w-[25px] h-[25px] rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Prohibida (0 copias)"
        >
          🚫
        </div>
      );
    }

    if (status === 'Limited') {
      return (
        <div 
          className="absolute top-1 left-1 bg-black border-[3px] border-red-655 text-yellow-400 font-sans font-black text-[12px] w-[25px] h-[25px] rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Limitada (1 copia)"
        >
          1
        </div>
      );
    }

    if (status === 'Semi-Limited') {
      return (
        <div 
          className="absolute top-1 left-1 bg-black border-[3px] border-blue-500 text-yellow-405 font-sans font-black text-[12px] w-[25px] h-[25px] rounded-full flex items-center justify-center shadow-md shadow-black/80 z-20 select-none"
          title="Semi-limitada (2 copias)"
        >
          2
        </div>
      );
    }

    return null;
  };

  const renderCardFanCount = (count: number) => {
    if (count <= 0) return null;
    return (
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center select-none">
        <div className="relative w-[26px] h-[18px] flex items-center justify-center">
          {/* Card 1: Left */}
          <div className="absolute w-[11px] h-[16px] bg-gradient-to-b from-amber-900 to-amber-950 border border-amber-600 rounded-[1px] shadow-sm transform -rotate-12 -translate-x-1.5 translate-y-0.5 origin-bottom" />
          {/* Card 3: Right */}
          <div className="absolute w-[11px] h-[16px] bg-gradient-to-b from-amber-900 to-amber-950 border border-amber-600 rounded-[1px] shadow-sm transform rotate-12 translate-x-1.5 translate-y-0.5 origin-bottom" />
          {/* Card 2: Center */}
          <div className="absolute w-[11px] h-[16px] bg-gradient-to-b from-amber-800 to-amber-950 border border-amber-500 rounded-[1px] shadow-md z-10" />
          {/* Count Text Overlay */}
          <div className="absolute z-20 bg-black/95 border border-zinc-800 text-white font-mono font-black text-[7px] px-0.5 py-px rounded shadow-lg leading-none">
            {count}x
          </div>
        </div>
      </div>
    );
  };

  // Desglose del arquetipo detectado en barra lateral
  const [sidebarBreakdownCards, setSidebarBreakdownCards] = useState<BreakdownCardItem[]>([]);
  const [isFetchingSidebarBreakdown, setIsFetchingSidebarBreakdown] = useState(false);

  // Registro de arquetipos sincronizados en esta sesión
  const [syncedArchetypes, setSyncedArchetypes] = useState<string[]>([]);

  const fetchSidebarBreakdown = useCallback(async (archetype: string) => {
    if (!archetype || archetype === 'Híbrido / Staples') {
      setSidebarBreakdownCards([]);
      return;
    }
    setIsFetchingSidebarBreakdown(true);
    try {
      const res = await fetch(`/api/breakdown?archetype=${encodeURIComponent(archetype)}&format=${format}`);
      if (res.ok) {
        const json = await res.json();
        setSidebarBreakdownCards(json.breakdown || []);
      }
    } catch (e) {
      console.error('Error al cargar desglose de arquetipo para barra lateral:', e);
    } finally {
      setIsFetchingSidebarBreakdown(false);
    }
  }, [format]);

  // 2. Analizar el deck en tiempo real con la API
  const analyzeDeck = useCallback(async (currentCards: DeckCard[], currentFormat: string) => {
    setIsAnalyzing(true);
    try {
      // Filtrar cartas que sean de extras para no afectar análisis principal del meta si no se desea, o mapear normal
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: currentCards.map(c => ({
            id: c.id,
            name: c.name,
            count: c.count,
            section: c.section
          })),
          format: currentFormat
        })
      });

      if (res.ok) {
        const json = await res.json();
        const detected: { name: string; count: number }[] = json.detectedArchetypes || [];
        setDetectedArchetypes(detected);
        const primaryArch = json.archetype || (detected.length > 0 ? detected[0].name : 'Híbrido / Staples');
        setInferredArchetype(primaryArch);

        // Actualizar pestaña activa de arquetipo si la actual no pertenece a los detectados
        setActiveArchetypeTab(prev => {
          if (prev && detected.some(d => d.name === prev)) return prev;
          return detected.length > 0 ? detected[0].name : primaryArch;
        });

        setBanlistAlerts(json.banlistAlerts || []);
        setReplacements(json.replacements || {});
      }
    } catch (e) {
      console.error('Error analizando deck:', e);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const triggerSync = useCallback(async (silent = false) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-meta', {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json();
        if (!silent) {
          alert(json.message);
        }
        analyzeDeck(deckCards, format);
        if (inferredArchetype && inferredArchetype !== 'Híbrido / Staples') {
          fetchSidebarBreakdown(inferredArchetype);
        }
      } else {
        const json = await res.json();
        if (!silent) {
          alert(`Error al sincronizar: ${json.error || 'Intente de nuevo'}`);
        }
      }
    } catch (e) {
      console.error('Error sincronizando:', e);
      if (!silent) {
        alert('Error de red al intentar sincronizar el meta.');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [analyzeDeck, deckCards, format, inferredArchetype, fetchSidebarBreakdown]);

  // Desglose de arquetipos (Drill-down)
  const [activeArchetypeBreakdown, setActiveArchetypeBreakdown] = useState<string | null>(null);
  const [breakdownCards, setBreakdownCards] = useState<BreakdownCardItem[]>([]);
  const [isFetchingBreakdown, setIsFetchingBreakdown] = useState(false);
  const openArchetypeBreakdown = useCallback(async (archetype: string) => {
    setActiveArchetypeBreakdown(archetype);
    setIsFetchingBreakdown(true);
    try {
      const res = await fetch(`/api/breakdown?archetype=${encodeURIComponent(archetype)}&format=${format}`);
      if (res.ok) {
        const json = await res.json();
        setBreakdownCards(json.breakdown || []);
      }
    } catch (e) {
      console.error('Error al cargar desglose de arquetipo:', e);
    } finally {
      setIsFetchingBreakdown(false);
    }
  }, [format, setActiveArchetypeBreakdown, setIsFetchingBreakdown, setBreakdownCards]);
  const fetchArchetypes = useCallback(async () => {
    setIsFetchingArchetypes(true);
    try {
      const res = await fetch(`/api/archetypes?format=${encodeURIComponent(format)}`);
      if (res.ok) {
        const json = await res.json();
        setArchetypesList(json.archetypes || []);
      }
    } catch (e) {
      console.error('Error fetching archetypes:', e);
    } finally {
      setIsFetchingArchetypes(false);
    }
  }, [format]);
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchArchetypes();
    });
  }, [fetchArchetypes]);

  const isExtraDeckCard = (cardType?: string): boolean => {
    if (!cardType) return false;
    const t = cardType.toLowerCase();
    return t.includes('fusion') || t.includes('link') || t.includes('synchro') || t.includes('xyz');
  };

  const initializeDeckFromArchetype = async (archetype: string, cardsInBreakdown: BreakdownCardItem[]) => {
    if (deckCards.length > 0 && !confirm(`¿Estás seguro de que deseas iniciar una nueva baraja de ${archetype}? Esto borrará tus cartas actuales.`)) {
      return;
    }

    const cardsToLoad: DeckCard[] = [];

    for (const item of cardsInBreakdown) {
      const isExtra = isExtraDeckCard(item.type);
      const section = isExtra ? 'extra' : 'main';

      cardsToLoad.push({
        id: item.id,
        name: item.name,
        count: Math.round(item.average_copies) || 1,
        section,
        type: item.type,
        image_url: item.image_url || item.image_url_small || '',
        archetype: archetype
      });
    }

    setDeckCards(cardsToLoad);
    setDeckName(`Deck ${archetype} (Meta)`);
    setDeckId(null);
    setActiveView('builder');
    setActiveArchetypeBreakdown(null);
  };

  // 1. Efectuar búsqueda de cartas
  const executeSearch = useCallback(async (query: string, type: string, adv: FilterState, scope: 'global' | 'collection', favs: boolean) => {
    setIsSearching(true);
    try {
      if (scope === 'collection') {
        let url = `/api/collection/cards?limit=100`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        
        const typeToUse = type !== 'All' ? type : adv.type;
        if (typeToUse) url += `&type=${typeToUse}`;
        
        if (adv.attribute) url += `&attribute=${encodeURIComponent(adv.attribute)}`;
        if (adv.race) url += `&race=${encodeURIComponent(adv.race)}`;
        if (adv.level) url += `&level=${encodeURIComponent(adv.level)}`;
        if (adv.atkMin) url += `&atkMin=${encodeURIComponent(adv.atkMin)}`;
        if (adv.atkMax) url += `&atkMax=${encodeURIComponent(adv.atkMax)}`;
        if (adv.defMin) url += `&defMin=${encodeURIComponent(adv.defMin)}`;
        if (adv.defMax) url += `&defMax=${encodeURIComponent(adv.defMax)}`;
        if (adv.archetype) url += `&archetype=${encodeURIComponent(adv.archetype)}`;
        if (favs) url += `&favorites=true`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const rawList = json.data || [];
          
          // Eliminar duplicados para que una misma carta física no aparezca repetida en los resultados de búsqueda
          const seen = new Set<number>();
          const mappedCards: Card[] = [];
          
          for (const uc of rawList) {
            if (!uc.card_details) continue;
            if (seen.has(uc.card_details.id)) continue;
            seen.add(uc.card_details.id);
            mappedCards.push({
              id: uc.card_details.id,
              name: uc.card_details.name,
              type: uc.card_details.type,
              desc: uc.card_details.desc || '',
              image_url: uc.card_details.image_url || '',
              image_url_small: uc.card_details.image_url_small || '',
              archetype: uc.card_details.archetype || undefined,
              ban_master_duel: uc.card_details.ban_master_duel,
              ban_tcg: uc.card_details.ban_tcg,
              ban_duel_links: uc.card_details.ban_duel_links,
              atk: uc.card_details.atk,
              def: uc.card_details.def,
              level: uc.card_details.level,
              race: uc.card_details.race,
              attribute: uc.card_details.attribute,
            });
          }
          setSearchResults(mappedCards);
        }
      } else {
        // Modo global
        // Si buscamos favoritas y no hay filtro de query ni otros, podemos cargar todas las favoritas del usuario
        // combinando favoritos locales y colección para mayor comodidad.
        if (favs && !query && !adv.attribute && !adv.race && !adv.level && !adv.atkMin && !adv.atkMax && !adv.defMin && !adv.defMax && !adv.archetype) {
          // Consultar favoritas de la colección
          const res = await fetch('/api/collection/cards?favorites=true');
          if (res.ok) {
            const json = await res.json();
            const rawList = json.data || [];
            const seen = new Set<number>();
            const mappedCards: Card[] = [];
            
            for (const uc of rawList) {
              if (!uc.card_details) continue;
              if (seen.has(uc.card_details.id)) continue;
              seen.add(uc.card_details.id);
              mappedCards.push({
                id: uc.card_details.id,
                name: uc.card_details.name,
                type: uc.card_details.type,
                desc: uc.card_details.desc || '',
                image_url: uc.card_details.image_url || '',
                image_url_small: uc.card_details.image_url_small || '',
                archetype: uc.card_details.archetype || undefined,
                ban_master_duel: uc.card_details.ban_master_duel,
                ban_tcg: uc.card_details.ban_tcg,
                ban_duel_links: uc.card_details.ban_duel_links,
                atk: uc.card_details.atk,
                def: uc.card_details.def,
                level: uc.card_details.level,
                race: uc.card_details.race,
                attribute: uc.card_details.attribute,
              });
            }
            
            // Si el usuario tiene favoritas locales (localStorage) pero no en yg_user_cards, podemos agregarlas consultándolas
            if (favoriteCardIds.length > 0) {
              // Obtener ids locales que falten
              const existingIds = new Set(mappedCards.map(c => c.id));
              const missingIds = favoriteCardIds.filter(id => !existingIds.has(id));
              if (missingIds.length > 0) {
                // Hacer fetch para las locales faltantes (hasta un límite razonable de 20 para no sobrecargar)
                const promises = missingIds.slice(0, 20).map(async (id) => {
                  try {
                    const r = await fetch(`/api/cards?id=${id}`);
                    if (r.ok) {
                      const j = await r.json();
                      return j.data?.[0];
                    }
                  } catch (e) {
                    console.error('Error fetching missing local favorite:', e);
                  }
                  return null;
                });
                const fetchedMissing = await Promise.all(promises);
                fetchedMissing.forEach(c => {
                  if (c && !seen.has(c.id)) {
                    seen.add(c.id);
                    mappedCards.push(c);
                  }
                });
              }
            }
            setSearchResults(mappedCards);
            return;
          }
        }

        let url = `/api/cards?limit=50`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        
        const typeToUse = type !== 'All' ? type : adv.type;
        if (typeToUse) url += `&type=${typeToUse}`;
        
        if (adv.attribute) url += `&attribute=${encodeURIComponent(adv.attribute)}`;
        if (adv.race) url += `&race=${encodeURIComponent(adv.race)}`;
        if (adv.level) url += `&level=${encodeURIComponent(adv.level)}`;
        if (adv.atkMin) url += `&atkMin=${encodeURIComponent(adv.atkMin)}`;
        if (adv.atkMax) url += `&atkMax=${encodeURIComponent(adv.atkMax)}`;
        if (adv.defMin) url += `&defMin=${encodeURIComponent(adv.defMin)}`;
        if (adv.defMax) url += `&defMax=${encodeURIComponent(adv.defMax)}`;
        if (adv.archetype) url += `&archetype=${encodeURIComponent(adv.archetype)}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          let cards: Card[] = json.data || [];
          
          if (favs) {
            // Filtrar usando los favoritos locales guardados en localStorage
            cards = cards.filter(c => favoriteCardIds.includes(c.id));
          }
          setSearchResults(cards);
        }
      }
    } catch (e) {
      console.error('Error buscando cartas:', e);
    } finally {
      setIsSearching(false);
    }
  }, [favoriteCardIds]);

  // Debounce simple para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(searchQuery, searchType, advancedFilters, searchScope, onlyFavorites);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, executeSearch]);



  // Disparar análisis cuando cambia la lista de cartas o el formato (con debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeDeck(deckCards, format);
    }, 300);
    return () => clearTimeout(timer);
  }, [deckCards, format, analyzeDeck]);

  // Cargar desglose de la barra lateral reactivamente según la pestaña de arquetipo activa
  useEffect(() => {
    const handleArchetypeChange = async () => {
      const archToUse = activeArchetypeTab || inferredArchetype;
      if (!archToUse || archToUse === 'Híbrido / Staples') {
        setSidebarBreakdownCards([]);
        return;
      }

      // Si no ha sido sincronizado en esta sesión, sincronizar
      if (!syncedArchetypes.includes(archToUse)) {
        setSyncedArchetypes(prev => [...prev, archToUse]);
        await triggerSync(true); // Sincronización silenciosa
      } else {
        fetchSidebarBreakdown(archToUse);
      }
    };
    handleArchetypeChange();
  }, [activeArchetypeTab, inferredArchetype, format, syncedArchetypes, fetchSidebarBreakdown, triggerSync]);

  // 3. Lógica para agregar carta al deck
  const addCardToDeck = useCallback((card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras') => {
    let section: 'main' | 'extra' | 'side' | 'extras' = 'main';

    if (targetSection) {
      section = targetSection;
    } else {
      const isExtraDeckType = isExtraDeckCard(card.type);
      section = isExtraDeckType ? 'extra' : 'main';
    }

    // Límites de tamaño
    const maxMainSize = format === 'Duel Links' ? 30 : 60;
    const maxExtraSize = format === 'Duel Links' ? 8 : 15;
    const maxSideSize = 15;
    const maxExtrasSize = 30;

    const mainCount = deckCards.filter(c => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
    const extraCount = deckCards.filter(c => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
    const sideCount = deckCards.filter(c => c.section === 'side').reduce((acc, c) => acc + c.count, 0);
    const extrasCount = deckCards.filter(c => c.section === 'extras').reduce((acc, c) => acc + c.count, 0);

    if (section === 'main' && mainCount >= maxMainSize) {
      alert(`El Main Deck ha alcanzado el límite máximo (${maxMainSize} cartas).`);
      return;
    }
    if (section === 'extra' && extraCount >= maxExtraSize) {
      alert(`El Extra Deck ha alcanzado el límite máximo (${maxExtraSize} cartas).`);
      return;
    }
    if (section === 'side' && sideCount >= maxSideSize) {
      alert(`El Side Deck ha alcanzado el límite máximo (${maxSideSize} cartas).`);
      return;
    }
    if (section === 'extras' && extrasCount >= maxExtrasSize) {
      alert(`La sección Extras ha alcanzado el límite máximo (${maxExtrasSize} cartas).`);
      return;
    }

    // Historial
    const historyCard: HistoryItem = {
      id: card.id,
      name: card.name,
      type: card.type,
      image_url: card.image_url || card.image_url_small || '',
      archetype: card.archetype,
      action: 'added',
      timestamp: Date.now()
    };
    setCardHistory(prev => {
      const filtered = prev.filter(item => item.id !== card.id);
      return [historyCard, ...filtered].slice(0, 15);
    });

    setDeckCards(prev => {
      const existing = prev.find(c => c.id === card.id && c.section === section);
      if (existing) {
        if (existing.count >= 3) {
          alert('No puedes jugar más de 3 copias de una misma carta.');
          return prev;
        }
        return prev.map(c => (c.id === card.id && c.section === section) ? { ...c, count: c.count + 1 } : c);
      }
      return [...prev, {
        id: card.id,
        name: card.name,
        count: 1,
        section,
        type: card.type,
        image_url: card.image_url,
        archetype: card.archetype,
        ban_master_duel: card.ban_master_duel,
        ban_tcg: card.ban_tcg,
        ban_duel_links: card.ban_duel_links
      }];
    });
  }, [format, deckCards]);

  // 4. Lógica para quitar carta
  const removeCardFromDeck = useCallback((cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => {
    const existing = deckCards.find(c => c.id === cardId && c.section === section);
    if (existing) {
      const historyCard: HistoryItem = {
        id: existing.id,
        name: existing.name,
        type: existing.type,
        image_url: existing.image_url || '',
        archetype: existing.archetype,
        action: 'removed',
        timestamp: Date.now()
      };
      setCardHistory(prev => {
        const filtered = prev.filter(item => item.id !== cardId);
        return [historyCard, ...filtered].slice(0, 15);
      });
    }

    setDeckCards(prev => {
      const existing = prev.find(c => c.id === cardId && c.section === section);
      if (existing && existing.count > 1) {
        return prev.map(c => (c.id === cardId && c.section === section) ? { ...c, count: c.count - 1 } : c);
      }
      return prev.filter(c => !(c.id === cardId && c.section === section));
    });
  }, [deckCards]);

  // Handlers para Drag & Drop de cartas desde paneles laterales hacia las secciones del deck
  const handleDragCardStart = (e: React.DragEvent, cardData: { id: number; name: string; type?: string; image_url?: string; archetype?: string; fromSection?: 'main' | 'extra' | 'side' | 'extras' }) => {
    const payload = JSON.stringify({
      id: cardData.id,
      name: cardData.name,
      type: cardData.type || 'Monster',
      image_url: cardData.image_url || '',
      archetype: cardData.archetype,
      fromSection: cardData.fromSection
    });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.setData('text/plain', String(cardData.id));
  };

  const handleDropCardOnSection = (e: React.DragEvent, targetSection: 'main' | 'extra' | 'side' | 'extras') => {
    e.preventDefault();
    const jsonStr = e.dataTransfer.getData('application/json');
    if (jsonStr) {
      try {
        const cardObj = JSON.parse(jsonStr);
        if (cardObj && cardObj.id) {
          if (cardObj.fromSection) {
            if (cardObj.fromSection !== targetSection) {
              removeCardFromDeck(cardObj.id, cardObj.fromSection);
              addCardToDeck(cardObj, targetSection);
            }
          } else {
            addCardToDeck(cardObj, targetSection);
          }
          return;
        }
      } catch (err) {
        console.error('Error al parsear carta arrastrada:', err);
      }
    }
    const rawId = e.dataTransfer.getData('text/plain');
    if (rawId) {
      const cardId = parseInt(rawId);
      if (!isNaN(cardId)) {
        addRecommendedCard(cardId, '', targetSection);
      }
    }
  };

  // 5. Agregar carta recomendada/staple de forma rápida
  const addRecommendedCard = async (cardId: number, cardName: string, targetSection?: 'main' | 'extra' | 'side' | 'extras', cardObj?: Partial<Card & BreakdownCardItem & HistoryItem>) => {
    if (cardObj && cardObj.id) {
      addCardToDeck({
        id: cardObj.id,
        name: cardObj.name || '',
        type: cardObj.type || 'Monster',
        image_url: cardObj.image_url || cardObj.image_url_small || '',
        image_url_small: cardObj.image_url_small || cardObj.image_url || '',
        archetype: cardObj.archetype
      }, targetSection);
      return;
    }

    const foundInSearch = searchResults.find(c => c.id === cardId);
    if (foundInSearch) {
      addCardToDeck(foundInSearch, targetSection);
      return;
    }

    const foundInSidebar = sidebarBreakdownCards.find(c => c.id === cardId);
    if (foundInSidebar) {
      addCardToDeck({
        id: foundInSidebar.id,
        name: foundInSidebar.name,
        type: foundInSidebar.type || 'Monster',
        image_url: foundInSidebar.image_url || foundInSidebar.image_url_small || ''
      }, targetSection);
      return;
    }

    const foundInHistory = cardHistory.find(c => c.id === cardId);
    if (foundInHistory) {
      addCardToDeck({
        id: foundInHistory.id,
        name: foundInHistory.name,
        type: foundInHistory.type || 'Monster',
        image_url: foundInHistory.image_url || '',
        archetype: foundInHistory.archetype
      }, targetSection);
      return;
    }

    try {
      const queryName = cardName || String(cardId);
      const res = await fetch(`/api/cards?q=${encodeURIComponent(queryName)}`);
      if (res.ok) {
        const json = await res.json();
        const card = json.data?.find((c: Card) => c.id === cardId) || json.data?.[0];
        if (card) {
          addCardToDeck(card, targetSection);
        }
      }
    } catch (e) {
      console.error('Error al agregar recomendada:', e);
    }
  };

  // Cargar datos de decks guardados y almacenes para el modal
  const fetchDecksAndLocations = async () => {
    setLoadingDecks(true);
    try {
      const decksRes = await fetch('/api/decks');
      if (decksRes.ok) {
        const json = await decksRes.json();
        setSavedDecks(json.data || []);
      }
      const locRes = await fetch('/api/collection/storage');
      if (locRes.ok) {
        const json = await locRes.json();
        setLocations((json.data || []).filter((l: StorageLocation) => l.type === 'deckbox' || l.type === 'binder' || l.type === 'box'));
      }

      // Cargar inventario para comparar cantidades de cartas
      const invRes = await fetch('/api/collection/cards');
      if (invRes.ok) {
        const json = await invRes.json();
        const counts: Record<number, number> = {};
        (json.data || []).forEach((uc: import('@/types/collection').UserCard) => {
          counts[uc.card_id] = (counts[uc.card_id] || 0) + (uc.quantity || 1);
        });
        setUserInventoryCounts(counts);
      }
    } catch (e) {
      console.error('Error cargando decks o inventario:', e);
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleOpenSaveModal = () => {
    fetchDecksAndLocations();
    // Reiniciar selecciones de importación de cartas
    const initialReg: Record<number, boolean> = {};
    deckCards.forEach(c => {
      initialReg[c.id] = true;
    });
    setCardsToRegister(initialReg);
    setSaveFormat(format); // Inicializar saveFormat con el formato actual
    setIsSaveModalOpen(true);
  };

  const handleOpenLoadModal = () => {
    fetchDecksAndLocations();
    setIsLoadModalOpen(true);
  };

  const handleLoadDeck = (selected: import('@/types/collection').Deck) => {
    setDeckId(selected.id);
    setDeckName(selected.name);

    setDeckDescription(selected.description || '');
    const fmt = selected.format;
    if (fmt === 'Master Duel' || fmt === 'TCG' || fmt === 'Duel Links') {
      setFormat(fmt);
    } else {
      setFormat('Master Duel');
    }
    const mappedCards: DeckCard[] = (selected.cards || []).map((dc: import('@/types/collection').DeckCardDetail) => ({
      id: dc.card_id,
      name: dc.card_details?.name || 'Carta Desconocida',
      count: dc.count,
      section: dc.section as 'main' | 'extra' | 'side' | 'extras',
      type: dc.card_details?.type || 'Monster',
      image_url: dc.card_details?.image_url || dc.card_details?.image_url_small || '',
      ban_master_duel: (dc.card_details as any)?.ban_master_duel,
      ban_tcg: (dc.card_details as any)?.ban_tcg,
      ban_duel_links: (dc.card_details as any)?.ban_duel_links
    }));
    setDeckCards(mappedCards);
    setIsLoadModalOpen(false);
  };

  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      alert('El nombre del deck es obligatorio.');
      return;
    }

    setLoadingDecks(true);
    try {
      const cardsToRegisterList = deckCards.filter(c => cardsToRegister[c.id]);

      let finalDeckId = deckId;
      let method = 'POST';

      if (deckId) {
        const overwrite = confirm('Se detectó que habías cargado una baraja existente. ¿Deseas SOBRESCRIBIR la baraja actual?\n\n- Presiona [Aceptar] para Sobrescribir.\n- Presiona [Cancelar] para guardar como una COPIA NUEVA.');
        if (overwrite) {
          method = 'PUT';
          finalDeckId = deckId;
        } else {
          method = 'POST';
          finalDeckId = null; // Guardar como nuevo
        }
      }

      const payload = {
        id: finalDeckId,
        name: deckName,
        description: deckDescription,
        format: saveFormat,
        is_active: saveIsActive,
        storage_location_id: targetLocationId === 'inbox' ? null : targetLocationId,
        cards: deckCards.map(c => ({
          id: c.id,
          name: c.name,
          count: c.count,
          section: c.section,
          type: c.type,
          image_url: c.image_url
        })),
        register_to_inventory: registerToInventory,
        inventory_cards_to_add: cardsToRegisterList.map(c => ({
          id: c.id,
          count: c.count
        }))
      };

      const res = await fetch('/api/decks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (method === 'POST' && json.data?.id) {
          setDeckId(json.data.id);
        }
        alert(method === 'PUT' ? '¡Deck sobrescrito exitosamente!' : '¡Copia nueva guardada exitosamente!');
        setIsSaveModalOpen(false);
      } else {
        const json = await res.json();
        alert(`Error al guardar: ${json.error || 'Intente de nuevo'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar el deck.');
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta baraja?')) return;
    try {
      const res = await fetch(`/api/decks?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSavedDecks(prev => prev.filter(d => d.id !== id));
        if (deckId === id) {
          setDeckId(null);
          setDeckCards([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearDeck = () => {
    if (confirm('¿Estás seguro de que deseas limpiar todo el deck actual? Esta acción no se puede deshacer.')) {
      setDeckCards([]);
      setDeckId(null);
    }
  };

  const handleExcludeExisting = () => {
    const updated = { ...cardsToRegister };
    deckCards.forEach(c => {
      const inInventory = userInventoryCounts[c.id] || 0;
      if (inInventory >= c.count) {
        updated[c.id] = false; // Excluir si ya tenemos suficientes
      }
    });
    setCardsToRegister(updated);
  };

  // Ratios de contadores
  const mainCardsCount = deckCards.filter(c => c.section === 'main').reduce((acc, c) => acc + c.count, 0);
  const extraCardsCount = deckCards.filter(c => c.section === 'extra').reduce((acc, c) => acc + c.count, 0);
  const sideCardsCount = deckCards.filter(c => c.section === 'side').reduce((acc, c) => acc + c.count, 0);
  const extrasCardsCount = deckCards.filter(c => c.section === 'extras').reduce((acc, c) => acc + c.count, 0);

  const activeReplacementCard = deckCards.find(c => c.id === activeReplacementCardId);
  const activeReplacementsList = activeReplacementCardId ? replacements[activeReplacementCardId] || [] : [];

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(224,25%,6%)] text-[hsl(210,40%,98%)] font-sans antialiased">
      
      {/* HEADER DE LA APP */}
      <header className="border-b border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/90 backdrop-blur-md sticky top-0 z-40 py-4 px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[hsl(263,85%,64%)] to-[hsl(180,80%,45%)] flex items-center justify-center font-bold text-xl shadow-lg shadow-[hsl(263,85%,64%)]/20">
            YG
          </div>
          <div>
            <input 
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="text-lg font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] focus:outline-none transition-colors max-w-xs text-slate-100"
            />
            <p className="text-xs text-[hsl(215,15%,70%)]">Constructor de Decks Inteligente</p>
          </div>
        </div>

        {/* ACCIONES DE BARRA DE CONTROL */}
        <div className="flex gap-2 items-center">
          <button
            onClick={handleOpenLoadModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-purple-400 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Cargar Deck</span>
          </button>

          <button
            onClick={handleClearDeck}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(224,25%,6%)] border border-red-900/40 hover:border-red-500 hover:text-red-400 hover:bg-red-950/10 rounded-xl text-xs font-semibold text-red-500 transition-all cursor-pointer"
          >
            <Trash className="w-3.5 h-3.5 text-red-500" />
            <span>Limpiar Deck</span>
          </button>
          
          <button
            onClick={handleOpenSaveModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(263,85%,64%)] text-white hover:bg-[hsl(263,85%,58%)] rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Deck</span>
          </button>
        </div>

        {/* NAVEGACIÓN DE VISTAS */}
        <div className="flex gap-2 bg-[hsl(224,25%,6%)] p-1 rounded-xl border border-[hsl(224,15%,16%)]">
          <button
            onClick={() => setActiveView('builder')}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all duration-300 cursor-pointer ${
              activeView === 'builder'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-[hsl(215,15%,70%)] hover:text-white'
            }`}
          >
            🛠️ Constructor
          </button>
          <button
            onClick={() => setActiveView('breakdowns')}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all duration-300 cursor-pointer ${
              activeView === 'breakdowns'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-[hsl(215,15%,70%)] hover:text-white'
            }`}
          >
            📊 Breakdowns Meta
          </button>
          <Link
            href="/collection"
            className="px-4 py-2 rounded-lg font-medium text-xs text-[hsl(215,15%,70%)] hover:text-white transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            📦 Mi Colección
          </Link>
        </div>

        {/* CONTROL DE DATOS Y FORMATOS */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 hover:text-white rounded-xl text-xs font-semibold text-[hsl(215,15%,70%)] transition-all cursor-pointer disabled:opacity-50"
            title="Sincronizar ratios de cartas y desgloses de arquetipos desde Master Duel Meta"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[hsl(180,80%,45%)] ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Meta'}
          </button>

          <div className="flex items-center gap-2 bg-[hsl(224,25%,6%)] p-1 rounded-xl border border-[hsl(224,15%,16%)]">
            {(['Master Duel', 'TCG', 'Duel Links'] as const).map(f => (
              <button
                key={f}
                onClick={() => {
                  setFormat(f);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                  format === f 
                    ? 'bg-[hsl(263,85%,64%)] text-white shadow-md' 
                    : 'text-[hsl(215,15%,70%)] hover:text-white hover:bg-[hsl(224,22%,10%)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL DEL BUILDER */}
      {activeView === 'builder' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 max-w-full w-full overflow-hidden">
          
          {/* COLUMNA 1: BUSCADOR DE CARTAS (Lg: 4 cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl p-4">
            <div className="border-b border-[hsl(224,15%,16%)] pb-2.5 flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                🔍 Buscar Cartas
              </h2>
              <div className="flex items-center gap-1 bg-[hsl(224,25%,6%)] p-0.5 rounded-lg border border-[hsl(224,15%,16%)]">
                <button
                  onClick={() => setSearchViewMode('grid')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    searchViewMode === 'grid'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-[hsl(215,15%,70%)] hover:text-white'
                  }`}
                  title="Vista Cuadrícula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSearchViewMode('list')}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    searchViewMode === 'list'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-[hsl(215,15%,70%)] hover:text-white'
                  }`}
                  title="Vista Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* BUSCABLE INPUT Y FAVORITAS */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={searchScope === 'collection' ? "Buscar en mi colección..." : "Nombre de carta..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] text-slate-100 rounded-xl text-xs focus:outline-none transition-colors"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[hsl(215,15%,70%)]" />
              </div>
              
              <button
                onClick={() => setOnlyFavorites(prev => !prev)}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  onlyFavorites
                    ? 'bg-pink-950/40 text-pink-500 border-pink-500/50 shadow-md shadow-pink-950/20'
                    : 'bg-[hsl(224,25%,6%)] border-[hsl(224,15%,16%)] text-slate-400 hover:text-pink-400 hover:border-pink-900/30'
                }`}
                title={onlyFavorites ? "Mostrar todas las cartas" : "Filtrar por Favoritas"}
              >
                <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-pink-500' : ''}`} />
              </button>
            </div>

            {/* TOGGLE ALCANCE (GLOBAL / COLECCIÓN) */}
            <div className="grid grid-cols-2 gap-1 bg-[hsl(224,25%,6%)] p-0.5 rounded-xl border border-[hsl(224,15%,16%)] shrink-0">
              <button
                onClick={() => setSearchScope('global')}
                className={`py-1.5 rounded-lg text-[10.5px] font-semibold transition-all duration-300 cursor-pointer ${
                  searchScope === 'global'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-[hsl(215,15%,70%)] hover:text-white'
                }`}
              >
                🌐 Base Global
              </button>
              <button
                onClick={() => setSearchScope('collection')}
                className={`py-1.5 rounded-lg text-[10.5px] font-semibold transition-all duration-300 cursor-pointer ${
                  searchScope === 'collection'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-[hsl(215,15%,70%)] hover:text-white'
                }`}
              >
                📦 Mi Colección
              </button>
            </div>

            {/* FILTROS RAPIDOS */}
            <div className="flex flex-wrap gap-1.5">
              {(['All', 'Monster', 'Spell', 'Trap', 'Extra'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setSearchType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    searchType === t
                      ? 'bg-[hsl(180,80%,45%)]/20 text-[hsl(180,80%,45%)] border border-[hsl(180,80%,45%)]/40'
                      : 'bg-[hsl(224,25%,6%)] text-[hsl(215,15%,70%)] border border-[hsl(224,15%,16%)] hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* FILTROS AVANZADOS */}
            <CardFilters
              filters={advancedFilters}
              onFilterChange={setAdvancedFilters}
              onReset={() => setAdvancedFilters({
                type: '',
                attribute: '',
                race: '',
                level: '',
                atkMin: '',
                atkMax: '',
                defMin: '',
                defMax: '',
                archetype: ''
              })}
            />

            {/* LISTA DE RESULTADOS */}
            <div className="flex-1 overflow-y-auto max-h-125 lg:max-h-155 pr-1 flex flex-col gap-2 scrollbar-thin">
              {isSearching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-500 mb-1" />
                  <span className="text-xs font-mono text-slate-500">Buscando...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">
                  No se encontraron cartas. Intenta buscando otra palabra.
                </div>
              ) : searchViewMode === 'grid' ? (
                <div className="grid grid-cols-6 gap-x-0.5 gap-y-1.5">
                  {searchResults.map(card => (
                    <div 
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype })}
                      onClick={() => addCardToDeck(card)}
                      onMouseEnter={() => handleCardMouseEnter(card)}
                      onMouseLeave={handleCardMouseLeave}
                      className="relative aspect-[3/4.2] bg-[hsl(224,25%,6%)] hover:bg-[hsl(224,22%,10%)] rounded-lg border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 transition-all duration-300 group flex flex-col justify-between p-1 overflow-hidden cursor-grab active:cursor-grabbing"
                    >
                      <div className="relative flex-1 rounded-md overflow-hidden shadow">
                        <img 
                          src={card.image_url_small || card.image_url} 
                          alt={card.name} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                        />
                        {getBanlistBadge(card)}
                      </div>
                      <div className="mt-1 transition-all text-center min-w-0">
                        <p className="text-[7.5px] font-semibold text-slate-300 truncate">{card.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                searchResults.map(card => (
                  <div 
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url, archetype: card.archetype })}
                    onClick={() => addCardToDeck(card)}
                    onMouseEnter={() => handleCardMouseEnter(card)}
                    onMouseLeave={handleCardMouseLeave}
                    className="flex gap-3 p-2 bg-[hsl(224,25%,6%)] hover:bg-[hsl(224,22%,10%)] rounded-xl border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 transition-all duration-300 group cursor-grab active:cursor-grabbing"
                  >
                    <img 
                      src={card.image_url_small || card.image_url} 
                      alt={card.name} 
                      className="w-12 h-18 object-contain rounded-md shadow-md shadow-black/40 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-[10.5px] font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors">{card.name}</p>
                        <p className="text-[9px] text-[hsl(215,15%,70%)] truncate">
                          {card.type} • {card.archetype || 'Genérica'}
                        </p>
                      </div>
                      
                      {/* ACCIONES DE ADICIÓN */}
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'main'); }}
                          className="flex-1 py-1 px-1.5 bg-[hsl(263,85%,64%)] hover:bg-[hsl(263,85%,64%)]/80 text-white rounded-lg text-[9px] font-bold transition-all"
                          title="Añadir al Deck principal o Extra (Auto)"
                        >
                          + Agregar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'side'); }}
                          className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-lg text-[9px] font-bold transition-all"
                          title="Añadir a Side Deck"
                        >
                          + Side
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); addCardToDeck(card, 'extras'); }}
                          className="px-1.5 py-1 bg-zinc-850 hover:bg-zinc-700 text-slate-350 rounded-lg text-[9px] font-bold transition-all"
                          title="Añadir a Extras/Sugeridas"
                        >
                          + Ext
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUMNA 2: DECK EN CONSTRUCCION (Lg: 5 cols) */}
          <section className="lg:col-span-5 flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[hsl(224,15%,16%)] pb-3 shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2">
                📋 Lista de Cartas
              </h2>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Main: <b className="font-mono text-white">{mainCardsCount}</b>/{format === 'Duel Links' ? '30' : '60'}
                </span>
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Extra: <b className="font-mono text-white">{extraCardsCount}</b>/{format === 'Duel Links' ? '8' : '15'}
                </span>
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Side: <b className="font-mono text-white">{sideCardsCount}</b>/15
                </span>
                <span className="flex items-center gap-1.5 bg-[hsl(224,25%,6%)] py-1 px-2.5 rounded-lg border border-[hsl(224,15%,16%)]">
                  Extras: <b className="font-mono text-white">{extrasCardsCount}</b>/30
                </span>
              </div>
            </div>

            {/* SECCIONES SCROLLABLES */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
              
              {/* MAIN DECK */}
              <div 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => handleDropCardOnSection(e, 'main')}
                className="p-2 rounded-xl border border-transparent hover:border-[hsl(180,80%,45%)]/30 transition-colors"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(180,80%,45%)] mb-3 flex items-center gap-2">
                  • Main Deck <span className="text-[10px] lowercase text-[hsl(215,15%,70%)]">({mainCardsCount} cartas) - Arrastra aquí</span>
                </h3>
                {deckCards.filter(c => c.section === 'main').length === 0 ? (
                  <div className="text-center py-6 bg-[hsl(224,25%,6%)] rounded-xl border border-[hsl(224,15%,16%)] border-dashed text-sm text-zinc-600">
                    El Main Deck está vacío. Busca y agrega cartas desde el panel izquierdo o arrástralas aquí.
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {deckCards.filter(c => c.section === 'main').map(c => (
                      <div 
                        key={c.id} 
                        draggable
                        onDragStart={(e) => handleDragCardStart(e, { id: c.id, name: c.name, type: c.type, image_url: c.image_url, archetype: c.archetype, fromSection: 'main' })}
                        onClick={() => removeCardFromDeck(c.id, 'main')}
                        onMouseEnter={() => handleCardMouseEnter(c)}
                        onMouseLeave={handleCardMouseLeave}
                        className="relative aspect-[3/4.2] rounded-lg overflow-hidden border border-[hsl(224,15%,16%)] hover:border-red-500/50 cursor-grab active:cursor-grabbing group hover:scale-105 transition-all duration-200"
                        title={`Haz clic para quitar 1 copia de ${c.name}`}
                      >
                        <img 
                          src={c.image_url} 
                          alt={c.name} 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                        />
                        {getBanlistBadge(c)}
                        {renderCardFanCount(c.count)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* EXTRA DECK */}
              <div 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => handleDropCardOnSection(e, 'extra')}
                className="border-t border-[hsl(224,15%,16%)] pt-4 p-2 rounded-xl hover:border-purple-500/30 transition-colors"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(263,85%,64%)] mb-3 flex items-center gap-2">
                  • Extra Deck <span className="text-[10px] lowercase text-[hsl(215,15%,70%)]">({extraCardsCount} cartas) - Arrastra aquí</span>
                </h3>
                {deckCards.filter(c => c.section === 'extra').length === 0 ? (
                  <div className="text-center py-4 bg-[hsl(224,25%,6%)] rounded-xl border border-[hsl(224,15%,16%)] border-dashed text-sm text-zinc-650">
                    Sin cartas en el Extra Deck.
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {deckCards.filter(c => c.section === 'extra').map(c => (
                      <div 
                        key={c.id} 
                        draggable
                        onDragStart={(e) => handleDragCardStart(e, { id: c.id, name: c.name, type: c.type, image_url: c.image_url, archetype: c.archetype, fromSection: 'extra' })}
                        onClick={() => removeCardFromDeck(c.id, 'extra')}
                        onMouseEnter={() => handleCardMouseEnter(c)}
                        onMouseLeave={handleCardMouseLeave}
                        className="relative aspect-[3/4.2] rounded-lg overflow-hidden border border-[hsl(224,15%,16%)] hover:border-red-500/50 cursor-grab active:cursor-grabbing group hover:scale-105 transition-all duration-200"
                        title={`Haz clic para quitar 1 copia de ${c.name}`}
                      >
                        <img 
                          src={c.image_url} 
                          alt={c.name} 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                        />
                        {getBanlistBadge(c)}
                        {renderCardFanCount(c.count)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SIDE DECK */}
              <div 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => handleDropCardOnSection(e, 'side')}
                className="border-t border-[hsl(224,15%,16%)] pt-4 p-2 rounded-xl hover:border-amber-500/30 transition-colors"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-2">
                  • Side Deck <span className="text-[10px] lowercase text-[hsl(215,15%,70%)]">({sideCardsCount} cartas) - Arrastra aquí</span>
                </h3>
                {deckCards.filter(c => c.section === 'side').length === 0 ? (
                  <div className="text-center py-4 bg-[hsl(224,25%,6%)] rounded-xl border border-[hsl(224,15%,16%)] border-dashed text-sm text-zinc-650">
                    Sin cartas en el Side Deck.
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {deckCards.filter(c => c.section === 'side').map(c => (
                      <div 
                        key={c.id} 
                        draggable
                        onDragStart={(e) => handleDragCardStart(e, { id: c.id, name: c.name, type: c.type, image_url: c.image_url, archetype: c.archetype, fromSection: 'side' })}
                        onClick={() => removeCardFromDeck(c.id, 'side')}
                        onMouseEnter={() => handleCardMouseEnter(c)}
                        onMouseLeave={handleCardMouseLeave}
                        className="relative aspect-[3/4.2] rounded-lg overflow-hidden border border-[hsl(224,15%,16%)] hover:border-red-500/50 cursor-grab active:cursor-grabbing group hover:scale-105 transition-all duration-200"
                        title={`Haz clic para quitar 1 copia de ${c.name}`}
                      >
                        <img 
                          src={c.image_url} 
                          alt={c.name} 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                        />
                        {getBanlistBadge(c)}
                        {renderCardFanCount(c.count)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* EXTRAS */}
              <div 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => handleDropCardOnSection(e, 'extras')}
                className="border-t border-[hsl(224,15%,16%)] pt-4 p-2 rounded-xl hover:border-teal-500/30 transition-colors"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-2">
                  • Extras / Estrategias Sugeridas <span className="text-[10px] lowercase text-[hsl(215,15%,70%)]">({extrasCardsCount} cartas) - Arrastra aquí</span>
                </h3>
                {deckCards.filter(c => c.section === 'extras').length === 0 ? (
                  <div className="text-center py-4 bg-[hsl(224,25%,6%)] rounded-xl border border-[hsl(224,15%,16%)] border-dashed text-sm text-zinc-650">
                    Sin cartas adicionales en Extras.
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {deckCards.filter(c => c.section === 'extras').map(c => (
                      <div 
                        key={c.id} 
                        draggable
                        onDragStart={(e) => handleDragCardStart(e, { id: c.id, name: c.name, type: c.type, image_url: c.image_url, archetype: c.archetype, fromSection: 'extras' })}
                        onClick={() => removeCardFromDeck(c.id, 'extras')}
                        onMouseEnter={() => handleCardMouseEnter(c)}
                        onMouseLeave={handleCardMouseLeave}
                        className="relative aspect-[3/4.2] rounded-lg overflow-hidden border border-[hsl(224,15%,16%)] hover:border-red-500/50 cursor-grab active:cursor-grabbing group hover:scale-105 transition-all duration-200"
                        title={`Haz clic para quitar 1 copia de ${c.name}`}
                      >
                        <img 
                          src={c.image_url} 
                          alt={c.name} 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                        />
                        {getBanlistBadge(c)}
                        {renderCardFanCount(c.count)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* COLUMNA 3: DIAGNOSTICO Y RECOMENDACIONES (Lg: 3 cols) */}
          <section className="lg:col-span-3 flex flex-col gap-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-2xl p-4 overflow-hidden">
            <div className="border-b border-[hsl(224,15%,16%)] pb-2 mb-2 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[hsl(180,80%,45%)]" /> Análisis del Meta
              </h2>
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-[hsl(180,80%,45%)]" />}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block mb-1.5">Arquetipos Principales Detectados:</span>
                {detectedArchetypes.length === 0 ? (
                  <span className="text-sm font-bold text-slate-300">{inferredArchetype || 'Híbrido / Staples'}</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detectedArchetypes.map((arch) => {
                      const isActive = (activeArchetypeTab || inferredArchetype) === arch.name;
                      return (
                        <button
                          key={arch.name}
                          onClick={() => {
                            setActiveArchetypeTab(arch.name);
                            fetchSidebarBreakdown(arch.name);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60 shadow-lg shadow-purple-900/20'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <span>{arch.name}</span>
                          <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-extrabold ${isActive ? 'bg-purple-500/40 text-purple-100' : 'bg-zinc-800 text-zinc-400'}`}>
                            {arch.count}x
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BANLIST ALERTAS */}
              {banlistAlerts.length > 0 && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30">
                  <h4 className="text-xs font-bold text-red-400 flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Banlist Alert ({banlistAlerts.length})
                  </h4>
                  <div className="space-y-1 text-xs">
                    {banlistAlerts.map((alert, i) => (
                      <div key={i} className="flex justify-between border-b border-red-900/10 pb-1">
                        <span className="text-zinc-200 truncate pr-2">{alert.cardName}</span>
                        <span className="text-red-400 font-bold font-mono">{alert.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DESGLOSE DEL ARQUETIPO DETECTADO */}
              {(activeArchetypeTab || inferredArchetype) && (activeArchetypeTab || inferredArchetype) !== 'Híbrido / Staples' && (
                <div className="border-t border-[hsl(224,15%,16%)] pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center justify-between">
                    <span>📊 Desglose de {activeArchetypeTab || inferredArchetype}</span>
                    {isFetchingSidebarBreakdown && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />}
                  </h4>
                  {sidebarBreakdownCards.length === 0 ? (
                    <p className="text-xs text-zinc-650 text-center py-4">Sin datos de desglose para este arquetipo.</p>
                  ) : (
                    <div className="grid grid-cols-6 gap-x-0.5 gap-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                      {sidebarBreakdownCards.map((card) => {
                        const U = card.usage_percent;
                        const A = card.average_copies;
                        let x3 = 0, x2 = 0, x1 = 0;
                        if (A >= 2) {
                          x3 = U * (A - 2);
                          x2 = U * (3 - A);
                        } else {
                          x2 = U * (A - 1);
                          x1 = U * (2 - A);
                        }
                        const rx3 = Math.round(x3);
                        const rx2 = Math.round(x2);
                        const rx1 = Math.round(x1);
                        const rx0 = 100 - (rx3 + rx2 + rx1);

                        const hoverText = `${card.name}\nSugerencia del Meta:\n- x3 en ${rx3}%\n- x2 en ${rx2}%\n- x1 en ${rx1}%\n- x0 en ${rx0}%`;
                        const suggestedCopies = Math.round(card.average_copies);

                        return (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => handleDragCardStart(e, { id: card.id, name: card.name, type: card.type, image_url: card.image_url_small || card.image_url })}
                            onClick={() => addRecommendedCard(card.id, card.name, undefined, card)}
                            onMouseEnter={() => handleCardMouseEnter(card)}
                            onMouseLeave={handleCardMouseLeave}
                            className="relative aspect-[3/4.2] rounded-md overflow-hidden border border-zinc-800 hover:border-purple-500 hover:scale-105 transition-all duration-200 bg-zinc-950 cursor-grab active:cursor-grabbing group"
                            title={hoverText}
                          >
                            <img
                              src={card.image_url_small || card.image_url}
                              alt={card.name}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-black/85 py-0.5 text-center text-[10px] font-extrabold text-purple-300 font-mono">
                              {Math.round(card.usage_percent)}%
                            </div>
                            <div className="absolute top-0.5 left-0.5 bg-black/75 px-1 rounded text-[7px] font-mono text-slate-200">
                              {suggestedCopies}x
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PORTAPAPELES / HISTORIAL DE CARTAS */}
              <div className="border-t border-[hsl(224,15%,16%)] pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
                  🕒 Acciones Recientes
                </h4>
                {cardHistory.length === 0 ? (
                  <p className="text-xs text-zinc-650 text-center py-4">Sin acciones recientes.</p>
                ) : (
                  <div className="grid grid-cols-6 gap-x-0.5 gap-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {cardHistory.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        draggable
                        onDragStart={(e) => handleDragCardStart(e, { id: item.id, name: item.name, type: item.type, image_url: item.image_url, archetype: item.archetype })}
                        onMouseEnter={() => handleCardMouseEnter(item)}
                        onMouseLeave={handleCardMouseLeave}
                        className={`relative aspect-[3/4.2] rounded-md overflow-hidden border bg-zinc-950 cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 group ${
                          item.action === 'added' ? 'border-green-500/40 hover:border-green-400' : 'border-red-500/40 hover:border-red-400'
                        }`}
                        title={`${item.name} (${item.action === 'added' ? 'Añadida' : 'Quitada'}) - Haz clic o arrastra para agregar`}
                        onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-contain bg-zinc-900"
                          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                        />
                        {/* Pequeño indicador circular en la esquina */}
                        <div className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow ${
                          item.action === 'added' ? 'bg-green-600' : 'bg-red-650'
                        }`}>
                          {item.action === 'added' ? '+' : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        // BREAKDOWNS VIEW
        <div className="flex-1 p-6 sm:p-8 max-w-full w-full">
          {/* ARQUETIPOS META EXPLORER */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[hsl(224,15%,16%)] pb-4">
              <div>
                <h2 className="font-bold text-2xl text-slate-100 flex items-center gap-2">
                  📊 Breakdowns Competitivos
                </h2>
                <p className="text-xs text-[hsl(215,15%,70%)] mt-1">Explora arquetipos de Master Duel Meta y carga sus recetas populares en un solo clic.</p>
              </div>
              <input
                type="text"
                placeholder="Filtrar arquetipos..."
                value={archetypeSearchQuery}
                onChange={(e) => setArchetypeSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-zinc-700 focus:border-[hsl(263,85%,64%)] text-slate-100 rounded-xl text-xs focus:outline-none max-w-xs w-full"
              />
            </div>

            {isFetchingArchetypes ? (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-500">Cargando arquetipos del meta...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {archetypesList
                  .filter(a => a.name.toLowerCase().includes(archetypeSearchQuery.toLowerCase()))
                  .map((arch) => (
                    <div 
                      key={arch.name}
                      onClick={() => openArchetypeBreakdown(arch.name)}
                      className="cursor-pointer p-4 bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 rounded-2xl flex flex-col justify-between group transition-all duration-300 shadow-md"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-base text-slate-200 group-hover:text-purple-300 transition-colors">{arch.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[hsl(180,80%,45%)]/15 text-[hsl(180,80%,45%)] font-bold font-mono">
                            Tier {arch.tier}
                          </span>
                        </div>
                        <p className="text-xs text-[hsl(215,15%,70%)] mt-2 line-clamp-2">{arch.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[hsl(224,15%,16%)] flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Cartas meta: {arch.cardCount}</span>
                        <span className="text-[hsl(180,80%,45%)] font-bold group-hover:underline">Ver desglose →</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: GUARDAR DECK Y OPCIONES DE INVENTARIO */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-100 flex items-center gap-1.5">
                    <Save className="w-5 h-5 text-purple-400" />
                    Vista Previa: Guardar Deck en Inventario
                  </h3>
                  <p className="text-xs text-slate-400">Guarda la baraja en la base de datos y agrega sus cartas a tu inventario físico.</p>
                </div>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* CONTENIDO DEL MODAL */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
                {/* CONFIG DECK GENERAL */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Nombre de la Baraja</label>
                    <input
                      type="text"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-250 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Descripción / Comentarios</label>
                    <input
                      type="text"
                      value={deckDescription}
                      onChange={(e) => setDeckDescription(e.target.value)}
                      placeholder="ej: Receta TCG regional..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-250 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Formato del Deck</label>
                    <select
                      value={saveFormat}
                      onChange={(e) => setSaveFormat(e.target.value as 'Master Duel' | 'TCG' | 'Duel Links')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-250 focus:outline-none focus:border-purple-500"
                    >
                      <option value="Master Duel">Master Duel</option>
                      <option value="TCG">TCG (Formato Físico)</option>
                      <option value="Duel Links">Duel Links</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Estado Físico</label>
                    <select
                      value={saveIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setSaveIsActive(e.target.value === 'active')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-250 focus:outline-none focus:border-purple-500 font-bold text-cyan-400"
                    >
                      <option value="active">🟢 Deck Activo (Físicamente armado)</option>
                      <option value="inactive">⚪ Deck Inactivo (Receta guardada)</option>
                    </select>
                  </div>
                </div>

                {/* OPCIÓN REGISTRAR EN INVENTARIO */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={registerToInventory}
                        onChange={(e) => setRegisterToInventory(e.target.checked)}
                        className="w-4 h-4 text-purple-500 bg-slate-900 border-slate-850 rounded"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-200">Registrar cartas en el Inventario General</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Inserta copias de las cartas seleccionadas directamente a tu stock físico.</p>
                      </div>
                    </label>
                  </div>

                  {registerToInventory && (
                    <div className="pt-3 border-t border-slate-850 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] text-slate-400 mb-1 font-mono">Ubicación física destino de las cartas</label>
                          <select
                            value={targetLocationId}
                            onChange={(e) => setTargetLocationId(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300"
                          >
                            <option value="inbox">📥 Bandeja Inbox (Sin Clasificar)</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>
                                📦 {loc.name} ({loc.type.toUpperCase()})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleExcludeExisting}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-xs text-slate-950 font-bold transition-all shadow cursor-pointer shrink-0"
                            title="Desmarca automáticamente las cartas de las cuales ya tienes suficientes copias registradas en tu colección."
                          >
                            Omitir cartas ya existentes
                          </button>
                        </div>
                      </div>

                      {/* TABLA DE CARTAS A IMPORTAR */}
                      <div className="border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                              <th className="p-2 w-12 text-center">Registrar</th>
                              <th className="p-2">Carta</th>
                              <th className="p-2">Sección</th>
                              <th className="p-2 text-center">En Deck</th>
                              <th className="p-2 text-center">En Inventario</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs divide-y divide-slate-850">
                            {deckCards.map(c => {
                              const inInventory = userInventoryCounts[c.id] || 0;
                              return (
                                <tr key={`${c.id}-${c.section}`} className="hover:bg-slate-900/40">
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!!cardsToRegister[c.id]}
                                      onChange={(e) => setCardsToRegister(prev => ({ ...prev, [c.id]: e.target.checked }))}
                                      className="w-3.5 h-3.5 text-purple-650 bg-slate-900 border-slate-800"
                                    />
                                  </td>
                                  <td className="p-2 font-medium text-slate-200">{c.name}</td>
                                  <td className="p-2 text-[10px] uppercase text-slate-450">{c.section}</td>
                                  <td className="p-2 text-center font-mono font-bold text-slate-300">{c.count}x</td>
                                  <td className="p-2 text-center font-mono">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${inInventory >= c.count ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : inInventory > 0 ? 'bg-amber-950/40 text-amber-450 border border-amber-900/40' : 'bg-red-950/20 text-slate-500'}`}>
                                      {inInventory} copias
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER DEL MODAL */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDeck}
                  disabled={loadingDecks}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loadingDecks ? 'Guardando...' : 'Confirmar y Guardar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CARGAR DECK */}
      <AnimatePresence>
        {isLoadModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-100 flex items-center gap-1.5">
                    <FolderOpen className="w-5 h-5 text-purple-400" />
                    Cargar Baraja Guardada
                  </h3>
                  <p className="text-xs text-slate-400">Selecciona una baraja de tu base de datos para cargarla al constructor.</p>
                </div>
                <button
                  onClick={() => setIsLoadModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* LISTADO DE DECKS */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {loadingDecks ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                    <p className="text-xs font-mono text-slate-500">Cargando lista de barajas...</p>
                  </div>
                ) : savedDecks.length === 0 ? (
                  <div className="text-center py-12 text-zinc-550 text-sm">
                    No tienes ninguna baraja guardada en la base de datos todavía.
                  </div>
                ) : (
                  savedDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="p-4 bg-slate-950 border border-slate-850 hover:border-purple-500/40 rounded-xl flex items-center justify-between gap-4 transition-all group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-200 group-hover:text-purple-300 transition-colors">{deck.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-slate-400 font-mono">
                            {deck.format}
                          </span>
                        </div>
                        {deck.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{deck.description}</p>
                        )}
                        <p className="text-[10px] text-slate-600 font-mono mt-1.5">
                          {deck.cards?.reduce((acc: number, c: import('@/types/collection').DeckCardDetail) => acc + c.count, 0) || 0} cartas • Creado el {new Date(deck.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadDeck(deck)}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-all cursor-pointer"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/40 rounded transition-all cursor-pointer"
                          title="Eliminar deck"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAWER / PANEL LATERAL DE REEMPLAZOS */}
      <AnimatePresence>
        {activeReplacementCard && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
            <div className="absolute inset-0" onClick={() => setActiveReplacementCardId(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl p-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Sustituir Carta
                  </h3>
                  <p className="text-xs text-slate-400">Reemplazos recomendados para {activeReplacementCard.name}</p>
                </div>
                <button onClick={() => setActiveReplacementCardId(null)} className="w-8 h-8 rounded-lg hover:bg-slate-850 text-slate-300 font-bold flex items-center justify-center">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {activeReplacementsList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">No hay reemplazos cargados en caché para esta carta.</p>
                ) : (
                  activeReplacementsList.map(rep => (
                    <div 
                      key={rep.id} 
                      onMouseEnter={() => handleCardMouseEnter(rep)}
                      onMouseLeave={handleCardMouseLeave}
                      className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex gap-3"
                    >
                      <img src={rep.image_url} alt={rep.name} className="w-12 h-18 object-contain rounded" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h5 className="font-bold text-xs text-white truncate">{rep.name}</h5>
                          <span className="text-[10px] font-mono text-[hsl(180,80%,45%)] font-bold">{Math.round(rep.similarityScore * 100)}% Similitud</span>
                          <p className="text-[11px] text-slate-450 mt-1 leading-tight">{rep.reason}</p>
                        </div>
                        <button
                          onClick={() => {
                            addRecommendedCard(rep.id, rep.name);
                            removeCardFromDeck(activeReplacementCard.id, activeReplacementCard.section);
                            setActiveReplacementCardId(null);
                          }}
                          className="mt-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold"
                        >
                          Sustituir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAWER / PANEL LATERAL DE BREAKDOWN DE ARQUETIPO */}
      <AnimatePresence>
        {activeArchetypeBreakdown && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
            <div className="absolute inset-0" onClick={() => setActiveArchetypeBreakdown(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-[hsl(224,22%,10%)] border-l border-[hsl(224,15%,16%)] h-full flex flex-col z-10 shadow-2xl overflow-hidden"
            >
              {/* Encabezado */}
              <div className="p-6 border-b border-[hsl(224,15%,16%)] bg-[hsl(224,25%,6%)]/40 flex justify-between items-center relative">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[hsl(180,80%,45%)]/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                  <span className="text-[10px] text-[hsl(180,80%,45%)] font-bold uppercase tracking-widest font-mono">Master Duel Meta Breakdown</span>
                  <h3 className="font-bold text-2xl text-white uppercase tracking-tight mt-1">
                    📊 {activeArchetypeBreakdown} Breakdown
                  </h3>
                  <p className="text-xs text-[hsl(215,15%,70%)] mt-1">Recetas recopiladas de la comunidad y ratios de cartas recomendados.</p>
                  {breakdownCards.length > 0 && (
                    <button
                      onClick={() => initializeDeckFromArchetype(activeArchetypeBreakdown!, breakdownCards)}
                      className="mt-3 py-2 px-4 bg-[hsl(263,85%,64%)] hover:bg-[hsl(263,85%,64%)]/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[hsl(263,85%,64%)]/20 cursor-pointer w-full sm:w-auto"
                    >
                      🔨 Iniciar Deck con este Arquetipo
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setActiveArchetypeBreakdown(null)}
                  className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl font-bold flex items-center justify-center transition-colors text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Contenido (Desglose de Cartas) */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
                {isFetchingBreakdown ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[hsl(180,80%,45%)]" />
                    <span className="text-sm font-semibold">Cargando desglose competitivo...</span>
                  </div>
                ) : breakdownCards.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 text-sm">
                    No hay suficientes datos de recetas recopiladas para el arquetipo &quot;{activeArchetypeBreakdown}&quot; en este formato.
                  </div>
                ) : (
                  <>
                    {/* TOP MAIN DECK */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(180,80%,45%)] border-b border-[hsl(224,15%,16%)] pb-2 mb-4">
                        🃏 Top Main Deck
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {breakdownCards.filter(c => c.is_main_deck).map(item => (
                          <div 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => handleDragCardStart(e, { id: item.id, name: item.name, type: item.type, image_url: item.image_url_small || item.image_url })}
                            onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                            onMouseEnter={() => handleCardMouseEnter(item)}
                            onMouseLeave={handleCardMouseLeave}
                            className="bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(180,80%,45%)]/40 rounded-xl p-3 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden cursor-grab active:cursor-grabbing"
                          >
                            <div className="relative aspect-3/4 rounded-lg overflow-hidden shadow shadow-black/60 mb-2.5">
                              <img 
                                src={item.image_url_small || item.image_url} 
                                alt={item.name} 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-1.5 right-1.5 bg-black/85 border border-zinc-700 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                                {Math.round(item.average_copies)}x
                              </div>
                            </div>
                            <div>
                              <h5 className="font-bold text-[10px] truncate text-white" title={item.name}>{item.name}</h5>
                              <p className="text-[9px] text-[hsl(180,80%,45%)] font-bold mt-1 font-mono">{Math.round(item.usage_percent)}% de decks</p>
                              
                              <button
                                onClick={(e) => { e.stopPropagation(); addRecommendedCard(item.id, item.name, undefined, item); }}
                                className="w-full py-1.5 px-3.5 mt-2 bg-zinc-800 hover:bg-[hsl(180,80%,45%)]/20 hover:text-[hsl(180,80%,45%)] text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 border border-zinc-700 hover:border-[hsl(180,80%,45%)]/30 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TOP EXTRA DECK */}
                    <div className="mt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(263,85%,64%)] border-b border-[hsl(224,15%,16%)] pb-2 mb-4">
                        🌌 Top Extra Deck
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {breakdownCards.filter(c => !c.is_main_deck).map(item => (
                          <div 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => handleDragCardStart(e, { id: item.id, name: item.name, type: item.type, image_url: item.image_url_small || item.image_url })}
                            onClick={() => addRecommendedCard(item.id, item.name, undefined, item)}
                            onMouseEnter={() => handleCardMouseEnter(item)}
                            onMouseLeave={handleCardMouseLeave}
                            className="bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] hover:border-[hsl(263,85%,64%)]/40 rounded-xl p-3 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden cursor-grab active:cursor-grabbing"
                          >
                            <div className="relative aspect-3/4 rounded-lg overflow-hidden shadow shadow-black/60 mb-2.5">
                              <img 
                                src={item.image_url_small || item.image_url} 
                                alt={item.name} 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-1.5 right-1.5 bg-black/85 border border-zinc-700 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                                {Math.round(item.average_copies)}x
                              </div>
                            </div>
                            <div>
                              <h5 className="font-bold text-[10px] truncate text-white" title={item.name}>{item.name}</h5>
                              <p className="text-[9px] text-[hsl(263,85%,64%)] font-bold mt-1 font-mono">{Math.round(item.usage_percent)}% de decks</p>
                              
                              <button
                                onClick={(e) => { e.stopPropagation(); addRecommendedCard(item.id, item.name, undefined, item); }}
                                className="w-full py-1.5 px-3.5 mt-2 bg-zinc-800 hover:bg-[hsl(263,85%,64%)]/20 hover:text-[hsl(263,85%,64%)] text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 border border-zinc-700 hover:border-[hsl(263,85%,64%)]/30 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Agregar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE VISTA PREVIA DETALLADA (FICHA TÉCNICA) POR HOVER */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={closePreview} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,20%)] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
            >
              {/* Close Button */}
              <button 
                onClick={closePreview} 
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Columna Izquierda: Imagen y Estado Banlist */}
              <div className="md:w-5/12 bg-[hsl(224,25%,6%)] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[hsl(224,15%,16%)]">
                <div className="w-full flex-1 flex items-center justify-center min-h-[280px]">
                  {isLoadingPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      <p className="text-xs text-slate-500">Cargando imagen...</p>
                    </div>
                  ) : (
                    <img 
                      src={previewCard?.image_url || hoveredCard?.image_url || 'https://images.ygoprodeck.com/images/cards/back.jpg'} 
                      alt={previewCard?.name || hoveredCard?.name || 'Carta'} 
                      className="max-h-[320px] object-contain rounded-lg shadow-lg shadow-black/50 hover:scale-[1.02] transition-transform duration-305"
                      onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                    />
                  )}
                </div>

                {/* ID / Passcode & Banlists */}
                {!isLoadingPreview && previewCard && (
                  <div className="w-full mt-4 space-y-2.5">
                    <div className="text-[10px] text-center font-mono text-slate-500">
                      ID: #{previewCard.id}
                    </div>
                    
                    {/* Banlists Grid */}
                    <div className="grid grid-cols-3 gap-1 text-[9px] text-center font-semibold">
                      <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg flex flex-col justify-between">
                        <span className="text-slate-500 uppercase tracking-wider text-[8px] mb-1 block">TCG</span>
                        <span className={
                          previewCard.ban_tcg === 'Forbidden' ? 'text-red-400 font-bold' :
                          previewCard.ban_tcg === 'Limited' ? 'text-amber-500 font-bold' :
                          previewCard.ban_tcg === 'Semi-Limited' ? 'text-yellow-400 font-bold' :
                          'text-emerald-450 font-medium'
                        }>{previewCard.ban_tcg || 'Unlimited'}</span>
                      </div>
                      
                      <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg flex flex-col justify-between">
                        <span className="text-slate-500 uppercase tracking-wider text-[8px] mb-1 block">Master Duel</span>
                        <span className={
                          previewCard.ban_master_duel === 'Forbidden' ? 'text-red-400 font-bold' :
                          previewCard.ban_master_duel === 'Limited' ? 'text-amber-500 font-bold' :
                          previewCard.ban_master_duel === 'Semi-Limited' ? 'text-yellow-400 font-bold' :
                          'text-emerald-450 font-medium'
                        }>{previewCard.ban_master_duel || 'Unlimited'}</span>
                      </div>

                      <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg flex flex-col justify-between">
                        <span className="text-slate-500 uppercase tracking-wider text-[8px] mb-1 block">Duel Links</span>
                        <span className={
                          previewCard.ban_duel_links === 'Forbidden' ? 'text-red-400 font-bold' :
                          previewCard.ban_duel_links === 'Limited' ? 'text-amber-500 font-bold' :
                          previewCard.ban_duel_links === 'Semi-Limited' ? 'text-yellow-400 font-bold' :
                          'text-emerald-450 font-medium'
                        }>{previewCard.ban_duel_links || 'Unlimited'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Información Técnica y Acciones */}
              <div className="md:w-7/12 p-6 flex flex-col justify-between bg-slate-900/50">
                {isLoadingPreview ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                    <h4 className="text-sm font-semibold text-slate-300">Cargando Ficha Técnica...</h4>
                    <p className="text-xs text-slate-500 text-center max-w-[200px]">Consultando la base de datos de cartas...</p>
                  </div>
                ) : previewCard ? (
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    {/* Header */}
                    <div>
                      <h3 className="font-extrabold text-xl text-white tracking-wide pr-8">{previewCard.name}</h3>
                      
                      {/* Sub-header con Tipo de Carta y Arquetipo */}
                      <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${
                          previewCard.type.includes('Spell') ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                          previewCard.type.includes('Trap') ? 'bg-pink-950/40 text-pink-400 border-pink-900/50' :
                          previewCard.type.includes('Fusion') ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' :
                          previewCard.type.includes('Synchro') ? 'bg-zinc-100 text-slate-900 border-zinc-350' :
                          previewCard.type.includes('XYZ') ? 'bg-black text-amber-400 border-zinc-800' :
                          previewCard.type.includes('Link') ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' :
                          'bg-amber-950/40 text-amber-400 border-amber-900/50'
                        }`}>
                          {previewCard.type}
                        </span>
                        {previewCard.archetype && (
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9.5px] font-medium text-slate-350">
                            Arquetipo: {previewCard.archetype}
                          </span>
                        )}
                        
                        {/* Favorito Badge en el header */}
                        {favoriteCardIds.includes(previewCard.id) && (
                          <span className="flex items-center gap-1 bg-red-950/30 text-red-400 border border-red-900/40 px-2 py-0.5 rounded text-[9.5px] font-bold">
                            <Heart className="w-3 h-3 fill-red-400 text-red-400" /> Favorita
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats de Carta (si es monstruo) */}
                    {previewCard.type.includes('Monster') && (
                      <div className="grid grid-cols-2 gap-3 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] p-3 rounded-xl">
                        {/* Atributo y Estrellas */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Atributo / Nivel</p>
                          <div className="flex items-center gap-2">
                            {previewCard.attribute && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-extrabold text-slate-200 uppercase tracking-widest border border-zinc-700">
                                {previewCard.attribute}
                              </span>
                            )}
                            {previewCard.level && (
                              <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10.5px]">
                                <span>⭐</span>
                                <span className="font-mono">{previewCard.level}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ATK / DEF */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ATK / DEF</p>
                          <p className="text-[12px] font-mono font-black text-slate-100 tracking-wider">
                            ATK: <span className="text-white">{previewCard.atk !== null && previewCard.atk !== undefined ? previewCard.atk : '?'}</span>
                            {previewCard.type.includes('Link') ? (
                              <span className="text-slate-500 ml-1">/ DEF: —</span>
                            ) : (
                              <>
                                <span className="text-slate-500 ml-1">/ DEF:</span> <span className="text-white">{previewCard.def !== null && previewCard.def !== undefined ? previewCard.def : '?'}</span>
                              </>
                            )}
                          </p>
                        </div>

                        {/* Tipo de Monstruo / Subtipo */}
                        {previewCard.race && (
                          <div className="col-span-2 border-t border-slate-850/60 pt-2 space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Familia / Subtipo</p>
                            <p className="text-xs text-slate-300 font-semibold">{previewCard.race}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats de Carta (si es Magia/Trampa) */}
                    {(previewCard.type.includes('Spell') || previewCard.type.includes('Trap')) && previewCard.race && (
                      <div className="bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] p-3 rounded-xl space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Clase / Icono</p>
                        <p className="text-xs text-slate-200 font-bold uppercase tracking-wider">{previewCard.race}</p>
                      </div>
                    )}

                    {/* Descripción / Efecto */}
                    <div className="flex-1 flex flex-col min-h-[100px] max-h-[160px]">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        📝 Efecto / Descripción
                      </p>
                      <div className="flex-1 overflow-y-auto bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] p-3 rounded-xl text-xs text-slate-350 leading-relaxed font-sans scrollbar-thin">
                        {previewCard.desc}
                      </div>
                    </div>

                    {/* Mensaje de retroalimentación de acciones */}
                    {modalActionMessage && (
                      <div className={`p-2 rounded text-center text-xs font-semibold ${
                        modalActionMessage.type === 'success' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : 'bg-red-950/40 text-red-400 border border-red-900/40'
                      }`}>
                        {modalActionMessage.text}
                      </div>
                    )}

                    {/* Botones de Acciones Ficha Técnica */}
                    <div className="flex gap-2 border-t border-slate-800 pt-4 mt-auto">
                      {/* Botón: Agregar como Proxy */}
                      <button
                        onClick={() => handleAddProxy(previewCard.id)}
                        disabled={isActionLoading}
                        className="flex-1 cursor-pointer bg-purple-650 hover:bg-purple-600 disabled:bg-purple-900/30 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-950/20"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Printer className="w-3.5 h-3.5" />
                        )}
                        <span>Agregar como Proxy</span>
                      </button>

                      {/* Botón: Favorito */}
                      <button
                        onClick={() => handleToggleFavorite(previewCard.id)}
                        className={`cursor-pointer px-4 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                          favoriteCardIds.includes(previewCard.id)
                            ? 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/30'
                            : 'bg-zinc-800 border-zinc-700 text-slate-300 hover:bg-zinc-750 hover:text-white'
                        }`}
                        title={favoriteCardIds.includes(previewCard.id) ? 'Quitar de favoritas' : 'Marcar como favorita'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favoriteCardIds.includes(previewCard.id) ? 'fill-red-400 text-red-400' : 'text-slate-300'}`} />
                        <span>{favoriteCardIds.includes(previewCard.id) ? 'Favorita' : 'Favorito'}</span>
                      </button>

                      {/* Botón: Eliminar de la colección */}
                      <button
                        onClick={() => handleRemoveFromCollection(previewCard.id)}
                        disabled={isActionLoading || (userInventoryCounts[previewCard.id] || 0) === 0}
                        className="cursor-pointer bg-zinc-800 border border-zinc-700 hover:bg-red-950/40 hover:border-red-900 hover:text-red-400 disabled:bg-zinc-900/30 disabled:border-zinc-850 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-300 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                        title="Eliminar esta carta de la colección completa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar ({userInventoryCounts[previewCard.id] || 0})</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-20 text-slate-500">
                    No se encontraron detalles para esta carta.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
