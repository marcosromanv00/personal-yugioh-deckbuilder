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
} from 'lucide-react';
import { useAIChat } from '@/context/AIChatContext';
import { AI_MODELS } from '@/lib/constants/models';

const QUICK_PROMPTS = [
  '¿Cuántas copias de Cartesia y Aluber tengo libres?',
  '¿Cómo funciona la regla de timing con cartas "When... you can"?',
  '¿Qué baraja competitiva o fun puedo armar con mis cartas sueltas?',
  '¿Qué staples me recomiendas para el meta de Agosto 2026?',
];

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
                      Cerebro Virtual Exordio
                    </h2>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold truncate max-w-60">
                    {activeSession?.title || 'Nueva Consulta Táctica'}
                  </p>
                </div>
              </div>

              {/* Botones de acción del header */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => createNewSession()}
                  className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Iniciar nueva conversación limpia"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <Link
                  href="/chat"
                  onClick={closeChatDrawer}
                  className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Abrir en pantalla completa (/chat)"
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

            {/* SUB-HEADER: SELECTOR DE MODELO */}
            <div className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Motor IA:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden focus:border-red-500 cursor-pointer"
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
                      ¿En qué te puedo asesorar hoy?
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
                      Pregúntame sobre cartas de tu inventario, combos, rulings oficiales de cadenas o ideas para armar barajas con tus cartas sueltas.
                    </p>
                  </div>

                  {/* QUICK PROMPT PILLS */}
                  <div className="w-full space-y-2 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 text-left">
                      Consultas Frecuentes
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(prompt);
                            sendMessage(prompt);
                          }}
                          className="text-left text-xs p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/30 border border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-800 text-zinc-700 dark:text-zinc-300 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="line-clamp-1">{prompt}</span>
                          <Sparkles className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-linear-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/20'
                            : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex gap-3 items-center text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="w-7 h-7 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    <span>Analizando conocimiento táctico y colección...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT FORM */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 shrink-0">
              <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu duda sobre cartas, decks o reglas..."
                  rows={2}
                  className="w-full resize-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 pr-12 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-red-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2.5 bottom-2.5 p-2 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-40 text-white shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="Enviar consulta"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 px-1">
                <span>Enter para enviar • Shift+Enter para salto de línea</span>
                <span className="font-mono">Agosto 2026</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
