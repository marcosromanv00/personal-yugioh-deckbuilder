import React from 'react';
import Link from 'next/link';
import { Save, FolderOpen, Upload, Download, Trash2, BarChart3, Bot, BrainCircuit, Box, RefreshCw } from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';
import { SearchPanel } from './SearchPanel';
import { MetaAnalysisPanel } from './MetaAnalysisPanel';
import { MobileTab } from './MobileNav';

interface DeckBuilderMobileSheetsProps {
  activeMobileTab: MobileTab;
  setActiveMobileTab: (tab: MobileTab) => void;
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (open: boolean) => void;
  searchPanelProps: Omit<React.ComponentProps<typeof SearchPanel>, 'isMobile' | 'leftPanelOpen' | 'setLeftPanelOpen' | 'leftPanelWidth'>;
  metaPanelProps: Omit<React.ComponentProps<typeof MetaAnalysisPanel>, 'isMobile' | 'rightPanelOpen' | 'setRightPanelOpen' | 'rightPanelWidth'>;
  hasCards: boolean;
  isSavedDeck: boolean;
  isSyncing: boolean;
  onOpenSaveModal: () => void;
  onOpenLoadModal: () => void;
  onOpenYdkUpload: () => void;
  onExportYdk: () => void;
  onOpenClearConfirm: () => void;
  onOpenDeleteConfirm: () => void;
  onOpenExordioView: () => void;
  onOpenBreakdownsView: () => void;
  onOpenAICopilot: () => void;
  onTriggerSync: () => void;
}

export function DeckBuilderMobileSheets(props: DeckBuilderMobileSheetsProps) {
  const {
    activeMobileTab, setActiveMobileTab, mobileMoreOpen, setMobileMoreOpen,
    searchPanelProps, metaPanelProps, hasCards, isSavedDeck, isSyncing,
    onOpenSaveModal, onOpenLoadModal, onOpenYdkUpload, onExportYdk,
    onOpenClearConfirm, onOpenDeleteConfirm, onOpenExordioView,
    onOpenBreakdownsView, onOpenAICopilot, onTriggerSync,
  } = props;

  return (
    <>
      {/* Search bottom sheet */}
      <MobileBottomSheet
        isOpen={activeMobileTab === 'search'}
        onClose={() => setActiveMobileTab('deck')}
        title="🔍 Buscar Cartas"
        heightClass="h-[88vh]"
      >
        <div className="p-4">
          <SearchPanel
            {...searchPanelProps}
            isMobile={true}
            leftPanelOpen={true}
            setLeftPanelOpen={() => {}}
            leftPanelWidth={0}
          />
        </div>
      </MobileBottomSheet>

      {/* Meta Analysis bottom sheet */}
      <MobileBottomSheet
        isOpen={activeMobileTab === 'meta'}
        onClose={() => setActiveMobileTab('deck')}
        title="📊 Detalle & Análisis"
        heightClass="h-[85vh]"
      >
        <div className="p-4">
          <MetaAnalysisPanel
            {...metaPanelProps}
            isMobile={true}
            rightPanelOpen={true}
            setRightPanelOpen={() => {}}
            rightPanelWidth={0}
          />
        </div>
      </MobileBottomSheet>

      {/* More options bottom sheet */}
      <MobileBottomSheet
        isOpen={mobileMoreOpen}
        onClose={() => setMobileMoreOpen(false)}
        title="⚙️ Centro de Operaciones"
        heightClass="h-[78vh]"
      >
        <div className="p-4 flex flex-col gap-5 text-zinc-900 dark:text-zinc-100">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono block">
              📁 Gestión de Baraja
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setMobileMoreOpen(false); onOpenSaveModal(); }} className="flex items-center gap-2 p-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer touch-manipulation min-h-12">
                <Save className="w-4 h-4 shrink-0" /><span>Guardar Deck</span>
              </button>
              <button type="button" onClick={() => { setMobileMoreOpen(false); onOpenLoadModal(); }} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12">
                <FolderOpen className="w-4 h-4 shrink-0 text-red-500" /><span>Cargar Deck</span>
              </button>
              <button type="button" onClick={() => { setMobileMoreOpen(false); onOpenYdkUpload(); }} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12">
                <Upload className="w-4 h-4 shrink-0 text-cyan-500" /><span>Subir .YDK</span>
              </button>
              <button type="button" onClick={() => { if (hasCards) { setMobileMoreOpen(false); onExportYdk(); } }} disabled={!hasCards} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12 disabled:opacity-40">
                <Download className="w-4 h-4 shrink-0 text-emerald-500" /><span>Bajar .YDK</span>
              </button>
            </div>
            <button type="button" onClick={() => { if (hasCards) { setMobileMoreOpen(false); onOpenClearConfirm(); } }} disabled={!hasCards} className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-11 disabled:opacity-40">
              <Trash2 className="w-4 h-4 shrink-0" /><span>Limpiar Todo el Deck</span>
            </button>
            {isSavedDeck && (
              <button type="button" onClick={() => { setMobileMoreOpen(false); onOpenDeleteConfirm(); }} className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-11 shadow-sm shadow-red-600/20">
                <Trash2 className="w-4 h-4 shrink-0" /><span>Eliminar Baraja Guardada</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono block">
              📊 Análisis &amp; Táctica
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setMobileMoreOpen(false); onOpenExordioView(); }} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12">
                <BarChart3 className="w-4 h-4 shrink-0 text-red-500" /><span>Análisis Exordio</span>
              </button>
              <button type="button" onClick={() => { setMobileMoreOpen(false); onOpenBreakdownsView(); }} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12">
                <span>📈</span><span>Meta MDM</span>
              </button>
              <button type="button" onClick={() => { setMobileMoreOpen(false); onOpenAICopilot(); }} className="flex items-center gap-2 p-3 bg-linear-to-r from-red-600/10 to-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12 font-display">
                <Bot className="w-4 h-4 shrink-0" /><span>IA Copilot</span>
              </button>
              <Link href="/knowledge" onClick={() => setMobileMoreOpen(false)} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12">
                <BrainCircuit className="w-4 h-4 shrink-0 text-cyan-500" /><span>Banco Reglas</span>
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono block">
              📦 Colección Física &amp; Datos
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/collection" onClick={() => setMobileMoreOpen(false)} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12">
                <Box className="w-4 h-4 shrink-0 text-amber-500" /><span>Mi Colección</span>
              </Link>
              <button type="button" onClick={() => { setMobileMoreOpen(false); onTriggerSync(); }} disabled={isSyncing} className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-12 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 shrink-0 text-amber-500 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sync Meta'}</span>
              </button>
            </div>
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
}
