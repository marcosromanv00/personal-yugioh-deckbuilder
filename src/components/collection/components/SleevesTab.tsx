'use client';

import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, 
  Search, 
  Plus, 
  Shield, 
  Filter, 
  RotateCcw,
  Sparkles,
  PackageCheck,
  PackageOpen
} from 'lucide-react';
import { SleeveInventory, SleeveSizeType, SleeveInventoryCondition, UserCard, Deck, StorageLocation } from '@/types/collection';
import { SleeveInventoryCard, AddSleeveCard } from '../SleeveInventoryCard';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { SleeveDetailModal } from './SleeveDetailModal';

interface SleevesTabProps {
  loadingSleeves: boolean;
  sleeves: SleeveInventory[];
  allUserCards?: UserCard[];
  decks?: Deck[];
  locations?: StorageLocation[];
  setEditingSleeve: (s: SleeveInventory | null) => void;
  setIsSleeveFormOpen: (open: boolean) => void;
  handleDeleteSleeve: (sleeve: SleeveInventory) => Promise<void>;
  onAddStock?: (sleeve: SleeveInventory) => void;
  onAddSleeveClick?: () => void;
}

/**
 * SleevesTab Component
 * Renders complete utilities toolbar, search, size/availability filters,
 * sleeve grid and individual cards tracking detail modal.
 */
