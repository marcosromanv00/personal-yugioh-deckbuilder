'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Package, Layers } from 'lucide-react';
import { SleeveInventory } from '@/types/collection';

interface SleeveInventoryCardProps {
  sleeve: SleeveInventory;
  onEdit: (sleeve: SleeveInventory) => void;
  onDelete: (sleeve: SleeveInventory) => void;
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

export const SleeveInventoryCard: React.FC<SleeveInventoryCardProps> = ({ sleeve, onEdit, onDelete }) => {
  const conditionCfg = CONDITION_CONFIG[sleeve.condition] || CONDITION_CONFIG.good;
  const available = sleeve.quantity_available ?? sleeve.quantity_total;
  const availPct = sleeve.quantity_total > 0 ? (available / sleeve.quantity_total) * 100 : 100;
  const availColor = availPct > 60 ? 'bg-emerald-500' : availPct > 25 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,16%)] rounded-xl overflow-hidden hover:border-purple-500/40 transition-all duration-300"
    >
      {/* Color swatch strip */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: sleeve.color_hex || '#1a1a2e' }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{sleeve.name}</h3>
            <p className="text-xs text-slate-400 truncate">{sleeve.brand}</p>
          </div>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(sleeve)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/60 hover:text-purple-300 text-slate-400 transition-colors"
              title="Editar"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(sleeve)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 hover:text-red-400 text-slate-400 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Color & Size badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/70 text-[10px] text-slate-300 border border-slate-700/50">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20"
              style={{ backgroundColor: sleeve.color_hex || '#1a1a2e' }}
            />
            {sleeve.color_pattern}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/70 text-[10px] text-slate-300 border border-slate-700/50">
            <Layers className="w-2.5 h-2.5" />
            {SIZE_LABELS[sleeve.size_type] || sleeve.size_type}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${conditionCfg.bg} ${conditionCfg.color}`}>
            {conditionCfg.label}
          </span>
        </div>

        {/* Availability bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Package className="w-3 h-3" />
              Disponibilidad
            </span>
            <span className="text-[10px] font-bold text-white">
              {available} <span className="text-slate-500 font-normal">/ {sleeve.quantity_total}</span>
            </span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${availPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${availColor}`}
            />
          </div>
        </div>

        {sleeve.notes && (
          <p className="mt-2 text-[10px] text-slate-500 line-clamp-2">{sleeve.notes}</p>
        )}
      </div>
    </motion.div>
  );
};

export const AddSleeveCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="group relative bg-[hsl(224,22%,10%)] border border-dashed border-[hsl(224,15%,22%)] rounded-xl p-4 hover:border-purple-500/60 hover:bg-purple-500/5 transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center gap-2"
  >
    <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
      <Layers className="w-5 h-5 text-purple-400" />
    </div>
    <span className="text-xs text-slate-400 group-hover:text-purple-300 transition-colors font-medium">
      Agregar Fundas
    </span>
  </motion.button>
);
