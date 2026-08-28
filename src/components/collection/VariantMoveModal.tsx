'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, X, Layers, Boxes, MapPin, Check, Minus, Plus } from 'lucide-react';
import { StorageLocation, UserCard } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { getLanguageDisplay } from '@/lib/collectionUtils';

interface VariantMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: UserCard | null;
  locations: StorageLocation[];
  currentLocation: StorageLocation | null;
  onConfirmMove: (
    variantId: string,
    quantityToMove: number,
    targetLocationId: string | null,
    targetCompartmentIndex: number
  ) => Promise<void>;
}

export const VariantMoveModal: React.FC<VariantMoveModalProps> = ({
  isOpen,
  onClose,
  variant,
  locations,
  currentLocation,
  onConfirmMove,
}) => {
  const currentQuantity = variant?.quantity || 1;
  const [moveQuantity, setMoveQuantity] = useState<number>(1);
  const [targetLocationId, setTargetLocationId] = useState<string>('inbox');
  const [targetCompartmentIndex, setTargetCompartmentIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen && variant) {
      setMoveQuantity(variant.quantity || 1);
      // Seleccionar como sugerencia el primer contenedor diferente al actual o inbox
      const defaultLoc = locations.find(l => l.id !== variant.storage_location_id);
      setTargetLocationId(defaultLoc ? defaultLoc.id : (variant.storage_location_id ? 'inbox' : (locations[0]?.id || 'inbox')));
      setTargetCompartmentIndex(0);
      setIsProcessing(false);
    }
  }, [isOpen, variant, locations]);

  // Contenedor seleccionado
  const selectedTargetLocation = useMemo(() => {
    if (targetLocationId === 'inbox') return null;
    return locations.find(l => l.id === targetLocationId) || null;
  }, [targetLocationId, locations]);

  // Opciones de contenedores
  const locationOptions = useMemo(() => {
    const opts = [
      { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
      ...locations.map(loc => ({
        value: loc.id,
        label: `${loc.type === 'binder' ? '📖' : '📦'} ${loc.name} (${loc.type === 'binder' ? 'Binder' : 'Caja'})`,
      })),
    ];
    return opts;
  }, [locations]);

  // Opciones de carriles/compartimentos si la caja destino tiene varios
  const compartmentOptions = useMemo(() => {
    if (!selectedTargetLocation?.compartments || selectedTargetLocation.compartments.count <= 1) {
      return [];
    }
    return selectedTargetLocation.compartments.names.map((compName, idx) => ({
      value: idx,
      label: `📦 ${compName || `Carril ${idx + 1}`}`,
    }));
  }, [selectedTargetLocation]);

  // Ajustar carril si cambia de contenedor
  useEffect(() => {
    if (compartmentOptions.length > 0) {
      if (targetCompartmentIndex >= compartmentOptions.length) {
        setTargetCompartmentIndex(0);
      }
    } else {
      setTargetCompartmentIndex(0);
    }
  }, [selectedTargetLocation, compartmentOptions, targetCompartmentIndex]);

  if (!isOpen || !variant) return null;

  const isMovingAll = moveQuantity >= currentQuantity;
  const remainingInContainer = Math.max(0, currentQuantity - moveQuantity);
  const langDisplay = getLanguageDisplay(variant.language);

  const handleConfirm = async () => {
    if (moveQuantity < 1) return;
    setIsProcessing(true);
    try {
      const effectiveLocId = targetLocationId === 'inbox' ? null : targetLocationId;
      await onConfirmMove(variant.id, moveQuantity, effectiveLocId, targetCompartmentIndex);
      onClose();
    } catch (e) {
      console.error('Error al mover variante:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans select-none overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-visible flex flex-col relative z-10 text-zinc-900 dark:text-zinc-100 my-auto"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/50 rounded-t-3xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                  Mover Variante a Otro Contenedor
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Selecciona la cantidad y la ubicación de destino
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-visible">
            {/* Resumen de la variante */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex gap-3.5 items-center">
              <div className="relative w-14 aspect-3/4 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                {variant.card_details && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={variant.card_details.image_url_small || variant.card_details.image_url}
                    alt={variant.card_details.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                  {variant.card_details?.name || 'Carta'}
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                    {variant.rarity || 'Common'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    {variant.condition || 'Near Mint'}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {langDisplay.badge}
                  </span>
                </div>
                <p className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  Ubicación actual: {currentLocation ? `${currentLocation.name}` : 'Bandeja Inbox'}
                </p>
              </div>
            </div>

            {/* Selector de Cantidad (si hay 2 o más copias) */}
            {currentQuantity > 1 && (
              <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  <span>¿Cuántas copias deseas mover?</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">
                    {moveQuantity} de {currentQuantity}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveQuantity(prev => Math.max(1, prev - 1))}
                    disabled={moveQuantity <= 1}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min={1}
                    max={currentQuantity}
                    value={moveQuantity}
                    onChange={(e) => setMoveQuantity(parseInt(e.target.value) || 1)}
                    className="flex-1 accent-purple-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
                  />

                  <button
                    type="button"
                    onClick={() => setMoveQuantity(prev => Math.min(currentQuantity, prev + 1))}
                    disabled={moveQuantity >= currentQuantity}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 pt-1">
                  <span>Se moverán: <strong className="text-purple-600 dark:text-purple-400">{moveQuantity}x</strong></span>
                  <span>Quedarán aquí: <strong className="text-zinc-700 dark:text-zinc-300">{remainingInContainer}x</strong></span>
                </div>
              </div>
            )}

            {/* Selector de Contenedor Destino */}
            <div>
              <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Contenedor de Destino</span>
              </label>
              <PremiumDropdown
                value={targetLocationId}
                onChange={(val) => setTargetLocationId(val)}
                align="full"
                size="md"
                options={locationOptions}
              />
            </div>

            {/* Selector de Carril / Compartimento (si la caja destino tiene varios) */}
            {compartmentOptions.length > 0 && (
              <div>
                <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Carril / Compartimento en {selectedTargetLocation?.name}</span>
                </label>
                <PremiumDropdown
                  value={targetCompartmentIndex}
                  onChange={(val) => setTargetCompartmentIndex(val as number)}
                  align="full"
                  size="md"
                  options={compartmentOptions}
                />
              </div>
            )}

            {/* Aviso informativo de destino */}
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2 border border-zinc-200 dark:border-zinc-800">
              <Boxes className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
              <p className="leading-snug">
                {selectedTargetLocation?.type === 'binder' ? (
                  <span>La carta se trasladará a la <strong>bandeja de pendientes</strong> de la carpeta <em>{selectedTargetLocation.name}</em> para que puedas ubicarla en un slot cuando quieras.</span>
                ) : targetLocationId === 'inbox' ? (
                  <span>La carta se trasladará a la <strong>Bandeja Sin Clasificar (Inbox)</strong>.</span>
                ) : (
                  <span>La carta se guardará en <strong>{selectedTargetLocation?.name}</strong>{compartmentOptions.length > 0 ? ` en ${selectedTargetLocation?.compartments?.names[targetCompartmentIndex] || `el Carril ${targetCompartmentIndex + 1}`}` : ''}.</span>
                )}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-b-3xl flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-11 flex items-center justify-center touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || moveQuantity < 1}
              className="flex-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-11 touch-manipulation"
            >
              {isProcessing ? (
                <span>Moviendo...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-2" />
                  <span>
                    {isMovingAll
                      ? `Mover ${moveQuantity === 1 ? '1 Copia' : `Todas las ${moveQuantity} Copias`}`
                      : `Mover ${moveQuantity} de ${currentQuantity} Copias`}
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
