'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Flame, Crown } from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';

interface ExordioKeyCardsProps {
  keyCards: {
    mainStarters: DeckCard[];
    keyCards: DeckCard[];
    mainBeaters: DeckCard[];
    mainDefenders: DeckCard[];
    bestCard: DeckCard | null;
  };
  format?: string;
  onCardClick?: (card: DeckCard) => void;
}

export const ExordioKeyCards: React.FC<ExordioKeyCardsProps> = ({
  keyCards,
  format = 'TCG',
  onCardClick,
}) => {
  const { mainStarters, keyCards: coreCards, mainBeaters, mainDefenders, bestCard } = keyCards;

  const renderCardRow = (cards: DeckCard[], emptyLabel: string = 'Sin cartas') => {
    if (cards.length === 0) {
      return (
        <div className="h-28 flex items-center justify-center text-xs font-mono text-zinc-500 italic">
          {emptyLabel}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
        {cards.map((card, idx) => (
          <motion.div
            key={`${card.id}-${idx}`}
            whileHover={{ scale: 1.06, y: -4 }}
            className="shrink-0 cursor-pointer relative group rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md hover:shadow-red-500/20 hover:border-red-500/50 transition-all"
            onClick={() => onCardClick?.(card)}
          >
            <div className="w-20 h-28 relative">
              <Image
                src={card.image_url}
                alt={card.name}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
            {/* Tooltip con nombre */}
            <div className="absolute inset-x-0 bottom-0 bg-black/85 text-[10px] text-white font-bold p-1 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
              {card.name}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto tech-cut-tr overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-xl transition-colors relative">
      {/* Header Banner Estilo Exordio */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-red-600 text-white font-black tracking-wider text-sm md:text-base border-b border-red-700">
        <div className="flex items-center gap-3">
          <span className="bg-white text-red-600 px-2.5 py-0.5 font-black text-xs uppercase shadow-sm tech-cut-tr">
            [ 02 ] KEY CARDS
          </span>
          <span className="italic font-black text-white/90">Deck Analysis - {format} Format</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-red-200 font-bold hidden sm:inline tracking-widest">// ROLES &amp; ENGINES //</span>
          <span className="text-[10px] font-mono text-white font-black tracking-widest">× × ×</span>
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        </div>
      </div>

      {/* Grid de 6 Bloques Tácticos */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. MAIN BEATERS */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                  MAIN BEATERS
                </h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic">
                  Golpeadores principales del Deck
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-red-600 dark:text-red-400">
              {mainBeaters.length}
            </span>
          </div>
          {renderCardRow(mainBeaters, 'No hay beaters detectados')}
        </div>

        {/* 2. KEY CARDS */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                  KEY CARDS
                </h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic">
                  Cartas principales del Deck
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-500 dark:text-amber-400">
              {coreCards.length}
            </span>
          </div>
          {renderCardRow(coreCards, 'No hay key cards detectadas')}
        </div>

        {/* 3. BEST CARD (Showcase holográfico destacado) */}
        <div className="row-span-1 md:row-span-2 p-5 rounded-xl border-2 border-amber-500/50 bg-linear-to-b from-amber-500/10 via-zinc-900/40 to-black/60 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-1.5 mx-auto">
              <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
              <h3 className="text-xs font-black tracking-wider uppercase text-amber-400">
                BEST CARD
              </h3>
            </div>
          </div>

          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic mb-2">
            Mejor carta del Deck
          </p>

          {bestCard ? (
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="relative cursor-pointer my-auto rounded-lg overflow-hidden border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]"
              onClick={() => onCardClick?.(bestCard)}
            >
              <div className="w-44 h-64 relative">
                <Image
                  src={bestCard.image_url}
                  alt={bestCard.name}
                  fill
                  sizes="180px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/80 to-transparent p-2 text-center">
                <span className="text-xs font-black text-amber-300 block truncate drop-shadow">
                  {bestCard.name}
                </span>
                <span className="text-[10px] text-zinc-300 font-mono">
                  {bestCard.type}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-zinc-500 italic">
              Sin carta seleccionada
            </div>
          )}

          <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest mt-2">
            * Pieza central de la win condition
          </span>
        </div>

        {/* 4. MAIN DEFENDERS */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                  MAIN DEFENDERS
                </h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic">
                  Mejores defensores del Deck
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-cyan-500 dark:text-cyan-400">
              {mainDefenders.length}
            </span>
          </div>
          {renderCardRow(mainDefenders, 'No hay defensores detectados')}
        </div>

        {/* 5. MAIN STARTERS */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                  MAIN STARTERS
                </h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 italic">
                  Cartas principales que inician jugadas
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-500 dark:text-emerald-400">
              {mainStarters.length}
            </span>
          </div>
          {renderCardRow(mainStarters, 'No hay starters detectados')}
        </div>
      </div>
    </div>
  );
};
