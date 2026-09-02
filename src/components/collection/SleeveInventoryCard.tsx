'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Package, Layers, PackagePlus } from 'lucide-react';
import { SleeveInventory } from '@/types/collection';

interface SleeveInventoryCardProps {
  sleeve: SleeveInventory;
  onEdit: (sleeve: SleeveInventory) => void;
  onDelete: (sleeve: SleeveInventory) => void;
  onAddStock?: (sleeve: SleeveInventory) => void;
}

const SIZE_LABELS: Record<string, string> = {
  'standard': 'Estándar',
  'mini-japanese': 'Mini Japonesas',
  'european': 'Europeas',
};

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Nuevas', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  good: { label: 'Buenas', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  worn: { label: 'Desgastadas', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

export const SleeveInventoryCard: React.FC<SleeveInventoryCardProps> = ({ sleeve, onEdit, onDelete, onAddStock }) => {
  const conditionCfg = CONDITION_CONFIG[sleeve.condition] || CONDITION_CONFIG.good;
  const available = sleeve.quantity_available ?? sleeve.quantity_total;
  const availPct = sleeve.quantity_total > 0 ? (available / sleeve.quantity_total) * 100 : 100;
  const availColor = availPct > 60 ? 'bg-emerald-500' : availPct > 25 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/50 shadow-xs transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* Color swatch strip */}
        <div
          className="h-2.5 w-full"
          style={{ backgroundColor: sleeve.color_hex || '#1a1a2e' }}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{sleeve.name}</h3>
              <p className="text-xs font-bold text-zinc-500 truncate font-mono">{sleeve.brand}</p>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(sleeve)}
                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Editar"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(sleeve)}
                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-500 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Color & Size badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/20 shadow-xs"
                style={{ backgroundColor: sleeve.color_hex || '#1a1a2e' }}
              />
              {sleeve.color_pattern}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <Layers className="w-2.5 h-2.5 text-zinc-400" />
              {SIZE_LABELS[sleeve.size_type] || sleeve.size_type}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${conditionCfg.bg} ${conditionCfg.color}`}>
              {conditionCfg.label}
            </span>
          </div>

          {/* Availability bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 font-mono">
                <Package className="w-3 h-3 text-red-500" />
                Disponibilidad
              </span>
              <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 font-mono">
                {available} <span className="text-zinc-400 font-normal">/ {sleeve.quantity_total}</span>
              </span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${availPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${availColor}`}
              />
            </div>
          </div>

          {/* Decks en uso */}
          {sleeve.used_in_decks && sleeve.used_in_decks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  En uso en {sleeve.used_in_decks.length} mazo{sleeve.used_in_decks.length > 1 ? 's' : ''}:
                </span>
                <span className="text-[9.5px] font-mono font-black text-red-600 dark:text-red-400">
                  {sleeve.quantity_used || 0} fundas
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {sleeve.used_in_decks.map((d) => (
                  <span
                    key={d.deck_id}
                    className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 rounded-md font-medium border border-zinc-200 dark:border-zinc-700 truncate max-w-full"
                  >
                    🃏 {d.deck_name} <b className="text-zinc-900 dark:text-zinc-100 font-mono">({d.quantity_used})</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {sleeve.notes && (
            <p className="mt-2 text-[10px] text-zinc-500 line-clamp-2 italic">{sleeve.notes}</p>
          )}

          {/* Quick Add Stock Button */}
          {onAddStock && (
            <button
              type="button"
              onClick={() => onAddStock(sleeve)}
              className="mt-3.5 w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700/80 hover:border-red-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-10 touch-manipulation"
            >
              <PackagePlus className="w-3.5 h-3.5 text-red-500" />
              <span>+ Añadir Stock</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const AddSleeveCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="group relative bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-red-500/60 hover:bg-red-50/20 dark:hover:bg-red-950/10 transition-all duration-200 min-h-35 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-xs"
  >
    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center justify-center group-hover:scale-105 transition-all text-red-600 dark:text-red-400">
      <Layers className="w-5 h-5" />
    </div>
    <span className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
      Agregar Fundas
    </span>
  </motion.button>
);
