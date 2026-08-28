'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Layers, ArrowRight, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useIdealEnvironment } from '@/context/IdealEnvironmentContext';
import { PhysicalStagingAssistantModal } from './PhysicalStagingAssistantModal';
import { UniversalDeckWorkspaceModal } from './UniversalDeckWorkspaceModal';
import { Deck, StorageLocation, UserCard, IdealSyncLog } from '@/types/collection';

export function IdealReportModal() {
  const { isReportModalOpen, closeReportModal, syncData } = useIdealEnvironment();
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [workspaceDeck, setWorkspaceDeck] = useState<Deck | null>(null);

  const mappedDecks: Deck[] = useMemo(() => {
    if (!syncData?.idealDecks) return [];
    return syncData.idealDecks.map(d => ({
      id: d.id,
      name: d.name || 'Deck Optimizado',
      description: d.description || '',
      format: d.format || 'Advanced',
      is_active: true,
      created_at: new Date().toISOString(),
      cards: (d.cards || []).map((c: { card_id: number; count: number; section: string; card_details?: UserCard['card_details'] }) => ({
        card_id: c.card_id,
        count: c.count,
        section: c.section || 'main',
        card_details: c.card_details
      })),
      sleeves: []
    }));
  }, [syncData]);

  const mappedLocations: StorageLocation[] = useMemo(() => {
    if (!syncData?.idealContainers) return [];
    return syncData.idealContainers.map(loc => ({
      id: loc.id,
      name: loc.name || 'Contenedor',
      type: loc.type || 'box',
      sub_type: loc.sub_type || 'standard',
      color_code: loc.color_code || '#ef4444',
      dimensions: loc.dimensions || { width: 100, height: 100, depth: 100 },
      capacity: loc.capacity || 100,
      grid_layout: loc.grid_layout || { rows: 1, cols: 1, pockets_per_page: 9, total_pages: 1 },
      compartments: loc.compartments || { count: 1, names: ['Principal'] },
      render_style: loc.render_style || 'default',
      description: loc.description,
      created_at: new Date().toISOString(),
      occupied_cards: loc.occupied_cards || 0
    }));
  }, [syncData]);

  const mappedCards: UserCard[] = useMemo(() => {
    if (!syncData?.idealCards) return [];
    return syncData.idealCards.map((c, idx) => ({
      id: c.id || `ideal-card-${idx}`,
      card_id: c.card_id || 0,
      storage_location_id: c.storage_location_id || null,
      deck_id: c.deck_id || null,
      deck_section: c.deck_section || null,
      compartment_index: c.compartment_index || 0,
      rarity: c.rarity || 'Common',
      condition: c.condition || 'Near Mint',
      language: c.language || 'ES',
      quantity: c.quantity || 1,
      status_flag: c.status_flag || 'collection',
      sleeve_type: c.sleeve_type || 'none',
      is_grayscale_shared: c.is_grayscale_shared,
      shared_notes: c.shared_notes,
      reorganization_reason: c.reorganization_reason,
      created_at: new Date().toISOString(),
      card_details: c.card_details
    }));
  }, [syncData]);

  if (!isReportModalOpen || !syncData) return null;

  const deckLogs = syncData.logs.filter(l => l.category === 'deck_created');
  const binderLogs = syncData.logs.filter(l => l.category === 'card_promoted');
  const bulkLogs = syncData.logs.filter(l => l.category === 'bulk_sorted');

  const totalCardsPromoted = binderLogs.reduce((acc, l) => acc + (l.card_count || 0), 0);

  const toggleExpand = (logId: string) => {
    setExpandedLogId(prev => prev === logId ? null : logId);
  };

  const handleOpenDeckWorkspace = (log: Omit<IdealSyncLog, 'id' | 'created_at'>) => {
    // 1. Match by explicit IDs
    let foundDeck = mappedDecks.find(d => 
      (log.ideal_deck_id && d.id === log.ideal_deck_id) ||
      (log.deck_id && d.id === `ideal-deck-${log.deck_id}`)
    );

    // 2. Match by cleaned title
    if (!foundDeck) {
      const cleanName = log.title.replace(/^Deck Optimizador:\s*/i, '').trim().toLowerCase();
      foundDeck = mappedDecks.find(d => d.name.toLowerCase() === cleanName || d.name.toLowerCase().includes(cleanName));
    }

    if (foundDeck) {
      setWorkspaceDeck(foundDeck);
    } else if (mappedDecks.length > 0) {
      setWorkspaceDeck(mappedDecks[0]);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-dvh sm:h-auto sm:max-h-[90vh]"
          >
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                    Reporte de Reorganización <span className="text-red-600 dark:text-red-500">Ideal</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                    Justificaciones y ajustes automáticos generados para tu ambiente gemelo.
                  </p>
                </div>
              </div>

              <button
                onClick={closeReportModal}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-11 min-w-11 flex items-center justify-center touch-manipulation"
                aria-label="Cerrar Reporte"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-800 dark:text-zinc-200 font-sans">
              
              {/* Executive Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Decks Card */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                      Decks y Variantes
                    </span>
                    <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">
                      {deckLogs.length} Armados
                    </span>
                  </div>
                </div>

                {/* Binders Card */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                      Promociones a Binders
                    </span>
                    <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">
                      {binderLogs.length} Lotes ({totalCardsPromoted} Cartas)
                    </span>
                  </div>
                </div>

                {/* Bulk Card */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider block">
                      Bulk Clasificado
                    </span>
                    <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">
                      {bulkLogs.length} Grupos
                    </span>
                  </div>
                </div>
              </div>

              {/* Shared Cards Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-bold block text-amber-900 dark:text-amber-200">Aviso de Cartas Compartidas</strong>
                  Las cartas que aparecen en <span className="font-bold underline decoration-amber-500">blanco y negro</span> en los decks o vistas corresponden a cartas utilizadas en múltiples variantes donde no posees suficientes copias físicas simultáneas.
                </div>
              </div>

              {/* Detail Justifications Logs */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display">
                  Detalle de Justificaciones y Cartas Reubicadas
                </h3>

                <div className="space-y-3">
                  {syncData.logs.map((log, index) => {
                    const logId = `log-${index}`;
                    const isExpanded = expandedLogId === logId;
                    const hasMovedCards = log.moved_cards && log.moved_cards.length > 0;
                    const hasDeckPreview = log.deck_cards_preview && log.deck_cards_preview.length > 0;
                    const isDeckLog = log.category === 'deck_created';

                    return (
                      <div
                        key={logId}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display">
                                  {log.title}
                                </h4>
                                {log.card_count && (
                                  <span className="px-2 py-0.5 bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold rounded-full font-mono">
                                    {log.card_count} cartas
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                                {log.description}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons for Log Row */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isDeckLog ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeckWorkspace(log)}
                                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer touch-manipulation min-h-9"
                                  title="Abrir modal de detalle de deck como en el sistema regular"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver cartas</span>
                                </button>
                                {hasDeckPreview && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(logId)}
                                    className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer min-h-9 min-w-9 touch-manipulation"
                                    title={isExpanded ? 'Ocultar vista previa rápida' : 'Desplegar vista previa rápida'}
                                    aria-label="Desplegar vista previa"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                )}
                              </>
                            ) : (
                              hasMovedCards && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(logId)}
                                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-red-500 hover:text-red-500 text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer min-h-9 touch-manipulation"
                                >
                                  <span>{isExpanded ? 'Ocultar cartas' : 'Ver cartas'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Expandable Deck Cards Preview Grid */}
                        <AnimatePresence>
                          {isExpanded && isDeckLog && hasDeckPreview && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                                  Vista Previa de Cartas Clave:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeckWorkspace(log)}
                                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer min-h-8 touch-manipulation"
                                >
                                  <span>Abrir Modal de Detalle de Deck</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                                {log.deck_cards_preview!.map((cp, idx) => (
                                  <div
                                    key={idx}
                                    className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center text-center group hover:border-red-500 transition-all"
                                  >
                                    <div className="w-full aspect-2/3 relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-1">
                                      {cp.image_url ? (
                                        <Image src={cp.image_url} alt={cp.name} fill unoptimized sizes="100px" className="object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-zinc-500">
                                          YGO
                                        </div>
                                      )}
                                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono font-black px-1 rounded z-10">
                                        x{cp.count}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate w-full">
                                      {cp.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Expandable Moved Cards List */}
                        <AnimatePresence>
                          {isExpanded && hasMovedCards && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800"
                            >
                              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-3 font-mono">
                                Cartas Específicas Reubicadas ({log.moved_cards!.length}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                                {log.moved_cards!.map((mc, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-2 text-xs"
                                  >
                                    {mc.image_url ? (
                                      <Image src={mc.image_url} alt={mc.name} width={32} height={44} unoptimized className="w-8 h-11 object-cover rounded-md shrink-0" />
                                    ) : (
                                      <div className="w-8 h-11 bg-zinc-200 dark:bg-zinc-800 rounded-md shrink-0 flex items-center justify-center text-[9px] font-mono">
                                        YGO
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <strong className="text-zinc-900 dark:text-white truncate block font-bold">
                                        {mc.name}
                                      </strong>
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono block">
                                        {mc.rarity}
                                      </span>
                                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                                        <span>{mc.from_location}</span>
                                        <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{mc.to_location}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={closeReportModal}
                className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation"
              >
                Cerrar Reporte
              </button>

              <button
                type="button"
                onClick={() => setIsStagingModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer font-display min-h-11 touch-manipulation"
              >
                <span>Asistente de Reorganización Física</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Staging Assistant Sub-Modal */}
      <PhysicalStagingAssistantModal
        isOpen={isStagingModalOpen}
        onClose={() => setIsStagingModalOpen(false)}
      />

      {/* Universal Deck Workspace Modal */}
      {workspaceDeck && (
        <UniversalDeckWorkspaceModal
          key={workspaceDeck.id}
          deck={workspaceDeck}
          isOpen={!!workspaceDeck}
          onClose={() => setWorkspaceDeck(null)}
          onSelectDeck={(d) => setWorkspaceDeck(d)}
          locations={mappedLocations}
          decks={mappedDecks}
          sleeves={[]}
          allUserCards={mappedCards}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}
