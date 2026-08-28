'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Sliders, ShieldCheck, Layers, Box, Check, RotateCcw, ArrowRight } from 'lucide-react';
import { IdealOptimizationConfig } from '@/types/collection';
import { DEFAULT_IDEAL_CONFIG } from '@/lib/idealOptimizer';

interface IdealOptimizationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: IdealOptimizationConfig) => void;
}

export function IdealOptimizationConfigModal({ isOpen, onClose, onConfirm }: IdealOptimizationConfigModalProps) {
  const [config, setConfig] = useState<IdealOptimizationConfig>(DEFAULT_IDEAL_CONFIG);

  if (!isOpen) return null;

  const handleReset = () => {
    setConfig(DEFAULT_IDEAL_CONFIG);
  };

  const handleToggle = (key: keyof IdealOptimizationConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                  Parámetros de Reorganización <span className="text-red-600 dark:text-red-500">Ideal</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  Personaliza cómo la IA optimizará tus carpetas, decks y cajas de almacenamiento.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Options */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-zinc-800 dark:text-zinc-200 font-sans text-xs">
            
            {/* 1. Preservar Decks Activos */}
            <div 
              onClick={() => handleToggle('preserve_active_decks')}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-red-500/50 transition-all flex items-start justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                    Preservar Receta de Decks Activos al 100%
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Tus barajas armadas conservarán intactas sus cartas y ratios originales, sin contaminar arquetipos con motores ajenos.
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                config.preserve_active_decks 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
              }`}>
                {config.preserve_active_decks && <Check className="w-3.5 h-3.5 stroke-3" />}
              </div>
            </div>

            {/* 2. Generar Variantes Tech */}
            <div 
              onClick={() => handleToggle('create_tech_variants')}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-red-500/50 transition-all flex items-start justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                    Generar Variantes Satélite Tech / Anti-Meta
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Crea recetas separadas con ajustes tácticos manteniendo compatibilidad estricta de Tipo (Máquinas, Dinos, etc.) y Atributo.
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                config.create_tech_variants 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
              }`}>
                {config.create_tech_variants && <Check className="w-3.5 h-3.5 stroke-3" />}
              </div>
            </div>

            {/* 3. Mosaicos Especiales Exodia & Dioses */}
            <div 
              onClick={() => handleToggle('enable_special_mosaics')}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-red-500/50 transition-all flex items-start justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                    Mosaicos Estéticos en Binders (Exodia &amp; Dioses Egipcios)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Ubica las 5 piezas de Exodia en un mosaico 3x3 centrado y los Dioses Egipcios en fila contigua. Nunca deja piezas sueltas.
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                config.enable_special_mosaics 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
              }`}>
                {config.enable_special_mosaics && <Check className="w-3.5 h-3.5 stroke-3" />}
              </div>
            </div>

            {/* 4. Apilar Copias en el Mismo Slot */}
            <div 
              onClick={() => handleToggle('stack_copies_in_same_slot')}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-red-500/50 transition-all flex items-start justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Box className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                    Apilar Copias en el Mismo Bolsillo (Ahorro de Espacio)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Si posees 2 o 3 copias de una misma carta, se agruparán juntas en un único slot (hasta 4 cartas por bolsillo) sin desperdiciar filas.
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                config.stack_copies_in_same_slot 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
              }`}>
                {config.stack_copies_in_same_slot && <Check className="w-3.5 h-3.5 stroke-3" />}
              </div>
            </div>

            {/* 5. Separar Binders Colección vs. Staples */}
            <div 
              onClick={() => handleToggle('separate_collection_and_staples_binders')}
              className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-red-500/50 transition-all flex items-start justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                    Separar Binders (Temática/Colección vs. Staples/Motores)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Destina una carpeta a rarezas máximas e iconos y otra a handtraps, board breakers y cartas competitivas.
                  </p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                config.separate_collection_and_staples_binders 
                  ? 'bg-red-600 border-red-600 text-white' 
                  : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
              }`}>
                {config.separate_collection_and_staples_binders && <Check className="w-3.5 h-3.5 stroke-3" />}
              </div>
            </div>

            {/* 6. Modo de Agrupación de Bulk */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-2">
              <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-wide block text-[11px]">
                Clasificación de Bulk Excedente en Cajas
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, bulk_grouping_mode: 'archetype' }))}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    config.bulk_grouping_mode === 'archetype'
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
                  }`}
                >
                  Por Arquetipo / Familia
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, bulk_grouping_mode: 'card_type' }))}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    config.bulk_grouping_mode === 'card_type'
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800'
                  }`}
                >
                  Por Tipo (Monstruo / Mágica / Trampa)
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-11 touch-manipulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Valores Recomendados</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => onConfirm(config)}
                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer font-display min-h-11 touch-manipulation"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ejecutar Optimización</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
