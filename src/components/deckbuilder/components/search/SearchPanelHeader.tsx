import React from 'react';
import { LayoutGrid, List, X, Search } from 'lucide-react';

interface SearchPanelHeaderProps {
  isMobile: boolean;
  leftPanelOpen: boolean;
  setLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchViewMode: 'grid' | 'list';
  setSearchViewMode: (mode: 'grid' | 'list') => void;
  resultsCount: number;
}

export const SearchPanelHeader: React.FC<SearchPanelHeaderProps> = ({
  isMobile,
  leftPanelOpen,
  setLeftPanelOpen,
  searchViewMode,
  setSearchViewMode,
  resultsCount,
}) => {
  if (isMobile) {
    return (
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setSearchViewMode('grid')}
            className={`p-1.5 rounded transition-colors cursor-pointer touch-manipulation ${
              searchViewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Vista Cuadrícula"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSearchViewMode('list')}
            className={`p-1.5 rounded transition-colors cursor-pointer touch-manipulation ${
              searchViewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Vista Lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        <span className="text-[10px] text-zinc-500">
          {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return (
    <div className={`border-b border-zinc-200 dark:border-zinc-800 pb-2.5 flex items-center shrink-0 ${leftPanelOpen ? 'justify-between' : 'justify-center flex-col gap-2'}`}>
      {leftPanelOpen && (
        <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
          <span>🔍</span>
          <span>Buscar Cartas</span>
        </h2>
      )}
      <div className="flex items-center gap-1">
        {leftPanelOpen && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setSearchViewMode('grid')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                searchViewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSearchViewMode('list')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                searchViewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Vista Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button
          onClick={() => setLeftPanelOpen((p) => !p)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          title={leftPanelOpen ? 'Colapsar panel de búsqueda' : 'Expandir panel de búsqueda'}
        >
          {leftPanelOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
