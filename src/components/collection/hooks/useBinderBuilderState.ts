import { useState, useEffect, useCallback } from 'react';
import { StorageLocation, UserCard } from '@/types/collection';
import { Card, SearchScope } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';

export function useBinderBuilderState(binderId: string) {
  // Estados de la Binder
  const [binder, setBinder] = useState<StorageLocation | null>(null);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentViewIndex, setCurrentViewIndex] = useState(0); // 0 = Portada/Pág 1, 1 = Pág 2/Pág 3, etc.

  // Estados de Búsqueda (Idénticos al Deck Builder)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra'>('All');
  const [searchScope, setSearchScope] = useState<SearchScope>('global');
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
    status: ''
  });

  // Click-to-place
  const [selectedSearchCard, setSelectedSearchCard] = useState<Card | null>(null);

  // 1. Cargar detalles del binder
  const fetchBinderDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/collection/storage?id=${binderId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setBinder(json.data);
        } else {
          console.error('Binder no encontrado');
        }
      }
    } catch (err) {
      console.error('Error al cargar detalles de la binder:', err);
    }
  }, [binderId]);

  // 2. Cargar cartas de la binder
  const fetchBinderCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/collection/cards?location_id=${binderId}`);
      if (res.ok) {
        const json = await res.json();
        setCards(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar cartas de la binder:', err);
    }
  }, [binderId]);

  // Carga inicial
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchBinderDetails(), fetchBinderCards()]);
      setLoading(false);
    };
    if (binderId) {
      init();
    }
  }, [binderId, fetchBinderDetails, fetchBinderCards]);

  // 3. Ejecutar búsqueda
  const executeSearch = useCallback(async (
    query: string,
    type: string,
    adv: FilterState,
    scope: SearchScope,
    favs: boolean,
    limitVal: number
  ) => {
    setIsSearching(true);
    try {
      if (scope === 'staged') {
        // Filtrar en memoria las cartas asociadas a esta binder que no tienen posición asignada
        const rawList = cards.filter(uc => !uc.binder_page || !uc.binder_slot);
        let filtered = rawList;

        if (query) {
          const qLower = query.toLowerCase();
          filtered = filtered.filter(uc => uc.card_details?.name.toLowerCase().includes(qLower));
        }

        const typeToUse = type !== 'All' ? type : adv.type;
        if (typeToUse) {
          filtered = filtered.filter(uc => {
            const cardType = uc.card_details?.type || '';
            if (typeToUse === 'Monster') return cardType.includes('Monster') && !cardType.includes('Fusion') && !cardType.includes('Synchro') && !cardType.includes('XYZ') && !cardType.includes('Link');
            if (typeToUse === 'Spell') return cardType.includes('Spell');
            if (typeToUse === 'Trap') return cardType.includes('Trap');
            if (typeToUse === 'Extra') return cardType.includes('Fusion') || cardType.includes('Synchro') || cardType.includes('XYZ') || cardType.includes('Link');
            return true;
          });
        }

        const seen = new Set<number>();
        const mappedCards: Card[] = [];
        for (const uc of filtered) {
          if (!uc.card_id) continue;
          if (seen.has(uc.card_id)) continue;
          seen.add(uc.card_id);
          mappedCards.push({
            id: uc.card_id,
            name: uc.card_details?.name || 'Carta sin detalles',
            type: uc.card_details?.type || 'Monster',
            desc: uc.card_details?.desc || '',
            image_url: uc.card_details?.image_url || '',
            image_url_small: uc.card_details?.image_url_small || '',
            archetype: uc.card_details?.archetype || undefined,
            ban_master_duel: 'Unlimited',
            ban_tcg: 'Unlimited',
            ban_duel_links: 'Unlimited',
            atk: uc.card_details?.atk,
            def: uc.card_details?.def,
            level: uc.card_details?.level,
            race: uc.card_details?.race,
            attribute: uc.card_details?.attribute,
          });
        }

        setSearchResults(mappedCards);
        setIsSearching(false);
      } else if (scope === 'collection') {
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
        } else {
          setSearchResults([]);
        }
      } else {
        // Búsqueda global a través de la API local
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
          const rawList = json.data || [];
          const seen = new Set<number>();
          const mappedCards: Card[] = [];
          for (const card of rawList) {
            if (!card.id) continue;
            if (seen.has(card.id)) continue;
            seen.add(card.id);
            mappedCards.push(card);
          }
          setSearchResults(mappedCards);
        } else {
          setSearchResults([]);
        }
      }
    } catch (e) {
      console.error('Error buscando cartas:', e);
    } finally {
      setIsSearching(false);
    }
  }, [cards]);

  // Ejecutar búsqueda con debounce al cambiar parámetros
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType, advancedFilters, searchScope, onlyFavorites, searchLimit, executeSearch]);

  // 4. Asignar carta a un slot de la binder (page, slot)
  const addCardToSlot = useCallback(async (card: Card, page: number, slot: number) => {
    try {

      if (searchScope === 'staged') {
        // Buscar carta local que está staged (sin página ni slot en este binder)
        const stagedCard = cards.find(uc => uc.card_id === card.id && (!uc.binder_page || !uc.binder_slot));
        if (stagedCard) {
          const updateRes = await fetch('/api/collection/cards', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: stagedCard.id,
              binder_page: page,
              binder_slot: slot,
            }),
          });
          if (updateRes.ok) {
            await fetchBinderCards();
          }
        }
      } else if (searchScope === 'global') {
        // Base global -> registrar nueva carta en la colección física en esta ubicación
        const res = await fetch('/api/collection/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_id: card.id,
            storage_location_id: binderId,
            quantity: 1,
            rarity: 'Common',
            condition: 'Near Mint',
            language: 'es',
            status_flag: 'collection',
            sleeve_type: 'none',
          }),
        });
        if (res.ok) {
          const json = await res.json();
          // Actualizar el slot en el registro insertado
          if (json.data && json.data.id) {
            await fetch('/api/collection/cards', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: json.data.id,
                binder_page: page,
                binder_slot: slot,
              }),
            });
          }
          await fetchBinderCards();
        }
      } else {
        // Mi colección -> buscar si hay copias disponibles en el inbox u otros contenedores
        const res = await fetch(`/api/collection/cards?q=${encodeURIComponent(card.name)}`);
        if (res.ok) {
          const json = await res.json();
          const ownedList: UserCard[] = json.data || [];
          
          // Buscar una que no esté en binder_page o que esté en el inbox
          const freeCard = ownedList.find(uc => 
            uc.card_id === card.id && 
            (!uc.storage_location_id || uc.storage_location_id !== binderId || !uc.binder_page)
          );

          if (freeCard) {
            const updateRes = await fetch('/api/collection/cards', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: freeCard.id,
                storage_location_id: binderId,
                binder_page: page,
                binder_slot: slot,
              }),
            });
            if (updateRes.ok) {
              await fetchBinderCards();
            }
          } else {
            alert(`No tienes copias disponibles de "${card.name}" sin ubicar en tu colección. Cambia a 'Base Global' para registrar una nueva copia.`);
          }
        }
      }
    } catch (err) {
      console.error('Error al asignar carta a ranura:', err);
    }
  }, [searchScope, cards, binderId, fetchBinderCards]);

  // 5. Desasignar carta (liberar bolsillo, mover a Pendientes de esta Binder)
  const removeCardFromSlot = useCallback(async (userCardId: string) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCardId,
          binder_page: null,
          binder_slot: null,
        }),
      });
      if (res.ok) {
        setCards(prev => prev.map(c => c.id === userCardId ? { ...c, binder_page: undefined, binder_slot: undefined } : c));
      }
    } catch (err) {
      console.error('Error al desasignar carta a pendientes:', err);
    }
  }, []);

  // Mover carta al Inbox general (sacar del binder por completo)
  const moveCardToInbox = useCallback(async (userCardId: string) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCardId,
          storage_location_id: null,
          binder_page: null,
          binder_slot: null,
        }),
      });
      if (res.ok) {
        setCards(prev => prev.filter(c => c.id !== userCardId));
      }
    } catch (err) {
      console.error('Error al mover carta al inbox:', err);
    }
  }, []);

  // 6. Eliminar carta de la colección permanentemente
  const deleteCardFromCollection = useCallback(async (userCardId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta carta de tu colección física permanentemente?')) return;
    try {
      const res = await fetch(`/api/collection/cards?id=${userCardId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCards(prev => prev.filter(c => c.id !== userCardId));
      }
    } catch (err) {
      console.error('Error al eliminar carta permanentemente:', err);
    }
  }, []);

  // 7. Actualizar metadatos de la carta (rareza, fundas, cantidad, is_proxy)
  const updateCardInSlot = useCallback(async (userCardId: string, updates: Partial<UserCard>) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCardId,
          ...updates,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.data;
        if (updated) {
          setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
        }
      }
    } catch (err) {
      console.error('Error al actualizar carta en ranura:', err);
    }
  }, []);

  return {
    binderId,
    binder,
    cards,
    loading,
    currentViewIndex,
    setCurrentViewIndex,

    // Buscador
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

    // Click to place
    selectedSearchCard,
    setSelectedSearchCard,

    // Lógica Binder
    addCardToSlot,
    removeCardFromSlot,
    moveCardToInbox,
    deleteCardFromCollection,
    updateCardInSlot,
  };
}
