'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitFork,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Play,
  Bot,
  Loader2,
} from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';
import { SAMPLE_COMBO_PLAYBOOKS, ComboPlaybookItem } from '@/lib/engines/comboEngine';

interface ComboDecisionTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckCards: DeckCard[];
  inferredArchetype?: string;
}

export const ComboDecisionTreeModal: React.FC<ComboDecisionTreeModalProps> = ({
  isOpen,
  onClose,
  deckCards,
  inferredArchetype = 'Snake-Eye',
}) => {
  const [combos] = useState<ComboPlaybookItem[]>(SAMPLE_COMBO_PLAYBOOKS);
  const [selectedCombo, setSelectedCombo] = useState<ComboPlaybookItem>(SAMPLE_COMBO_PLAYBOOKS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number | null>(null);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState<boolean>(false);

  const handleGenerateAICombo = async () => {
    try {
      setIsGeneratingWithAI(true);
      const starters = deckCards.filter(
        (c) =>
          c.desc?.toLowerCase().includes('add 1') ||
          c.desc?.toLowerCase().includes('normal')
      );
      const sampleHand = starters.slice(0, 2).map((c) => c.name);
      if (sampleHand.length === 0) sampleHand.push(deckCards[0]?.name || 'Card A');

      const response = await fetch('/api/ai/combo-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handCards: sampleHand,
          deckCards: deckCards.map((c) => ({ name: c.name })),
          archetype: inferredArchetype,
          goingTurn: 1,
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        const generated: ComboPlaybookItem = {
          id: `ai_combo_${Date.now()}`,
          title: res.data.comboTitle,
          archetype: inferredArchetype,
          comboType: '1-card',
          requiredCards: res.data.startingHand,
          endboardDescription: res.data.primaryEndboard,
          interruptionTolerance: res.data.interruptionTolerance,
          steps: res.data.steps.map(
            (s: {
              stepNumber: number;
              action: string;
              cardName: string;
              description: string;
            }) => ({
              stepNumber: s.stepNumber,
              action: s.action,
              cardName: s.cardName,
              sourceZone: 'hand',
              targetZone: 'field',
              details: s.description,
            })
          ),
          decisionBranches: res.data.decisionBranches.map(
            (b: {
              interruptionPoint: string;
              recommendedPivot: string;
              contingencyEndboard: string;
            }) => ({
              trigger: b.interruptionPoint,
              branchName: 'Ruta de Mitigación',
              alternativeSteps: [
                {
                  stepNumber: 1,
                  action: 'Pivote Estratégico',
                  cardName: b.recommendedPivot,
                  details: b.recommendedPivot,
                },
              ],
              resultingEndboard: b.contingencyEndboard,
              resilienceScore: 4,
            })
          ),
        };
        setSelectedCombo(generated);
        setCurrentStepIndex(0);
        setActiveBranchIndex(null);
      }
    } catch (err) {
      console.error('Error generating AI combo:', err);
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  if (!isOpen) return null;

  const currentStep = selectedCombo.steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-5xl h-[88vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span>Árboles de Decisión &amp; Playbook de Combos</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-600 text-white font-mono font-bold">
                  Gemini 3.1
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                Rutas paso a paso, simulador interactivo y ramas de contingencia ante interrupciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAICombo}
              disabled={isGeneratingWithAI}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingWithAI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              <span>Generar Combo con IA</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido en 2 Columnas */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Lista de Combos */}
          <div className="md:col-span-4 p-4 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-y-auto space-y-2.5 scrollbar-thin">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">
              Líneas Disponibles ({combos.length})
            </span>

            {combos.map((c) => {
              const isSelected = selectedCombo.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCombo(c);
                    setCurrentStepIndex(0);
                    setActiveBranchIndex(null);
                  }}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase">
                      {c.comboType}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase ${
                        c.interruptionTolerance === 'high'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : c.interruptionTolerance === 'medium'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      Resiliencia: {c.interruptionTolerance}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100">{c.title}</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                    {c.endboardDescription}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Reproductor de Pasos & Ramas de Decisión */}
          <div className="md:col-span-8 p-6 overflow-y-auto scrollbar-thin space-y-5 bg-white dark:bg-zinc-950">
            {/* Header del Combo */}
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">{selectedCombo.title}</h3>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                  Mano: {selectedCombo.requiredCards.join(' + ')}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                <span className="font-bold text-red-600 dark:text-red-400">Tablero Final: </span>
                {selectedCombo.endboardDescription}
              </p>
            </div>

            {/* Reproductor Interactivo de Pasos */}
            <div className="p-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50/60 dark:bg-red-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100">
                    Paso {currentStepIndex + 1} de {selectedCombo.steps.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setCurrentStepIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentStepIndex === 0}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 disabled:opacity-30 text-xs font-black uppercase transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentStepIndex((prev) =>
                        Math.min(selectedCombo.steps.length - 1, prev + 1)
                      )
                    }
                    disabled={currentStepIndex === selectedCombo.steps.length - 1}
                    className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white text-xs font-black uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Detalle del Paso Actual Destacado */}
              {currentStep && (
                <motion.div
                  key={currentStep.stepNumber}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-white dark:bg-black/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white font-black font-mono text-xs flex items-center justify-center shrink-0 shadow-md">
                    {currentStep.stepNumber}
                  </div>
                  <div className="flex-1 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-600 dark:text-amber-300">
                        {currentStep.action}:
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {currentStep.cardName}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {currentStep.details}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Secuencia Completa */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2.5">
                Secuencia Completa ({selectedCombo.steps.length} Pasos)
              </span>

              <div className="space-y-2">
                {selectedCombo.steps.map((step, idx) => {
                  const isActive = currentStepIndex === idx;
                  return (
                    <div
                      key={step.stepNumber}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                        isActive
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/40 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-red-600 text-white font-black shadow-xs'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold'
                        }`}
                      >
                        {step.stepNumber}
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-900 dark:text-zinc-100">
                            {step.action}:
                          </span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {step.cardName}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-[11px] mt-0.5">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ramas de Mitigación ante Interrupciones */}
            {selectedCombo.decisionBranches.length > 0 && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Árboles de Decisión / Contingencia ante Handtraps
                </span>

                <div className="space-y-3">
                  {selectedCombo.decisionBranches.map((branch, idx) => {
                    const isSelected = activeBranchIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() =>
                          setActiveBranchIndex(isSelected ? null : idx)
                        }
                        className={`cursor-pointer p-4 rounded-2xl border transition-all space-y-2 text-xs ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-xs'
                            : 'border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/15 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-black">
                          <div className="flex items-center gap-2">
                            <GitFork className="w-4 h-4 text-amber-500" />
                            <span>Escenario: {branch.trigger}</span>
                          </div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-mono font-bold">
                            {isSelected ? 'Ocultar Plan' : 'Ver Plan B →'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 space-y-1">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            Plan B / Línea Alternativa:
                          </span>
                          {branch.alternativeSteps.map((alt, aIdx) => (
                            <p key={aIdx} className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                              • {alt.action} ({alt.cardName}): {alt.details}
                            </p>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
                          <span>
                            Tablero de Emergencia:{' '}
                            <strong className="text-zinc-900 dark:text-zinc-100">
                              {branch.resultingEndboard}
                            </strong>
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            Resiliencia: {branch.resilienceScore}/5 ★
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
