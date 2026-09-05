'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Compass,
  Sparkles,
  ShieldAlert,
  BarChart3,
  Network,
  GitFork,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';
import { generateExordioDeckAnalysis } from '@/lib/engines/exordioAnalytics';
import { ExordioDecklistBroadcast } from './ExordioDecklistBroadcast';
import { ExordioDeckStats } from './ExordioDeckStats';
import { ExordioKeyCards } from './ExordioKeyCards';
import { ExordioThreatCards } from './ExordioThreatCards';
import { ExordioTestingData } from './ExordioTestingData';
import { CardRelationshipGraphModal } from './CardRelationshipGraphModal';
import { ComboDecisionTreeModal } from './ComboDecisionTreeModal';

interface ExordioAnalyticsDashboardProps {
  deckCards: DeckCard[];
  inferredArchetype?: string;
  format?: string;
  onApplyGeneratedDeck?: (cards: { name: string; count: number; section: 'main' | 'extra' }[]) => void;
  onCardClick?: (card: DeckCard) => void;
  onClose?: () => void;
}

type ExordioTab = 'stats' | 'key_cards' | 'threats' | 'testing' | 'decklist';

export const ExordioAnalyticsDashboard: React.FC<ExordioAnalyticsDashboardProps> = ({
  deckCards,
  inferredArchetype,
  format = 'TCG',
  onApplyGeneratedDeck,
  onCardClick,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ExordioTab>('stats');
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isComboOpen, setIsComboOpen] = useState(false);

  // Generar análisis heurístico en tiempo real
  const analysis = useMemo(() => {
    if (deckCards.length === 0) return null;
    return generateExordioDeckAnalysis(deckCards, inferredArchetype);
  }, [deckCards, inferredArchetype]);

  const tabs: Array<{ id: ExordioTab; label: string; icon: React.ElementType; slideNum: string }> = [
    { id: 'stats', label: 'Radar & Deck Stats', icon: Compass, slideNum: '01' },
    { id: 'key_cards', label: 'Key Cards', icon: Sparkles, slideNum: '02' },
    { id: 'threats', label: 'Threat Cards', icon: ShieldAlert, slideNum: '03' },
    { id: 'testing', label: 'Testing Data', icon: BarChart3, slideNum: '04' },
    { id: 'decklist', label: 'Full Decklist', icon: Layers, slideNum: '05' },
  ];

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);

  const handleNextTab = () => {
    const nextIdx = (currentTabIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIdx].id);
  };

  const handlePrevTab = () => {
    const prevIdx = (currentTabIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIdx].id);
  };

  // Estado vacío: Cuando el deck no contiene cartas
  if (deckCards.length === 0 || !analysis) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="p-8 sm:p-12 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col items-center max-w-lg w-full transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 text-3xl border border-red-200 dark:border-red-900/40 shadow-xs">
            📊
          </div>
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
            Deck Vacío — Sin Datos de Análisis
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-medium max-w-sm">
            Para generar la matriz de consistencia, el radar de 7 atributos y la detección de amenazas, añade cartas a tu Main Deck o carga una receta guardada.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-600/30 cursor-pointer transition-all"
            >
              🛠️ Ir al Taller de Construcción
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col p-4 md:p-6 transition-colors">
      {/* Barra Táctica Superior: Diapositivas + Acceso Rápido a Grafo & Combos */}
      <div className="max-w-6xl mx-auto w-full mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/80 shadow-md backdrop-blur-md">
        
        {/* Botón Volver al Taller siempre visible cuando onClose está provisto */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer font-display min-h-11 touch-manipulation shrink-0 self-start sm:self-center"
            title="Regresar al Taller de Construcción de Decks"
          >
            <span>←</span>
            <span>Taller</span>
          </button>
        )}

        {/* Selector de Diapositivas Estilo Broadcast */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span className="text-[10px] opacity-70 font-mono">[{tab.slideNum}]</span>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Herramientas de Análisis Profundo & Controles de Diapositiva */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={() => setIsGraphOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-cyan-500 hover:text-cyan-500 bg-zinc-50 dark:bg-zinc-900 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            title="Abrir Grafo Relacional de Sinergias"
          >
            <Network className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden md:inline">Grafo</span>
          </button>

          <button
            onClick={() => setIsComboOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-500 bg-zinc-50 dark:bg-zinc-900 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            title="Abrir Árbol de Combos y Decisiones"
          >
            <GitFork className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Combos</span>
          </button>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-800 mx-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevTab}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Diapositiva anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextTab}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Siguiente diapositiva"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de Diapositiva Activa con Animación de Transición */}
      <div className="max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            {activeTab === 'stats' && (
              <ExordioDeckStats
                analysis={analysis}
                format={format}
              />
            )}

            {activeTab === 'key_cards' && (
              <ExordioKeyCards
                keyCards={analysis.keyCards}
                format={format}
                onCardClick={onCardClick}
              />
            )}

            {activeTab === 'threats' && (
              <ExordioThreatCards
                threats={analysis.threatCards}
                format={format}
              />
            )}

            {activeTab === 'testing' && (
              <ExordioTestingData
                testingData={analysis.testingData}
                format={format}
                onCardClick={onCardClick}
              />
            )}

            {activeTab === 'decklist' && (
              <ExordioDecklistBroadcast
                deckCards={deckCards}
                analysis={analysis}
                format={format}
                onCardClick={onCardClick}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modales Secundarios de Herramientas */}
      <CardRelationshipGraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
        deckCards={deckCards}
      />

      <ComboDecisionTreeModal
        isOpen={isComboOpen}
        onClose={() => setIsComboOpen(false)}
        deckCards={deckCards}
        inferredArchetype={inferredArchetype}
      />
    </div>
  );
};
