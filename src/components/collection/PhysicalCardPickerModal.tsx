'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Shield, AlertTriangle, Layers, ArrowRight, Check } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { Card } from '@/components/deckbuilder/types';
import { getSleeveColorHex } from '@/lib/sleeves';

interface PhysicalCardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  userCards: UserCard[];
  targetContainerName?: string;
  onSelectCopy: (userCard: UserCard, action?: 'move' | 'proxy') => void;
}

export const PhysicalCardPickerModal: React.FC<PhysicalCardPickerModalProps> = ({
  isOpen,
  onClose,
  card,
  userCards,
  targetContainerName = 'este contenedor',
  onSelectCopy,
}) => {
  const [selectedUserCard, setSelectedUserCard] = useState<UserCard | null>(null);
  const [showDeckConflict, setShowDeckConflict] = useState(false);

  if (!isOpen || !card) return null;

  const handleCardClick = (uc: UserCard) => {
    setSelectedUserCard(uc);
    if (uc.deck_id || uc.deck_details) {
      setShowDeckConflict(true);
    } else {
      onSelectCopy(uc, 'move');
      onClose();
    }
  };

  const handleResolveConflict = (action: 'move' | 'proxy') => {
    if (selectedUserCard) {
      onSelectCopy(selectedUserCard, action);
      setShowDeckConflict(false);
      setSelectedUserCard(null);
      onClose();
    }
  };

  const getRarityBadgeStyle = (rarity?: string) => {
    const r = rarity?.toLowerCase() || '';
    if (r.includes('starlight') || r.includes('ghost') || r.includes('secret')) {
      return 'bg-linear-to-r from-purple-900/80 to-pink-900/80 text-purple-200 border-purple-500/50 shadow-xs shadow-purple-500/20';
    }
    if (r.includes('ultra') || r.includes('ultimate') || r.includes('collector')) {
      return 'bg-linear-to-r from-amber-900/80 to-yellow-900/80 text-amber-200 border-amber-500/50 shadow-xs shadow-amber-500/20';
    }
    if (r.includes('super')) {
      return 'bg-linear-to-r from-cyan-900/80 to-blue-900/80 text-cyan-200 border-cyan-500/50';
    }
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-14 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-zinc-700 shadow-xs">
                <img
                  src={card.image_url_small || card.image_url}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-zinc-100">{card.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                    {userCards.length} {userCards.length === 1 ? 'copia física' : 'copias físicas'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Selecciona la copia concreta que deseas ubicar en <strong className="text-cyan-400">{targetContainerName}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          {showDeckConflict && selectedUserCard ? (
            /* Sub-diálogo de Conflicto de Deck */
            <div className="p-6 space-y-5 bg-zinc-950 flex-1 flex flex-col justify-center">
              <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-amber-200">Esta copia física pertenece a un Deck activo</h4>
                  <p className="text-amber-300/80 leading-relaxed">
                    La copia seleccionada (Rareza: <strong>{selectedUserCard.rarity || 'Common'}</strong>) está registrada actualmente en:
                    <br />
                    <span className="font-mono font-bold text-amber-200">⚔️ {selectedUserCard.deck_details?.name || 'Deck Activo'}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-300">¿Cómo deseas proceder con esta carta?</p>
                
                <button
                  onClick={() => handleResolveConflict('move')}
                  className="w-full p-3.5 bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-bold text-xs flex items-center justify-between transition-all shadow-md cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowRight className="w-4 h-4 text-red-200 group-hover:translate-x-1 transition-transform" />
                    <div className="text-left">
                      <div>Desvincular del Deck y Mover</div>
                      <div className="text-[10px] font-normal text-red-100/80">Remueve la física del deck anterior y la asigna a {targetContainerName}</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => handleResolveConflict('proxy')}
                  className="w-full p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl font-bold text-xs flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <div className="text-left">
                      <div>Mantener Marcador (Proxy) en Deck</div>
                      <div className="text-[10px] font-normal text-zinc-400">Deja la anotación de proxy en el deck y mueve la carta física a {targetContainerName}</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                  onClick={() => setShowDeckConflict(false)}
                  className="w-full py-2 bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Regresar a la selección de copias
                </button>
              </div>
            </div>
          ) : (
            /* Lista de Copias Físicas */
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {userCards.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                  No hay copias físicas registradas para esta carta.
                </div>
              ) : (
                userCards.map((uc) => {
                  const sleeveHex = uc.sleeve_type !== 'none' && uc.sleeve_color ? getSleeveColorHex(uc.sleeve_color) : undefined;
                  const isInDeck = Boolean(uc.deck_id || uc.deck_details);

                  return (
                    <motion.div
                      key={uc.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleCardClick(uc)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isInDeck
                          ? 'bg-zinc-900/70 border-amber-500/40 hover:border-amber-500/80 hover:bg-amber-950/20'
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-red-500/80 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Miniatura con Indicador de Funda */}
                        <div className="relative w-11 h-16 bg-zinc-950 rounded-md overflow-hidden shrink-0 border border-zinc-700 shadow-sm">
                          <img
                            src={uc.card_details?.image_url_small || card.image_url_small || card.image_url}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          {sleeveHex && (
                            <div
                              className="absolute inset-0 border-2 rounded-md pointer-events-none"
                              style={{ borderColor: sleeveHex }}
                              title={`Funda: ${uc.sleeve_color || 'Asignada'}`}
                            />
                          )}
                        </div>

                        {/* Detalles Físicos */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Badge de Rareza */}
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase border ${getRarityBadgeStyle(uc.rarity)}`}>
                              {uc.rarity || 'Common'}
                            </span>

                            {/* Badge de Condición */}
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px] font-mono font-bold">
                              {uc.condition || 'NM'}
                            </span>

                            {/* Indicator de Proxy */}
                            {uc.is_proxy && (
                              <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-mono font-black uppercase">
                                Proxy
                              </span>
                            )}
                          </div>

                          {/* Funda e información secundaria */}
                          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 truncate">
                            {uc.sleeve_type !== 'none' ? (
                              <span className="flex items-center gap-1 text-zinc-300">
                                <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span className="truncate">Funda {uc.sleeve_color || 'Estándar'}</span>
                              </span>
                            ) : (
                              <span className="text-zinc-600">Sin Funda</span>
                            )}
                            <span>•</span>
                            <span className="text-zinc-400 font-bold">{uc.quantity}x copia</span>
                          </div>

                          {/* Ubicación / Asignación actual */}
                          <div className="text-[11px] font-mono flex items-center gap-1 truncate">
                            {isInDeck ? (
                              <span className="text-amber-400 font-bold flex items-center gap-1 truncate">
                                ⚔️ En Deck: {uc.deck_details?.name || 'Deck Activo'}
                              </span>
                            ) : uc.storage_location_id ? (
                              <span className="text-zinc-400 truncate">
                                📦 Almacén registrado
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold truncate">
                                📥 Sin Clasificar (Inbox)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botón Acción */}
                      <button className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shrink-0 transition-all shadow-xs">
                        Seleccionar
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
