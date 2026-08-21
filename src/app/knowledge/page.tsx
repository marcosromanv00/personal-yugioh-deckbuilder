'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Search, 
  Sparkles, 
  BookOpen, 
  Layers, 
  History, 
  ShieldCheck, 
  Loader2, 
  Plus,
  Flame,
  CheckCircle2,
  Trophy,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAIChat } from '@/context/AIChatContext';
import { CardKnowledgeData } from '@/types/knowledge';
import { CardIntelligenceView } from '@/components/knowledge/CardIntelligenceView';
import { ARCHETYPE_IMPLICIT_SYNERGIES } from '@/lib/constants/archetypeSynergies';
import { TeachSynergyModal } from '@/components/deckbuilder/ai/TeachSynergyModal';

const QUICK_SUGGESTIONS = [
  'Fallen of Albaz',
  'Ash Blossom & Joyous Spring',
  'Resonance Insect',
  'Diabellstar the Black Witch',
  'Promethean Princess, Bestower of Flames',
  'S:P Little Knight',
  'Tenpai Dragon Paidra',
  'Bonfire',
  'Vernusylph of the Misting Seedlings'
];

export default function KnowledgePage() {
  const { theme, toggleTheme } = useTheme();
  const { openChatDrawer } = useAIChat();
  const [searchQuery, setSearchQuery] = useState<string>('Fallen of Albaz');
  const [activeTab, setActiveTab] = useState<'card_hub' | 'archetype_matrix' | 'rulings_base' | 'learning_log'>('card_hub');
  const [selectedCardKnowledge, setSelectedCardKnowledge] = useState<CardKnowledgeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTeachSynergyModalOpen, setIsTeachSynergyModalOpen] = useState(false);

  // Fetch initial card knowledge
  useEffect(() => {
    fetchCardKnowledge('Fallen of Albaz');
  }, []);

  const fetchCardKnowledge = async (cardName: string) => {
    if (!cardName.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/knowledge/card?name=${encodeURIComponent(cardName.trim())}`);
      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setSelectedCardKnowledge(result.data);
      } else {
        setErrorMessage(result.error || `No se encontraron datos para "${cardName}"`);
      }
    } catch (err) {
      setErrorMessage('Error al conectar con la Base de Conocimiento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCardKnowledge(searchQuery);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200">
      
      {/* ══════════════════════════════════════════════════════════════
          HEADER UNIFICADO EXORDIO — Consistencia Global de UI (h-16)
      ══════════════════════════════════════════════════════════════ */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 h-16 shrink-0 flex items-center shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          
          {/* ZONA IZQUIERDA: Identidad Exordio */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 shrink-0 font-display tracking-wider">
              EX
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display uppercase leading-none">
                Exordio DeckLab
              </h1>
              <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5 font-sans">
                Banco de Reglas &amp; Meta Intelligence
              </p>
            </div>
          </div>

          {/* ZONA CENTRAL: Navegación de Modos Unificada */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🛠️</span>
              <span className="hidden sm:inline">Taller</span>
            </Link>
            <Link
              href="/?tab=exordio"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Análisis</span>
            </Link>
            <Link
              href="/?tab=breakdowns"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📈</span>
              <span className="hidden sm:inline">Meta</span>
            </Link>
            <Link
              href="/collection"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📦</span>
              <span className="hidden sm:inline">Colección</span>
            </Link>
            <button
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs transition-all cursor-default flex items-center gap-1.5"
            >
              <span>📜</span>
              <span className="hidden sm:inline">Reglas</span>
            </button>
            <Link
              href="/chat"
              className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Cerebro Virtual Exordio (/chat)"
            >
              <span>🧠</span>
              <span className="hidden sm:inline">Cerebro</span>
            </Link>
          </div>

          {/* ZONA DERECHA: Botón Cerebro AI + Acciones y Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openChatDrawer}
              className="flex items-center gap-1.5 px-3 py-2 bg-linear-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer font-display"
              title="Abrir Cerebro Virtual Exordio"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerebro AI</span>
            </button>

            <button
              onClick={() => setIsTeachSynergyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-display"
            >
              <Plus className="w-3.5 h-3.5 text-red-500" />
              <span>Enseñar Sinergia</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Alternar tema claro/oscuro"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
          </div>

        </div>
      </header>

      {/* Sub-header Controls & Search Area */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* Search Form + Sub-tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xl">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar carta para consultar rankings de torneos, ratios y rulings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-24 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-[11px] font-black uppercase tracking-wider text-white rounded-lg transition-all cursor-pointer font-display"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </form>

            {/* Sub-navigation Tabs */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 self-stretch md:self-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('card_hub')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'card_hub'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>Card Intelligence</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('archetype_matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'archetype_matrix'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Sinergias &amp; Engines</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rulings_base')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'rulings_base'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Reglas de Juez</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('learning_log')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'learning_log'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 text-zinc-400" />
                <span>Historial</span>
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
            <span className="text-[10px] text-zinc-400 uppercase font-black font-mono shrink-0 mr-1">Consultar:</span>
            {QUICK_SUGGESTIONS.map((card) => (
              <button
                type="button"
                key={card}
                onClick={() => {
                  setSearchQuery(card);
                  fetchCardKnowledge(card);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
                  searchQuery.toLowerCase() === card.toLowerCase()
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-bold'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {card}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 flex-1">
        {/* Tab 1: Card Intelligence Hub */}
        {activeTab === 'card_hub' && (
          <div>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider font-display">Consultando Banco de Reglas...</span>
              </div>
            )}

            {errorMessage && !isLoading && (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-red-600 dark:text-red-400 text-xs">
                {errorMessage}
              </div>
            )}

            {!isLoading && selectedCardKnowledge && (
              <CardIntelligenceView
                cardData={selectedCardKnowledge}
                onKnowledgeUpdated={(updated) => setSelectedCardKnowledge(updated)}
              />
            )}
          </div>
        )}

        {/* Tab 2: Archetype & Engine Matrix */}
        {activeTab === 'archetype_matrix' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Matriz de Sinergias No Nominales &amp; Engines
              </h2>
              <p className="text-xs text-zinc-500">
                Cartas que pertenecen de facto al núcleo de un arquetipo sin llevar su nombre en el título.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ARCHETYPE_IMPLICIT_SYNERGIES.map((arch) => (
                <div
                  key={arch.archetype}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-red-600 dark:text-red-400 font-display">{arch.archetype}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{arch.description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono font-bold">
                      {arch.implicitCards.length} tech cards
                    </span>
                  </div>

                  <div className="space-y-2">
                    {arch.implicitCards.map((card) => (
                      <div
                        key={card.cardName}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{card.cardName}</div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1">{card.reason}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 uppercase font-mono font-bold">
                            {card.role}
                          </span>
                          <span className="text-[11px] font-mono text-amber-500 font-bold">
                            {Math.round(card.weight * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Rulings & Judge Rules Base */}
        {activeTab === 'rulings_base' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Base Central de Rulings Oficiales y Decisiones de Juez
              </h2>
              <p className="text-xs text-zinc-500">
                Interacciones de timing, cadenas simultáneas SEGOC y resoluciones complejas de Konami.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs font-display">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Missing the Timing (&quot;When... you can&quot;)</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                  Los efectos opcionales que comienzan con <strong>&quot;When... you can&quot;</strong> pierden el tiempo si su condición de activación no fue el último suceso en ocurrir en la cadena (por ejemplo, si el monstruo fue enviado al GY como material de tributo o enlace y la invocación ocurre después).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-black text-xs font-display">
                  <Layers className="w-4 h-4" />
                  <span>Regla SEGOC (Efectos Disparados Simultáneos)</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                  Cuando múltiples efectos se activan al mismo tiempo, la cadena se construye en este orden estricto:
                  1. Efectos obligatorios del jugador de turno.
                  2. Efectos obligatorios del rival.
                  3. Efectos opcionales del jugador de turno.
                  4. Efectos opcionales del rival.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-xs font-display">
                  <Flame className="w-4 h-4" />
                  <span>Efecto Negado vs Activación Negada</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                  Si la <strong>activación</strong> de una carta con restricción &quot;You can only activate 1 [Card] per turn&quot; es negada (ej. por Solemn Judgment), puedes activar otra copia ese turno. Si solo el <strong>efecto</strong> fue negado (ej. por Ash Blossom), no puedes activar otra copia.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs font-display">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Damage Step Limitations</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                  Durante el Damage Step solo se pueden activar: cartas que alteren ATK/DEF directamente, trampas de contraefecto, efectos de disparo obligatorio o efectos que nieguen expresamente activaciones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Learning Log (Auditoría) */}
        {activeTab === 'learning_log' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                Historial de Aprendizaje &amp; Auditoría del Agente
              </h2>
              <p className="text-xs text-zinc-500">
                Registro cronológico de las interpretaciones, asignaciones y reglas corregidas por el usuario.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-display">Fallen of Albaz</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      Interpretación Verificada
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">TCG</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Asociación confirmada como pieza central del motor Branded / Despia y fusiones universales.
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Hoy</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-display">Resonance Insect</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                      Sinergia No Nominal
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">Beetrooper</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Rol: Buscador central de Insectos Nivel 5+ sin restricción una vez por turno.
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Hoy</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Teach Synergy Modal */}
      <TeachSynergyModal
        isOpen={isTeachSynergyModalOpen}
        onClose={() => setIsTeachSynergyModalOpen(false)}
        defaultCardName={selectedCardKnowledge?.cardName || ''}
        defaultArchetype={selectedCardKnowledge?.archetype || ''}
      />
    </div>
  );
}
