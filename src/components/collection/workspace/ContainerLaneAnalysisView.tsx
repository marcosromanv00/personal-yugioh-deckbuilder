'use client';

import React from 'react';
import { Layers, Swords, Settings, Boxes, AlertCircle } from 'lucide-react';
import { StorageLocation, UserCard, Deck } from '@/types/collection';
import { analyzeLanePatterns, LaneCluster } from '@/lib/cardClassificationEngine';

interface ContainerLaneAnalysisViewProps {
  activeCompartment: number;
  currentLocation: StorageLocation | null;
  location: StorageLocation | null;
  internalDecks: Deck[];
  activeLaneCards: UserCard[];
  lanePatternReport: ReturnType<typeof analyzeLanePatterns>;
  activeClusterFilter: string | null;
  setActiveClusterFilter: (f: string | null) => void;
  expandedClusterSubId: string | null;
  setExpandedClusterSubId: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenAssignDeckModal: (compartmentIdx: number) => void;
  onOpenPickListForCluster: (cluster: LaneCluster, title: string, subtitle: string) => void;
  onOpenPickListForSubArchetype: (sub: NonNullable<LaneCluster['subArchetypes']>[number]) => void;
  onMoveMisplacedCard: (userCardId: string, suggestedLocationId: string, cardName: string, suggestedLocationName: string) => Promise<void>;
}

