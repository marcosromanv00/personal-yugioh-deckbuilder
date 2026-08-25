'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  BrainCircuit,
  X,
  Send,
  Plus,
  Maximize2,
  Sparkles,
  Bot,
  User,
  Loader2,
  Scale,
  Swords,
  Package,
} from 'lucide-react';
import { useAIChat } from '@/context/AIChatContext';
import { AI_MODELS } from '@/lib/constants/models';

type AIModeType = 'judge' | 'duel' | 'collection';

const MODE_PROMPTS: Record<AIModeType, string[]> = {
  judge: [
    '¿Cómo funciona la resolución de cadenas simultáneas (SEGOC)?',
    '¿Qué diferencia hay entre "If... you can" y "When... you can" para perder timing?',
    '¿Puede activarse Super Polymerization en Damage Step?',
  ],
  duel: [
    '¿Cuál es la línea de combo óptima de Cyber Dragon para asegurar OTK?',
    '¿Cómo jugar alrededor de Nibiru y Droll & Lock Bird?',
    '¿Qué staples son más efectivas contra el meta de Agosto 2026?',
  ],
  collection: [
    '¿Cuántas copias de Cartesia y Aluber tengo libres en mi inventario?',
    '¿Qué baraja competitiva puedo armar con mis cartas sueltas?',
    '¿Qué piezas me faltan para completar el motor Branded o Therion?',
  ],
};

export const GlobalAIChatDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    closeChatDrawer,
    messages,
    isLoading,
    sendMessage,
    createNewSession,
    activeSession,
    selectedModel,
    setSelectedModel,
  } = useAIChat();

  const [input, setInput] = useState('');
  const [selectedAIMode, setSelectedAIMode] = useState<AIModeType>('judge');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isDrawerOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isDrawerOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isDrawerOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChatDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-120 md:w-135 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col font-sans"
          >
            {/* DRAWER HEADER */}
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase font-display">
                      Cerebro Virtual IA
                    </h2>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold truncate max-w-60">
                    {activeSession?.title || 'Juez Oficial, Combos & Estrategia'}
                  </p>
                </div>
              </div>

              {/* Botones de acción del header */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => createNewSession()}
                  className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Nueva conversación"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <Link
                  href="/chat"
                  onClick={closeChatDrawer}
                  className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={closeChatDrawer}
                  className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Cerrar asistente"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SUB-HEADER: SELECTOR DE MODO IA + SELECTOR DE MODELO */}
            <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs flex-wrap">
              {/* Selector de modo */}
              <div className="flex items-center gap-1 p-0.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedAIMode('judge')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    selectedAIMode === 'judge'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                  <span>Juez</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAIMode('duel')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    selectedAIMode === 'duel'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Swords className="w-3 h-3" />
                  <span>Duelo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAIMode('collection')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                    selectedAIMode === 'collection'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>Cartas</span>
                </button>
              </div>

              {/* Selector de Modelo */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-hidden focus:border-red-500 cursor-pointer"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* MENSAJES DEL CHAT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-inner">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-zinc-100 font-display">
                      {selectedAIMode === 'judge'
                        ? '⚖️ Juez Oficial de Yu-Gi-Oh!'
                        : selectedAIMode === 'duel'
                        ? '⚔️ Asesor de Duelo & Combos'
                        : '📦 Consultas de Colección & Decks'}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
                      {selectedAIMode === 'judge'
                        ? 'Resuelvo dudas de rulings oficiales, timing, resolución de cadenas y efectos continuos.'
                        : selectedAIMode === 'duel'
                        ? 'Te ayudo a planear turnos óptimos, mitigar handtraps y optimizar tus líneas de juego.'
                        : 'Pregúntame sobre disponibilidad de cartas en tu inventario, combos y recetas.'}
                    </p>
                  </div>

                  {/* QUICK PROMPT PILLS DEL MODO SELECCIONADO */}
                  <div className="w-full space-y-2 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 text-left">
                      Consultas Frecuentes
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {MODE_PROMPTS[selectedAIMode].map((promptText, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(promptText);
                            sendMessage(promptText);
                          }}
                          className="text-left text-xs p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/30 border border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-800 text-zinc-700 dark:text-zinc-300 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="line-clamp-1">{promptText}</span>
                          <Sparkles className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                        msg.role === 'user'
                          ? 'bg-red-600 text-white rounded-tr-none'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-none prose dark:prose-invert prose-xs max-w-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5 shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                  <span>Analizando estrategia...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FORMULARIO DE ENTRADA */}
            <form
              onSubmit={handleSubmit}
              className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-end gap-2 shrink-0"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu duda sobre rulings, jugadas o colecciones..."
                rows={1}
                className="flex-1 max-h-32 min-h-10 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-red-500 resize-none transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-sm shadow-red-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
