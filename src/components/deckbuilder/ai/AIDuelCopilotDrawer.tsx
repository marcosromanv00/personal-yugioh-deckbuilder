'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { DeckCard } from '@/components/deckbuilder/types';

interface AIDuelCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeckCards: DeckCard[];
  format?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const INITIAL_COPILOT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Saludos, Duelista! Soy tu **Duel Copilot & Master Judge AI**. Puedo ayudarte a evaluar jugadas con tu mano inicial, mitigar handtraps del oponente, resolver cadenas y dudas de rulings complejas bajo el formato oficial vigente de Agosto 2026. ¿En qué situación te encuentras?',
  timestamp: 0,
};

export const AIDuelCopilotDrawer: React.FC<AIDuelCopilotDrawerProps> = ({
  isOpen,
  onClose,
  currentDeckCards,
  format = 'TCG',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_COPILOT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const currentTimestamp = Date.now();
    const userMsg: ChatMessage = {
      id: `user_${currentTimestamp}`,
      role: 'user',
      content: text,
      timestamp: currentTimestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/duel-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          currentDeckCards,
          format,
        }),
      });

      const res = await response.json();
      if (res.success && res.reply) {
        const replyTimestamp = Date.now();
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant_${replyTimestamp}`,
            role: 'assistant',
            content: res.reply,
            timestamp: replyTimestamp,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      const errorTimestamp = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${errorTimestamp}`,
          role: 'assistant',
          content: 'Ocurrió un error al contactar al juez de IA. Por favor intenta de nuevo.',
          timestamp: errorTimestamp,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, currentDeckCards, format]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
                  Duel Copilot &amp; Judge
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Gemini 3.1 AI • {format} Format
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sugerencias Rápidas */}
          <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/20 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {[
              '¿Cómo juego contra Nibiru?',
              '¿Cuál es la mejor apertura?',
              '¿Cómo romper campo de Snake-Eye?',
              'Explicar timing de efecto',
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-red-600/30 text-red-500 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-red-600 text-white rounded-br-none shadow-md shadow-red-600/10'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs p-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span className="font-mono text-[11px]">Analizando tablero y rulings...</span>
              </div>
            )}
          </div>

          {/* Input de Chat */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta de juego o ruling..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
