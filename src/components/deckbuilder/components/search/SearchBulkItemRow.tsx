import React from 'react';
import { CardImage } from '@/components/ui/CardImage';
import { ParsedBulkItem } from './searchPanel.types';

interface SearchBulkItemRowProps {
  item: ParsedBulkItem;
  toggleBulkItem: (id: string) => void;
  toggleBulkItemLink: (id: string) => void;
  updateBulkItemQty: (id: string, delta: number) => void;
}

export const SearchBulkItemRow: React.FC<SearchBulkItemRowProps> = ({
  item,
  toggleBulkItem,
  toggleBulkItemLink,
  updateBulkItemQty,
}) => {
  return (
    <div
      onClick={() => toggleBulkItem(item.id)}
      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
        item.selected ? 'bg-zinc-50 dark:bg-zinc-950/80 border-red-500/50' : 'bg-zinc-100/50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800 opacity-60'
      }`}
    >
      <input
        type="checkbox"
        checked={item.selected}
        onChange={() => toggleBulkItem(item.id)}
        onClick={(e) => e.stopPropagation()}
        className="rounded border-zinc-300 text-red-600 w-3.5 h-3.5"
      />
      <div className="w-7 h-10 rounded overflow-hidden shrink-0">
        <CardImage src={item.image_url_small || item.image_url} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {item.section}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleBulkItemLink(item.id);
            }}
            className="text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          >
            {item.linkWithCollection !== false ? '🔗 Enlazada' : '⚫ Nueva'}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => updateBulkItemQty(item.id, -1)}
          disabled={item.quantity <= 1}
          className="w-4 h-4 rounded flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 font-bold text-xs"
        >
          -
        </button>
        <span className="text-xs font-mono font-black px-1">{item.quantity}</span>
        <button
          type="button"
          onClick={() => updateBulkItemQty(item.id, 1)}
          disabled={item.quantity >= 3}
          className="w-4 h-4 rounded flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 font-bold text-xs"
        >
          +
        </button>
      </div>
    </div>
  );
};
