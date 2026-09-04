'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Zap, Sparkles, Compass, Award } from 'lucide-react';
import { ExordioAnalysisResult } from '@/lib/engines/exordioAnalytics';

interface ExordioDeckStatsProps {
  analysis: ExordioAnalysisResult;
  format?: string;
}

export const ExordioDeckStats: React.FC<ExordioDeckStatsProps> = ({ analysis, format = 'TCG' }) => {
  const { mainStats, additionalStats, stamina, finalScore, scoreRankBadge, recommendedFor, difficulty } = analysis;

  // Parámetros para el Radar Chart Heptagonal (7 ejes)
  const axes = [
    { key: 'attack', label: 'Attack', value: mainStats.attack },
    { key: 'control', label: 'Control', value: mainStats.control },
    { key: 'consistency', label: 'Consistency', value: mainStats.consistency },
    { key: 'boardBreaking', label: 'Board Breaking', value: mainStats.boardBreaking },
    { key: 'versatility', label: 'Versatility', value: mainStats.versatility },
    { key: 'resilience', label: 'Resilience', value: mainStats.resilience },
    { key: 'recovery', label: 'Recovery', value: mainStats.recovery },
  ];

  const size = 280;
  const center = size / 2;
  const radius = 88;
  const angleStep = (Math.PI * 2) / axes.length;

  // Calcular puntos del polígono de datos
  const radarPoints = axes
    .map((axis, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const normalizedValue = Math.min(10, Math.max(1, axis.value)) / 10;
      const r = radius * normalizedValue;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const renderStars = (count: number, max: number = 5) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={`text-sm font-black ${
              i < count ? 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]' : 'text-zinc-600/40'
            }`}
          >
            ★
          </span>
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
            [ 01 ] DECK STATS
          </span>
          <span className="italic font-black text-white/90">Deck Analysis - {format} Format</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-red-200 font-bold hidden sm:inline tracking-widest">{"// TACTICAL RADAR //"}</span>
          <span className="text-[10px] font-mono text-white font-black tracking-widest">+ + +</span>
          <Award className="w-5 h-5 text-amber-300" />
        </div>
      </div>

      {/* Grid Principal estilo transmisión de análisis */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Columna Izquierda: DECK'S MAIN STATS (Barras de 1 a 10) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                DECK&apos;S MAIN STATS
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300">0 - 10 SCALE</span>
          </div>

          <div className="space-y-3 my-3 sm:my-4">
            {axes.map((axis) => (
              <div key={axis.key} className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-zinc-800 dark:text-zinc-200">{axis.label}</span>
                  <span className="font-mono text-red-600 dark:text-red-400 font-black">{axis.value}/10</span>
                </div>
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800/80 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(axis.value / 10) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-linear-to-r from-red-600 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-zinc-600 dark:text-zinc-300 italic pt-2 border-t border-zinc-200 dark:border-zinc-800">
            * Ponderación analítica calculada mediante simulación de apertura y roles de motor.
          </div>
        </div>

        {/* Columna Derecha: RADAR CHART (Graphic Stats) + FINAL SCORE */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                GRAPHIC STATS
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono font-semibold uppercase text-zinc-600 dark:text-zinc-300">
                Radar Vector
              </span>
            </div>
          </div>

          {/* SVG Radar Chart Heptagonal Responsivo */}
          <div className="flex justify-center items-center py-2 relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full max-w-70 h-auto overflow-visible"
            >
              {/* Círculos concéntricos guía */}
              {[0.25, 0.5, 0.75, 1].map((level) => {
                const guidePoints = axes
                  .map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const r = radius * level;
                    const x = center + r * Math.cos(angle);
                    const y = center + r * Math.sin(angle);
                    return `${x},${y}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={level}
                    points={guidePoints}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-zinc-300 dark:text-zinc-800"
                    strokeDasharray={level < 1 ? '2 2' : undefined}
                  />
                );
              })}

              {/* Ejes radiales */}
              {axes.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-zinc-300 dark:text-zinc-800"
                  />
                );
              })}

              {/* Polígono de Datos con Gradient Fill */}
              <defs>
                <linearGradient id="radarGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <polygon
                points={radarPoints}
                fill="url(#radarGlow)"
                stroke="#ef4444"
                strokeWidth="2.5"
                className="drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]"
              />

              {/* Etiquetas de los vértices */}
              {axes.map((axis, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const labelRadius = radius + 22;
                const x = center + labelRadius * Math.cos(angle);
                const y = center + labelRadius * Math.sin(angle);
                return (
                  <text
                    key={axis.key}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9.5px] font-black uppercase fill-zinc-800 dark:fill-zinc-200 tracking-wider"
                  >
                    {axis.label}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Banner de Final Score & Rank (Estilo Tarjeta de Transmisión) */}
          <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-950/20 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block">
                RECOMMENDED FOR
              </span>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs border border-emerald-500/40">
                {recommendedFor}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block">
                FINAL SCORE
              </span>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-3xl font-black font-mono text-zinc-900 dark:text-white tracking-tight">
                  {finalScore.toFixed(1)}
                </span>
                <span className="px-2.5 py-1 rounded bg-red-600 text-white font-black text-xs tracking-wider uppercase shadow-md">
                  {scoreRankBadge}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fila Inferior: ADDITIONAL STATS (Estrellas) + DECK STAMINA */}
        <div className="lg:col-span-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                ADDITIONAL STATS
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300">1 - 5 STARS</span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">DRAW POWER:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.drawPower)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.drawPower}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">CONTROL:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.control)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.control}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">SEARCH:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.search)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.search}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">END BOARD:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.layeredEndBoard)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.layeredEndBoard}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">BEATDOWN:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.beatdown)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.beatdown}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">STAMINA:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.stamina)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.stamina}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">COMEBACK:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.comeback)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.comeback}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">SWARM:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(additionalStats.swarm)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{additionalStats.swarm}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fila Inferior Derecha: DECK DIFFICULTY & DECK STAMINA */}
        <div className="lg:col-span-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-black tracking-wider uppercase text-zinc-900 dark:text-white">
                DECK STAMINA &amp; DIFFICULTY
              </h3>
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase font-mono">
              {difficulty.label}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">EARLY GAME:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(stamina.earlyGame)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{stamina.earlyGame}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">MID-GAME:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(stamina.midGame)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{stamina.midGame}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">LONG GAME:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(stamina.longGame)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{stamina.longGame}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">GY RECYCLE (HAND):</span>
              <div className="flex items-center gap-1.5">
                {renderStars(stamina.gyRecycleHand)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{stamina.gyRecycleHand}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">S.SUMMON FROM GY:</span>
              <div className="flex items-center gap-1.5">
                {renderStars(stamina.specialSummonGY)}
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 ml-1">{stamina.specialSummonGY}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
