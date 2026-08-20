'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  MapPin, 
  ArrowRight, 
  Boxes, 
  Package, 
  Layers, 
  X, 
  Sparkles,
  CheckSquare,
  Square,
  Loader2,
  Wrench,
  Swords
} from 'lucide-react';
import { StorageLocation, UserCard } from '@/types/collection';
import { LaneCluster } from '@/lib/cardClassificationEngine';
import { getLanguageDisplay } from '@/lib/collectionUtils';
import { useToast } from '@/components/ui/ToastProvider';
import { DeckCard } from '@/components/deckbuilder/types';

interface PickListConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster?: LaneCluster | null;
  selectedCards?: UserCard[];
  title?: string;
  subtitle?: string;
  allCollectionCards: UserCard[];
  locations: StorageLocation[];
  defaultTargetLocationId?: string | null;
  defaultTargetCompartmentIndex?: number;
  onSuccess?: () => void;
}

interface OriginGroup {
  locationId: string | null;
  locationName: string;
  locationType: string;
  compartmentIndex: number;
  compartmentName: string;
  cards: UserCard[];
  totalQuantity: number;
}

export const PickListConsolidationModal: React.FC<PickListConsolidationModalProps> = ({
  isOpen,
  onClose,
  cluster,
  selectedCards,
  title,
  subtitle,
  allCollectionCards,
  locations,
  defaultTargetLocationId,
  defaultTargetCompartmentIndex = 0,
  onSuccess,
}) => {
  const router = useRouter();
  const toast = useToast();
  const [checkedCardIds, setCheckedCardIds] = useState<Set<string>>(new Set());
  const [targetLocationId, setTargetLocationId] = useState<string>(
    defaultTargetLocationId === undefined ? 'inbox' : defaultTargetLocationId === null ? 'inbox' : defaultTargetLocationId
  );
  const [targetCompartmentIndex, setTargetCompartmentIndex] = useState<number>(defaultTargetCompartmentIndex);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determinar la lista de UserCards involucradas con resolución multi-nivel
  const targetUserCards = useMemo<UserCard[]>(() => {
    if (selectedCards && selectedCards.length > 0) return selectedCards;
    if (!cluster) return [];

    const pool = allCollectionCards && allCollectionCards.length > 0 ? allCollectionCards : [];
    if (pool.length === 0) return [];

    // Nivel 1: Coincidencia por userCardIds (como strings)
    if (cluster.userCardIds && cluster.userCardIds.length > 0) {
      const idSet = new Set(cluster.userCardIds.filter(Boolean).map(String));
      const matchedById = pool.filter(c => c.id && idSet.has(String(c.id)));
      if (matchedById.length > 0) return matchedById;
    }

    // Nivel 2: Coincidencia por cardIds (números o strings tolerantes)
    if (cluster.cardIds && cluster.cardIds.length > 0) {
      const cardIdSet = new Set(cluster.cardIds.filter(id => id != null).map(id => String(id)));
      const matchedByCardId = pool.filter(c => c.card_id != null && cardIdSet.has(String(c.card_id)));
      if (matchedByCardId.length > 0) return matchedByCardId;
    }

    // Nivel 3: Coincidencia por nombre de arquetipo si aplica
    const cleanArchetypeName = cluster.archetypeName || 
      (cluster.id?.startsWith('subarch-') ? cluster.id.replace('subarch-', '') : null) ||
      (cluster.id?.startsWith('global-subarch-') ? cluster.id.replace('global-subarch-', '') : null) ||
      (cluster.id?.startsWith('arch-') ? cluster.id.replace('arch-', '') : null) ||
      (cluster.id?.startsWith('global-arch-') ? cluster.id.replace('global-arch-', '') : null) ||
      (cluster.name?.startsWith('Arquetipo: ') ? cluster.name.replace('Arquetipo: ', '') : null) ||
      (cluster.name?.startsWith('Sub-Arquetipo: ') ? cluster.name.replace('Sub-Arquetipo: ', '') : null) ||
      (title?.startsWith('Ruta: ') ? title.replace('Ruta: ', '') : null);

    if (cleanArchetypeName) {
      const targetArchLower = cleanArchetypeName.trim().toLowerCase();
      const matchedByArch = pool.filter(c => 
        c.card_details?.archetype?.trim().toLowerCase() === targetArchLower
      );
      if (matchedByArch.length > 0) return matchedByArch;
    }

    return [];
  }, [selectedCards, cluster, allCollectionCards, title]);

  const locMap = useMemo(() => {
    const map = new Map<string, StorageLocation>();
    for (const loc of locations) {
      map.set(loc.id, loc);
    }
    return map;
  }, [locations]);

  // Agrupar las cartas por su contenedor físico de origen
  const originGroups = useMemo<OriginGroup[]>(() => {
    const groupsMap = new Map<string, OriginGroup>();

    for (const uc of targetUserCards) {
      const locId = uc.storage_location_id || null;
      const compIdx = uc.compartment_index || 0;
      const key = `${locId ?? 'inbox'}_${compIdx}`;

      if (!groupsMap.has(key)) {
        let locName = 'Sin Clasificar (Inbox)';
        let locType = 'inbox';
        let compName = 'Inbox Principal';

        if (locId) {
          const found = locMap.get(locId);
          if (found) {
            locName = found.name;
            locType = found.type;
            compName = found.compartments?.names?.[compIdx] || `Carril ${compIdx + 1}`;
          } else {
            locName = 'Contenedor';
          }
        }

        groupsMap.set(key, {
          locationId: locId,
          locationName: locName,
          locationType: locType,
          compartmentIndex: compIdx,
          compartmentName: compName,
          cards: [],
          totalQuantity: 0,
        });
      }

      const grp = groupsMap.get(key)!;
      grp.cards.push(uc);
      grp.totalQuantity += (uc.quantity || 1);
    }

    return Array.from(groupsMap.values());
  }, [targetUserCards, locMap]);

  const totalPhysicalCardsCount = useMemo(() => {
    return targetUserCards.reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [targetUserCards]);

  const totalCheckedCount = useMemo(() => {
    return targetUserCards
      .filter(c => checkedCardIds.has(c.id))
      .reduce((sum, c) => sum + (c.quantity || 1), 0);
  }, [targetUserCards, checkedCardIds]);

  const progressPercentage = totalPhysicalCardsCount > 0 
    ? Math.round((totalCheckedCount / totalPhysicalCardsCount) * 100) 
    : 0;

  // Seleccionar o deseleccionar todas
  const handleToggleCheckAll = () => {
    if (checkedCardIds.size === targetUserCards.length) {
      setCheckedCardIds(new Set());
    } else {
      setCheckedCardIds(new Set(targetUserCards.map(c => c.id)));
    }
  };

  const handleToggleCardCheck = (cardId: string) => {
    setCheckedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const targetLocationObj = useMemo(() => {
    if (targetLocationId === 'inbox') return null;
    return locMap.get(targetLocationId) || null;
  }, [targetLocationId, locMap]);

  // Ejecutar unificación digital
  const handleConfirmConsolidation = async () => {
    if (targetUserCards.length === 0) return;
    setIsSubmitting(true);
    try {
      const cardIdsToMove = targetUserCards.map(c => c.id);
      const targetLoc = targetLocationId === 'inbox' ? null : targetLocationId;

      const res = await fetch('/api/collection/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_move',
          card_ids: cardIdsToMove,
          target_storage_location_id: targetLoc,
          target_compartment_index: targetCompartmentIndex,
        }),
      });

      if (res.ok) {
        const destName = targetLocationObj ? targetLocationObj.name : 'Sin Clasificar (Inbox)';
        toast.success(
          `Se unificaron ${totalPhysicalCardsCount} cartas en ${destName}`,
          { title: '¡Lote Unificado!' }
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error('Ocurrió un error al mover las cartas.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red al unificar lote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transferir cartas al taller de construcción como borrador
  const handleSendToWorkshop = () => {
    if (targetUserCards.length === 0) return;

    const isExtraDeckType = (cardType?: string): boolean => {
      if (!cardType) return false;
      const t = cardType.toLowerCase();
      return t.includes('fusion') || t.includes('link') || t.includes('synchro') || t.includes('xyz');
    };

    const deckCardsMap = new Map<number, DeckCard>();
    for (const uc of targetUserCards) {
      const cId = Number(uc.card_id);
      const qty = uc.quantity || 1;
      const details = uc.card_details;
      const isExtra = isExtraDeckType(details?.type);

      if (deckCardsMap.has(cId)) {
        const existing = deckCardsMap.get(cId)!;
        existing.count = Math.min(3, existing.count + qty);
      } else {
        deckCardsMap.set(cId, {
          id: cId,
          name: details?.name || `Carta #${cId}`,
          count: Math.min(3, qty),
          proxy_count: 0,
          section: isExtra ? 'extra' : 'main',
          type: details?.type || 'Monster',
          image_url: details?.image_url || details?.image_url_small || `https://images.ygoprodeck.com/images/cards/${cId}.jpg`,
          image_url_small: details?.image_url_small || details?.image_url,
          archetype: details?.archetype,
          ban_master_duel: details?.ban_master_duel,
          ban_tcg: details?.ban_tcg,
          ban_duel_links: details?.ban_duel_links,
          atk: details?.atk,
          def: details?.def,
          level: details?.level,
          race: details?.race,
          attribute: details?.attribute,
          desc: details?.desc,
        });
      }
    }

    const mappedDeckCards = Array.from(deckCardsMap.values());
    const cleanDeckName = (title || cluster?.name || 'Mazo')
      .replace(/^Ruta:\s*/i, '')
      .replace(/^Sub-Arquetipo:\s*/i, '')
      .replace(/^Arquetipo:\s*/i, '')
      .replace(/^Ruta Global:\s*/i, '')
      .trim();

    const draft = {
      deckName: cleanDeckName || 'Mazo Nuevo',
      deckDescription: `Creado desde Análisis de Contenedores (${modalTitle})`,
      format: 'Master Duel',
      deckCards: mappedDeckCards,
      timestamp: Date.now()
    };

    localStorage.setItem('yg_deck_draft', JSON.stringify(draft));
    const totalCount = mappedDeckCards.reduce((s, c) => s + c.count, 0);
    toast.success(`Se enviaron ${totalCount} cartas al Taller de Mazos.`, {
      title: '¡Abriendo Taller!'
    });
    onClose();
    router.push('/?loadDraft=1');
  };

  if (!isOpen) return null;

  const modalTitle = title || cluster?.name || 'Ruta de Recolección y Unificación';
  const modalSubtitle = subtitle || cluster?.description || 'Recorre tus contenedores físicos para reunir este lote.';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 select-auto"
        >
          {/* HEADER */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 shadow-xs">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{modalTitle}</span>
                  <span className="text-[11px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-700 dark:text-zinc-300">
                    {totalPhysicalCardsCount} cartas
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {modalSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendToWorkshop}
                disabled={targetUserCards.length === 0}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                title="Abrir este conjunto de cartas en el taller de mazos"
              >
                <Wrench className="w-3.5 h-3.5 text-red-500" />
                <span>Enviar al taller</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PROGRESS BAR & CHECK ALL BAR */}
          <div className="px-5 py-3 bg-zinc-100/60 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-48">
              <div className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                Progreso Físico: <strong className="text-red-600 dark:text-red-400 font-black">{totalCheckedCount} / {totalPhysicalCardsCount}</strong> ({progressPercentage}%)
              </div>
              <div className="flex-1 max-w-40 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleCheckAll}
              className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 cursor-pointer"
            >
              {checkedCardIds.size === targetUserCards.length ? (
                <CheckSquare className="w-4 h-4 text-red-600" />
              ) : (
                <Square className="w-4 h-4 text-zinc-400" />
              )}
              <span>{checkedCardIds.size === targetUserCards.length ? 'Deseleccionar todo' : 'Marcar todas recogidas'}</span>
            </button>
          </div>

          {/* PICK LIST CONTAINER SCROLL */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {originGroups.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                No hay cartas seleccionadas para esta ruta de recolección.
              </div>
            ) : (
              originGroups.map((grp, gIdx) => {
                const groupCheckedCount = grp.cards.filter(c => checkedCardIds.has(c.id)).length;
                const isGroupFullyChecked = groupCheckedCount === grp.cards.length;

                return (
                  <div 
                    key={gIdx}
                    className="border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xs"
                  >
                    {/* ORIGIN HEADER */}
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-red-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                          {gIdx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span>{grp.locationName}</span>
                            </h4>
                            <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                              • {grp.compartmentName}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Extraer {grp.totalQuantity} carta(s) de este contenedor
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isGroupFullyChecked 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {groupCheckedCount} / {grp.cards.length} listas
                      </span>
                    </div>

                    {/* CARD ITEMS */}
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                      {grp.cards.map((card) => {
                        const isChecked = checkedCardIds.has(card.id);
                        const langInfo = getLanguageDisplay(card.language);

                        return (
                          <div
                            key={card.id}
                            onClick={() => handleToggleCardCheck(card.id)}
                            className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isChecked 
                                ? 'bg-red-50/40 dark:bg-red-950/15' 
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                className="text-zinc-400 hover:text-red-600 transition-colors shrink-0"
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-5 h-5 text-red-600 fill-red-50 dark:fill-red-950" />
                                ) : (
                                  <Square className="w-5 h-5 text-zinc-400" />
                                )}
                              </button>

                              <div className="w-9 h-12 rounded bg-zinc-900 overflow-hidden shrink-0 border border-zinc-300 dark:border-zinc-700">
                                {card.card_details && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img 
                                    src={card.card_details.image_url_small || card.card_details.image_url} 
                                    alt={card.card_details.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>

                              <div className="min-w-0">
                                <h5 className={`text-xs font-bold truncate ${
                                  isChecked ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'
                                }`}>
                                  {card.card_details?.name || `Carta #${card.card_id}`}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{card.quantity || 1}x</span>
                                  <span>•</span>
                                  <span className="truncate">{card.rarity || 'Common'}</span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 font-bold text-zinc-600 dark:text-zinc-400">
                                    <span>{langInfo.flag}</span>
                                    <span>{langInfo.badge}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              {card.binder_page && card.binder_slot ? (
                                <span className="text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                  Pág {card.binder_page} • Slot {card.binder_slot}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {grp.compartmentName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER & TARGET SELECTOR */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* DESTINATION CONTAINER PICKER */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-xs font-mono font-black uppercase text-zinc-500 shrink-0 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-red-500" />
                <span>Destino:</span>
              </span>

              <select
                value={targetLocationId}
                onChange={(e) => {
                  setTargetLocationId(e.target.value);
                  setTargetCompartmentIndex(0);
                }}
                className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 shadow-2xs"
              >
                <option value="inbox">📥 Sin Clasificar (Inbox)</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.type === 'binder' ? '📖' : '📦'} {l.name}
                  </option>
                ))}
              </select>

              {targetLocationObj?.compartments && targetLocationObj.compartments.count > 1 && (
                <select
                  value={targetCompartmentIndex}
                  onChange={(e) => setTargetCompartmentIndex(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 shadow-2xs"
                >
                  {targetLocationObj.compartments.names.map((cName, idx) => (
                    <option key={idx} value={idx}>
                      {cName || `Carril ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 min-h-11 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer touch-manipulation"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={targetUserCards.length === 0}
                onClick={handleSendToWorkshop}
                className="px-4 py-2 min-h-11 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-100 text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2 border border-zinc-700 dark:border-zinc-600 disabled:opacity-50 touch-manipulation"
                title="Cargar estas cartas en el constructor para armar y guardar un mazo"
              >
                <Wrench className="w-4 h-4 text-red-500" />
                <span>Enviar al taller</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting || targetUserCards.length === 0}
                onClick={handleConfirmConsolidation}
                className="px-4 py-2 min-h-11 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Unificando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Unificación ({totalPhysicalCardsCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
