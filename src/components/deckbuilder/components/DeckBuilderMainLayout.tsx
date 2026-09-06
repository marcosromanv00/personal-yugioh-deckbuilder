import React from 'react';
import { SearchPanel } from './SearchPanel';
import { MetaAnalysisPanel } from './MetaAnalysisPanel';
import { DeckBoard } from './DeckBoard';
import { DeckBuilderMobileSheets } from './DeckBuilderMobileSheets';
import { MobileTab } from './MobileNav';
import { usePanelResize } from '../hooks/usePanelResize';
import { useDeckBuilderState } from '../hooks/useDeckBuilderState';
import { useDeckBuilderModalsState } from '../hooks/useDeckBuilderModalsState';
import { useDeckBuilderLayoutProps } from '../hooks/useDeckBuilderLayoutProps';

interface DeckBuilderMainLayoutProps {
  resize: ReturnType<typeof usePanelResize>;
  state: ReturnType<typeof useDeckBuilderState>;
  modalsState: ReturnType<typeof useDeckBuilderModalsState>;
  layoutProps: ReturnType<typeof useDeckBuilderLayoutProps>;
  activeMobileTab: MobileTab;
  setActiveMobileTab: (tab: MobileTab) => void;
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (open: boolean) => void;
  showToastSuccess: (msg: string) => void;
}

export function DeckBuilderMainLayout(props: DeckBuilderMainLayoutProps) {
  const {
    resize, state, modalsState, layoutProps, activeMobileTab,
    setActiveMobileTab, mobileMoreOpen, setMobileMoreOpen, showToastSuccess,
  } = props;

  return (
    <>
      {/* DESKTOP (lg+): 3-column resizable layout */}
      <div className="hidden lg:flex flex-1 min-h-0 flex-row gap-3 p-3 lg:p-4 max-w-full w-full overflow-hidden">
        <SearchPanel {...layoutProps.searchPanelSharedProps} leftPanelOpen={resize.leftPanelOpen} setLeftPanelOpen={resize.setLeftPanelOpen} leftPanelWidth={resize.leftPanelWidth} isMobile={false} />
        {resize.leftPanelOpen && <div onMouseDown={resize.startResizeLeft} className="w-1 hover:w-1.5 bg-transparent cursor-col-resize self-stretch shrink-0 transition-all" />}
        <DeckBoard {...layoutProps.deckBoardProps} />
        {resize.rightPanelOpen && <div onMouseDown={resize.startResizeRight} className="w-1 hover:w-1.5 bg-transparent cursor-col-resize self-stretch shrink-0 transition-all" />}
        <MetaAnalysisPanel {...layoutProps.metaPanelSharedProps} rightPanelOpen={resize.rightPanelOpen} setRightPanelOpen={resize.setRightPanelOpen} rightPanelWidth={resize.rightPanelWidth} isMobile={false} />
      </div>

      {/* TABLET (md–lg): 2-column layout */}
      <div className="hidden md:flex lg:hidden flex-1 min-h-0 flex-row gap-3 p-4 max-w-full w-full overflow-hidden">
        <div className="w-72 shrink-0 h-full min-h-0 flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <h2 className="font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">🔍 Buscar</h2>
          </div>
          <div className="p-4 pt-0 flex-1 overflow-hidden">
            <SearchPanel {...layoutProps.searchPanelSharedProps} leftPanelOpen={true} setLeftPanelOpen={() => {}} leftPanelWidth={0} isMobile={true} />
          </div>
        </div>
        <div className="flex-1 min-w-0 h-full min-h-0 flex flex-col gap-3 overflow-hidden">
          <DeckBoard {...layoutProps.deckBoardProps} />
          <div className="shrink-0">
            <MetaAnalysisPanel {...layoutProps.metaPanelSharedProps} rightPanelOpen={resize.rightPanelOpen} setRightPanelOpen={resize.setRightPanelOpen} rightPanelWidth={resize.rightPanelWidth} isMobile={false} />
          </div>
        </div>
      </div>

      {/* MOBILE (< md): Single-column layout */}
      <div className="flex md:hidden flex-col flex-1 pb-16">
        <div className="flex-1 flex flex-col gap-3 p-4">
          <DeckBoard {...layoutProps.deckBoardProps} isMobileLayout={true} />
        </div>
        <DeckBuilderMobileSheets
          activeMobileTab={activeMobileTab}
          setActiveMobileTab={setActiveMobileTab}
          mobileMoreOpen={mobileMoreOpen}
          setMobileMoreOpen={setMobileMoreOpen}
          searchPanelProps={layoutProps.searchPanelSharedProps}
          metaPanelProps={layoutProps.metaPanelSharedProps}
          hasCards={state.deckCards.length > 0}
          isSavedDeck={Boolean(state.deckId)}
          isSyncing={state.isSyncing}
          onOpenSaveModal={state.handleOpenSaveModal}
          onOpenLoadModal={state.handleOpenLoadModal}
          onOpenYdkUpload={() => modalsState.setIsYdkUploadOpen(true)}
          onExportYdk={() => { state.exportYdkFile(); showToastSuccess('Archivo .YDK descargado'); }}
          onOpenClearConfirm={() => modalsState.setIsClearConfirmOpen(true)}
          onOpenDeleteConfirm={() => modalsState.setIsDeleteActiveDeckConfirmOpen(true)}
          onOpenExordioView={() => state.setActiveView('exordio')}
          onOpenBreakdownsView={() => state.setActiveView('breakdowns')}
          onOpenAICopilot={() => modalsState.setIsAICopilotOpen(true)}
          onTriggerSync={() => state.triggerSync()}
        />
      </div>
    </>
  );
}