export const ContainerLaneAnalysisView: React.FC<ContainerLaneAnalysisViewProps> = ({
  activeCompartment,
  currentLocation,
  location,
  internalDecks,
  activeLaneCards,
  lanePatternReport,
  activeClusterFilter,
  setActiveClusterFilter,
  expandedClusterSubId,
  setExpandedClusterSubId,
  onOpenAssignDeckModal,
  onOpenPickListForCluster,
  onOpenPickListForSubArchetype,
  onMoveMisplacedCard,
}) => {
  return (
    <div className="space-y-3.5">
      {/* Tarjeta de Mazo Asignado al Carril (Si aplica) */}
      {activeCompartment !== -1 && (
        (() => {
          const activeLoc = currentLocation || location;
          const assignedDeckId = activeLoc?.compartments?.deck_ids?.[activeCompartment];
          const assignedDeck = assignedDeckId ? internalDecks.find(d => d.id === assignedDeckId) : null;

          if (assignedDeck) {
            const deckCardsInLane = activeLaneCards.filter(c => c.deck_id === assignedDeck.id || c.deck_details?.name === assignedDeck.name);
            const totalDeckCardsCount = (assignedDeck.cards || []).reduce((sum, c) => sum + c.count, 0) || 40;
            const physicalCardsPresent = deckCardsInLane.reduce((sum, c) => sum + (c.quantity || 1), 0);
            const percentagePresent = Math.min(100, Math.round((physicalCardsPresent / Math.max(1, totalDeckCardsCount)) * 100));

            return (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-2xl space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Swords className="w-3 h-3" />
                    <span>Mazo Asignado</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenAssignDeckModal(activeCompartment)}
                    className="text-[10.5px] font-mono font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Configurar</span>
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>{assignedDeck.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">({assignedDeck.format || 'Master Duel'})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Este carril está configurado como la ubicación física de este mazo.
                  </p>
                </div>

                {/* Barra de progreso de presencia física */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-zinc-600 dark:text-zinc-400">Presencia Física en Carril:</span>
                    <span className="text-red-600 dark:text-red-400 font-black">{physicalCardsPresent} / {totalDeckCardsCount} cartas ({percentagePresent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${percentagePresent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="p-3 bg-zinc-100/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">
                  ¿Guardas un mazo aquí?
                </span>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium truncate">
                  Asigna un mazo a este carril para rastrear sus cartas físicas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAssignDeckModal(activeCompartment)}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Asignar</span>
              </button>
            </div>
          );
        })()
      )}

      {/* Resumen del Carril */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/40">
            {activeCompartment === -1 ? 'Todo el Contenedor' : `Carril ${activeCompartment + 1}`}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 font-bold">
            {lanePatternReport.totalCards} cartas ({lanePatternReport.uniqueCards} únicas)
          </span>
        </div>
        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
          {lanePatternReport.dominantTheme} ({lanePatternReport.dominantPercentage}%)
        </h4>
        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {lanePatternReport.summaryRecommendation}
        </p>
      </div>

      {/* Coincidencias y Clusters Detectados */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>Grupos Detectados ({lanePatternReport.clusters.length})</span>
          </span>
          {activeClusterFilter && (
            <button
              type="button"
              onClick={() => setActiveClusterFilter(null)}
              className="text-[10px] font-mono text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        <div className="space-y-2">
          {lanePatternReport.clusters.map(cluster => {
            const isFiltered = activeClusterFilter === cluster.id;
            return (
              <div
                key={cluster.id}
                onClick={() => setActiveClusterFilter(isFiltered ? null : cluster.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 shadow-2xs ${
                  isFiltered
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-900 dark:text-red-200'
                    : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {cluster.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                    {cluster.count} cartas ({cluster.percentage}%)
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  {cluster.description}
                </p>

                {/* Desglose de Sub-Arquetipos */}
                {cluster.subArchetypes && cluster.subArchetypes.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                        Sub-arquetipos ({cluster.subArchetypes.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedClusterSubId(p => p === cluster.id ? null : cluster.id)}
                        className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>{expandedClusterSubId === cluster.id ? '▲ Ocultar' : '▼ Ver todos'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {(expandedClusterSubId === cluster.id ? cluster.subArchetypes : cluster.subArchetypes.slice(0, 4)).map(sub => {
                        const isSubFiltered = activeClusterFilter === sub.id;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => setActiveClusterFilter(isSubFiltered ? null : sub.id)}
                            className={`px-2 py-0.8 rounded-lg text-[9.5px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                              isSubFiltered
                                ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-purple-400 dark:hover:border-purple-600'
                            }`}
                            title={`${sub.count} cartas (${sub.uniqueCount} únicas) de ${sub.archetypeName}. Haz clic para filtrar cuadrícula.`}
                          >
                            <span className="truncate max-w-28">{sub.archetypeName}</span>
                            <span className={`px-1 py-0.2 rounded text-[8.5px] font-black ${isSubFiltered ? 'bg-purple-800 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                              {sub.count}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPickListForSubArchetype(sub);
                              }}
                              className="ml-0.5 p-1 hover:bg-red-600 hover:text-white rounded text-zinc-400 dark:text-zinc-400 transition-colors"
                              title={`Abrir ruta de recolección para ${sub.archetypeName}`}
                            >
                              <Boxes className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      {expandedClusterSubId !== cluster.id && cluster.subArchetypes.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setExpandedClusterSubId(cluster.id)}
                          className="px-1.5 py-0.8 text-[9.5px] font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                        >
                          +{cluster.subArchetypes.length - 4} más...
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  {cluster.suggestedAction && (
                    <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      💡 {cluster.suggestedAction}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPickListForCluster(cluster, `Ruta: ${cluster.name}`, cluster.description);
                      }}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Abrir lista de recolección física para este grupo"
                    >
                      <Boxes className="w-3 h-3" />
                      <span>Ruta</span>
                    </button>
                    <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isFiltered 
                        ? 'bg-red-600 text-white' 
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                    }`}>
                      {isFiltered ? 'Filtro Activo' : 'Filtrar grid'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cartas Fuera de Lugar */}
      {lanePatternReport.misplacedCards.length > 0 && (
        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono font-black text-amber-700 dark:text-amber-400 uppercase">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cartas Fuera de Lugar ({lanePatternReport.misplacedCards.length})</span>
          </div>
          <div className="space-y-2">
            {lanePatternReport.misplacedCards.map((m, idx) => (
              <div key={idx} className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0">
                  <h6 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{m.cardName}</h6>
                  <p className="text-[9.5px] text-amber-600 dark:text-amber-400 font-mono">
                    {m.rarity} • Sugerido: {m.suggestedLocationName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onMoveMisplacedCard(m.userCardId, m.suggestedLocationId || '', m.cardName, m.suggestedLocationName)}
                  className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Mover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
