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
  ArrowUpDown
} from 'lucide-react';
import { StorageLocation, UserCard, SleeveInventory, Deck } from '@/types/collection';
import { Card, HoverCardBase } from '@/components/deckbuilder/types';
import { FilterState } from '@/components/deckbuilder/CardFilters';
import { SearchPanel } from '@/components/deckbuilder/components/SearchPanel';
import { PhysicalCardPickerModal } from './PhysicalCardPickerModal';
import { getSleeveColorHex } from '@/lib/sleeves';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { usePanelResize } from '@/components/deckbuilder/hooks/usePanelResize';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';


interface UniversalContainerWorkspaceModalProps {
  isOpen: boolean;
  onClose: (hasMutated?: boolean) => void;
  location: StorageLocation | null;
  locations?: StorageLocation[];
  onSelectLocation?: (location: StorageLocation) => void;
  sleeves?: SleeveInventory[];
  decks?: Deck[];
  onDeckClick?: (deck: Deck) => void;
}

export const UniversalContainerWorkspaceModal: React.FC<UniversalContainerWorkspaceModalProps> = ({
  isOpen,
  onClose,
  location,
  locations = [],
  onSelectLocation,
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

  // Panel derecho: Carta activa para edición/inspección
  const [selectedUserCard, setSelectedUserCard] = useState<UserCard | null>(null);

  // Paginación y filtros internos del contenedor (panel central)
  const [containerSearch, setContainerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('registration_asc');
  const [activeCompartment, setActiveCompartment] = useState<number>(-1);
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

  // Cargar cartas de este contenedor específico
  const fetchCards = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      if (isIdealMode && syncData?.idealCards) {
        const physicalLocId = (location as any)?.physical_storage_location_id;
        const targetId = location?.id;

        const filtered = (syncData.idealCards as UserCard[]).filter(c => {
          if (isInbox) return !c.storage_location_id;
          return (
            c.storage_location_id === targetId ||
            (physicalLocId && c.storage_location_id === physicalLocId)
          );
        });

        setCards(filtered);
        if (selectedUserCard) {
          const fresh = filtered.find(c => c.id === selectedUserCard.id);
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
        if (selectedUserCard) {
          const fresh = data.find(c => c.id === selectedUserCard.id);
          if (fresh) setSelectedUserCard(fresh);
        }
      }
    } catch (err) {
      console.error('Error al cargar cartas del contenedor:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, isInbox, containerId, selectedUserCard, isIdealMode, syncData, location]);


  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setHasMutated(false);
        setSelectedUserCard(null);
        setSelectedSearchCard(null);
        setCurrentGridPage(1);
        setCurrentBinderViewIndex(0);
        fetchCards();
      });
    }
  }, [isOpen, location?.id, fetchCards]);

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

  // Filtrado y Ordenamiento de cartas en el panel central
  const filteredCards = useMemo(() => {
    const list = cards.filter(c => {
      const nameMatch = !containerSearch || (c.card_details?.name.toLowerCase().includes(containerSearch.toLowerCase()) ?? false);
      const statusMatch = statusFilter === 'all' || c.status_flag === statusFilter;
      const compMatch = activeCompartment === -1 || (c.compartment_index || 0) === activeCompartment;
      return nameMatch && statusMatch && compMatch;
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
  }, [cards, containerSearch, statusFilter, activeCompartment, sortBy]);

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

  // Conteo total de cartas físicas en el contenedor (sumando copias de todas las variantes)
  const totalPhysicalCards = useMemo(() => {
    return cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [cards]);

  // Paginación para la grilla basada en tarjetas únicas agrupadas
  const CARDS_PER_GRID_PAGE = 30;
  const totalGridPages = Math.max(1, Math.ceil(groupedGridCards.length / CARDS_PER_GRID_PAGE));
  const paginatedGridCards = useMemo(() => {
    const start = (currentGridPage - 1) * CARDS_PER_GRID_PAGE;
    return groupedGridCards.slice(start, start + CARDS_PER_GRID_PAGE);
  }, [groupedGridCards, currentGridPage]);

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
          
          {/* Switch de Modo: Buscar vs Importar */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 shrink-0">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setLeftTab('search')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === 'search'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar Carta</span>
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('import')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === 'import'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar Bulk</span>
              </button>
            </div>
          </div>

          {/* Contenido según el switch */}
          {leftTab === 'search' ? (
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
          ) : (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <h3 className="text-xs font-black uppercase text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar Bulk</span>
                </h3>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
                  Selecciona el método e importa múltiples cartas directamente a <strong>{isInbox ? 'Sin Clasificar' : location?.name}</strong>.
                </p>

                {/* Sub-Switch de Formato de Importación Bulk */}
                <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 gap-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setImportSubTab('ydk');
                      setImportError('');
                      setImportSuccessMsg('');
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      importSubTab === 'ydk'
                        ? 'bg-cyan-600 text-white font-black shadow-xs'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    📄 Archivo .YDK / Receta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportSubTab('id_list');
                      setImportError('');
                      setImportSuccessMsg('');
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      importSubTab === 'id_list'
                        ? 'bg-cyan-600 text-white font-black shadow-xs'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    🔢 Lista por IDs (Cantidad + ID)
                  </button>
                </div>
              </div>

              <form onSubmit={handleYdkImport} className="space-y-4">
                {/* Selector de Carril de Destino (Si el contenedor tiene varios compartimentos) */}
                {location?.compartments && location.compartments.count > 1 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl space-y-1.5 shadow-2xs">
                    <label className="text-[10.5px] font-mono font-black uppercase text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Carril / Compartimento de Destino:</span>
                    </label>
                    <select
                      value={targetCompartmentForImport}
                      onChange={(e) => setTargetCompartmentForImport(parseInt(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-purple-300 dark:border-purple-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-bold focus:border-purple-500 focus:outline-none shadow-2xs cursor-pointer"
                    >
                      {location.compartments.names.map((compName, idx) => (
                        <option key={idx} value={idx}>
                          📦 {compName || `Carril ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-purple-800 dark:text-purple-300 font-mono font-medium">
                      Las cartas importadas se asignarán a este carril.
                    </p>
                  </div>
                )}
                {importSubTab === 'ydk' ? (
                  <>
                    <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-cyan-500 rounded-2xl p-4 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
                      <input
                        type="file"
                        accept=".ydk,.txt"
                        onChange={handleFileUpload}
                        id="workspace-ydk-file"
                        className="hidden"
                      />
                      <label htmlFor="workspace-ydk-file" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-cyan-400" />
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                          {ydkFileName ? ydkFileName : 'Haz clic para seleccionar archivo .ydk'}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Formatos: .ydk, .txt</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                        O pega la receta / texto .ydk:
                      </label>
                      <textarea
                        value={ydkText}
                        onChange={(e) => setYdkText(e.target.value)}
                        placeholder="3 Ash Blossom & Joyous Spring&#10;1 Nibiru, the Primal Being&#10;2 Triple Tactics Talent"
                        rows={6}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:border-cyan-500 focus:outline-none resize-none"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Pega tu lista [Cantidad] [ID / Passcode]:
                    </label>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs text-purple-900 dark:text-purple-200 mb-2.5 font-mono space-y-1">
                      <p className="font-black text-purple-950 dark:text-purple-100">Formato aceptado:</p>
                      <p className="flex items-center gap-1">
                        • <code className="bg-purple-100 dark:bg-purple-900/60 text-purple-950 dark:text-purple-100 px-1 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-700/50">1 61280937</code>
                        <span className="text-purple-700 dark:text-purple-300 font-medium">(1x Nibiru)</span>
                      </p>
                      <p className="flex items-center gap-1">
                        • <code className="bg-purple-100 dark:bg-purple-900/60 text-purple-950 dark:text-purple-100 px-1 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-700/50">3 89631139</code>
                        <span className="text-purple-700 dark:text-purple-300 font-medium">(3x Dragón Blanco)</span>
                      </p>
                      <p className="flex items-center gap-1">
                        • <code className="bg-purple-100 dark:bg-purple-900/60 text-purple-950 dark:text-purple-100 px-1 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-700/50">05318639</code>
                        <span className="text-purple-700 dark:text-purple-300 font-medium">(1 por línea sin cantidad)</span>
                      </p>
                    </div>
                    <textarea
                      value={ydkText}
                      onChange={(e) => setYdkText(e.target.value)}
                      placeholder="1 61280937&#10;3 89631139&#10;2 05318639&#10;61280937"
                      rows={7}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-medium focus:border-cyan-500 focus:outline-none resize-none shadow-2xs placeholder-zinc-400 dark:placeholder-zinc-600"
                    />
                  </div>
                )}

                {importError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-300 font-semibold rounded-xl flex items-start gap-2 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <span className="flex-1">{importError}</span>
                  </div>
                )}

                {importSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 font-semibold rounded-xl flex items-start gap-2 shadow-2xs">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="flex-1">{importSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={importLoading || !ydkText.trim()}
                  className="w-full py-2.5 bg-linear-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando Bulk...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Importar a {isInbox ? 'Inbox' : location?.name}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
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
          
          {/* Barra Superior de Filtros y Compartimentos — En 1 Sola Línea */}
          <div className="px-3 sm:px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 flex items-center justify-between gap-2 shrink-0 flex-nowrap overflow-x-auto scrollbar-none">
            
            {/* Buscador dentro del contenedor */}
            <div className="relative flex-1 min-w-32 max-w-xs shrink">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={containerSearch}
                onChange={(e) => setContainerSearch(e.target.value)}
                placeholder="Filtrar cartas..."
                className="w-full pl-8.5 pr-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Selector de Estado y Criterio de Ordenamiento en 1 Sola Línea */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Filtro de Ordenamiento */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="registration_asc">Orden: Registro (1º → N)</option>
                  <option value="registration_desc">Orden: Recientes primero</option>
                  <option value="name_asc">Nombre (A → Z)</option>
                  <option value="name_desc">Nombre (Z → A)</option>
                  <option value="id_asc">ID Passcode (0 → 9)</option>
                  <option value="type">Tipo de Carta</option>
                </select>
              </div>

              {/* Selector de Estado */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:border-red-500 focus:outline-none shrink-0"
              >
                <option value="all">Todos los estados</option>
                <option value="collection">En Colección</option>
                <option value="trade_sale">Venta / Trade</option>
                <option value="bulk">Bulk</option>
                <option value="workshop">Taller / Activo</option>
              </select>
            </div>
          </div>

          {/* Tabs de Carriles / Compartimentos */}
          {location?.compartments && location.compartments.count > 1 && (
            <div className="px-3 sm:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/30 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[10px] font-mono font-black uppercase text-zinc-400 dark:text-zinc-500 mr-1 shrink-0 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>Carriles:</span>
              </span>

              <button
                type="button"
                onClick={() => handleSelectCompartment(-1)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeCompartment === -1
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>Todos los carriles ({totalPhysicalCards})</span>
              </button>

              {location.compartments.names.map((compName, idx) => {
                const compCount = cards.filter(c => (c.compartment_index || 0) === idx).reduce((sum, c) => sum + (c.quantity || 1), 0);
                const isActive = activeCompartment === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCompartment(idx)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Box className="w-3 h-3 text-purple-400" />
                    <span>{compName || `Carril ${idx + 1}`} ({compCount})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Banner de Click to Place para Binders */}
          <AnimatePresence>
            {selectedSearchCard && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="m-3 p-3 bg-purple-950/80 border border-purple-500/40 rounded-xl flex items-center justify-between text-xs text-purple-200 shadow-md shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>
                    Colocando <strong>{selectedSearchCard.name}</strong>. Haz clic en una casilla para ubicarla.
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSearchCard(null)}
                  className="px-2.5 py-1 rounded bg-purple-900 hover:bg-purple-800 text-purple-100 font-bold"
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
                              <span className="uppercase text-zinc-400">{uc.condition?.replace('Played', 'P') || 'NM'}</span>
                            </div>
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

        {/* ─── PANEL DERECHO: INSPECTOR Y EDICIÓN DE CARTA (REDIMENSIONABLE Y MÁS ESPACIOSO) ─── */}
        <div 
          style={!isMobile ? { width: `${panelResize.rightPanelWidth}px` } : {}}
          className={`${mobileTab === 'right' ? 'flex w-full' : 'hidden'} lg:flex shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex-col h-full overflow-y-auto p-5 z-20`}
        >
          {selectedUserCard && selectedUserCard.card_details ? (
            <div className="space-y-4.5">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
                <h3 className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-red-500" />
                  <span>Detalles de Carta</span>
                </h3>
                <button
                  onClick={() => setSelectedUserCard(null)}
                  className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Vista previa de carta */}
              <div className="flex gap-3.5 items-start bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedUserCard.card_details.image_url_small || selectedUserCard.card_details.image_url}
                  alt={selectedUserCard.card_details.name}
                  className="w-22 rounded-xl shadow-md shrink-0 border border-zinc-200 dark:border-zinc-800"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white leading-snug">
                    {selectedUserCard.card_details.name}
                  </h4>
                  <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono uppercase font-semibold">
                    {selectedUserCard.card_details.type}
                  </p>
                  {selectedUserCard.card_details.archetype && (
                    <span className="inline-block text-[9.5px] font-mono text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-2 py-0.5 rounded-md mt-1.5 font-bold">
                      {selectedUserCard.card_details.archetype}
                    </span>
                  )}
                </div>
              </div>

              {/* Formulario de propiedades con desglose de variantes */}
              <div className="space-y-4">
                {/* Desglose de Variantes y Rarezas por Copias */}
                <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    <span>Desglose de Copias ({totalCopiesInContainer} en total)</span>
                  </h4>
                </div>

                <div className="space-y-3">
                  {activeVariants.map((v, idx) => (
                    <div key={v.id} className="p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-1.5">
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
                        {/* Cantidad de copias para esta variante */}
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
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        {/* Rareza de esta variante */}
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                            Rareza:
                          </label>
                          <select
                            value={v.rarity || 'Common'}
                            onChange={(e) => handleUpdateVariantById(v.id, { rarity: e.target.value })}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-bold focus:border-purple-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Common">Common (Común)</option>
                            <option value="Rare">Rare (Rara)</option>
                            <option value="Super Rare">Super Rare</option>
                            <option value="Ultra Rare">Ultra Rare</option>
                            <option value="Secret Rare">Secret Rare</option>
                            <option value="Ultimate Rare">Ultimate Rare</option>
                            <option value="Ghost Rare">Ghost Rare</option>
                            <option value="Starlight Rare">Starlight Rare</option>
                            <option value="Collector's Rare">Collector&apos;s Rare</option>
                            <option value="Quarter Century Secret Rare">25th Quarter Century</option>
                          </select>
                        </div>
                      </div>

                      {/* Condición y Funda */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                            Condición:
                          </label>
                          <select
                            value={v.condition || 'Near Mint'}
                            onChange={(e) => handleUpdateVariantById(v.id, { condition: e.target.value as UserCard['condition'] })}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:border-purple-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Near Mint">Near Mint (NM)</option>
                            <option value="Lightly Played">Lightly Played (LP)</option>
                            <option value="Moderately Played">Moderately Played (MP)</option>
                            <option value="Heavily Played">Heavily Played (HP)</option>
                            <option value="Damaged">Damaged (DMG)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                            Funda / Sleeving:
                          </label>
                          <select
                            value={v.sleeve_type || 'none'}
                            onChange={(e) => handleUpdateVariantById(v.id, { sleeve_type: e.target.value as UserCard['sleeve_type'] })}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:border-purple-500 focus:outline-none cursor-pointer"
                          >
                            <option value="none">Sin Funda</option>
                            <option value="single">Funda Simple</option>
                            <option value="double">Funda Doble</option>
                            <option value="triple">Funda Triple</option>
                          </select>
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

                {/* Destino / Status flag */}
                <div>
                  <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Destino / Clasificación
                  </label>
                  <select
                    value={selectedUserCard.status_flag || 'collection'}
                    onChange={(e) => handleUpdateCard({ status_flag: e.target.value as UserCard['status_flag'] })}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="collection">Colección Permanente</option>
                    <option value="trade_sale">Venta / Trade</option>
                    <option value="bulk">Bulk (Sobrantes)</option>
                    <option value="workshop">Taller / Decks Activos</option>
                  </select>
                </div>

                {/* Carril / Compartimento */}
                {location?.compartments && location.compartments.count > 1 && (
                  <div>
                    <label className="text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Carril / Compartimento</span>
                    </label>
                    <select
                      value={selectedUserCard.compartment_index ?? 0}
                      onChange={(e) => handleUpdateCard({ compartment_index: parseInt(e.target.value) })}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none shadow-2xs cursor-pointer font-bold"
                    >
                      {location.compartments.names.map((compName, idx) => (
                        <option key={idx} value={idx}>
                          📦 {compName || `Carril ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mover de Contenedor */}
                <div>
                  <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Mover a Contenedor
                  </label>
                  <select
                    value={selectedUserCard.storage_location_id || 'inbox'}
                    onChange={(e) => handleMoveCard(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="inbox">📥 Bandeja Sin Clasificar (Inbox)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📦 {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
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
              </div>

              {/* Botón Eliminar */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
              <Sparkles className="w-10 h-10 mb-1 opacity-40 text-red-500" />
              <h4 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                Ninguna carta seleccionada
              </h4>
              <p className="text-[11.5px] leading-relaxed text-zinc-400 dark:text-zinc-500 max-w-xs">
                Haz clic en una carta de la grid o añade una nueva para inspeccionar y editar sus propiedades.
              </p>
            </div>
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

      </motion.div>
    </div>
  );
};
