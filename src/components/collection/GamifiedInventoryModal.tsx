'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageLocation, UserCard } from '@/types/collection';
import { X, ChevronLeft, ChevronRight, Search, Sparkles } from 'lucide-react';

interface GamifiedInventoryModalProps {
  location: StorageLocation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GamifiedInventoryModal: React.FC<GamifiedInventoryModalProps> = ({ location, isOpen, onClose }) => {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCompartment, setActiveCompartment] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);

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
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">Doble</span>;
      case 'single':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Simple</span>;
      case 'none':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400">Sin Funda</span>;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-slate-950 border border-purple-900/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          style={{
            boxShadow: `0 0 40px -10px ${location.color_code || '#8b5cf6'}30`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full animate-pulse"
                style={{ backgroundColor: location.color_code || '#8b5cf6' }}
              />
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  {location.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {location.type === 'binder' ? `Carpeta ${rows}x${cols}` : location.type.toUpperCase()}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {filteredCards.length} cartas guardadas • Capacidad: {location.capacity}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Toolbar */}
          <div className="p-3 px-6 bg-slate-900/40 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 min-w-50">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar carta en este contenedor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
              >
                <option value="all">Todos los estados</option>
                <option value="collection">Colección</option>
                <option value="trade_sale">Venta / Trade</option>
                <option value="workshop">Taller</option>
                <option value="bulk">Bulk / Crap</option>
              </select>
            </div>

            {location.type === 'deckbox' && (location.compartments?.count || 1) > 1 && (
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {Array.from({ length: location.compartments.count }, (_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCompartment(idx)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      activeCompartment === idx ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Comp {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid View */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950/90 relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-75">
                <Sparkles className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                <p className="text-sm font-mono text-slate-400">Abriendo inventario...</p>
              </div>
            ) : location.type === 'binder' ? (
              <div className="flex flex-col items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, rotateY: -15, scale: 0.98 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, rotateY: 15, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl"
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
                          className={`relative aspect-3/4 rounded-xl border flex flex-col items-center justify-center p-1 group transition-all duration-300 ${
                            userCard ? 'bg-slate-900 border-slate-700/80 cursor-pointer hover:border-purple-500 hover:scale-105 shadow-md' : 'bg-slate-950/50 border-dashed border-slate-800/60'
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
                                <div className="absolute top-1 left-1 bg-red-600 text-white font-mono text-[8px] px-1 py-0.5 rounded border border-red-500 font-bold uppercase tracking-wider shadow">
                                  Proxy
                                </div>
                              )}
                              <div className="absolute top-1 right-1 bg-slate-950/90 text-purple-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-purple-500/30">
                                {userCard.quantity}x
                              </div>
                              <div className="absolute bottom-1 left-1 right-1 flex justify-center">
                                {getSleeveBadge(userCard.sleeve_type)}
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-600">Vacío</span>
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
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-mono text-slate-300">
                    Página <strong className="text-purple-400">{currentPage}</strong> de {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight className="w-5 h-5" />
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
                      whileHover={{ scale: 1.04, y: -2 }}
                      onClick={() => setSelectedCard(userCard)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 cursor-pointer hover:border-purple-500 transition-all flex flex-col items-center relative group"
                    >
                      {userCard.card_details?.image_url ? (
                        <img
                          src={userCard.card_details.image_url_small || userCard.card_details.image_url}
                          alt={userCard.card_details.name}
                          className="w-full aspect-3/4 object-cover rounded-lg mb-2"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-3/4 bg-slate-950 rounded-lg flex items-center justify-center text-xs font-mono text-slate-500 mb-2">
                          Sin Imagen
                        </div>
                      )}
                      {userCard.is_proxy && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded border border-red-500 font-bold uppercase tracking-wider shadow">
                          Proxy
                        </div>
                      )}
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1 text-center w-full">
                        {userCard.card_details?.name || `Carta #${userCard.card_id}`}
                      </p>
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-[10px] font-mono text-purple-400">{userCard.rarity}</span>
                        <span className="text-[10px] font-mono text-slate-400">{userCard.quantity}x</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center text-slate-500 font-mono text-sm">
                    No se encontraron cartas en este contenedor.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Card Popup Details */}
          {selectedCard && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-slate-100 relative shadow-2xl">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-3 right-3 p-1 rounded hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex space-x-4 items-start">
                  {selectedCard.card_details?.image_url && (
                    <img
                      src={selectedCard.card_details.image_url}
                      alt={selectedCard.card_details.name}
                      className="w-28 rounded-lg shadow-lg border border-slate-700 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-base text-purple-300">{selectedCard.card_details?.name}</h3>
                    <div className="text-xs font-mono text-slate-400 space-y-1">
                      <p>Rareza: {selectedCard.rarity}</p>
                      <p>Condición: {selectedCard.condition}</p>
                      <p>Estado: {selectedCard.status_flag}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      {getSleeveBadge(selectedCard.sleeve_type)}
                      {selectedCard.is_proxy ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-500/20 text-red-300 border border-red-500/40">Proxy / Copia</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Física Original</span>
                      )}
                    </div>

                    {/* Checkbox de Alternar Proxy */}
                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300 flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCard.is_proxy || false}
                          onChange={() => handleToggleProxy(selectedCard)}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0 focus:ring-offset-0"
                        />
                        <span>¿Es una carta Proxy (Impresa/Placeholder)?</span>
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
