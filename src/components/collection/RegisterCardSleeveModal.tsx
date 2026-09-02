'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Plus, 
  Search, 
  Sparkles, 
  Check, 
  Loader2, 
  ArrowRight
} from 'lucide-react';
import { SleeveInventory, UserCard, DeckCardDetail } from '@/types/collection';

interface RegisterCardSleeveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCard: UserCard | null;
  cardDetail?: DeckCardDetail | null;
  availableSleeves: SleeveInventory[];
  onSleeveUpdatedOrCreated: (updatedSleeve: SleeveInventory, assignedToCard?: boolean) => void;
  onOpenCreateSleeveModal: (prefillData: { brand: string; color_pattern: string; size_type: string }) => void;
}

export const RegisterCardSleeveModal: React.FC<RegisterCardSleeveModalProps> = ({
  isOpen,
  onClose,
  userCard,
  cardDetail,
  availableSleeves,
  onSleeveUpdatedOrCreated,
  onOpenCreateSleeveModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSleeveId, setLoadingSleeveId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cardName = cardDetail?.card_details?.name || 'Carta Seleccionada';
  const cardImg = cardDetail?.card_details?.image_url_small || cardDetail?.card_details?.image_url;
  const currentBrand = userCard?.sleeve_brand || 'Dragon Shield';
  const currentColor = userCard?.sleeve_color || 'Matte Black';

  const filteredSleeves = useMemo(() => {
    if (!searchQuery.trim()) return availableSleeves;
    const q = searchQuery.toLowerCase();
    return availableSleeves.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.color_pattern.toLowerCase().includes(q)
    );
  }, [availableSleeves, searchQuery]);

  const handleAddOneStock = async (sleeve: SleeveInventory) => {
    setLoadingSleeveId(sleeve.id);
    try {
      const res = await fetch('/api/collection/sleeve-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sleeve.id,
          add_quantity: 1,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const updatedSleeve: SleeveInventory = {
          ...sleeve,
          quantity_total: (sleeve.quantity_total || 0) + 1,
          quantity_available: (sleeve.quantity_available || 0) + 1,
          ...(json.data || {}),
        };

        // Si la carta existe, actualizar su marca y color para coincidir con la funda
        if (userCard) {
          await fetch('/api/collection/cards', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: userCard.id,
              sleeve_type: userCard.sleeve_type === 'none' ? 'single' : (userCard.sleeve_type || 'single'),
              sleeve_brand: updatedSleeve.brand,
              sleeve_color: updatedSleeve.color_pattern,
              sleeve_condition: updatedSleeve.condition || 'good',
            }),
          });
        }

        setSuccessMessage(`+1 funda sumada con éxito a "${sleeve.name}"`);
        onSleeveUpdatedOrCreated(updatedSleeve, true);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Error al sumar stock a la funda:', err);
    } finally {
      setLoadingSleeveId(null);
    }
  };

  const handleCreateNewCategory = () => {
    onOpenCreateSleeveModal({
      brand: currentBrand,
      color_pattern: currentColor,
      size_type: 'standard',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-display uppercase tracking-tight">
                  Registrar Funda en Inventario
                </h3>
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono">
                  Suma stock a un modelo existente o registra un nuevo estilo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contexto de la Carta */}
          <div className="p-3.5 bg-zinc-100/70 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shrink-0">
            {cardImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cardImg}
                alt={cardName}
                className="w-10 h-14 object-contain rounded-md shadow-xs shrink-0 border border-zinc-200 dark:border-zinc-800"
              />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">
                Funda detectada en la copia física:
              </span>
              <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                {cardName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10.5px] font-mono text-zinc-600 dark:text-zinc-300 font-bold">
                  🛡️ {currentBrand} - {currentColor}
                </span>
                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {userCard?.sleeve_type || 'single'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback de Éxito */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono flex items-center gap-2 shrink-0"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Cuerpo con Opciones */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Opción 1: Registrar como Nueva Categoría */}
            <button
              type="button"
              onClick={handleCreateNewCategory}
              className="w-full p-3.5 bg-linear-to-r from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-left hover:border-red-400 dark:hover:border-red-700 transition-all cursor-pointer group shadow-2xs min-h-11 touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      Registrar como Nueva Funda / Categoría
                    </h4>
                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                      Crea un nuevo estilo en tu inventario pre-llenado con {currentBrand} ({currentColor})
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Separador */}
            <div className="flex items-center gap-2">
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                O suma +1 a un estilo registrado
              </span>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            </div>

            {/* Buscador de Fundas Existentes */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar funda en tu inventario..."
                className="w-full pl-8.5 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Lista de Fundas Existentes */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredSleeves.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 font-mono border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  No se encontraron fundas registradas. Usa la opción superior para crear una nueva.
                </div>
              ) : (
                filteredSleeves.map((sleeve) => {
                  const isLoading = loadingSleeveId === sleeve.id;
                  const isMatch =
                    sleeve.brand.toLowerCase() === currentBrand.toLowerCase() &&
                    sleeve.color_pattern.toLowerCase() === currentColor.toLowerCase();

                  return (
                    <div
                      key={sleeve.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                        isMatch
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800/60'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-xs"
                          style={{ backgroundColor: sleeve.color_hex || '#1a1a2e' }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {sleeve.name}
                            </h5>
                            {isMatch && (
                              <span className="text-[9px] font-mono font-black uppercase px-1 py-0.2 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                                Coincide
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                            {sleeve.brand} • {sleeve.color_pattern} •{' '}
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">
                              {sleeve.quantity_available ?? sleeve.quantity_total} disp.
                            </span>{' '}
                            / {sleeve.quantity_total} total
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isLoading || !!loadingSleeveId}
                        onClick={() => handleAddOneStock(sleeve)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1 shrink-0 min-h-11 sm:min-h-8 touch-manipulation ${
                          isMatch
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-xs'
                            : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>+1 Stock</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-11 sm:min-h-9 touch-manipulation"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
