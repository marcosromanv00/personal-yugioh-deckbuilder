'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Layers,
  Maximize2,
  Swords,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { ExordioAnalysisResult } from '@/lib/engines/exordioAnalytics';
import { ExordioModalTab } from './ExordioAnalyticsModal';

interface ExordioSidePanelSummaryProps {
  analysis: ExordioAnalysisResult;
  format?: string;
  onOpenModal: (tab?: ExordioModalTab) => void;
}

export const ExordioSidePanelSummary: React.FC<ExordioSidePanelSummaryProps> = ({
  analysis,
  format = 'TCG',
  onOpenModal,
}) => {
  const {
    finalScore,
    scoreRankBadge,
    tierRank,
    difficulty,
    recommendedFor,
    mainStats,
    keyCards,
    threatCards,
    testingData,
  } = analysis;

  const quickStats = [
    { label: 'Ataque', value: mainStats.attack, color: 'from-red-600 to-rose-500' },
    { label: 'Control', value: mainStats.control, color: 'from-blue-600 to-cyan-500' },
    { label: 'Consistencia', value: mainStats.consistency, color: 'from-emerald-600 to-teal-500' },
    { label: 'Board Breaking', value: mainStats.boardBreaking, color: 'from-amber-600 to-yellow-500' },
    { label: 'Resiliencia', value: mainStats.resilience, color: 'from-purple-600 to-indigo-500' },
    { label: 'Recuperación', value: mainStats.recovery, color: 'from-pink-600 to-rose-500' },
  ];

  const modules: Array<{
    id: ExordioModalTab;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    badge: string;
    badgeColor: string;
  }> = [
    {
      id: 'stats',
      title: 'Radar & Métricas de Mazo',
      subtitle: '7 atributos tácticos y evaluación de aguante',
      icon: Compass,
      badge: `${finalScore}/100`,
      badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
    {
      id: 'key_cards',
      title: 'Cartas Clave y Bosses',
      subtitle: `${keyCards.mainStarters.length} starters • ${keyCards.mainBeaters.length} beaters detectados`,
      icon: Sparkles,
      badge: keyCards.bestCard ? 'WinCon Detectada' : '5 Roles',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      id: 'threats',
      title: 'Amenazas Meta y Handtraps',
      subtitle: `${threatCards.length} cartas meta críticas contra tu estrategia`,
      icon: ShieldAlert,
      badge: `${threatCards.length} Alertas`,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      id: 'testing',
      title: 'Pruebas de Consistencia',
      subtitle: `Winrate: ${testingData.winRatio}% • Ladrillos: ${testingData.deadHands}%`,
      icon: BarChart3,
      badge: `${testingData.winRatio}% Winrate`,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'decklist',
      title: 'Ficha de Transmisión TV',
      subtitle: 'Roster visual completo y desgloses de motor',
      icon: Layers,
      badge: 'Broadcast',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-3.5 text-xs font-sans">
      {/* ─── HERO SCORE CARD (Adaptable a cualquier ancho) ─── */}
      <div className="p-4 rounded-2xl bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-md relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-mono font-black text-[10px] uppercase tracking-wider">
              {format}
            </span>
            <span className="text-[11px] font-bold text-zinc-300 truncate">
              {tierRank} • {recommendedFor}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono font-black text-amber-400">
              {scoreRankBadge}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-2">
          <div>
            <div className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">
              Puntaje Táctico Exordio
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black font-mono tracking-tight text-white">
                {finalScore}
              </span>
              <span className="text-xs font-mono font-bold text-zinc-400">/ 100</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-400 block">Dificultad</span>
            <span className="text-xs font-bold text-zinc-200 uppercase">{difficulty.label}</span>
          </div>
        </div>
      </div>

      {/* ─── BOTÓN PRINCIPAL DE ACCIÓN: ABRIR MODAL EXPANSIVO ─── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onOpenModal('stats')}
        className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-red-600 via-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all min-h-11 touch-manipulation font-display"
      >
        <Maximize2 className="w-4 h-4" />
        <span>Abrir Análisis Exordio Completo</span>
      </motion.button>

      {/* ─── RESUMEN DE ATRIBUTOS TÁCTICOS COMPACTO (Sin desbordamiento) ─── */}
      <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
          <span className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-red-500" />
            Métricas Principales
          </span>
          <span className="font-mono text-[10px] text-zinc-500">Escala 0-10</span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-0.5">
          {quickStats.map((st) => (
            <div key={st.label} className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium truncate">
                  {st.label}
                </span>
                <span className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                  {st.value}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-linear-to-r ${st.color}`}
                  style={{ width: `${(st.value / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── LANZADORES DE MÓDULOS ESPECÍFICOS (Click abre el modal en la tab indicada) ─── */}
      <div className="space-y-2">
        <div className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-0.5">
          Módulos Tácticos
        </div>

        <div className="space-y-1.5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.button
                key={mod.id}
                type="button"
                whileHover={{ x: 2 }}
                onClick={() => onOpenModal(mod.id)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer group shadow-2xs min-h-11 touch-manipulation"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:text-red-500 group-hover:border-red-500/40 transition-colors shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[11.5px] text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {mod.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {mod.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-mono text-[9.5px] font-bold border ${mod.badgeColor}`}
                  >
                    {mod.badge}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
