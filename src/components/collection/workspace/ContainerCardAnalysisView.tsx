'use client';

import React from 'react';
import { Tag, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { analyzeCardClassification, BestRecommendation } from '@/lib/cardClassificationEngine';

interface ContainerCardAnalysisViewProps {
  selectedUserCard: UserCard | null;
  classificationReport: ReturnType<typeof analyzeCardClassification> | null;
  onApplyRecommendation: (rec: BestRecommendation) => void;
  onAssignToDeck: (deckId: string, deckName: string, section: string) => void;
}

export const ContainerCardAnalysisView: React.FC<ContainerCardAnalysisViewProps> = ({
  selectedUserCard,
  classificationReport,
  onApplyRecommendation,
  onAssignToDeck,
}) => {
  if (!classificationReport || !selectedUserCard) {
    return (
      <div className="p-6 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs">
        <Tag className="w-8 h-8 text-zinc-400 mx-auto opacity-50" />
        <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase">Selecciona una carta</h4>
        <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
          Haz clic en cualquier carta de la cuadrícula para ver su diagnóstico individual y destino recomendado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Header de la Carta */}
      <div className="flex gap-3 items-start bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={selectedUserCard.card_details?.image_url_small || selectedUserCard.card_details?.image_url}
          alt={selectedUserCard.card_details?.name || ''}
          className="w-16 rounded-lg shadow-sm shrink-0 border border-zinc-200 dark:border-zinc-800"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
            {selectedUserCard.card_details?.name}
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono uppercase">
            {selectedUserCard.card_details?.type}
          </p>
          {selectedUserCard.card_details?.archetype && (
            <span className="inline-block text-[9.5px] font-mono text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 px-1.5 py-0.5 rounded">
              {selectedUserCard.card_details.archetype}
            </span>
          )}
        </div>
      </div>

      {/* Tarjeta de Sugerencia Principal */}
      <div className={`p-3.5 rounded-2xl border ${
        classificationReport.bestRecommendation.badgeColor === 'emerald'
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
          : classificationReport.bestRecommendation.badgeColor === 'amber'
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
          : classificationReport.bestRecommendation.badgeColor === 'blue'
          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/40 text-blue-900 dark:text-blue-200'
          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200'
      } space-y-2 shadow-2xs`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-white/80 dark:bg-zinc-900/80 border border-current">
            {classificationReport.bestRecommendation.badgeLabel}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Sugerencia IA</span>
          </span>
        </div>
        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
          {classificationReport.bestRecommendation.title}
        </h4>
        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {classificationReport.bestRecommendation.description}
        </p>
        <button
          type="button"
          onClick={() => onApplyRecommendation(classificationReport.bestRecommendation)}
          className="w-full mt-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{classificationReport.bestRecommendation.actionLabel}</span>
        </button>
      </div>

      {/* Decks Activos que requieren esta carta */}
      <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completar Decks Activos</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {classificationReport.deckMatches.length} mazo(s)
          </span>
        </div>

        {classificationReport.deckMatches.length > 0 ? (
          <div className="space-y-2">
            {classificationReport.deckMatches.map(deck => (
              <div key={deck.deckId} className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {deck.deckName}
                  </h5>
                  <p className="text-[10px] font-mono text-zinc-500">
                    Sección: <span className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{deck.section}</span> • Faltan: <span className="font-black text-zinc-800 dark:text-zinc-200">{deck.neededCopies}x</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAssignToDeck(deck.deckId, deck.deckName, deck.section)}
                  className="shrink-0 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>Asignar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 italic py-0.5">
            Ningún mazo activo en tu biblioteca requiere esta carta actualmente.
          </p>
        )}
      </div>

      {/* Playset y Excedente */}
      <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-700 dark:text-zinc-300">Regla de Playset (3 copias):</span>
          <span className={`font-mono font-bold ${classificationReport.surplus.isSurplus ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
            {classificationReport.surplus.isSurplus ? `+${classificationReport.surplus.surplusCopies}x Excedente` : `${classificationReport.surplus.totalPhysicalInInventory}/3`}
          </span>
        </div>
        <p className="text-[10.5px] text-zinc-500">
          {classificationReport.surplus.isSurplus 
            ? 'Tienes más de 3 copias físicas de esta carta en tu colección. Las copias sobrantes pueden venderse o cambiarse.' 
            : 'Dentro del límite reglamentario de 3 copias para jugar.'}
        </p>
      </div>
    </div>
  );
};
