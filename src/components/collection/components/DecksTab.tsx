'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Search, Plus, Shield, Box, Eye, Trash2, ArrowUpRight, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';
import { Deck, StorageLocation, SleeveInventory } from '@/types/collection';

interface DecksTabProps {
  decks: Deck[];
  locations: StorageLocation[];
  sleeves: SleeveInventory[];
  setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  onDeckClick: (deck: Deck) => void;
  onRefreshData?: () => void;
}

/**
 * DecksTab Component
 * Main gallery view for managing all user deck recipes, physical status, 
 * formats, assigned sleeves and physical storage locations.
 */
export const DecksTab: React.FC<DecksTabProps> = ({
  decks,
  locations,
  sleeves,
  setDecks,
  onDeckClick,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'Master Duel' | 'TCG' | 'Duel Links'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'recipe'>('all');

  const filteredDecks = useMemo(() => {
    return decks.filter(deck => {
      const matchesSearch = deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFormat = formatFilter === 'all' || deck.format === formatFilter;
      
      const isActive = deck.is_active !== false;
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' 
          ? isActive 
          : !isActive;

      return matchesSearch && matchesFormat && matchesStatus;
    });
  }, [decks, searchQuery, formatFilter, statusFilter]);

  const toggleDeckActive = async (e: React.MouseEvent, deck: Deck) => {
    e.stopPropagation();
    const newActive = deck.is_active === false ? true : false;
    const previousDecks = decks;

    setDecks(prev =>
      prev.map(d => (d.id === deck.id ? { ...d, is_active: newActive } : d))
    );

    try {
      const res = await fetch('/api/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deck.id, is_active: newActive }),
      });
      if (!res.ok) {
        setDecks(previousDecks);
      }
    } catch (err) {
      setDecks(previousDecks);
      console.error('Error al actualizar estado activo del deck:', err);
    }
  };

  const getFormatBadgeColor = (format: string) => {
    switch (format) {
      case 'Master Duel':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/40';
      case 'TCG':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/40';
      case 'Duel Links':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/40';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR: BUSCADOR Y FILTROS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[hsl(224,22%,10%)] p-4 rounded-2xl border border-[hsl(224,15%,16%)]">
        <div className="relative flex-1 min-w-50">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar baraja por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[hsl(263,85%,64%)] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Formato Filter */}
          <div className="flex items-center gap-1 bg-[hsl(224,25%,6%)] p-1 rounded-xl border border-[hsl(224,15%,16%)]">
            {(['all', 'Master Duel', 'TCG', 'Duel Links'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  formatFilter === fmt
                    ? 'bg-[hsl(263,85%,64%)] text-white shadow-sm'
                    : 'text-[hsl(215,15%,70%)] hover:text-white'
                }`}
              >
                {fmt === 'all' ? 'Todos' : fmt === 'Master Duel' ? 'MD' : fmt === 'Duel Links' ? 'DL' : 'TCG'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] rounded-xl text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Estado: Todos</option>
            <option value="active">Solo Activos (Físicos)</option>
            <option value="recipe">Solo Recetas / Inactivos</option>
          </select>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[hsl(263,85%,64%)] to-[hsl(180,80%,45%)] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear en Constructor</span>
          </Link>
        </div>
      </div>

      {/* GRID DE DECKS */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-16 bg-[hsl(224,22%,10%)]/50 border border-dashed border-[hsl(224,15%,16%)] rounded-2xl p-6">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No se encontraron barajas</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {decks.length === 0
              ? 'Aún no tienes barajas guardadas en tu cuenta. Diseña una en el constructor inteligente.'
              : 'Ninguna baraja coincide con los filtros de búsqueda aplicados.'}
          </p>
          {decks.length === 0 && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[hsl(263,85%,64%)] text-white text-xs font-bold rounded-xl hover:bg-[hsl(263,85%,58%)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Construir mi primer deck</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => {
            const storedIn = locations.find(l => l.id === deck.storage_location_id);
            const totalCards = deck.cards?.reduce((acc: number, c: any) => acc + c.count, 0) || 0;
            const isActive = deck.is_active !== false;
            const formatStr = deck.format || 'TCG';

            return (
              <motion.div
                key={deck.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => onDeckClick(deck)}
                className={`relative group rounded-2xl p-5 border transition-all duration-300 shadow-md shadow-black/30 overflow-hidden cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'border-[hsl(224,15%,16%)] bg-[hsl(224,22%,10%)]/85 hover:border-purple-500/60 hover:shadow-purple-950/20'
                    : 'border-[hsl(224,15%,14%)] bg-[hsl(224,22%,8%)]/60 opacity-80 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Formato + Estado */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg border uppercase ${getFormatBadgeColor(formatStr)}`}>
                      {formatStr}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => toggleDeckActive(e, deck)}
                      className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title="Clic para cambiar entre Activo (físico armado) y Receta"
                    >
                      {isActive ? '● Activo Físico' : '○ Solo Receta'}
                    </button>
                  </div>

                  {/* Nombre y Descripción */}
                  <h3 className="font-bold text-base text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1">
                    {deck.name}
                  </h3>
                  {deck.description ? (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {deck.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 italic mt-1">
                      Sin descripción
                    </p>
                  )}

                  {/* Metadata: Cartas y Contenedor */}
                  <div className="mt-4 pt-3 border-t border-[hsl(224,15%,16%)]/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Total de Cartas:</span>
                      <span className="text-white font-bold">{totalCards} cartas</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Almacenamiento:</span>
                      {storedIn ? (
                        <span className="text-cyan-400 font-semibold flex items-center gap-1 truncate max-w-35">
                          <Box className="w-3 h-3 shrink-0" />
                          <span className="truncate">{storedIn.name}</span>
                        </span>
                      ) : (
                        <span className="text-amber-500/80 italic text-[11px]">
                          Sin asignar
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-[hsl(224,15%,16%)]/40 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {deck.id.slice(0, 8)}...
                  </span>

                  <button
                    type="button"
                    className="text-xs font-semibold text-purple-400 group-hover:text-purple-300 flex items-center gap-1"
                  >
                    <span>Ver Detalles</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
