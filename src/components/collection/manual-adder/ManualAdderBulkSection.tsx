import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface ManualAdderBulkSectionProps {
  bulkText: string;
  setBulkText: (t: string) => void;
  analyzingBulk: boolean;
  unmatchedBulkCards: string[];
  onAnalyzeBulk: () => void;
}

export const ManualAdderBulkSection: React.FC<ManualAdderBulkSectionProps> = ({
  bulkText,
  setBulkText,
  analyzingBulk,
  unmatchedBulkCards,
  onAnalyzeBulk,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
        Pega tu lista de cartas (una por línea con cantidad):
      </div>
      <textarea
        rows={8}
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        placeholder={`3 Ash Blossom & Joyous Spring\n1 Nibiru, the Primal Being\n3 Infinite Impermanence\nRaigeki x2`}
        className="w-full flex-1 p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono focus:border-red-500 focus:outline-none resize-none leading-relaxed"
      />

      <button
        type="button"
        onClick={onAnalyzeBulk}
        disabled={analyzingBulk || !bulkText.trim()}
        className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-600/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        {analyzingBulk ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analizando...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Analizar y Volcar al Grid</span>
          </>
        )}
      </button>

      {unmatchedBulkCards.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px]">
          <b>No reconocidas ({unmatchedBulkCards.length}):</b>
          <div className="font-mono mt-1 max-h-20 overflow-y-auto">
            {unmatchedBulkCards.map((u, i) => (
              <div key={i}>• {u}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
