import React from 'react';
import Image from 'next/image';
import { Search, X, Loader2, BookOpen } from 'lucide-react';
import { YgoCardResult } from './manualAdder.types';

interface ManualAdderSearchSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra';
  setTypeFilter: (t: 'All' | 'Monster' | 'Spell' | 'Trap' | 'Extra') => void;
  searchResults: YgoCardResult[];
  searching: boolean;
  onAddCardToQueue: (card: YgoCardResult) => void;
}

export const ManualAdderSearchSection: React.FC<ManualAdderSearchSectionProps> = ({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  searchResults,
  searching,
  onAddCardToQueue,
}) => {
  return (
    <>
      {/* Search Bar */}
      <div className="relative mb-2 shrink-0">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-red-500 shadow-xs"
        />
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Fast Type Filter Pills */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-2 mb-2 shrink-0">
        {(['All', 'Monster', 'Spell', 'Trap', 'Extra'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
              typeFilter === t
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {t === 'All' ? 'Todos' : t}
          </button>
        ))}
      </div>

      {/* Search Results List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
        {searching ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-red-500 mb-2" />
            <span className="text-[11px] font-mono text-zinc-400">Buscando cartas...</span>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {searchResults.map((c) => (
              <div
                key={c.id}
                onClick={() => onAddCardToQueue(c)}
                className="group relative p-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:scale-102 shadow-xs"
              >
                <div className="relative aspect-[3/4.2] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-1.5">
                  <Image
                    src={c.image_url_small || c.image_url}
                    alt={c.name}
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </div>
                <span className="text-[10px] font-black line-clamp-1 text-zinc-900 dark:text-zinc-100">
                  {c.name}
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[8px] font-mono text-zinc-400 truncate max-w-20">
                    {c.type}
                  </span>
                  <span className="text-[9px] font-black text-red-500 flex items-center">
                    + Añadir
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
            <BookOpen className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              {searchQuery ? 'Sin coincidencias' : 'Escribe para buscar'}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-50">
              Escribe el nombre de la carta para añadirla a la cola.
            </p>
          </div>
        )}
      </div>
    </>
  );
};
