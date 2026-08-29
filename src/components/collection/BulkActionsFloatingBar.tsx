'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderInput, 
  Tag, 
  Sparkles, 
  Trash2, 
  X, 
  Scissors, 
  Check, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { StorageLocation, CardCondition, CardStatusFlag, SleeveType } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface BulkActionsFloatingBarProps {
  selectedCount: number;
  totalPhysicalCount: number;
  locations: StorageLocation[];
  currentLocationId?: string | null;
  onClearSelection: () => void;
  onMove: (targetLocationId: string | null, targetCompartmentIndex?: number) => Promise<void>;
  onChangeStatus: (newStatus: CardStatusFlag) => Promise<void>;
  onChangeCondition: (newCondition: CardCondition, sleeveType?: SleeveType) => Promise<void>;
  onDelete: () => Promise<void>;
  onSplitSingleCard?: () => void;
  canSplitSingleCard?: boolean;
}

export const BulkActionsFloatingBar: React.FC<BulkActionsFloatingBarProps> = ({
  selectedCount,
  totalPhysicalCount,
  locations,
  currentLocationId,
  onClearSelection,
  onMove,
  onChangeStatus,
  onChangeCondition,
  onDelete,
  onSplitSingleCard,
  canSplitSingleCard = false,
}) => {
  const [activeModal, setActiveModal] = useState<'none' | 'move' | 'status' | 'condition' | 'delete'>('none');
  const [isBusy, setIsBusy] = useState(false);

  // Estados de los formularios en los sub-modales
  const [targetLocationId, setTargetLocationId] = useState<string>('inbox');
  const [targetCompartmentIdx, setTargetCompartmentIdx] = useState<number>(0);
  const [targetStatus, setTargetStatus] = useState<CardStatusFlag>('collection');
  const [targetCondition, setTargetCondition] = useState<CardCondition>('Near Mint');
  const [targetSleeve, setTargetSleeve] = useState<SleeveType>('none');
  const [includeSleeveChange, setIncludeSleeveChange] = useState<boolean>(false);

  if (selectedCount === 0) return null;

  const targetLocationObj = locations.find(l => l.id === targetLocationId);

  // Manejador Mover
  const handleExecuteMove = async () => {
    setIsBusy(true);
    try {
      const locId = targetLocationId === 'inbox' ? null : targetLocationId;
      await onMove(locId, targetCompartmentIdx);
      setActiveModal('none');
    } finally {
      setIsBusy(false);
    }
  };

  // Manejador Cambiar Estado
  const handleExecuteStatus = async () => {
    setIsBusy(true);
    try {
      await onChangeStatus(targetStatus);
      setActiveModal('none');
    } finally {
      setIsBusy(false);
    }
  };

  // Manejador Cambiar Condición / Funda
  const handleExecuteCondition = async () => {
    setIsBusy(true);
    try {
      await onChangeCondition(targetCondition, includeSleeveChange ? targetSleeve : undefined);
      setActiveModal('none');
    } finally {
      setIsBusy(false);
    }
  };

  // Manejador Eliminar
  const handleExecuteDelete = async () => {
    setIsBusy(true);
    try {
      await onDelete();
      setActiveModal('none');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      {/* ═══ BARRA FLOTANTE PRINCIPAL ═══ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-auto bg-zinc-950/95 text-white border border-zinc-700/80 rounded-2xl shadow-2xl backdrop-blur-md px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2.5 sm:gap-4 ring-1 ring-white/10"
        >
          {/* Contador y Badge de Selección */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-red-600/90 text-white font-mono font-black text-xs shadow-xs">
              {selectedCount}
            </div>
            <div className="hidden sm:block min-w-0">
              <span className="text-xs font-mono font-bold block truncate">
                {selectedCount} {selectedCount === 1 ? 'carta' : 'cartas'}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 block">
                ({totalPhysicalCount} {totalPhysicalCount === 1 ? 'copia física' : 'copias físicas'})
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-800 shrink-0 hidden sm:block" />

          {/* Botones de Acciones en Bloque */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-center min-w-0 overflow-x-auto py-0.5">
            {/* 1. Mover a */}
            <button
              type="button"
              onClick={() => setActiveModal('move')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-red-500/50 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              title="Mover cartas seleccionadas a otro contenedor o carril"
            >
              <FolderInput className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Mover a</span>
            </button>

            {/* 2. Cambiar Estado */}
            <button
              type="button"
              onClick={() => setActiveModal('status')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-red-500/50 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              title="Cambiar estado (Colección, Venta/Trade, Bulk, Taller)"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Estado</span>
            </button>

            {/* 3. Condición / Fundas */}
            <button
              type="button"
              onClick={() => setActiveModal('condition')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-red-500/50 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              title="Cambiar condición y/o fundas en lote"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden lg:inline">Condición</span>
            </button>

            {/* 4. Separar Copia (Solo cuando 1 carta seleccionada tiene copias > 1) */}
            {canSplitSingleCard && onSplitSingleCard && (
              <button
                type="button"
                onClick={onSplitSingleCard}
                className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/80 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                title="Hacer copia individual a partir de este grupo de cartas"
              >
                <Scissors className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden md:inline">Separar</span>
              </button>
            )}

            {/* 5. Eliminar */}
            <button
              type="button"
              onClick={() => setActiveModal('delete')}
              className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 hover:border-red-500 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              title="Eliminar cartas seleccionadas de la colección"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-800 shrink-0" />

          {/* Botón Salir / Deseleccionar */}
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Deseleccionar todas y cerrar barra"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* ═══ SUB-MODAL 1: MOVER A CONTENEDOR / CARRIL ═══ */}
      <AnimatePresence>
        {activeModal === 'move' && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans select-none"
            onClick={() => setActiveModal('none')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-visible flex flex-col relative z-10 text-zinc-900 dark:text-zinc-100"
            >
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/50 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                    <FolderInput className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                      Mover {selectedCount} {selectedCount === 1 ? 'Carta' : 'Cartas'}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Selecciona el contenedor y carril de destino
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-visible">
                <div>
                  <label className="block text-[11px] font-mono font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Contenedor de Destino:
                  </label>
                  <PremiumDropdown
                    value={targetLocationId}
                    onChange={(val) => {
                      setTargetLocationId(val);
                      setTargetCompartmentIdx(0);
                    }}
                    align="full"
                    size="md"
                    options={[
                      { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
                      ...locations.map((loc) => ({
                        value: loc.id,
                        label: `${loc.type === 'binder' ? '📖' : '📦'} ${loc.name} (${loc.type === 'binder' ? 'Binder' : 'Caja'})${loc.id === currentLocationId ? ' [Actual]' : ''}`,
                      })),
                    ]}
                  />
                </div>

                {targetLocationObj?.compartments && targetLocationObj.compartments.count > 1 && (
                  <div>
                    <label className="text-[11px] font-mono font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Carril / Compartimento:</span>
                    </label>
                    <PremiumDropdown
                      value={targetCompartmentIdx}
                      onChange={(val) => setTargetCompartmentIdx(Number(val) || 0)}
                      align="full"
                      size="md"
                      options={targetLocationObj.compartments.names.map((compName, idx) => ({
                        value: idx,
                        label: `Carril ${idx + 1}: ${compName || `Carril ${idx + 1}`}`,
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-end gap-2.5 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleExecuteMove}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isBusy ? 'Moviendo...' : `Confirmar Mover (${selectedCount})`}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SUB-MODAL 2: CAMBIAR ESTADO ═══ */}
      <AnimatePresence>
        {activeModal === 'status' && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans select-none"
            onClick={() => setActiveModal('none')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-visible flex flex-col relative z-10 text-zinc-900 dark:text-zinc-100"
            >
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/50 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                      Cambiar Estado
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Aplica clasificación a {selectedCount} {selectedCount === 1 ? 'carta' : 'cartas'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 overflow-visible">
                {[
                  { value: 'collection', label: 'Colección Permanente', desc: 'Cartas conservadas para tu archivo personal', dot: 'bg-green-500' },
                  { value: 'trade_sale', label: 'Venta / Trade', desc: 'Disponibles para intercambio o venta física', dot: 'bg-amber-500' },
                  { value: 'bulk', label: 'Bulk (Sobrantes)', desc: 'Cartas comunes y excedentes para clasificar', dot: 'bg-zinc-400' },
                  { value: 'workshop', label: 'Taller / Decks Activos', desc: 'Cartas activas en construcción o testeo', dot: 'bg-purple-500' },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setTargetStatus(opt.value as CardStatusFlag)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      targetStatus === opt.value
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-3 h-3 rounded-full ${opt.dot} shrink-0`} />
                      <div className="min-w-0">
                        <span className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-100 block">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                          {opt.desc}
                        </span>
                      </div>
                    </div>
                    {targetStatus === opt.value && (
                      <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-end gap-2.5 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleExecuteStatus}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isBusy ? 'Aplicando...' : 'Guardar Estado'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SUB-MODAL 3: CAMBIAR CONDICIÓN / FUNDA ═══ */}
      <AnimatePresence>
        {activeModal === 'condition' && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans select-none"
            onClick={() => setActiveModal('none')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-visible flex flex-col relative z-10 text-zinc-900 dark:text-zinc-100"
            >
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/50 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                      Condición & Fundas
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Actualiza atributos físicos en lote
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-visible">
                <div>
                  <label className="block text-[11px] font-mono font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Condición Física:
                  </label>
                  <PremiumDropdown
                    value={targetCondition}
                    onChange={(val) => setTargetCondition(val as CardCondition)}
                    align="full"
                    size="md"
                    options={[
                      { value: 'Near Mint', label: 'Near Mint (NM) - Impecable' },
                      { value: 'Lightly Played', label: 'Lightly Played (LP) - Desgaste leve' },
                      { value: 'Moderately Played', label: 'Moderately Played (MP) - Desgaste moderado' },
                      { value: 'Heavily Played', label: 'Heavily Played (HP) - Desgaste fuerte' },
                      { value: 'Damaged', label: 'Damaged (DMG) - Dañada' },
                    ]}
                  />
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-mono font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      ¿Actualizar también Fundas?
                    </label>
                    <input
                      type="checkbox"
                      checked={includeSleeveChange}
                      onChange={(e) => setIncludeSleeveChange(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </div>

                  {includeSleeveChange && (
                    <PremiumDropdown
                      value={targetSleeve}
                      onChange={(val) => setTargetSleeve(val as SleeveType)}
                      align="full"
                      size="md"
                      options={[
                        { value: 'none', label: 'Sin Funda' },
                        { value: 'single', label: 'Funda Simple (Single Sleeved)' },
                        { value: 'double', label: 'Funda Doble (Double Sleeved)' },
                        { value: 'triple', label: 'Funda Triple (Triple Sleeved)' },
                      ]}
                    />
                  )}
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-end gap-2.5 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleExecuteCondition}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isBusy ? 'Guardando...' : 'Aplicar Cambios'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SUB-MODAL 4: ELIMINAR EN LOTE ═══ */}
      <AnimatePresence>
        {activeModal === 'delete' && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans select-none"
            onClick={() => setActiveModal('none')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-red-300 dark:border-red-900/60 rounded-3xl shadow-2xl overflow-visible flex flex-col relative z-10 text-zinc-900 dark:text-zinc-100"
            >
              <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/30 rounded-t-3xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 font-mono">
                      Eliminar de la Colección
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Confirmación de acción destructiva
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 overflow-visible">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  ¿Estás seguro de que deseas eliminar permanentemente <strong>{selectedCount} registros</strong> ({totalPhysicalCount} cartas físicas) de tu colección?
                </p>
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl text-[11px] text-red-700 dark:text-red-300 font-mono">
                  ⚠️ Esta acción no se puede deshacer y liberará los espacios en este contenedor.
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex items-center justify-end gap-2.5 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleExecuteDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBusy ? 'Eliminando...' : `Sí, Eliminar (${selectedCount})`}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
