'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Menu,
  ChevronLeft,
  Sun,
  Moon,
  MessageSquare,
  BookOpen,
  Box,
  Wrench,
} from 'lucide-react';
import { useAIChat } from '@/context/AIChatContext';
import { useTheme } from '@/components/ui/ThemeProvider';
import { AI_MODELS } from '@/lib/constants/models';

const QUICK_PROMPTS = [
  '¿Cuántas copias de Cartesia y Aluber tengo libres en mi inventario?',
  '¿Cómo resuelvo una cadena compleja con "When... you can" y efectos simultáneos (SEGOC)?',
  'Arma una baraja divertida y jugable aprovechando mis cartas libres.',
  '¿Qué cambios recomiendas en el formato de Agosto 2026 para contrarrestar el meta?',
];

export default function ChatPage() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    isLoading,
    selectedModel,
    setSelectedModel,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    sendMessage,
  } = useAIChat();

  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      await renameSession(id, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased overflow-hidden">
      
      {/* ══════════════════════════════════════════════════════════════
          SIDEBAR DE CONVERSACIONES
      ══════════════════════════════════════════════════════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 shrink-0 font-display tracking-wider">
              EX
            </div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
                Cerebro Virtual
              </h1>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Historial de Consultas
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpenMobile(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Chat Button */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={async () => {
              await createNewSession();
              setIsSidebarOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Conversación</span>
          </button>
        </div>

        {/* Search Chats */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-red-500"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400 font-medium">
              No hay conversaciones guardadas
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const isEditing = s.id === editingSessionId;

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    selectSession(s.id);
                    setIsSidebarOpenMobile(false);
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold border border-red-500/30'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-500' : 'text-zinc-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(s.id, e as unknown as React.MouseEvent);
                        }}
                        className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 px-2 py-0.5 rounded text-xs w-full text-zinc-900 dark:text-zinc-100"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{s.title}</span>
                    )}
                  </div>

                  {/* Actions for session */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button
                        onClick={(e) => handleSaveRename(s.id, e)}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-emerald-500"
                        title="Guardar título"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleStartRename(s.id, s.title, e)}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600"
                        title="Renombrar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Quick Nav */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Wrench className="w-4 h-4 text-amber-500" />
            <span>Taller de Decks</span>
          </Link>
          <Link
            href="/collection"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Box className="w-4 h-4 text-purple-500" />
            <span>Mi Colección</span>
          </Link>
          <Link
            href="/knowledge"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span>Banco de Reglas</span>
          </Link>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpenMobile && (
        <div
          onClick={() => setIsSidebarOpenMobile(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          MAIN CHAT CONTAINER
      ══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-zinc-100 dark:bg-zinc-950">
        
        {/* TOP MAIN HEADER */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 truncate font-display">
                  {activeSession?.title || 'Cerebro Virtual Exordio'}
                </h2>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold truncate">
                  Conocimiento integral de colección, barajas y reglas oficiales
                </p>
              </div>
            </div>
          </div>

          {/* Model Selector & Theme Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-hidden cursor-pointer"
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="dark:bg-zinc-900">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={`Cambiar a modo ${theme === 'dark' ? 'Light' : 'Dark'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl w-full mx-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-red-600/20 to-amber-600/20 border border-red-500/30 text-red-500 flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-black uppercase text-zinc-900 dark:text-zinc-100 font-display">
                  Asistente &amp; Cerebro Virtual de Yu-Gi-Oh!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Pregúntame sobre cualquier aspecto de tu colección, barajas, rulings de cartas vigentes a Agosto 2026 o asesoría para armar decks con tus cartas físicas.
                </p>
              </div>

              {/* QUICK SUGGESTIONS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg pt-4">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt);
                      sendMessage(prompt);
                    }}
                    className="text-left text-xs p-3 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/30 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-800 text-zinc-800 dark:text-zinc-200 transition-all flex items-center justify-between group shadow-xs cursor-pointer"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-red-500 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-linear-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/20'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xs whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3.5 items-center text-xs text-zinc-500 dark:text-zinc-400">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span className="font-semibold">Consultando base de conocimientos y cartas...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT PROMPT BAR */}
        <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta lo que sea sobre tus cartas, sinergias, rulings o ideas de decks..."
                rows={2}
                className="w-full resize-none bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 pr-14 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-red-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 min-h-11 min-w-11 p-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-40 text-white shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:cursor-not-allowed touch-manipulation flex items-center justify-center"
                title="Enviar consulta"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 px-1 font-sans">
              <span>Enter para enviar • Shift+Enter para nueva línea</span>
              <span className="font-mono">Yu-Gi-Oh! Official Rules • Agosto 2026</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