export const SleevesTab: React.FC<SleevesTabProps> = ({
  loadingSleeves,
  sleeves,
  allUserCards = [],
  decks = [],
  locations = [],
  setEditingSleeve,
  setIsSleeveFormOpen,
  handleDeleteSleeve,
  onAddStock,
  onAddSleeveClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<'all' | SleeveSizeType>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'in_use' | 'out_of_stock'>('all');
  const [conditionFilter, setConditionFilter] = useState<'all' | SleeveInventoryCondition>('all');

  // Estado para el modal de tracking y detalle de cartas
  const [selectedSleeveForDetail, setSelectedSleeveForDetail] = useState<SleeveInventory | null>(null);

  // Filtrado reactivo de inventario de fundas
  const filteredSleeves = useMemo(() => {
    return sleeves.filter((sleeve) => {
      // 1. Buscador de texto
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sleeve.name.toLowerCase().includes(q) ||
        sleeve.brand.toLowerCase().includes(q) ||
        sleeve.color_pattern.toLowerCase().includes(q) ||
        (sleeve.notes && sleeve.notes.toLowerCase().includes(q));

      // 2. Filtro de tamaño
      const matchesSize = sizeFilter === 'all' || sleeve.size_type === sizeFilter;

      // 3. Filtro de disponibilidad
      const available = sleeve.quantity_available ?? Math.max(0, (sleeve.quantity_total || 0) - (sleeve.quantity_used || 0));
      let matchesAvailability = true;
      if (availabilityFilter === 'available') {
        matchesAvailability = available > 0;
      } else if (availabilityFilter === 'in_use') {
        matchesAvailability = (sleeve.quantity_used || 0) > 0;
      } else if (availabilityFilter === 'out_of_stock') {
        matchesAvailability = available === 0;
      }

      // 4. Filtro de condición
      const matchesCondition = conditionFilter === 'all' || sleeve.condition === conditionFilter;

      return matchesSearch && matchesSize && matchesAvailability && matchesCondition;
    });
  }, [sleeves, searchQuery, sizeFilter, availabilityFilter, conditionFilter]);

  // Contadores globales de inventario de fundas
  const totalSleevesCount = useMemo(() => {
    return sleeves.reduce((acc, s) => acc + (s.quantity_total || 0), 0);
  }, [sleeves]);

  const totalUsedSleeves = useMemo(() => {
    return sleeves.reduce((acc, s) => acc + (s.quantity_used || 0), 0);
  }, [sleeves]);

  const hasActiveFilters = searchQuery !== '' || sizeFilter !== 'all' || availabilityFilter !== 'all' || conditionFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSizeFilter('all');
    setAvailabilityFilter('all');
    setConditionFilter('all');
  };

  const handleOpenAdd = () => {
    if (onAddSleeveClick) {
      onAddSleeveClick();
    } else {
      setEditingSleeve(null);
      setIsSleeveFormOpen(true);
    }
  };

  if (loadingSleeves) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-red-500 animate-spin mb-2" />
        <p className="text-xs font-mono text-zinc-500">Cargando inventario de fundas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ TOOLBAR ERGONÓMICA DE FUNDAS ═══ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        
        {/* Buscador */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar funda por nombre, marca, color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Píldoras de Tamaño / Formato */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'standard', label: 'Estándar' },
                { id: 'mini-japanese', label: 'Mini JAP' },
                { id: 'european', label: 'EUR' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSizeFilter(s.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  sizeFilter === s.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Filtro de Disponibilidad */}
          <PremiumDropdown
            value={availabilityFilter}
            onChange={(val) => setAvailabilityFilter(val as 'all' | 'available' | 'in_use' | 'out_of_stock')}
            size="sm"
            menuWidth="min-w-44"
            options={[
              { value: 'all', label: 'Stock: Todos' },
              { value: 'available', label: '🟢 Disponibles (>0)' },
              { value: 'in_use', label: '⚔️ En Uso' },
              { value: 'out_of_stock', label: '🔴 Agotadas (0)' },
            ]}
          />

          {/* Filtro de Condición */}
          <PremiumDropdown
            value={conditionFilter}
            onChange={(val) => setConditionFilter(val as 'all' | SleeveInventoryCondition)}
            size="sm"
            menuWidth="min-w-40"
            options={[
              { value: 'all', label: 'Estado: Todos' },
              { value: 'new', label: '✨ Nuevas' },
              { value: 'good', label: '👍 Buenas' },
              { value: 'worn', label: '⚡ Desgastadas' },
            ]}
          />

          {/* Reset Filters Shortcut */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
              title="Restablecer filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Botón Nueva Funda */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer font-display min-h-10 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Funda</span>
          </button>
        </div>
      </div>

      {/* Resumen de Inventario / Conteo */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-1">
        <span>
          Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{filteredSleeves.length}</strong> de <strong className="text-red-600 dark:text-red-400">{sleeves.length}</strong> modelos de fundas
        </span>
        <span className="hidden sm:inline">
          Total físico: <strong className="text-zinc-900 dark:text-zinc-100">{totalSleevesCount}</strong> fundas (<strong className="text-red-600 dark:text-red-400">{totalUsedSleeves}</strong> en uso)
        </span>
      </div>

      {/* ═══ GRID DE FUNDAS O ESTADO VACÍO ═══ */}
      {filteredSleeves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center p-6 shadow-xs">
          <Shield className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
            {hasActiveFilters ? 'No se encontraron fundas con esos filtros' : 'No tienes fundas registradas'}
          </h3>
          <p className="text-xs font-mono text-zinc-500 mt-1 max-w-sm">
            {hasActiveFilters
              ? 'Prueba modificando los términos de búsqueda o restableciendo los filtros activos.'
              : 'Agrega tu primer modelo de fundas para gestionar el stock y las cartas asignadas en tus mazos.'}
          </p>

          <div className="flex items-center gap-3 mt-4">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer min-h-10 touch-manipulation"
              >
                Restablecer Filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md shadow-red-600/20 min-h-10 touch-manipulation"
              >
                + Agregar Primera Funda
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSleeves.map((sleeve) => (
            <SleeveInventoryCard
              key={sleeve.id}
              sleeve={sleeve}
              onEdit={() => {
                setEditingSleeve(sleeve);
                setIsSleeveFormOpen(true);
              }}
              onDelete={() => handleDeleteSleeve(sleeve)}
              onAddStock={onAddStock}
              onViewDetails={(s) => setSelectedSleeveForDetail(s)}
            />
          ))}
          <AddSleeveCard onClick={handleOpenAdd} />
        </div>
      )}

      {/* ═══ MODAL DETALLADO DE TRACKING DE CARTAS INDIVIDUALES ═══ */}
      <SleeveDetailModal
        isOpen={Boolean(selectedSleeveForDetail)}
        onClose={() => setSelectedSleeveForDetail(null)}
        sleeve={selectedSleeveForDetail}
        allUserCards={allUserCards}
        decks={decks}
        locations={locations}
        onEdit={(s) => {
          setEditingSleeve(s);
          setIsSleeveFormOpen(true);
        }}
        onAddStock={onAddStock}
      />
    </div>
  );
};
