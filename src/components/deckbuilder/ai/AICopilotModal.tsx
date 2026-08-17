'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  X,
  Wand2,
  Package,
  TrendingUp,
  DollarSign,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
} from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';
import { AI_MODELS, AIModelId, DEFAULT_AI_MODEL } from '@/lib/constants/models';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeckCards: DeckCard[];
  currentDeckName?: string;
  format?: string;
  onApplyDeck: (cards: { name: string; count: number; section: 'main' | 'extra' }[]) => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  currentDeckCards,
  currentDeckName,
  format = 'TCG',
  onApplyDeck,
}) => {
  const [activeTab, setActiveTab] = useState<'synthesizer' | 'copilot'>('synthesizer');

  // Synthesizer State
  const [synthMode, setSynthMode] = useState<'scratch' | 'collection' | 'meta_align' | 'budget'>('scratch');
  const [prompt, setPrompt] = useState('');
  const [budgetMax, setBudgetMax] = useState<number>(50);
  const [selectedModel, setSelectedModel] = useState<AIModelId>(DEFAULT_AI_MODEL);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<{
    deckName: string;
    archetype: string;
    analysisRationale: string;
    keySynergies: string[];
    mainDeck: { name: string; count: number; category?: string }[];
    extraDeck: { name: string; count: number; category?: string }[];
    estimatedBudgetUsd?: number;
  } | null>(null);

  // Copilot Chat State
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `👋 ¡Hola Duelista! Soy tu **Duel Copilot & Juez Oficial de Yu-Gi-Oh!** (Actualizado a Agosto 2026).\n\n¿Tienes dudas sobre una mano inicial, cómo mitigar una handtrap (*Ash*, *Nibiru*, *Droll*) o necesitas un ruling oficial sobre resolución de cadenas? Pregúntame lo que necesites.`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSynthesize = async () => {
    try {
      setIsSynthesizing(true);
      const res = await fetch('/api/ai/deck-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: synthMode,
          prompt,
          currentDeckCards: currentDeckCards.map((c) => ({
            name: c.name,
            count: c.count,
            section: c.section,
          })),
          budgetMax: synthMode === 'budget' ? budgetMax : undefined,
          format,
          model: selectedModel,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setGeneratedDeck(json.data);
      }
    } catch (err) {
      console.error('Error synthesizing deck:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      text: chatInput,
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/duel-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.text,
          })),
          currentDeckName,
          currentDeckCards: currentDeckCards.map((c) => ({ name: c.name })),
          format,
          model: selectedModel,
        }),
      });

      const json = await res.json();
      if (json.success && json.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `reply_${Date.now()}`,
            role: 'assistant',
            text: json.reply,
          },
        ]);
      }
    } catch (err) {
      console.error('Error in copilot chat:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl h-[85vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header con Pestañas Principales */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                AI Copilot &amp; Asistente Táctico
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/15 text-red-600 dark:text-red-400 font-bold">
                  Gemini 3.1 Flash
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Sintetizador de recetas de torneo, optimización y juez en vivo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex bg-zinc-200 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-300 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('synthesizer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'synthesizer'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Sintetizador
              </button>
              <button
                onClick={() => setActiveTab('copilot')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'copilot'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Juez &amp; Duelo</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'synthesizer' ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Modo de Síntesis */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block mb-2">
                  1. Selecciona el Modo de Síntesis
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'scratch', label: 'Desde Cero', icon: Wand2, desc: 'Por concepto o arquetipo' },
                    { id: 'collection', label: 'Mi Colección', icon: Package, desc: 'Priorizar cartas que poseo' },
                    { id: 'meta_align', label: 'Ratios de Meta', icon: TrendingUp, desc: 'Alineado a Agosto 2026' },
                    { id: 'budget', label: 'Presupuesto', icon: DollarSign, desc: 'Reemplazo de staples caras' },
                  ].map((m) => {
                    const isSelected = synthMode === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSynthMode(m.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-red-600 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1.5 text-red-600 dark:text-red-400" />
                        <h4 className="text-xs font-black">{m.label}</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parámetros Adicionales */}
              {synthMode === 'budget' && (
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold">Límite de Presupuesto (USD)</h4>
                    <p className="text-[11px] text-zinc-500">Reemplazar staples por variantes accesibles</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold">$</span>
                    <input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono font-bold text-right focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Prompt del Usuario */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block mb-2">
                  2. Instrucciones Tácticas (Opcional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Quiero una variante de Branded Despia con 22 cartas de non-engine orientada a ir segundo (Going 2nd) y romper tableros pesados con Super Poly..."
                  className="w-full h-24 p-3.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Botón de Ejecución */}
              <button
                type="button"
                onClick={handleSynthesize}
                disabled={isSynthesizing}
                className="w-full py-3 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sintetizando con Gemini 3.1 Flash...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Sintetizar Deck Inteligente</span>
                  </>
                )}
              </button>

              {/* Resultado de Deck Generado */}
              {generatedDeck && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl border border-red-500/40 bg-red-50/50 dark:bg-red-950/20 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-red-600 dark:text-red-400">
                        {generatedDeck.deckName}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Arquetipo: {generatedDeck.archetype} • {generatedDeck.mainDeck.reduce((acc, c) => acc + c.count, 0)} Main / {generatedDeck.extraDeck.reduce((acc, c) => acc + c.count, 0)} Extra
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const allCards: { name: string; count: number; section: 'main' | 'extra' }[] = [
                          ...generatedDeck.mainDeck.map((c) => ({ name: c.name, count: c.count, section: 'main' as const })),
                          ...generatedDeck.extraDeck.map((c) => ({ name: c.name, count: c.count, section: 'extra' as const })),
                        ];
                        onApplyDeck(allCards);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all"
                    >
                      Aplicar al Constructor →
                    </button>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-white/80 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    {generatedDeck.analysisRationale}
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            /* Chat de Juez & Copilot */
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 overflow-y-auto space-y-3 p-2 scrollbar-thin">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-red-600 text-white rounded-br-xs shadow-md'
                            : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  );
                })}

                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-2 text-zinc-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                      <span>El Juez está analizando las reglas y jugadas...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input de Chat */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe tu consulta táctica o duda de ruling..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-black transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
