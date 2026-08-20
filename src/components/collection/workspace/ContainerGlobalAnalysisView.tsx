'use client';

import React from 'react';
import { Layers, Boxes, AlertCircle, CheckCircle2 } from 'lucide-react';
import { analyzeGlobalCollectionPatterns, LaneCluster } from '@/lib/cardClassificationEngine';
import { DispersedCardSummary, getLanguageDisplay } from '@/lib/collectionUtils';

interface ContainerGlobalAnalysisViewProps {
  totalCollectionCount: number;
  globalCollectionReport: ReturnType<typeof analyzeGlobalCollectionPatterns>;
  allDispersedCards: DispersedCardSummary[];
  expandedClusterSubId: string | null;
  setExpandedClusterSubId: React.Dispatch<React.SetStateAction<string | null>>;
  onOpenPickListForCluster: (cluster: LaneCluster, title: string, subtitle: string) => void;
  onOpenPickListForSubArchetype: (sub: NonNullable<LaneCluster['subArchetypes']>[number]) => void;
  onOpenPickListForDispersed: (disp: DispersedCardSummary) => void;
}

export const ContainerGlobalAnalysisView: React.FC<ContainerGlobalAnalysisViewProps> = ({
  totalCollectionCount,
  globalCollectionReport,
  allDispersedCards,
  expandedClusterSubId,
  setExpandedClusterSubId,
  onOpenPickListForCluster,
  onOpenPickListForSubArchetype,
  onOpenPickListForDispersed,
}) => {
  return (
    <div className="space-y-3.5">
      {/* Resumen Global */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/40">
            Colección Total
          </span>
          <span className="text-[10px] font-mono text-zinc-500 font-bold">
            {totalCollectionCount} cartas
          </span>
        </div>
        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
          Diagnóstico & Agrupaciones Globales
        </h4>
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10.5px] font-mono">
          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 block text-[9px]">Grupos/Cores:</span>
            <span className="font-black text-purple-600 dark:text-purple-400 text-xs">
              {globalCollectionReport.globalClusters.length}
            </span>
          </div>
          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 block text-[9px]">Decks Listos:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
              {globalCollectionReport.deckOpportunities.filter(d => d.readyToAssignCount > 0).length}
            </span>
          </div>
          <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 block text-[9px]">Dispersas:</span>
            <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
              {allDispersedCards.length}
            </span>
          </div>
        </div>
      </div>

      {/* Grupos y Arquetipos Detectados en Toda la Colección */}
      <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-mono font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>Agrupaciones Globales ({globalCollectionReport.globalClusters.length})</span>
          </h5>
        </div>

        <div className="space-y-2">
          {globalCollectionReport.globalClusters.map((cluster) => (
            <div key={cluster.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{cluster.name}</span>
                <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                  {cluster.count} cartas ({cluster.percentage}%)
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {cluster.description}
              </p>

              {/* Desglose de Sub-Arquetipos Globales */}
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
                      return (
                        <div
                          key={sub.id}
                          className="px-2 py-0.8 rounded-lg text-[9.5px] font-mono font-bold border bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-2xs"
                          title={`${sub.count} cartas (${sub.uniqueCount} únicas) de ${sub.archetypeName} en la colección.`}
                        >
                          <span className="truncate max-w-28">{sub.archetypeName}</span>
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {sub.count}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPickListForSubArchetype(sub);
                            }}
                            className="ml-0.5 p-1 hover:bg-red-600 hover:text-white rounded text-zinc-400 dark:text-zinc-400 transition-colors"
                            title={`Ruta global de recolección para ${sub.archetypeName}`}
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

              <div className="flex items-center justify-between pt-1">
                {cluster.suggestedAction && (
                  <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    💡 {cluster.suggestedAction}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onOpenPickListForCluster(cluster, `Ruta Global: ${cluster.name}`, cluster.description)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                  title="Iniciar recolección física de este grupo"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Ruta de Recolección</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cartas Dispersas / Fragmentadas en Múltiples Ubicaciones */}
      {allDispersedCards.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-mono font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Cartas Dispersas ({allDispersedCards.length})</span>
            </h5>
          </div>
          <p className="text-[11px] text-zinc-500">
            Copias de la misma carta divididas en diferentes cajas, carpetas o idiomas.
          </p>

          <div className="space-y-2">
            {allDispersedCards.slice(0, 10).map((disp) => (
              <div key={disp.cardId} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <h6 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {disp.cardName}
                  </h6>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{disp.totalCopies}x copias</span>
                    <span>•</span>
                    <span>{disp.distinctLocationsCount} ubicaciones</span>
                    <span>•</span>
                    <span>{disp.languagesList.map(l => getLanguageDisplay(l).badge).join(', ')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenPickListForDispersed(disp)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-mono font-bold shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <Boxes className="w-3 h-3" />
                  <span>Reunir</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mazos con Piezas Disponibles */}
      {globalCollectionReport.deckOpportunities.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs">
          <h5 className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mazos con Piezas Listas</span>
          </h5>

          <div className="space-y-2">
            {globalCollectionReport.deckOpportunities.slice(0, 4).map(deck => (
              <div key={deck.deckId} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{deck.deckName}</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {deck.readyToAssignCount}/{deck.totalNeeded} listas
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {deck.completionPossibleNow ? '✨ ¡Todas las cartas necesarias están en tu colección!' : `Tienes ${deck.readyToAssignCount} de las cartas faltantes.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
