import React from 'react';
import { ArchetypeItem } from '../types';

interface ArchetypesBreakdownsViewProps {
  onBackToBuilder: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  isFetching: boolean;
  archetypesList: ArchetypeItem[];
  onSelectArchetype: (name: string) => void;
}

export function ArchetypesBreakdownsView({
  onBackToBuilder,
  searchQuery,
  onSearchQueryChange,
  isFetching,
  archetypesList,
  onSelectArchetype,
}: ArchetypesBreakdownsViewProps) {
  const filteredArchetypes = archetypesList.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-0 p-4 sm:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 overflow-y-auto">
      <div className="space-y-6">
        {/* Barra de Retorno Rápido al Constructor */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onBackToBuilder}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer font-display min-h-11 touch-manipulation"
          >
            <span>←</span>
            <span>Volver al Taller</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
            Metajuego MDM
          </span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="font-black text-xl sm:text-2xl text-zinc-900 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-red-500">📊</span> Breakdowns Competitivos
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
              Explora arquetipos de Master Duel Meta y carga sus recetas populares en un solo clic.
            </p>
          </div>
          <input
            type="text"
            placeholder="Filtrar arquetipos..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-3 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-red-500 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold focus:outline-hidden w-full sm:max-w-xs shadow-xs transition-colors"
          />
        </div>

        {isFetching ? (
          <div className="text-center py-20">
            <span className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2 block font-extrabold">⏳</span>
            <p className="text-xs font-mono font-bold text-zinc-500">Cargando arquetipos del meta...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredArchetypes.map((arch) => (
              <div
                key={arch.name}
                onClick={() => onSelectArchetype(arch.name)}
                className="cursor-pointer p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/60 rounded-2xl flex flex-col justify-between group transition-all duration-200 shadow-xs touch-manipulation"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-base text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors">
                      {arch.name}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold font-mono border border-red-200 dark:border-red-900/40">
                      Tier {arch.tier}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {arch.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono font-bold text-zinc-400">
                  <span>Cartas meta: {arch.cardCount}</span>
                  <span className="text-red-600 dark:text-red-400 font-black group-hover:underline">
                    Ver desglose →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
