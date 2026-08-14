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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-2xl bg-[hsl(224,22%,10%)] border border-[hsl(224,15%,20%)] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-slate-800 text-slate-350 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Image & Banlist status */}
            <div className="md:w-5/12 bg-[hsl(224,25%,6%)] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[hsl(224,15%,16%)]">
              <div className="w-full flex-1 flex items-center justify-center min-h-70">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-xs text-slate-500">Cargando imagen...</p>
                  </div>
                ) : (
                  <img 
                    src={previewCard?.image_url || hoveredCard?.image_url || 'https://images.ygoprodeck.com/images/cards/back.jpg'} 
                    alt={previewCard?.name || hoveredCard?.name || 'Carta'} 
                    className="max-h-80 object-contain rounded-lg shadow-lg shadow-black/50 hover:scale-[1.02] transition-transform duration-300"
                    onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
                  />
                )}
              </div>

              {!isLoadingPreview && previewCard && (
                <div className="w-full mt-4 space-y-2.5">
                  <div className="text-[10px] text-center font-mono text-slate-500">
                    ID: #{previewCard.id}
                  </div>
                  
                  {/* Banlist grids per formats */}
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-center font-semibold">
                    <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg flex flex-col justify-between">
                      <span className="text-slate-500 uppercase tracking-wider text-[8px] mb-1 block">TCG</span>
                      <span className={
                        previewCard.ban_tcg === 'Forbidden' ? 'text-red-400 font-bold' :
                        previewCard.ban_tcg === 'Limited' ? 'text-amber-500 font-bold' :
                        previewCard.ban_tcg === 'Semi-Limited' ? 'text-yellow-400 font-bold' :
                        'text-emerald-450 font-medium'
                      }>{previewCard.ban_tcg || 'Unlimited'}</span>
                    </div>
                    
                    <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg flex flex-col justify-between">
                      <span className="text-slate-500 uppercase tracking-wider text-[8px] mb-1 block">Master Duel</span>
                      <span className={
                        previewCard.ban_master_duel === 'Forbidden' ? 'text-red-400 font-bold' :
                        previewCard.ban_master_duel === 'Limited' ? 'text-amber-500 font-bold' :
                        previewCard.ban_master_duel === 'Semi-Limited' ? 'text-yellow-400 font-bold' :
                        'text-emerald-450 font-medium'
                      }>{previewCard.ban_master_duel || 'Unlimited'}</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 p-1.5 rounded-lg flex flex-col justify-between">
                      <span className="text-slate-500 uppercase tracking-wider text-[8px] mb-1 block">Duel Links</span>
                      <span className={
                        previewCard.ban_duel_links === 'Forbidden' ? 'text-red-400 font-bold' :
                        previewCard.ban_duel_links === 'Limited' ? 'text-amber-500 font-bold' :
                        previewCard.ban_duel_links === 'Semi-Limited' ? 'text-yellow-400 font-bold' :
                        'text-emerald-450 font-medium'
                      }>{previewCard.ban_duel_links || 'Unlimited'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Text Information & Actions */}
            <div className="md:w-7/12 p-6 flex flex-col justify-between bg-slate-900/50">
              {isLoadingPreview ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                  <h4 className="text-sm font-semibold text-slate-300">Cargando Ficha Técnica...</h4>
                  <p className="text-xs text-slate-500 text-center max-w-50">Consultando la base de datos de cartas...</p>
                </div>
              ) : previewCard ? (
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-xl text-white tracking-wide pr-8">{previewCard.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider border ${
                        previewCard.type.includes('Spell') ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                        previewCard.type.includes('Trap') ? 'bg-pink-950/40 text-pink-400 border-pink-900/50' :
                        previewCard.type.includes('Fusion') ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' :
                        previewCard.type.includes('Synchro') ? 'bg-zinc-100 text-slate-900 border-zinc-350' :
                        previewCard.type.includes('XYZ') ? 'bg-black text-amber-400 border-zinc-800' :
                        previewCard.type.includes('Link') ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' :
                        'bg-amber-950/40 text-amber-400 border-amber-900/50'
                      }`}>
                        {previewCard.type}
                      </span>
                      {previewCard.archetype && (
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9.5px] font-medium text-slate-350">
                          Arquetipo: {previewCard.archetype}
                        </span>
                      )}
                      
                      {favoriteCardIds.includes(previewCard.id) && (
                        <span className="flex items-center gap-1 bg-red-950/30 text-red-400 border border-red-900/40 px-2 py-0.5 rounded text-[9.5px] font-bold">
                          <Heart className="w-3 h-3 fill-red-400 text-red-400" /> Favorita
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Monster Stats Grid */}
                  {previewCard.type.includes('Monster') && (
                    <div className="grid grid-cols-2 gap-3 bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] p-3 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Atributo / Nivel</p>
                        <div className="flex items-center gap-2">
                          {previewCard.attribute && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-extrabold text-slate-200 uppercase tracking-widest border border-zinc-700">
                              {previewCard.attribute}
                            </span>
                          )}
                          {previewCard.level && (
                            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10.5px]">
                              <span>⭐</span>
                              <span className="font-mono">{previewCard.level}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ATK / DEF</p>
                        <p className="text-[12px] font-mono font-black text-slate-100 tracking-wider">
                          ATK: <span className="text-white">{previewCard.atk !== null && previewCard.atk !== undefined ? previewCard.atk : '?'}</span>
                          {previewCard.type.includes('Link') ? (
                            <span className="text-slate-500 ml-1">/ DEF: —</span>
                          ) : (
                            <>
                              <span className="text-slate-500 ml-1">/ DEF:</span> <span className="text-white">{previewCard.def !== null && previewCard.def !== undefined ? previewCard.def : '?'}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {previewCard.race && (
                        <div className="col-span-2 border-t border-slate-850/60 pt-2 space-y-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Familia / Subtipo</p>
                          <p className="text-xs text-slate-300 font-semibold">{previewCard.race}</p>
                        </div>
                      )}

                      {/* Stock availability */}
                      <div className="col-span-2 border-t border-slate-850/60 pt-2 space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mi Inventario</p>
                        <div className="flex gap-4 text-xs font-semibold">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-normal">Originales:</span>
                            <span className="text-emerald-400">
                              {Math.max(0, (userInventoryCounts[previewCard.id] || 0) - (userProxyCounts[previewCard.id] || 0))}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-normal">Proxies:</span>
                            <span className="text-red-400">{userProxyCounts[previewCard.id] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spell / Trap subtpes */}
                  {(previewCard.type.includes('Spell') || previewCard.type.includes('Trap')) && previewCard.race && (
                    <div className="bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] p-3 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Clase / Icono</p>
                      <p className="text-xs text-slate-200 font-bold uppercase tracking-wider">{previewCard.race}</p>
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="flex-1 flex flex-col min-h-25 max-h-40">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      📝 Efecto / Descripción
                    </p>
                    <div className="flex-1 overflow-y-auto bg-[hsl(224,25%,6%)] border border-[hsl(224,15%,16%)] p-3 rounded-xl text-xs text-slate-300 leading-relaxed font-sans scrollbar-thin">
                      {previewCard.desc}
                    </div>
                  </div>

                  {modalActionMessage && (
                    <div className={`p-2 rounded text-center text-xs font-semibold ${
                      modalActionMessage.type === 'success' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : 'bg-red-950/40 text-red-400 border border-red-900/40'
                    }`}>
                      {modalActionMessage.text}
                    </div>
                  )}

                  {/* technical shortcuts */}
                  <div className="flex gap-2 border-t border-slate-800 pt-4 mt-auto">
                    <button
                      onClick={() => handleAddProxy(previewCard.id)}
                      disabled={isActionLoading}
                      className="flex-1 cursor-pointer bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/30 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-950/20"
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Printer className="w-3.5 h-3.5" />
                      )}
                      <span>Agregar como Proxy</span>
                    </button>

                    <button
                      onClick={() => handleToggleFavorite(previewCard.id)}
                      className={`cursor-pointer px-4 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        favoriteCardIds.includes(previewCard.id)
                          ? 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/30'
                          : 'bg-zinc-800 border-zinc-700 text-slate-350 hover:bg-zinc-750 hover:text-white'
                      }`}
                      title={favoriteCardIds.includes(previewCard.id) ? 'Quitar de favoritas' : 'Marcar como favorita'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favoriteCardIds.includes(previewCard.id) ? 'fill-red-400 text-red-400' : 'text-slate-300'}`} />
                      <span>{favoriteCardIds.includes(previewCard.id) ? 'Favorita' : 'Favorito'}</span>
                    </button>

                    <button
                      onClick={() => handleRemoveFromCollection(previewCard.id)}
                      disabled={isActionLoading || (userInventoryCounts[previewCard.id] || 0) === 0}
                      className="cursor-pointer bg-zinc-850 border border-zinc-700 hover:bg-red-950/45 hover:border-red-900 hover:text-red-400 disabled:bg-zinc-900/30 disabled:border-zinc-850 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-300 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                      title="Eliminar esta carta de la colección completa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar ({userInventoryCounts[previewCard.id] || 0})</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center py-20 text-slate-500">
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
