'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  X,
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

export type ExordioModalTab = 'stats' | 'key_cards' | 'threats' | 'testing' | 'decklist';

interface ExordioAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckCards: DeckCard[];
  inferredArchetype?: string;
  format?: string;
  initialTab?: ExordioModalTab;
  onCardClick?: (card: DeckCard) => void;
  onApplyGeneratedDeck?: (cards: { name: string; count: number; section: 'main' | 'extra' }[]) => void;
}

export const ExordioAnalyticsModal: React.FC<ExordioAnalyticsModalProps> = ({
  isOpen,
  onClose,
  deckCards,
  inferredArchetype,
  format = 'TCG',
  initialTab = 'stats',
  onCardClick,
}) => {
  const [activeTab, setActiveTab] = useState<ExordioModalTab>(initialTab);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isComboOpen, setIsComboOpen] = useState(false);

  // Sincronizar initialTab cuando se abre el modal
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generar análisis heurístico en tiempo real
  const analysis = useMemo(() => {
    if (deckCards.length === 0) return null;
    return generateExordioDeckAnalysis(deckCards, inferredArchetype);
  }, [deckCards, inferredArchetype]);

  const tabs: Array<{ id: ExordioModalTab; label: string; icon: React.ElementType; slideNum: string }> = [
    { id: 'stats', label: 'Radar & Stats', icon: Compass, slideNum: '01' },
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
        {/* Backdrop con Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header Superior del Modal */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-600/30 shrink-0">
                📊
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100 uppercase tracking-tight font-display truncate">
                    Análisis Exordio del Duelista
                  </h3>
                  {analysis && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-mono font-black text-[10.5px]">
                      Score {analysis.finalScore}/100 • {analysis.scoreRankBadge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 truncate">
                  Visualización táctica estilo broadcast • Formato {format}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Acceso directo a Grafo y Combos */}
              <button
                type="button"
                onClick={() => setIsGraphOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500 hover:text-cyan-500 bg-white dark:bg-zinc-900 text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-9"
                title="Abrir Grafo Relacional de Sinergias"
              >
                <Network className="w-3.5 h-3.5 text-cyan-500" />
                <span>Grafo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsComboOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-500 bg-white dark:bg-zinc-900 text-xs font-black uppercase tracking-wider transition-all cursor-pointer min-h-9"
                title="Abrir Árbol de Combos y Decisiones"
              >
                <GitFork className="w-3.5 h-3.5 text-emerald-500" />
                <span>Combos</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader: Barra de Diapositivas */}
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/40 shrink-0 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 shrink-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer min-h-9 touch-manipulation ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                        : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] opacity-70 font-mono">[{tab.slideNum}]</span>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrevTab}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Diapositiva anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextTab}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Siguiente diapositiva"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenido Principal con Scroll Interno */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            {!analysis || deckCards.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl max-w-md w-full">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3 text-2xl">
                    📊
                  </div>
                  <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
                    Deck Vacío
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Añade cartas a tu mazo en el constructor para generar la simulación completa y métricas Exordio.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="w-full"
                >
                  {activeTab === 'stats' && (
                    <ExordioDeckStats analysis={analysis} format={format} />
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
            )}
          </div>
        </motion.div>

        {/* Modales Secundarios de Grafo y Combos */}
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
    </AnimatePresence>
  );
};
