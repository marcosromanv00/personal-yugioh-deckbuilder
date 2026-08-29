import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, DeckCard, DeckCardPhysicalCopy, ArchetypeItem, BreakdownCardItem, BanlistAlert, Replacement, HistoryItem } from '../types';
import { FilterState } from '../CardFilters';
import { StorageLocation, SleeveInventory, DeckSleeve, Deck, UserCard } from '@/types/collection';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';

export interface YgoApiCardDetails {
  id: number;
  name: string;
  type: string;
  card_images: Array<{ image_url: string; image_url_small?: string }>;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  archetype?: string;
}

export function useDeckBuilderState() {

  const { isIdealMode, syncData } = useIdealEnvironment();

  // Formato y Deck
  const [format, setFormat] = useState<'Master Duel' | 'TCG' | 'Duel Links'>('TCG');
  const [saveFormat, setSaveFormat] = useState<'Master Duel' | 'TCG' | 'Duel Links'>('TCG');
  const [saveIsActive, setSaveIsActive] = useState<boolean>(false);
  const [deckLayoutMode, setDeckLayoutMode] = useState<'collapsed' | 'expanded'>('collapsed');
  const [deactivatedDeckIds, setDeactivatedDeckIds] = useState<string[]>([]);
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [deckName, setDeckName] = useState('Nuevo Deck TCG');
  const [isManualDeckName, setIsManualDeckName] = useState(false);
  const isManualDeckNameRef = useRef(false);
  const [deckDescription, setDeckDescription] = useState('');
  const [deckId, setDeckId] = useState<string | null>(null);
  const [searchLimit, setSearchLimit] = useState(45);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');

  const handleUpdateDeckName = (name: string, isManual = true) => {
    if (!name.trim()) {
      setIsManualDeckName(false);
      isManualDeckNameRef.current = false;
      if (detectedArchetypes.length >= 2 && detectedArchetypes[0].count >= 2 && detectedArchetypes[1].count >= 2) {
        setDeckName(`${detectedArchetypes[0].name} ${detectedArchetypes[1].name}`);
      } else if (detectedArchetypes.length >= 1) {
        setDeckName(`Deck ${detectedArchetypes[0].name}`);
      } else {
        setDeckName('Nuevo Deck TCG');
      }
      return;
    }

    setDeckName(name);
    if (isManual) {
      setIsManualDeckName(true);
      isManualDeckNameRef.current = true;
    }
  };

  const handleResetDeckName = () => {
    setIsManualDeckName(false);
    isManualDeckNameRef.current = false;
    if (detectedArchetypes.length >= 2 && detectedArchetypes[0].count >= 2 && detectedArchetypes[1].count >= 2) {
      setDeckName(`${detectedArchetypes[0].name} ${detectedArchetypes[1].name}`);
    } else if (detectedArchetypes.length >= 1) {
      setDeckName(`Deck ${detectedArchetypes[0].name}`);
    } else {
      setDeckName('Nuevo Deck TCG');
    }
  };

  // Portal de exploración (Archetype Hub)
  const [activeView, setActiveView] = useState<'builder' | 'breakdowns' | 'exordio'>('builder');
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

  // Historial de Undo / Redo para el constructor
  const [historyStack, setHistoryStack] = useState<DeckCard[][]>([]);
  const [redoStack, setRedoStack] = useState<DeckCard[][]>([]);

  // Sincronización en caliente
  const [isSyncing, setIsSyncing] = useState(false);

  // Modales de Base de Datos e Inventario
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [savedDecks, setSavedDecks] = useState<Deck[]>([]);

  const [loadingDecks, setLoadingDecks] = useState(false);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [allUserCards, setAllUserCards] = useState<UserCard[]>([]);
  const [userInventoryCounts, setUserInventoryCounts] = useState<Record<number, number>>({});
  const [userProxyCounts, setUserProxyCounts] = useState<Record<number, number>>({});
  const [targetLocationId, setTargetLocationId] = useState<string>('inbox');
  const [selectedLaneIndex, setSelectedLaneIndex] = useState<number>(0);
  const [registerToInventory, setRegisterToInventory] = useState(false);
  const [cardsToRegister, setCardsToRegister] = useState<Record<number, boolean>>({});

  // Fundas disponibles
  const [availableSleeves, setAvailableSleeves] = useState<SleeveInventory[]>([]);
  const [selectedMainSleeveId, setSelectedMainSleeveId] = useState<string>('');
  const [selectedExtraSleeveId, setSelectedExtraSleeveId] = useState<string>('');

  // Historial de cartas
  const [cardHistory, setCardHistory] = useState<HistoryItem[]>([]);

  // Vista técnica de favoritos
  const [favoriteCardIds, setFavoriteCardIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yg_favorite_cards');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing favorite cards:', e);
        }
      }
    }
    return [];
  });
  const [searchScope, setSearchScope] = useState<'global' | 'collection' | 'staged'>('global');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const handleToggleFavorite = (cardId: number) => {
    setFavoriteCardIds(prev => {
      const updated = prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId];
      localStorage.setItem('yg_favorite_cards', JSON.stringify(updated));
      return updated;
    });
  };

  const isExtraDeckCard = (cardType?: string): boolean => {
    if (!cardType) return false;
    const t = cardType.toLowerCase();
    return t.includes('fusion') || t.includes('link') || t.includes('synchro') || t.includes('xyz');
  };

  // Desglose de arquetipo en barra lateral
  const [sidebarBreakdownCards, setSidebarBreakdownCards] = useState<BreakdownCardItem[]>([]);
  const [isFetchingSidebarBreakdown, setIsFetchingSidebarBreakdown] = useState(false);

  // Registro de arquetipos sincronizados
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

  const analyzeDeck = useCallback(async (currentCards: DeckCard[], currentFormat: string) => {
    setIsAnalyzing(true);
    try {
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

        setActiveArchetypeTab(prev => {
          if (prev && detected.some(d => d.name === prev)) return prev;
          return detected.length > 0 ? detected[0].name : primaryArch;
        });

        setBanlistAlerts(json.banlistAlerts || []);
        setReplacements(json.replacements || {});

        // Precarga dinámica del nombre basada en el balance de arquetipos detectados
        if (!isManualDeckNameRef.current) {
          if (currentCards.length === 0) {
            setDeckName('Nuevo Deck TCG');
          } else if (detected.length >= 2 && detected[0].count >= 2 && detected[1].count >= 2) {
            setDeckName(`${detected[0].name} ${detected[1].name}`);
          } else if (detected.length >= 1 && detected[0].count >= 2) {
            setDeckName(`Deck ${detected[0].name}`);
          } else if (detected.length >= 1) {
            setDeckName(detected[0].name);
          } else {
            setDeckName('Nuevo Deck TCG');
          }
        }
      }
    } catch (e) {
      console.error('Error analizando deck:', e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [setDetectedArchetypes, setInferredArchetype, setActiveArchetypeTab, setBanlistAlerts, setReplacements, setDeckName]);

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
  }, [format]);

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
  }, [format, setIsFetchingArchetypes, setArchetypesList]);

  const fetchDecksAndLocations = useCallback(async () => {
    setLoadingDecks(true);
    try {
      let fetchedDecks: Deck[] = [];
      try {
        const decksRes = await fetch('/api/decks');
        if (decksRes.ok) {
          const json = await decksRes.json();
          fetchedDecks = json.data || [];
        }
      } catch (err) {
        console.warn('Advertencia consultando /api/decks:', err);
      }

      if (isIdealMode && syncData?.idealDecks) {
        fetchedDecks = [...(syncData.idealDecks as Deck[]), ...fetchedDecks];
      }
      setSavedDecks(fetchedDecks);

      try {
        const locRes = await fetch('/api/collection/storage');
        if (locRes.ok) {
          const json = await locRes.json();
          setLocations((json.data || []).filter((l: StorageLocation) => l.type === 'deckbox' || l.type === 'binder' || l.type === 'box'));
        }
      } catch (err) {
        console.warn('Advertencia consultando /api/collection/storage:', err);
      }

      try {
        const invRes = await fetch('/api/collection/cards');
        if (invRes.ok) {
          const json = await invRes.json();
          const rawCards = json.data || [];
          setAllUserCards(rawCards);
          const counts: Record<number, number> = {};
          const proxies: Record<number, number> = {};
          rawCards.forEach((uc: import('@/types/collection').UserCard) => {
            counts[uc.card_id] = (counts[uc.card_id] || 0) + (uc.quantity || 1);
            if (uc.is_proxy) {
              proxies[uc.card_id] = (proxies[uc.card_id] || 0) + (uc.quantity || 1);
            }
          });
          setUserInventoryCounts(counts);
          setUserProxyCounts(proxies);
        }
      } catch (err) {
        console.warn('Advertencia consultando /api/collection/cards:', err);
      }

      try {
        const sleevesRes = await fetch('/api/collection/sleeve-inventory');
        if (sleevesRes.ok) {
          const json = await sleevesRes.json();
          setAvailableSleeves(json.data || []);
        }
      } catch (err) {
        console.warn('Advertencia consultando fundas:', err);
      }

      if (deckId) {
        const dsRes = await fetch(`/api/decks/${deckId}/sleeves`);
        if (dsRes.ok) {
          const json = await dsRes.json();
          const assigned: DeckSleeve[] = json.data || [];
          const mainSleeve = assigned.find(a => a.section_type === 'main_side');
          const extraSleeve = assigned.find(a => a.section_type === 'extra');
          setSelectedMainSleeveId(mainSleeve?.sleeve_id || '');
          setSelectedExtraSleeveId(extraSleeve?.sleeve_id || '');
        }
      } else {
        setSelectedMainSleeveId('');
        setSelectedExtraSleeveId('');
      }
    } catch (e) {
      console.error('Error cargando decks o inventario:', e);
    } finally {
      setLoadingDecks(false);
    }
  }, [isIdealMode, syncData, deckId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchArchetypes();
      fetchDecksAndLocations();
    });
  }, [fetchArchetypes, fetchDecksAndLocations]);



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

  const executeSearch = useCallback(async (query: string, type: string, adv: FilterState, scope: 'global' | 'collection' | 'staged', favs: boolean, limitVal: number) => {
    setIsSearching(true);
    try {
      if (scope === 'collection') {
        let url = `/api/collection/cards?limit=${limitVal}`;
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
          const seen = new Set<number>();
          const mappedCards: Card[] = [];
          
          for (const uc of rawList) {
            if (!uc.card_details) continue;
            const cid = uc.card_id;
            if (seen.has(cid)) continue;
            seen.add(cid);
            const cardUserGroup = rawList.filter((x: import('@/types/collection').UserCard) => x.card_id === cid);
            mappedCards.push({
              id: cid,
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
              userCardsGroup: cardUserGroup
            });
          }
          setSearchResults(mappedCards);
        }
      } else {
        if (favs && !query && !adv.attribute && !adv.race && !adv.level && !adv.atkMin && !adv.atkMax && !adv.defMin && !adv.defMax && !adv.archetype) {
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
            
            if (favoriteCardIds.length > 0) {
              const existingIds = new Set(mappedCards.map(c => c.id));
              const missingIds = favoriteCardIds.filter(id => !existingIds.has(id));
              if (missingIds.length > 0) {
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

        let url = `/api/cards?limit=${limitVal}`;
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
            cards = cards.filter(c => favoriteCardIds.includes(c.id));
          }
          cards = cards.map(c => ({
            ...c,
            userCardsGroup: allUserCards.filter(uc => uc.card_id === c.id)
          }));
          setSearchResults(cards);
        }
      }
    } catch (e) {
      console.error('Error buscando cartas:', e);
    } finally {
      setIsSearching(false);
    }
  }, [favoriteCardIds, setIsSearching, setSearchResults]);

    const pushHistory = (currentCards: DeckCard[]) => {
      setHistoryStack(prev => [...prev.slice(-14), currentCards]);
      setRedoStack([]);
    };

    const handleUndo = useCallback(() => {
      if (historyStack.length === 0) return;
      const previous = historyStack[historyStack.length - 1];
      setRedoStack(prev => [...prev, deckCards]);
      setDeckCards(previous);
      setHistoryStack(prev => prev.slice(0, -1));
    }, [historyStack, deckCards]);

    const handleRedo = useCallback(() => {
      if (redoStack.length === 0) return;
      const next = redoStack[redoStack.length - 1];
      setHistoryStack(prev => [...prev, deckCards]);
      setDeckCards(next);
      setRedoStack(prev => prev.slice(0, -1));
    }, [redoStack, deckCards]);

    // Persistencia de Borrador en LocalStorage
    useEffect(() => {
      if (typeof window !== 'undefined') {
        if (deckCards.length > 0) {
          const draft = {
            deckName,
            deckDescription,
            format,
            deckCards,
            timestamp: Date.now()
          };
          localStorage.setItem('yg_deck_draft', JSON.stringify(draft));
        }
      }
    }, [deckCards, deckName, deckDescription, format]);



    // Exportar deck como archivo .YDK
    const exportYdkFile = useCallback(() => {
      const mainCards = deckCards.filter(c => c.section === 'main');
      const extraCards = deckCards.filter(c => c.section === 'extra');
      const sideCards = deckCards.filter(c => c.section === 'side');

      let ydkText = `#created by Yu-Gi-Oh! Deckbuilder\n#main\n`;
      mainCards.forEach(c => {
        for (let i = 0; i < c.count; i++) {
          ydkText += `${c.id}\n`;
        }
      });

      ydkText += `#extra\n`;
      extraCards.forEach(c => {
        for (let i = 0; i < c.count; i++) {
          ydkText += `${c.id}\n`;
        }
      });

      ydkText += `!side\n`;
      sideCards.forEach(c => {
        for (let i = 0; i < c.count; i++) {
          ydkText += `${c.id}\n`;
        }
      });

      const blob = new Blob([ydkText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${deckName.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'deck'}.ydk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, [deckCards, deckName]);

  const addCardToDeck = useCallback((card: Card, targetSection?: 'main' | 'extra' | 'side' | 'extras') => {
    let section: 'main' | 'extra' | 'side' | 'extras' = 'main';

    if (targetSection) {
      section = targetSection;
    } else {
      const isExtraDeckType = isExtraDeckCard(card.type);
      section = isExtraDeckType ? 'extra' : 'main';
    }

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

    pushHistory(deckCards);

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

    // Auto-asignación inteligente de copia física
    const assignedUserCardIds = new Set<string>();
    deckCards.forEach(c => {
      c.physical_copies?.forEach(pc => {
        if (pc.user_card_id) assignedUserCardIds.add(pc.user_card_id);
      });
    });

    const ownedForCard = allUserCards.filter(uc => uc.card_id === card.id);
    const availableUnassigned = ownedForCard.filter(uc => !assignedUserCardIds.has(uc.id));
    availableUnassigned.sort((a, b) => {
      const aInDeck = a.deck_id ? 1 : 0;
      const bInDeck = b.deck_id ? 1 : 0;
      return aInDeck - bInDeck;
    });

    const pickedUserCard = availableUnassigned[0];
    let newPhysicalCopy: import('../types').DeckCardPhysicalCopy;

    if (pickedUserCard) {
      const loc = locations.find(l => l.id === pickedUserCard.storage_location_id);
      const locName = loc ? loc.name : 'Inbox / Sin clasificar';
      newPhysicalCopy = {
        user_card_id: pickedUserCard.id,
        storage_location_id: pickedUserCard.storage_location_id,
        location_name: locName,
        rarity: pickedUserCard.rarity || 'Common',
        condition: pickedUserCard.condition || 'Near Mint',
        is_proxy: Boolean(pickedUserCard.is_proxy),
        is_in_active_deck: Boolean(pickedUserCard.deck_id),
        active_deck_id: pickedUserCard.deck_id || undefined,
        active_deck_name: pickedUserCard.deck_details?.name || (pickedUserCard.deck_id ? 'Deck Activo' : undefined),
        binder_page: pickedUserCard.binder_page,
        binder_slot: pickedUserCard.binder_slot,
        compartment_index: pickedUserCard.compartment_index
      };
    } else {
      newPhysicalCopy = {
        is_proxy: true,
        rarity: 'Receta / Proxy'
      };
    }

    setDeckCards(prev => {
      const existing = prev.find(c => c.id === card.id && c.section === section);
      if (existing) {
        if (existing.count >= 3) {
          alert('No puedes jugar más de 3 copias de una misma carta.');
          return prev;
        }
        const currentCopies = existing.physical_copies || [];
        return prev.map(c => (c.id === card.id && c.section === section) ? {
          ...c,
          count: c.count + 1,
          physical_copies: [...currentCopies, newPhysicalCopy]
        } : c);
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
        ban_duel_links: card.ban_duel_links,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        physical_copies: [newPhysicalCopy]
      }];
    });
  }, [format, deckCards, allUserCards, locations]);

  const removeCardFromDeck = useCallback((cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => {
    pushHistory(deckCards);

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
        const currentCopies = existing.physical_copies || [];
        return prev.map(c => (c.id === cardId && c.section === section) ? {
          ...c,
          count: c.count - 1,
          physical_copies: currentCopies.length > 1 ? currentCopies.slice(0, -1) : []
        } : c);
      }
      return prev.filter(c => !(c.id === cardId && c.section === section));
    });
  }, [deckCards]);

  const removeCopyFromDeck = useCallback((cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex: number) => {
    pushHistory(deckCards);
    setDeckCards(prev => {
      const existing = prev.find(c => c.id === cardId && c.section === section);
      if (!existing) return prev;
      if (existing.count <= 1) {
        return prev.filter(c => !(c.id === cardId && c.section === section));
      }
      const currentCopies = existing.physical_copies ? [...existing.physical_copies] : [];
      if (copyIndex >= 0 && copyIndex < currentCopies.length) {
        currentCopies.splice(copyIndex, 1);
      } else if (currentCopies.length > 0) {
        currentCopies.pop();
      }
      return prev.map(c => (c.id === cardId && c.section === section) ? {
        ...c,
        count: c.count - 1,
        physical_copies: currentCopies
      } : c);
    });
  }, [deckCards]);

  const handleUpdateCardPhysicalCopy = useCallback((
    cardId: number,
    section: 'main' | 'extra' | 'side' | 'extras',
    copyIndex: number,
    selectedUserCardId: string | 'proxy'
  ) => {
    setDeckCards(prev => {
      return prev.map(c => {
        if (c.id !== cardId || c.section !== section) return c;
        const copies = [...(c.physical_copies || [])];
        while (copies.length <= copyIndex) {
          copies.push({ is_proxy: true, rarity: 'Receta / Proxy' });
        }

        if (selectedUserCardId === 'proxy') {
          copies[copyIndex] = {
            is_proxy: true,
            rarity: 'Receta / Proxy'
          };
        } else {
          const targetUc = allUserCards.find(uc => uc.id === selectedUserCardId);
          if (targetUc) {
            const loc = locations.find(l => l.id === targetUc.storage_location_id);
            copies[copyIndex] = {
              user_card_id: targetUc.id,
              storage_location_id: targetUc.storage_location_id,
              location_name: loc ? loc.name : 'Inbox / Sin clasificar',
              rarity: targetUc.rarity || 'Common',
              condition: targetUc.condition || 'Near Mint',
              is_proxy: Boolean(targetUc.is_proxy),
              is_in_active_deck: Boolean(targetUc.deck_id),
              active_deck_id: targetUc.deck_id || undefined,
              active_deck_name: targetUc.deck_details?.name || (targetUc.deck_id ? 'Deck Activo' : undefined),
              binder_page: targetUc.binder_page,
              binder_slot: targetUc.binder_slot,
              compartment_index: targetUc.compartment_index
            };
          }
        }
        return { ...c, physical_copies: copies };
      });
    });
  }, [allUserCards, locations]);

  const handleResolveConflictAction = useCallback((
    userCardId: string,
    action: 'move_to_deck' | 'deactivate_origin'
  ) => {
    if (action === 'deactivate_origin') {
      const targetUc = allUserCards.find(uc => uc.id === userCardId);
      if (targetUc?.deck_id) {
        setDeactivatedDeckIds(prev => Array.from(new Set([...prev, targetUc.deck_id!])));
      }
    }

    setDeckCards(prev => {
      return prev.map(c => {
        if (!c.physical_copies) return c;
        const updatedCopies = c.physical_copies.map(pc => {
          if (pc.user_card_id === userCardId) {
            return {
              ...pc,
              is_in_active_deck: false,
              active_deck_id: undefined,
              active_deck_name: undefined
            };
          }
          return pc;
        });
        return { ...c, physical_copies: updatedCopies };
      });
    });
  }, [allUserCards]);

  const extractionPickList = useMemo(() => {
    interface ExtractionCardItem {
      cardId: number;
      name: string;
      rarity: string;
      count: number;
      image_url: string;
      locationDetail?: string;
      userCardId?: string;
      isInActiveDeck?: boolean;
      activeDeckId?: string;
      activeDeckName?: string;
    }

    interface ExtractionGroup {
      id: string;
      name: string;
      type: 'binder' | 'box' | 'tin' | 'deckbox' | 'drawer' | 'inbox' | 'conflict_deck' | 'global_proxy';
      colorCode?: string;
      cards: ExtractionCardItem[];
    }

    const groupsMap = new Map<string, ExtractionGroup>();

    const getOrCreateGroup = (
      id: string,
      name: string,
      type: 'binder' | 'box' | 'tin' | 'deckbox' | 'drawer' | 'inbox' | 'conflict_deck' | 'global_proxy',
      colorCode?: string
    ): ExtractionGroup => {
      if (!groupsMap.has(id)) {
        groupsMap.set(id, { id, name, type, colorCode, cards: [] });
      }
      return groupsMap.get(id)!;
    };

    deckCards.forEach(card => {
      const copies: DeckCardPhysicalCopy[] = card.physical_copies && card.physical_copies.length > 0
        ? card.physical_copies
        : Array.from({ length: card.count }).map((): DeckCardPhysicalCopy => ({ is_proxy: true, rarity: 'Receta / Proxy' }));

      copies.forEach(copy => {
        if (copy.is_proxy || !copy.user_card_id) {
          const group = getOrCreateGroup('proxies', 'Recetas Virtuales / Proxies', 'global_proxy', '#71717a');
          const existingCard = group.cards.find(c => c.cardId === card.id && c.rarity === (copy.rarity || 'Receta / Proxy'));
          if (existingCard) {
            existingCard.count += 1;
          } else {
            group.cards.push({
              cardId: card.id,
              name: card.name,
              rarity: copy.rarity || 'Receta / Proxy',
              count: 1,
              image_url: card.image_url
            });
          }
        } else if (copy.is_in_active_deck && copy.active_deck_name) {
          const groupId = `conflict-${copy.active_deck_id || 'unknown'}`;
          const group = getOrCreateGroup(groupId, `⚔️ Deck Activo: ${copy.active_deck_name}`, 'conflict_deck', '#f59e0b');
          group.cards.push({
            cardId: card.id,
            name: card.name,
            rarity: copy.rarity || 'Common',
            count: 1,
            image_url: card.image_url,
            userCardId: copy.user_card_id,
            isInActiveDeck: true,
            activeDeckId: copy.active_deck_id,
            activeDeckName: copy.active_deck_name
          });
        } else if (copy.storage_location_id) {
          const loc = locations.find(l => l.id === copy.storage_location_id);
          const group = getOrCreateGroup(
            loc?.id || copy.storage_location_id,
            loc ? `${loc.type === 'binder' ? '📁' : '📦'} ${loc.name}` : '📦 Contenedor',
            loc?.type || 'box',
            loc?.color_code || '#ef4444'
          );

          let locationDetail = '';
          if (loc?.type === 'binder' && copy.binder_page) {
            locationDetail = `Pág. ${copy.binder_page}${copy.binder_slot ? `, Ranura ${copy.binder_slot}` : ''}`;
          } else if (copy.compartment_index !== undefined) {
            locationDetail = `Carril ${copy.compartment_index + 1}`;
          }

          group.cards.push({
            cardId: card.id,
            name: card.name,
            rarity: copy.rarity || 'Common',
            count: 1,
            image_url: card.image_url,
            locationDetail,
            userCardId: copy.user_card_id
          });
        } else {
          const group = getOrCreateGroup('inbox', '📥 Inbox / Sin clasificar', 'inbox', '#3b82f6');
          group.cards.push({
            cardId: card.id,
            name: card.name,
            rarity: copy.rarity || 'Common',
            count: 1,
            image_url: card.image_url,
            userCardId: copy.user_card_id
          });
        }
      });
    });

    return Array.from(groupsMap.values());
  }, [deckCards, locations]);

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



  const handleOpenSaveModal = async () => {
    await fetchDecksAndLocations();
    const initialReg: Record<number, boolean> = {};
    deckCards.forEach(c => {
      const owned = userInventoryCounts[c.id] || 0;
      initialReg[c.id] = owned < c.count;
    });
    setCardsToRegister(initialReg);
    setSaveFormat(format);
    setIsSaveModalOpen(true);
  };

  const handleOpenLoadModal = () => {
    fetchDecksAndLocations();
    setIsLoadModalOpen(true);
  };

  const handleLoadDeck = useCallback(async (selected: Deck) => {
    setDeckId(selected.id);
    setDeckName(selected.name);
    setDeckDescription(selected.description || '');
    const fmt = selected.format;
    if (fmt === 'Master Duel' || fmt === 'TCG' || fmt === 'Duel Links') {
      setFormat(fmt);
    } else {
      setFormat('Master Duel');
    }

    const initialMappedCards: DeckCard[] = (selected.cards || []).map((dc: import('@/types/collection').DeckCardDetail) => {
      const cardDetails = dc.card_details as (Card & typeof dc.card_details);
      return {
        id: dc.card_id,
        name: cardDetails?.name || `Carta #${dc.card_id}`,
        count: dc.count,
        proxy_count: dc.proxy_count || 0,
        section: dc.section as 'main' | 'extra' | 'side' | 'extras',
        type: cardDetails?.type || 'Monster',
        image_url: cardDetails?.image_url || cardDetails?.image_url_small || `https://images.ygoprodeck.com/images/cards/${dc.card_id}.jpg`,
        ban_master_duel: cardDetails?.ban_master_duel,
        ban_tcg: cardDetails?.ban_tcg,
        ban_duel_links: cardDetails?.ban_duel_links,
        atk: cardDetails?.atk,
        def: cardDetails?.def,
        level: cardDetails?.level,
        race: cardDetails?.race,
        attribute: cardDetails?.attribute
      };
    });

    setDeckCards(initialMappedCards);
    setHistoryStack([]);
    setRedoStack([]);
    setIsLoadModalOpen(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem('yg_deck_draft', JSON.stringify({
        deckName: selected.name,
        deckDescription: selected.description || '',
        format: fmt,
        deckCards: initialMappedCards,
        timestamp: Date.now()
      }));
    }


    // Asynchronously resolve details for cards missing names or fallback image
    try {
      const missingIds = initialMappedCards.filter(c => c.name.startsWith('Carta #')).map(c => c.id);
      if (missingIds.length > 0) {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${missingIds.slice(0, 20).join(',')}`);
        if (res.ok) {
          const json = await res.json();
          const detailsList = json.data || [];
          const detailsMap = new Map<number, YgoApiCardDetails>();
          detailsList.forEach((item: YgoApiCardDetails) => detailsMap.set(item.id, item));


          setDeckCards(prev => prev.map(card => {
            const found = detailsMap.get(card.id);
            if (found) {
              return {
                ...card,
                name: found.name,
                type: found.type,
                image_url: found.card_images[0]?.image_url || card.image_url,
                atk: found.atk,
                def: found.def,
                level: found.level,
                race: found.race,
                attribute: found.attribute
              };
            }
            return card;
          }));
        }
      }
    } catch (e) {
      console.warn('Error resolviendo detalles de cartas cargadas:', e);
    }

    try {
      const dsRes = await fetch(`/api/decks/${selected.id}/sleeves`);
      if (dsRes.ok) {
        const json = await dsRes.json();
        const assigned: DeckSleeve[] = json.data || [];
        const mainSleeve = assigned.find(a => a.section_type === 'main_side');
        const extraSleeve = assigned.find(a => a.section_type === 'extra');
        setSelectedMainSleeveId(mainSleeve?.sleeve_id || '');
        setSelectedExtraSleeveId(extraSleeve?.sleeve_id || '');
        setLastSavedSnapshot(JSON.stringify({
          deckName: selected.name,
          deckDescription: selected.description || '',
          format: fmt,
          saveFormat: fmt,
          deckId: selected.id,
          selectedMainSleeveId: mainSleeve?.sleeve_id || '',
          selectedExtraSleeveId: extraSleeve?.sleeve_id || '',
          cards: initialMappedCards.map(c => ({
            id: c.id,
            count: c.count,
            section: c.section,
            proxy_count: c.proxy_count || 0,
            rarity: c.rarity,
            condition: c.condition,
          })),
        }));
      } else {
        setSelectedMainSleeveId('');
        setSelectedExtraSleeveId('');
        setLastSavedSnapshot(JSON.stringify({
          deckName: selected.name,
          deckDescription: selected.description || '',
          format: fmt,
          saveFormat: fmt,
          deckId: selected.id,
          selectedMainSleeveId: '',
          selectedExtraSleeveId: '',
          cards: initialMappedCards.map(c => ({
            id: c.id,
            count: c.count,
            section: c.section,
            proxy_count: c.proxy_count || 0,
            rarity: c.rarity,
            condition: c.condition,
          })),
        }));
      }
    } catch (e) {
      console.error('Error al cargar fundas al seleccionar deck:', e);
      setSelectedMainSleeveId('');
      setSelectedExtraSleeveId('');
    }
  }, []);

  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      deckName,
      deckDescription,
      format,
      saveFormat,
      deckId,
      selectedMainSleeveId,
      selectedExtraSleeveId,
      cards: deckCards.map(c => ({
        id: c.id,
        count: c.count,
        section: c.section,
        proxy_count: c.proxy_count || 0,
        rarity: c.rarity,
        condition: c.condition,
      })),
    });
  }, [deckName, deckDescription, format, saveFormat, deckId, selectedMainSleeveId, selectedExtraSleeveId, deckCards]);

  const isDirty = useMemo(() => {
    if (lastSavedSnapshot) {
      return currentSnapshot !== lastSavedSnapshot;
    }
    return deckCards.length > 0 || isManualDeckName;
  }, [lastSavedSnapshot, currentSnapshot, deckCards.length, isManualDeckName]);


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
          finalDeckId = null;
        }
      }

      const assignedUserCardIds: string[] = [];
      deckCards.forEach(c => {
        c.physical_copies?.forEach(pc => {
          if (pc.user_card_id && !pc.is_proxy) {
            assignedUserCardIds.push(pc.user_card_id);
          }
        });
      });

      const payload = {
        id: finalDeckId,
        name: deckName,
        description: deckDescription,
        format: saveFormat,
        is_active: saveIsActive,
        storage_location_id: targetLocationId === 'inbox' ? null : targetLocationId,
        compartment_index: targetLocationId === 'inbox' ? 0 : selectedLaneIndex,
        cards: deckCards.map(c => ({
          id: c.id,
          name: c.name,
          count: c.count,
          proxy_count: c.proxy_count || 0,
          section: c.section,
          type: c.type,
          image_url: c.image_url
        })),
        register_to_inventory: registerToInventory,
        inventory_cards_to_add: cardsToRegisterList.map(c => {
          const owned = userInventoryCounts[c.id] || 0;
          const deficit = Math.max(1, c.count - owned);
          return {
            id: c.id,
            count: deficit
          };
        }),
        assigned_user_card_ids: assignedUserCardIds,
        deactivated_deck_ids: deactivatedDeckIds
      };

      const res = await fetch('/api/decks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        const savedDeckId = finalDeckId || json.data?.id;

        if (method === 'POST' && json.data?.id) {
          setDeckId(json.data.id);
        }

        if (savedDeckId) {
          try {
            if (selectedMainSleeveId) {
              const msRes = await fetch(`/api/decks/${savedDeckId}/sleeves`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sleeve_id: selectedMainSleeveId, section_type: 'main_side' })
              });
              if (!msRes.ok) {
                const err = await msRes.json();
                console.warn('Advertencia al asignar funda de Main Deck:', err.error);
              }
            } else {
              await fetch(`/api/decks/${savedDeckId}/sleeves?section_type=main_side`, { method: 'DELETE' });
            }

            if (selectedExtraSleeveId) {
              const esRes = await fetch(`/api/decks/${savedDeckId}/sleeves`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sleeve_id: selectedExtraSleeveId, section_type: 'extra' })
              });
              if (!esRes.ok) {
                const err = await esRes.json();
                console.warn('Advertencia al asignar funda de Extra Deck:', err.error);
              }
            } else {
              await fetch(`/api/decks/${savedDeckId}/sleeves?section_type=extra`, { method: 'DELETE' });
            }
          } catch (sleeveErr) {
            console.error('Error al guardar asociación de fundas:', sleeveErr);
          }
        }

        setLastSavedSnapshot(JSON.stringify({
          deckName,
          deckDescription,
          format: saveFormat,
          saveFormat,
          deckId: savedDeckId,
          selectedMainSleeveId,
          selectedExtraSleeveId,
          cards: deckCards.map(c => ({
            id: c.id,
            count: c.count,
            section: c.section,
            proxy_count: c.proxy_count || 0,
            rarity: c.rarity,
            condition: c.condition,
          })),
        }));

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
          setLastSavedSnapshot('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearDeck = () => {
    setDeckCards([]);
    setDeckId(null);
    setDeckName('Nuevo Deck TCG');
    setIsManualDeckName(false);
    isManualDeckNameRef.current = false;
    setSelectedMainSleeveId('');
    setSelectedExtraSleeveId('');
    setLastSavedSnapshot('');
  };

  const handleExcludeExisting = () => {
    const updated = { ...cardsToRegister };
    deckCards.forEach(c => {
      const inInventory = userInventoryCounts[c.id] || 0;
      if (inInventory >= c.count) {
        updated[c.id] = false;
      }
    });
    setCardsToRegister(updated);
  };

  const handleImportYdkOrBulk = async (rawInput: string) => {
    if (!rawInput.trim()) return;

    const lines = rawInput.split(/\r?\n/);
    let currentSection: 'main' | 'extra' | 'side' = 'main';
    const parsedEntries: Array<{ cardId: number; section: 'main' | 'extra' | 'side' }> = [];
    let hasSectionHeader = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('#main')) {
        currentSection = 'main';
        hasSectionHeader = true;
        return;
      }
      if (trimmed.startsWith('#extra')) {
        currentSection = 'extra';
        hasSectionHeader = true;
        return;
      }
      if (trimmed.startsWith('!side') || trimmed.startsWith('#side')) {
        currentSection = 'side';
        hasSectionHeader = true;
        return;
      }
      if (trimmed.startsWith('#') || trimmed.startsWith('!')) {
        return;
      }

      const matches = trimmed.match(/\d+/g);
      if (matches) {
        matches.forEach(m => {
          const id = parseInt(m, 10);
          if (id > 0) {
            parsedEntries.push({ cardId: id, section: currentSection });
          }
        });
      }
    });

    if (parsedEntries.length === 0) {
      throw new Error('No se encontraron IDs de cartas válidas en el texto proporcionado.');
    }

    const uniqueIds = Array.from(new Set(parsedEntries.map(e => e.cardId)));
    const detailsMap = new Map<number, Record<string, unknown>>();

    for (let i = 0; i < uniqueIds.length; i += 30) {
      const chunk = uniqueIds.slice(i, i + 30);
      try {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${chunk.join(',')}`);
        if (res.ok) {
          const json = await res.json();
          (json.data || []).forEach((item: Record<string, unknown>) => {
            if (typeof item.id === 'number') {
              detailsMap.set(item.id, item);
            }
          });
        }
      } catch (e) {
        console.warn('Error resolviendo lote de IDs en YGOPRODeck:', e);
      }
    }

    const countsMap = new Map<string, { cardId: number; count: number; section: 'main' | 'extra' | 'side' }>();
    parsedEntries.forEach(entry => {
      const details = detailsMap.get(entry.cardId);
      let section = entry.section;

      if (!hasSectionHeader && details) {
        const type = (details.type as string)?.toLowerCase() || '';
        const isExtra = type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link');
        section = isExtra ? 'extra' : 'main';
      }

      const key = `${entry.cardId}_${section}`;
      const existing = countsMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        countsMap.set(key, { cardId: entry.cardId, count: 1, section });
      }
    });

    const newMappedCards: DeckCard[] = Array.from(countsMap.values()).map(item => {
      const found = detailsMap.get(item.cardId);
      const images = found?.card_images as Array<{ image_url: string }> | undefined;
      return {
        id: item.cardId,
        name: (found?.name as string) || `Carta #${item.cardId}`,
        count: item.count,
        proxy_count: 0,
        section: item.section,
        type: (found?.type as string) || 'Monster',
        image_url: images?.[0]?.image_url || `https://images.ygoprodeck.com/images/cards/${item.cardId}.jpg`,
        atk: found?.atk as number | undefined,
        def: found?.def as number | undefined,
        level: found?.level as number | undefined,
        race: found?.race as string | undefined,
        attribute: found?.attribute as string | undefined
      };
    });

    setDeckCards(newMappedCards);
    setHistoryStack([]);
    setRedoStack([]);
    setDeckId(null);
    setDeckName('Deck Importado YDK / Bulk');

    if (typeof window !== 'undefined') {
      localStorage.setItem('yg_deck_draft', JSON.stringify({
        deckName: 'Deck Importado YDK / Bulk',
        format: format,
        deckCards: newMappedCards,
        timestamp: Date.now()
      }));
    }
  };


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const loadDeckId = params.get('loadDeckId');
      const loadDraft = params.get('loadDraft');

      if (loadDraft) {
        const rawDraft = localStorage.getItem('yg_deck_draft');
        if (rawDraft) {
          try {
            const draft = JSON.parse(rawDraft);
            if (Array.isArray(draft.deckCards) && draft.deckCards.length > 0) {
              queueMicrotask(() => {
                setDeckId(null);
                setDeckCards(draft.deckCards);
                if (draft.deckName) {
                  setDeckName(draft.deckName);
                  setIsManualDeckName(true);
                  isManualDeckNameRef.current = true;
                }
                if (draft.format) setFormat(draft.format);
                if (draft.deckDescription) setDeckDescription(draft.deckDescription);
                setHistoryStack([]);
                setRedoStack([]);
              });
            }
          } catch (e) {
            console.error('Error cargando borrador desde query param:', e);
          }
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else if (loadDeckId) {
        fetch('/api/decks')
          .then(res => res.json())
          .then(json => {
            const selected = (json.data || []).find((d: Deck) => d.id === loadDeckId);
            if (selected) {
              handleLoadDeck(selected);
              // Clean up the URL search params so it doesn't trigger again
              const newUrl = window.location.pathname;
              window.history.replaceState({}, '', newUrl);
            }
          })
          .catch(err => console.error('Error loading deck from query param:', err));
      }
    }
  }, [handleLoadDeck]);


  return {
    format,
    setFormat,
    saveFormat,
    setSaveFormat,
    saveIsActive,
    setSaveIsActive,
    deckCards,
    setDeckCards,
    deckName,
    setDeckName,
    handleUpdateDeckName,
    handleResetDeckName,
    isManualDeckName,
    deckDescription,
    setDeckDescription,
    deckId,
    setDeckId,
    searchLimit,
    setSearchLimit,
    activeView,
    setActiveView,
    archetypesList,
    isFetchingArchetypes,
    archetypeSearchQuery,
    setArchetypeSearchQuery,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    isSearching,
    searchViewMode,
    setSearchViewMode,
    advancedFilters,
    setAdvancedFilters,
    inferredArchetype,
    detectedArchetypes,
    activeArchetypeTab,
    setActiveArchetypeTab,
    banlistAlerts,
    replacements,
    isAnalyzing,
    activeReplacementCardId,
    setActiveReplacementCardId,
    isSyncing,
    isSaveModalOpen,
    setIsSaveModalOpen,
    isLoadModalOpen,
    setIsLoadModalOpen,
    savedDecks,
    loadingDecks,
    locations,
    allUserCards,
    userInventoryCounts,
    setUserInventoryCounts,
    userProxyCounts,
    setUserProxyCounts,
    targetLocationId,
    setTargetLocationId,
    selectedLaneIndex,
    setSelectedLaneIndex,
    registerToInventory,
    setRegisterToInventory,
    cardsToRegister,
    setCardsToRegister,
    availableSleeves,
    selectedMainSleeveId,
    setSelectedMainSleeveId,
    selectedExtraSleeveId,
    setSelectedExtraSleeveId,
    cardHistory,
    favoriteCardIds,
    handleToggleFavorite,
    searchScope,
    setSearchScope,
    onlyFavorites,
    setOnlyFavorites,
    sidebarBreakdownCards,
    isFetchingSidebarBreakdown,
    activeArchetypeBreakdown,
    setActiveArchetypeBreakdown,
    breakdownCards,
    isFetchingBreakdown,
    syncedArchetypes,
    setSyncedArchetypes,
    fetchSidebarBreakdown,
    analyzeDeck,
    triggerSync,
    openArchetypeBreakdown,
    initializeDeckFromArchetype,
    deckLayoutMode,
    setDeckLayoutMode,
    deactivatedDeckIds,
    setDeactivatedDeckIds,
    handleUpdateCardPhysicalCopy,
    handleResolveConflictAction,
    removeCopyFromDeck,
    extractionPickList,
    executeSearch,
    addCardToDeck,
    removeCardFromDeck,
    addRecommendedCard,
    handleOpenSaveModal,
    handleOpenLoadModal,
    handleLoadDeck,
    handleSaveDeck,
    handleDeleteDeck,
    handleClearDeck,
    handleExcludeExisting,
    handleImportYdkOrBulk,
    handleUndo,
    handleRedo,
    canUndo: historyStack.length > 0,
    canRedo: redoStack.length > 0,
    exportYdkFile,
    isDirty,
    currentSnapshot,
    lastSavedSnapshot,
    setLastSavedSnapshot,
  };
}
