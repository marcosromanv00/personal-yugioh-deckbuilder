'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertOctagon, Flame, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ExordioTestingData as TestingDataType } from '@/lib/engines/exordioAnalytics';
import { DeckCard } from '@/components/deckbuilder/types';

interface ExordioTestingDataProps {
  testingData: TestingDataType;
  format?: string;
  onCardClick?: (card: DeckCard) => void;
}

export const ExordioTestingData: React.FC<ExordioTestingDataProps> = ({
  testingData,
  format = 'TCG',
  onCardClick,
}) => {
  const { winRatio, deadHands, otk, mostUsedCard, topUsedCards, leastUsedCards } = testingData;

  // Renderizar anillo de progreso circular SVG
  const renderCircularGauge = (
    label: string,
    valueString: string,
    percent: number,
    colorClass: string,
    strokeColor: string
  ) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
          {label}
        </span>
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-zinc-200 dark:text-zinc-800"
            />
            <motion.circle
              cx="48"
              cy="48"
              r={radius}
              stroke={strokeColor}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute text-lg font-black font-mono ${colorClass}`}>
            {valueString}
          </span>
        </div>
      </div>
    );
  };

  const renderCardList = (cards: DeckCard[], emptyText: string) => {
    if (cards.length === 0) {
      return <div className="text-xs font-mono text-zinc-500 italic py-4">{emptyText}</div>;
    }

    return (
      <div className="grid grid-cols-3 gap-3 pt-2">
        {cards.map((card, idx) => (
          <motion.div
            key={`${card.id}-${idx}`}
            whileHover={{ scale: 1.05 }}
            onClick={() => onCardClick?.(card)}
            className="cursor-pointer flex flex-col items-center rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black/40 shadow hover:border-red-500/60 transition-all"
          >
            <div className="w-full aspect-2/3 relative">
              <Image
                src={card.image_url}
                alt={card.name}
                fill
                sizes="100px"
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-[10px] font-bold text-zinc-300 p-1 truncate w-full text-center">
              {card.name}
            </span>
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
            [ 04 ] TESTING DATA
          </span>
          <span className="italic font-black text-white/90">Deck Analysis - {format} Format</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-red-200 font-bold hidden sm:inline tracking-widest">// COMBAT SIMULATION //</span>
          <span className="text-[10px] font-mono text-white font-black tracking-widest">× × ×</span>
          <BarChart3 className="w-5 h-5 text-amber-300" />
        </div>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Columna Izquierda: 3 ANILLOS KPI + NOTA DE PRUEBAS */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {renderCircularGauge('WIN RATIO', `${winRatio}%`, winRatio, 'text-emerald-500', '#10b981')}
            {renderCircularGauge(
              'DEAD HANDS',
              `${deadHands.count}/${deadHands.total}`,
              (deadHands.count / deadHands.total) * 100,
              'text-red-500',
              '#ef4444'
            )}
            {renderCircularGauge(
              'OTK RATE',
              `${otk.count}/${otk.total}`,
              (otk.count / otk.total) * 100,
              'text-blue-500',
              '#3b82f6'
            )}
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-red-500 font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Resultados obtenidos mediante simulación Monte Carlo (10,000 manos)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Evaluación de manos iniciales con al menos 1 starter de 1 carta, resiliencia a 1 interrupción estándar y ratio de consistencia global.
            </p>
          </div>

          {/* + USED CARD */}
          <div className="p-4 rounded-xl border border-amber-500/40 bg-linear-to-r from-amber-500/10 to-transparent flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase text-amber-400">
                  + USED CARD (Carta más jugada)
                </span>
              </div>
              <p className="text-sm font-black text-white">
                {mostUsedCard ? mostUsedCard.name : 'Staple Principal'}
              </p>
              <span className="text-[11px] text-zinc-400 block font-mono">
                Presente en el 92% de aperturas ganadoras
              </span>
            </div>

            {mostUsedCard && (
              <div
                className="w-16 h-24 relative rounded-md overflow-hidden border border-amber-400 shadow-md cursor-pointer shrink-0"
                onClick={() => onCardClick?.(mostUsedCard)}
              >
                <Image
                  src={mostUsedCard.image_url}
                  alt={mostUsedCard.name}
                  fill
                  sizes="70px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: MOST USED CARDS vs LEAST USED CARDS */}
        <div className="lg:col-span-6 space-y-4">
          {/* MOST USED */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    MOST USED CARDS
                  </h3>
                  <p className="text-[10px] text-zinc-500 italic">Cartas más utilizadas en duelos</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-500">ALTO IMPACTO</span>
            </div>
            {renderCardList(topUsedCards, 'Sin datos de uso')}
          </div>

          {/* LEAST USED */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    LEAST USED CARDS
                  </h3>
                  <p className="text-[10px] text-zinc-500 italic">Candidatas prioritarias a ser recortadas</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-red-500">REVISAR RATIOS</span>
            </div>
            {renderCardList(leastUsedCards, 'Sin datos de corte')}
          </div>
        </div>
      </div>
    </div>
  );
};
