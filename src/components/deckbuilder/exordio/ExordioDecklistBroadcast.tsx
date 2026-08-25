'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shield, Swords, Award, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';
import { ExordioAnalysisResult } from '@/lib/engines/exordioAnalytics';

interface ExordioDecklistBroadcastProps {
  deckCards: DeckCard[];
  analysis: ExordioAnalysisResult;
  format?: string;
  onCardClick?: (card: DeckCard) => void;
}

export const ExordioDecklistBroadcast: React.FC<ExordioDecklistBroadcastProps> = ({
  deckCards,
  analysis,
  format = 'TCG',
  onCardClick,
}) => {
  const mainCards = deckCards.filter((c) => c.section === 'main');
  const extraCards = deckCards.filter((c) => c.section === 'extra');
  const totalMainCount = mainCards.reduce((acc, c) => acc + c.count, 0);

  const {
    variant,
    nonEngineCount,
    nonEngineGrade,
    finalScore,
    scoreRankBadge,
    goingFirstViability,
    goingSecondViability,
    deckType,
    tierRank,
    difficulty,
    mainStats,
  } = analysis;

  // Renderizar cartas con repeticiones visuales exactas (ej. 3 copias = 3 cartas mostradas)
  const renderCardGrid = (cards: DeckCard[], isExtra: boolean = false) => {
    const flattenedList: DeckCard[] = [];
    cards.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        flattenedList.push(c);
      }
    });

    return (
      <div
        className={`grid ${
          isExtra ? 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10' : 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10'
        } gap-1.5`}
      >
        {flattenedList.map((card, idx) => (
          <motion.div
            key={`${card.id}-${idx}`}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            onClick={() => onCardClick?.(card)}
            className="cursor-pointer relative aspect-2/3 rounded overflow-hidden border border-zinc-300 dark:border-zinc-800 shadow-sm hover:border-red-500 transition-all"
          >
            <Image
              src={card.image_url}
              alt={card.name}
              fill
              sizes="60px"
              className="object-cover"
              unoptimized
            />
            {card.ban_tcg && card.ban_tcg !== 'Unlimited' && (
              <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                {card.ban_tcg === 'Limited' ? '1' : card.ban_tcg === 'Semi-Limited' ? '2' : 'X'}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto tech-cut-tr overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-xl transition-colors relative">
      {/* Header Banner Estilo Exordio */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-red-600 text-white font-black tracking-wider text-sm md:text-base border-b border-red-700 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="bg-white text-red-600 px-2.5 py-0.5 font-black text-xs uppercase shadow-sm tech-cut-tr">
            [ 05 ] FULL DECKLIST
          </span>
          <span className="italic font-black text-white/90">Deck Analysis - {format} Format</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-red-200 font-bold hidden sm:inline tracking-widest">// ROSTER GRID //</span>
          <span className="text-[10px] font-mono text-white font-black tracking-widest">× × ×</span>
          <Layers className="w-5 h-5 text-amber-300" />
        </div>
      </div>

      {/* Barra de Título del Deck */}
      <div className="px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-1.5 h-6 bg-red-600 rounded-full" />
          <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
            DECKLIST ({totalMainCount})
          </h2>
          <span className="px-2 py-0.5 bg-red-600/20 text-red-600 dark:text-red-400 rounded text-xs font-bold uppercase">
            VARIANT: {variant}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase">NON-ENGINE:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs border border-emerald-500/30">
            {nonEngineCount}+ ({nonEngineGrade})
          </span>
        </div>
      </div>

      {/* Grid: Decklist a la Izquierda, Panel Resumen a la Derecha */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Columna Izquierda: Cartas de Main & Extra Deck */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">
              MAIN DECK ({totalMainCount} CARDS)
            </span>
            {renderCardGrid(mainCards, false)}
          </div>

          {extraCards.length > 0 && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">
                EXTRA DECK ({extraCards.reduce((acc, c) => acc + c.count, 0)} CARDS)
              </span>
              {renderCardGrid(extraCards, true)}
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen de Estadísticas & Tier */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Mini Main Stats */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white block pb-1 border-b border-zinc-200 dark:border-zinc-800">
              DECK&apos;S MAIN STATS
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-zinc-600 dark:text-zinc-400">ATTACK:</span>
                <span className="font-mono text-red-500">{mainStats.attack}/10</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-zinc-600 dark:text-zinc-400">CONTROL:</span>
                <span className="font-mono text-red-500">{mainStats.control}/10</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-zinc-600 dark:text-zinc-400">CONSISTENCY:</span>
                <span className="font-mono text-red-500">{mainStats.consistency}/10</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-zinc-600 dark:text-zinc-400">BOARD BREAKING:</span>
                <span className="font-mono text-red-500">{mainStats.boardBreaking}/10</span>
              </div>
            </div>
          </div>

          {/* Final Score */}
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
              FINAL SCORE
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black font-mono text-white">
                {finalScore.toFixed(1)}
              </span>
              <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded uppercase">
                {scoreRankBadge}
              </span>
            </div>
          </div>

          {/* Better Start */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">
              BETTER START?
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                1st: {goingFirstViability}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                2nd: {goingSecondViability}
              </span>
            </div>
          </div>

          {/* Deck Difficulty */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <span className="text-xs font-black uppercase text-zinc-900 dark:text-white block mb-1">
              DECK DIFFICULTY
            </span>
            <span className="text-xs text-red-500 font-bold block">
              {difficulty.label}
            </span>
          </div>

          {/* Deck Type & Tier */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-r from-zinc-900 to-black text-center space-y-1">
            <div className="text-xs font-bold text-zinc-400 uppercase">
              DECK TYPE: <span className="text-white font-black">{deckType}</span>
            </div>
            <div className="text-xs font-bold text-amber-400 uppercase">
              {tierRank}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
