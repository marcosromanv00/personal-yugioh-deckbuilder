import React from 'react';
import Link from 'next/link';
import { BrainCircuit, Save, Sun, Moon } from 'lucide-react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { DeckActionsDropdown } from './DeckActionsDropdown';
import { EnvironmentSwitcher } from '@/components/collection/EnvironmentSwitcher';
import { useDeckBuilderState } from '../hooks/useDeckBuilderState';
import { useDeckBuilderShortcuts } from '../hooks/useDeckBuilderShortcuts';
import { useDeckBuilderModalsState } from '../hooks/useDeckBuilderModalsState';
import { useDeckVariants } from '../hooks/useDeckVariants';

interface DeckBuilderHeaderProps {
  state: ReturnType<typeof useDeckBuilderState>;
  shortcuts: ReturnType<typeof useDeckBuilderShortcuts>;
  modalsState: ReturnType<typeof useDeckBuilderModalsState>;
  variantsManager: ReturnType<typeof useDeckVariants>;
  handleQuickSaveClick: () => Promise<void>;
  openChatDrawer: () => void;
  theme: string;
  toggleTheme: () => void;
  preloadSaveModal: () => void;
  onOpenSaveModalWithToast: () => void;
  showToastSuccess: (msg: string) => void;
}

const FORMAT_OPTIONS = [
  { value: 'TCG', label: 'TCG' },
  { value: 'Master Duel', label: 'Master Duel' },
  { value: 'Duel Links', label: 'Duel Links' },
];

export function DeckBuilderHeader({
  state,
  shortcuts,
  modalsState,
  variantsManager,
  handleQuickSaveClick,
  openChatDrawer,
  theme,
  toggleTheme,
  preloadSaveModal,
  onOpenSaveModalWithToast,
  showToastSuccess,
}: DeckBuilderHeaderProps) {
  const canQuickSave = !state.loadingDecks && !state.isSavingUnregistered && state.deckCards.length > 0;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 h-16 shrink-0 flex items-center shadow-xs">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        {/* ZONA IZQUIERDA: Marca Exordio DeckLab + Dropdown de Formato */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 font-display tracking-wider">
              EX
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-display uppercase leading-none">
                Exordio DeckLab
              </span>
              <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 font-sans tracking-wide mt-0.5">
                Tactical Builder &amp; Meta
              </span>
            </div>
          </div>

          <div className="w-36 shrink-0">
            <PremiumDropdown
              value={state.format}
              onChange={(val) => state.setFormat(val as 'TCG' | 'Master Duel' | 'Duel Links')}
              options={FORMAT_OPTIONS}
              size="sm"
              triggerClassName="bg-zinc-100 dark:bg-zinc-900 font-bold border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
          </div>
        </div>

        {/* ZONA CENTRAL: Navegación Principal Limpia */}
        <div className="hidden lg:flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => state.setActiveView('builder')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              state.activeView === 'builder' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>🛠️</span><span className="hidden sm:inline">Taller</span>
          </button>

          <button
            type="button"
            onClick={() => state.setActiveView('breakdowns')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              state.activeView === 'breakdowns' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>📈</span><span className="hidden sm:inline">Meta</span>
          </button>

          <Link href="/collection" className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5">
            <span>📦</span><span className="hidden sm:inline">Colección</span>
          </Link>

          <Link href="/knowledge" className="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5" title="Banco de Reglas e Interpretaciones del Agente">
            <span>📜</span><span className="hidden sm:inline">Reglas</span>
          </Link>
        </div>

        {/* ZONA DERECHA: Botón IA + Menú Desplegable Deck + Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openChatDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer font-display min-h-11 touch-manipulation"
            title="Abrir Asistente Táctico de IA (Juez, Rulings & Combos)"
          >
            <BrainCircuit className="w-4 h-4" /><span>IA</span>
          </button>

          <button
            type="button"
            onClick={handleQuickSaveClick}
            onMouseEnter={preloadSaveModal}
            onFocus={preloadSaveModal}
            disabled={!canQuickSave}
            className={`flex items-center justify-center p-2.5 rounded-xl min-h-11 min-w-11 touch-manipulation transition-all ${
              canQuickSave
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/35 border border-emerald-400/50 cursor-pointer active:scale-95'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700/60 cursor-not-allowed opacity-50'
            }`}
            title={!canQuickSave ? 'No hay cartas para guardar' : state.deckId ? `Guardado Rápido: Sobrescribir "${state.deckName}" (Ctrl+S)` : 'Guardar Nueva Baraja (Ctrl+S)'}
            aria-label={!canQuickSave ? 'Guardar desactivado' : state.deckId ? `Guardado Rápido: Sobrescribir "${state.deckName}"` : 'Guardar Nueva Baraja'}
          >
            <Save className="w-4 h-4" />
          </button>

          <DeckActionsDropdown
            onSave={state.handleOpenSaveModal}
            onQuickSave={handleQuickSaveClick}
            onCreateNewVariant={onOpenSaveModalWithToast}
            isDirty={state.isDirty}
            activeVariantName={variantsManager.activeVariant?.name}
            onLoad={() => shortcuts.executeGuardedAction(state.handleOpenLoadModal)}
            onCreateWithAI={() => modalsState.setIsAICopilotOpen(true)}
            onImportYdk={() => shortcuts.executeGuardedAction(() => modalsState.setIsYdkUploadOpen(true))}
            onExportYdk={() => { state.exportYdkFile(); showToastSuccess('Archivo .YDK descargado'); }}
            onClear={() => shortcuts.executeGuardedAction(() => modalsState.setIsClearConfirmOpen(true))}
            onSyncMeta={() => state.triggerSync()}
            hasCards={state.deckCards.length > 0}
            isSyncing={state.isSyncing}
            isSavedDeck={Boolean(state.deckId)}
            onDeleteDeck={() => modalsState.setIsDeleteActiveDeckConfirmOpen(true)}
            onPreloadSave={preloadSaveModal}
          />

          <EnvironmentSwitcher />

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-11 touch-manipulation flex items-center justify-center"
            title={`Cambiar a modo ${theme === 'dark' ? 'Light Tech' : 'Dark Carbón'}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>
      </div>
    </header>
  );
}
