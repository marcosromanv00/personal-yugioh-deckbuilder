import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Heart, Printer, Trash2 } from 'lucide-react';
import { Card, HoverCardBase } from '../types';

interface CardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoadingPreview: boolean;
  previewCard: Card | null;
  hoveredCard: HoverCardBase | null;
  favoriteCardIds: number[];
  handleToggleFavorite: (cardId: number) => void;
  userInventoryCounts: Record<number, number>;
  userProxyCounts: Record<number, number>;
  handleAddProxy: (cardId: number) => Promise<void>;
  handleRemoveFromCollection: (cardId: number) => Promise<void>;
  isActionLoading: boolean;
  modalActionMessage: { text: string; type: 'success' | 'error' } | null;
}

/**
 * CardPreviewModal Component
 * Shows details, stats (ATK, DEF, Attribute, level, race), text description,
 * banlists (TCG, Master Duel, Duel Links), and collection manager shortcuts for a card.
 */
export const CardPreviewModal: React.FC<CardPreviewModalProps> = ({
  isOpen,
  onClose,
  isLoadingPreview,
  previewCard,
  hoveredCard,
  favoriteCardIds,
  handleToggleFavorite,
  userInventoryCounts,
  userProxyCounts,
  handleAddProxy,
  handleRemoveFromCollection,
  isActionLoading,
  modalActionMessage,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-3 sm:p-4">
          {/* Backdrop close */}
          <div className="absolute inset-0 cursor-pointer hidden md:block" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full md:max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row z-10 max-h-[92dvh] md:max-h-[90vh] text-zinc-900 dark:text-zinc-100"
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Image & Banlist status */}
            <div className="md:w-5/12 bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="w-full flex-1 flex items-center justify-center min-h-48 sm:min-h-70">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    <p className="text-xs text-zinc-400">Cargando imagen...</p>
                  </div>
                ) : (
                  <img 
                    src={previewCard?.image_url || hoveredCard?.image_url || 'https://images.ygoprodeck.com/images/cards/back.jpg'} 
                    alt={previewCard?.name || hoveredCard?.name || 'Carta'} 
                    className="max-h-56 sm:max-h-80 object-contain rounded-xl shadow-lg hover:scale-[1.02] transition-transform duration-300"
                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                  />
                )}
              </div>

              {!isLoadingPreview && previewCard && (
                <div className="w-full mt-4 space-y-2.5">
                  <div className="text-[10px] text-center font-mono text-zinc-400">
                    ID: #{previewCard.id}
                  </div>
                  
                  {/* Banlist grids per formats */}
                  <div className="grid grid-cols-3 gap-1.5 text-[9px] text-center font-bold">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl flex flex-col justify-between">
                      <span className="text-zinc-400 uppercase tracking-wider text-[8px] mb-0.5 block">TCG</span>
                      <span className={
                        previewCard.ban_tcg === 'Forbidden' ? 'text-red-500 font-bold' :
                        previewCard.ban_tcg === 'Limited' ? 'text-amber-500 font-bold' :
                        previewCard.ban_tcg === 'Semi-Limited' ? 'text-yellow-500 font-bold' :
                        'text-emerald-500 font-bold'
                      }>{previewCard.ban_tcg || 'Unlimited'}</span>
                    </div>
                    
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl flex flex-col justify-between">
                      <span className="text-zinc-400 uppercase tracking-wider text-[8px] mb-0.5 block">Master Duel</span>
                      <span className={
                        previewCard.ban_master_duel === 'Forbidden' ? 'text-red-500 font-bold' :
                        previewCard.ban_master_duel === 'Limited' ? 'text-amber-500 font-bold' :
                        previewCard.ban_master_duel === 'Semi-Limited' ? 'text-yellow-500 font-bold' :
                        'text-emerald-500 font-bold'
                      }>{previewCard.ban_master_duel || 'Unlimited'}</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl flex flex-col justify-between">
                      <span className="text-zinc-400 uppercase tracking-wider text-[8px] mb-0.5 block">Duel Links</span>
                      <span className={
                        previewCard.ban_duel_links === 'Forbidden' ? 'text-red-500 font-bold' :
                        previewCard.ban_duel_links === 'Limited' ? 'text-amber-500 font-bold' :
                        previewCard.ban_duel_links === 'Semi-Limited' ? 'text-yellow-500 font-bold' :
                        'text-emerald-500 font-bold'
                      }>{previewCard.ban_duel_links || 'Unlimited'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Text Information & Actions */}
            <div className="md:w-7/12 p-6 flex flex-col justify-between bg-white dark:bg-zinc-900">
              {isLoadingPreview ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Cargando Ficha Técnica...</h4>
                </div>
              ) : previewCard ? (
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-100 tracking-tight pr-8">{previewCard.name}</h3>
                    
                    <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                        previewCard.type.includes('Spell') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900' :
                        previewCard.type.includes('Trap') ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-300 dark:border-pink-900' :
                        previewCard.type.includes('Fusion') ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-900' :
                        previewCard.type.includes('Synchro') ? 'bg-zinc-100 text-zinc-900 border-zinc-300' :
                        previewCard.type.includes('XYZ') ? 'bg-zinc-900 text-amber-400 border-zinc-800' :
                        previewCard.type.includes('Link') ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-900' :
                        'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-900'
                      }`}>
                        {previewCard.type}
                      </span>
                      {previewCard.archetype && (
                        <span className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                          {previewCard.archetype}
                        </span>
                      )}
                      
                      {favoriteCardIds.includes(previewCard.id) && (
                        <span className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" /> Favorita
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Monster Stats Grid */}
                  {previewCard.type.includes('Monster') && (
                    <div className="grid grid-cols-2 gap-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Atributo / Nivel</p>
                        <div className="flex items-center gap-1.5">
                          {previewCard.attribute && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black text-zinc-800 dark:text-zinc-200 uppercase">
                              {previewCard.attribute}
                            </span>
                          )}
                          {previewCard.level && (
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                              <span>⭐</span>
                              <span className="font-mono">{previewCard.level}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">ATK / DEF</p>
                        <p className="text-xs font-mono font-black text-zinc-900 dark:text-zinc-100">
                          ATK: <span>{previewCard.atk !== null && previewCard.atk !== undefined ? previewCard.atk : '?'}</span>
                          {previewCard.type.includes('Link') ? (
                            <span className="text-zinc-400 ml-1">/ DEF: —</span>
                          ) : (
                            <>
                              <span className="text-zinc-400 ml-1">/ DEF:</span> <span>{previewCard.def !== null && previewCard.def !== undefined ? previewCard.def : '?'}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {previewCard.race && (
                        <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-800/80 pt-1.5 space-y-0.5">
                          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Familia / Subtipo</p>
                          <p className="text-xs text-zinc-800 dark:text-zinc-200 font-bold">{previewCard.race}</p>
                        </div>
                      )}

                      {/* Stock availability */}
                      <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-800/80 pt-1.5 space-y-0.5">
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Mi Inventario</p>
                        <div className="flex gap-4 text-xs font-bold font-mono">
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500 font-normal">Originales:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {Math.max(0, (userInventoryCounts[previewCard.id] || 0) - (userProxyCounts[previewCard.id] || 0))}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500 font-normal">Proxies:</span>
                            <span className="text-amber-600 dark:text-amber-400">{userProxyCounts[previewCard.id] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spell / Trap subtypes */}
                  {(previewCard.type.includes('Spell') || previewCard.type.includes('Trap')) && previewCard.race && (
                    <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl space-y-0.5">
                      <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">Clase / Icono</p>
                      <p className="text-xs text-zinc-900 dark:text-zinc-100 font-black uppercase">{previewCard.race}</p>
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="flex-1 flex flex-col min-h-25 max-h-40">
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider mb-1">
                      Efecto / Descripción
                    </p>
                    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans scrollbar-thin">
                      {previewCard.desc}
                    </div>
                  </div>

                  {modalActionMessage && (
                    <div className={`p-2 rounded-xl text-center text-xs font-bold ${
                      modalActionMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800'
                    }`}>
                      {modalActionMessage.text}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleAddProxy(previewCard.id)}
                      disabled={isActionLoading}
                      className="flex-1 cursor-pointer bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-600/25 touch-manipulation min-h-11 sm:min-h-9"
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      <span>+ Proxy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(previewCard.id)}
                      className={`cursor-pointer px-4 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider touch-manipulation min-h-11 sm:min-h-9 ${
                        favoriteCardIds.includes(previewCard.id)
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favoriteCardIds.includes(previewCard.id) ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
                      <span>{favoriteCardIds.includes(previewCard.id) ? 'Favorita' : 'Favorito'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCollection(previewCard.id)}
                      disabled={isActionLoading || (userInventoryCounts[previewCard.id] || 0) === 0}
                      className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all touch-manipulation min-h-11 sm:min-h-9"
                      title="Eliminar esta carta de la colección completa"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center py-20 text-zinc-400 font-mono text-xs">
                  No se encontraron detalles para esta carta.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
