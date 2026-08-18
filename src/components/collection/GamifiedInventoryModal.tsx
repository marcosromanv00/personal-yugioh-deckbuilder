'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageLocation, UserCard, Deck, DeckCardDetail } from '@/types/collection';
import { X, ChevronLeft, ChevronRight, Search, Sparkles, Plus } from 'lucide-react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface GamifiedInventoryModalProps {
  location: StorageLocation | null;
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  onRefreshData: () => void;
  onDeckClick?: (deck: Deck) => void;
}

export const GamifiedInventoryModal: React.FC<GamifiedInventoryModalProps> = ({
  location,
  isOpen,
  onClose,
  decks = [],
  onRefreshData,
  onDeckClick,
}) => {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCompartment, setActiveCompartment] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'decks'>('gallery');

  const fetchContainerCards = async (locationId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/collection/cards?location_id=${locationId}`);
      if (res.ok) {
        const json = await res.json();
        setCards(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar cartas del contenedor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && location) {
      const timer = setTimeout(() => {
        fetchContainerCards(location.id);
        setCurrentPage(1);
        setActiveCompartment(0);
        setViewMode('gallery');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, location]);

  const handleToggleProxy = async (userCard: UserCard) => {
    try {
      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userCard.id,
          is_proxy: !userCard.is_proxy,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.data;
        setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
        setSelectedCard(updated);
      }
    } catch (err) {
      console.error('Error al alternar estado de proxy:', err);
    }
  };

  if (!isOpen || !location) return null;

  const rows = location.grid_layout?.rows || 3;
  const cols = location.grid_layout?.cols || 3;
  const pocketsPerPage = rows * cols;

  // Filtrar cartas
  const filteredCards = cards.filter(c => {
    const nameMatch = c.card_details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const statusMatch = statusFilter === 'all' || c.status_flag === statusFilter;
    const compMatch = location.type !== 'deckbox' || c.compartment_index === activeCompartment;
    return nameMatch && statusMatch && compMatch;
  });

  // Cálculo de páginas para Binders
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pocketsPerPage));
  const currentPageCards = filteredCards.slice((currentPage - 1) * pocketsPerPage, currentPage * pocketsPerPage);

  const getSleeveBadge = (sleeveType?: string) => {
    switch (sleeveType) {
      case 'double':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">Doble</span>;
      case 'single':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40">Simple</span>;
      case 'none':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Sin Funda</span>;
    }
  };

  const associatedDecks = decks.filter(d => d.storage_location_id === location.id);
  const unassignedDecks = decks.filter(d => !d.storage_location_id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: location.color_code || '#8b5cf6' }}
              />
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{location.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono">
                    {location.type === 'binder' ? `Carpeta ${rows}x${cols}` : location.type.toUpperCase()}
                  </span>
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {filteredCards.length} cartas guardadas • Capacidad: {location.capacity}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Switch de Vista */}
          <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 px-6 py-2 bg-zinc-50/50 dark:bg-zinc-950/30">
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'gallery' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              🖼️ Galería
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              📋 Lista (Detalle)
            </button>
            <button
              onClick={() => setViewMode('decks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'decks' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              📦 Barajas Asociadas
            </button>
          </div>

          {/* Search Toolbar (solo visible en Galería y Lista) */}
          {viewMode !== 'decks' && (
            <div className="p-3 px-6 bg-zinc-50/80 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1 min-w-50">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar carta en este contenedor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <PremiumDropdown
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  size="sm"
                  options={[
                    { value: 'all', label: 'Todos los estados' },
                    { value: 'collection', label: 'Colección' },
                    { value: 'trade_sale', label: 'Venta / Trade' },
                    { value: 'workshop', label: 'Taller' },
                    { value: 'bulk', label: 'Bulk / Crap' },
                  ]}
                />
              </div>

              {location.type === 'deckbox' && (location.compartments?.count || 1) > 1 && (
                <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {Array.from({ length: location.compartments.count }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCompartment(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        activeCompartment === idx ? 'bg-purple-600 text-white font-bold' : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Comp {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-zinc-100/50 dark:bg-zinc-950/90 relative scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-75 text-center">
                <Sparkles className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                <p className="text-xs font-mono text-zinc-400">Abriendo inventario...</p>
              </div>
            ) : viewMode === 'gallery' ? (
              location.type === 'binder' ? (
                <div className="flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                        gap: '1rem',
                      }}
                    >
                      {Array.from({ length: pocketsPerPage }).map((_, slotIdx) => {
                        const userCard = currentPageCards[slotIdx];
                        return (
                          <div
                            key={slotIdx}
                            onClick={() => userCard && setSelectedCard(userCard)}
                            className={`relative aspect-3/4 rounded-xl border flex flex-col items-center justify-center p-1 group transition-all duration-200 ${
                              userCard ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-purple-500 hover:scale-105 shadow-xs' : 'bg-zinc-100/40 dark:bg-zinc-950/40 border-dashed border-zinc-300 dark:border-zinc-800'
                            }`}
                          >
                            {userCard && userCard.card_details ? (
                              <>
                                <img
                                  src={userCard.card_details.image_url_small || userCard.card_details.image_url}
                                  alt={userCard.card_details.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  loading="lazy"
                                />
                                {userCard.is_proxy && (
                                  <div className="absolute top-1 left-1 bg-amber-500 text-black font-mono text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-wider shadow-sm">
                                    Proxy
                                  </div>
                                )}
                                <div className="absolute top-1 right-1 bg-black/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                  {userCard.quantity}x
                                </div>
                                <div className="absolute bottom-1 left-1 right-1 flex justify-center">
                                  {getSleeveBadge(userCard.sleeve_type)}
                                </div>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-zinc-400">Vacío</span>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>

                  {/* Pagination */}
                  <div className="flex items-center space-x-4 mt-6">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                      Página <strong className="text-purple-600 dark:text-purple-400 font-bold">{currentPage}</strong> de {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer shadow-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Lata / Caja Scroll Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredCards.length > 0 ? (
                    filteredCards.map((userCard) => (
                      <motion.div
                        key={userCard.id}
                        whileHover={{ scale: 1.03, y: -2 }}
                        onClick={() => setSelectedCard(userCard)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 cursor-pointer hover:border-purple-500 transition-all flex flex-col items-center relative group shadow-xs"
                      >
                        {userCard.card_details?.image_url ? (
                          <img
                            src={userCard.card_details.image_url_small || userCard.card_details.image_url}
                            alt={userCard.card_details.name}
                            className="w-full aspect-3/4 object-cover rounded-xl mb-2"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full aspect-3/4 bg-zinc-100 dark:bg-zinc-950 rounded-xl flex items-center justify-center text-xs font-mono text-zinc-400 mb-2">
                            Sin Imagen
                          </div>
                        )}
                        {userCard.is_proxy && (
                          <div className="absolute top-3 left-3 bg-amber-500 text-black font-mono text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-wider shadow-sm">
                            Proxy
                          </div>
                        )}
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 text-center w-full">
                          {userCard.card_details?.name || `Carta #${userCard.card_id}`}
                        </p>
                        <div className="flex items-center justify-between w-full mt-1">
                          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">{userCard.rarity}</span>
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">{userCard.quantity}x</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-zinc-400 font-mono text-xs">
                      No se encontraron cartas en este contenedor.
                    </div>
                  )}
                </div>
              )
            ) : viewMode === 'list' ? (
              /* TABLA DE CARTAS EN MODO LISTA */
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-mono">
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Rareza</th>
                      <th className="p-3">Condición</th>
                      <th className="p-3 text-center">Cantidad</th>
                      <th className="p-3">Funda</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.length > 0 ? (
                      filteredCards.map((userCard) => (
                        <tr 
                          key={userCard.id} 
                          onClick={() => setSelectedCard(userCard)}
                          className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{userCard.card_details?.name || `Carta #${userCard.card_id}`}</td>
                          <td className="p-3 text-zinc-500 font-mono">{userCard.card_details?.type || 'Monster'}</td>
                          <td className="p-3 text-purple-600 dark:text-purple-400 font-mono font-bold">{userCard.rarity}</td>
                          <td className="p-3 text-zinc-500 font-mono">{userCard.condition}</td>
                          <td className="p-3 text-center text-zinc-900 dark:text-zinc-100 font-bold font-mono">{userCard.quantity}x</td>
                          <td className="p-3">{getSleeveBadge(userCard.sleeve_type)}</td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedCard(userCard)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold text-purple-600 dark:text-purple-300 transition-colors cursor-pointer"
                            >
                              Detalles
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-400 font-mono text-xs">
                          No se encontraron cartas en este contenedor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* BARAJAS ASOCIADAS AL CONTENEDOR */
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                    Barajas en este Contenedor
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Estas barajas están físicamente guardadas dentro de {location.name}.
                  </p>
                </div>

                {associatedDecks.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs font-mono">
                    Este contenedor no tiene barajas asignadas actualmente.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {associatedDecks.map((d) => {
                      const deckCardsCount = d.cards?.reduce((acc: number, c: DeckCardDetail) => acc + c.count, 0) || 0;
                      return (
                        <div 
                          key={d.id} 
                          onClick={() => {
                            if (onDeckClick) {
                              onDeckClick(d);
                            }
                          }}
                          className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-cyan-500 transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer group/assocDeck"
                          title="Haz clic para ver detalles del deck"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover/assocDeck:text-cyan-600 transition-colors">{d.name}</h4>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                              {d.format} • {deckCardsCount} cartas
                            </p>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await fetch('/api/decks', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: d.id, storage_location_id: null })
                                });
                                if (res.ok) {
                                  onRefreshData();
                                  fetchContainerCards(location.id);
                                }
                              } catch (err) {
                                console.error('Error al desasignar baraja:', err);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 hover:border-red-500 bg-red-50 dark:bg-red-950/20 text-[10px] font-black uppercase text-red-600 dark:text-red-400 transition-colors cursor-pointer shrink-0"
                            title="Quitar deck de este contenedor"
                          >
                            Quitar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sección para asignar nueva baraja */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Asignar Baraja Existente</span>
                  </h4>
                  {unassignedDecks.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-mono">
                      No hay barajas libres disponibles para asignar. Todas tus barajas ya tienen un contenedor asignado.
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 max-w-md">
                      <PremiumDropdown
                        value=""
                        onChange={async (deckId) => {
                          if (!deckId) return;
                          try {
                            const res = await fetch('/api/decks', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: deckId, storage_location_id: location.id }),
                            });
                            if (res.ok) {
                              onRefreshData();
                              fetchContainerCards(location.id);
                            }
                          } catch (err) {
                            console.error('Error al asignar baraja:', err);
                          }
                        }}
                        placeholder="Selecciona una baraja para almacenar aquí..."
                        align="full"
                        size="md"
                        options={[
                          ...unassignedDecks.map((d) => ({
                            value: d.id,
                            label: `${d.name} (${d.format})`,
                          })),
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Card Popup Details */}
          {selectedCard && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full text-zinc-900 dark:text-zinc-100 relative shadow-2xl">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex space-x-4 items-start">
                  {selectedCard.card_details?.image_url && (
                    <img
                      src={selectedCard.card_details.image_url}
                      alt={selectedCard.card_details.name}
                      className="w-28 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="font-black text-sm text-purple-600 dark:text-purple-400">{selectedCard.card_details?.name}</h3>
                    <div className="text-xs font-mono text-zinc-500 space-y-0.5">
                      <p>Rareza: <strong className="text-zinc-800 dark:text-zinc-200">{selectedCard.rarity}</strong></p>
                      <p>Condición: <strong className="text-zinc-800 dark:text-zinc-200">{selectedCard.condition}</strong></p>
                      <p>Estado: <strong className="text-zinc-800 dark:text-zinc-200">{selectedCard.status_flag}</strong></p>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                      {getSleeveBadge(selectedCard.sleeve_type)}
                      {selectedCard.is_proxy ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">Proxy / Copia</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">Original</span>
                      )}
                    </div>

                    {/* Checkbox de Alternar Proxy */}
                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCard.is_proxy || false}
                          onChange={() => handleToggleProxy(selectedCard)}
                          className="w-4 h-4 rounded text-red-600 cursor-pointer"
                        />
                        <span>¿Es carta Proxy (Impresa)?</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
