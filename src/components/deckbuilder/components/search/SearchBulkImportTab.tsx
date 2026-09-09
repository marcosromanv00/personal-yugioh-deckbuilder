import React from 'react';
import { Upload, FileText, Camera, AlertCircle, Check, Loader2, Sparkles } from 'lucide-react';
import { ParsedBulkItem } from './searchPanel.types';
import { SearchBulkItemRow } from './SearchBulkItemRow';

interface SearchBulkImportTabProps {
  bulkMode: 'ydk' | 'ids';
  setBulkMode: (m: 'ydk' | 'ids') => void;
  fileName: string;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bulkText: string;
  setBulkText: (t: string) => void;
  bulkLinkWithCollection: boolean;
  setBulkLinkWithCollection: (v: boolean) => void;
  setIsScannerOpen: (o: boolean) => void;
  bulkErrorMsg: string;
  bulkSuccessMsg: string;
  unmatchedBulkCards: string[];
  parsedBulkItems: ParsedBulkItem[];
  selectAllBulkItems: (val: boolean) => void;
  toggleBulkItem: (id: string) => void;
  toggleBulkItemLink: (id: string) => void;
  updateBulkItemQty: (id: string, delta: number) => void;
  confirmAddParsedBulkToDeck: () => void;
  handleProcessBulkText: () => void;
  analyzingBulk: boolean;
  userInventoryCounts: Record<number, number>;
}

export const SearchBulkImportTab: React.FC<SearchBulkImportTabProps> = ({
  bulkMode, setBulkMode, fileName, handleFileUpload, bulkText, setBulkText,
  bulkLinkWithCollection, setBulkLinkWithCollection, setIsScannerOpen,
  bulkErrorMsg, bulkSuccessMsg, unmatchedBulkCards, parsedBulkItems,
  selectAllBulkItems, toggleBulkItem, toggleBulkItemLink, updateBulkItemQty,
  confirmAddParsedBulkToDeck, handleProcessBulkText, analyzingBulk,
}) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col justify-between space-y-3 scrollbar-thin">
      <div className="space-y-3 flex-1">
        <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setBulkMode('ydk')}
            className={`py-1 px-2 rounded-md text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              bulkMode === 'ydk' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>.YDK / Nombre</span>
          </button>
          <button
            type="button"
            onClick={() => setBulkMode('ids')}
            className={`py-1 px-2 rounded-md text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              bulkMode === 'ids' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>#</span>
            <span>IDs Numéricos</span>
          </button>
        </div>

        {bulkMode === 'ydk' && (
          <div className="border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-red-500 rounded-xl p-3 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors shrink-0">
            <input type="file" accept=".ydk,.txt" onChange={handleFileUpload} id="search-bulk-file-input" className="hidden" />
            <label htmlFor="search-bulk-file-input" className="cursor-pointer flex flex-col items-center justify-center">
              <Upload className="w-5 h-5 text-red-600 dark:text-red-500 mb-1" />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{fileName || 'Subir archivo .ydk o .txt'}</span>
              <span className="text-[10px] text-zinc-400">Archivos YDK o texto con IDs/nombres</span>
            </label>
          </div>
        )}

        <div className="shrink-0">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono">
              {bulkMode === 'ids' ? 'Pega IDs numéricos (uno por línea):' : 'O pega lista de nombres, IDs o formato YDK:'}
            </label>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[9.5px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              title="Escanear código con cámara"
            >
              <Camera className="w-3 h-3" />
              <span>Cámara</span>
            </button>
          </div>
          <textarea
            rows={4}
            inputMode={bulkMode === 'ids' ? 'numeric' : 'text'}
            placeholder={bulkMode === 'ids' ? '89631139\n46986414' : '3x Ash Blossom & Joyous Spring\n#main\n46986414'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:border-red-500"
          />
        </div>

        <label className="flex items-start gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={bulkLinkWithCollection}
            onChange={(e) => setBulkLinkWithCollection(e.target.checked)}
            className="rounded border-zinc-300 text-red-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer mt-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <span>🔗</span>
              <span>Enlazar con Mi Colección</span>
            </p>
            <p className="text-[9.5px] text-zinc-500 font-mono leading-tight mt-0.5">
              Asigna tus cartas físicas de mayor rareza disponibles y detecta cartas en otros mazos.
            </p>
          </div>
        </label>

        {bulkErrorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{bulkErrorMsg}</span>
          </div>
        )}

        {bulkSuccessMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{bulkSuccessMsg}</span>
          </div>
        )}

        {unmatchedBulkCards.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium shrink-0">
            <strong className="block font-bold">No reconocidas ({unmatchedBulkCards.length}):</strong>
            <span className="text-[11px] font-mono">{unmatchedBulkCards.slice(0, 5).join(', ')}{unmatchedBulkCards.length > 5 ? '...' : ''}</span>
          </div>
        )}

        {parsedBulkItems.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
              <span className="text-[11px] font-black uppercase text-zinc-800 dark:text-zinc-200">
                Total a agregar: <b className="text-red-600 dark:text-red-400 font-mono text-xs">{parsedBulkItems.filter((i) => i.selected).reduce((acc, i) => acc + i.quantity, 0)} cartas</b>
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => selectAllBulkItems(true)} className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Todas</button>
                <button type="button" onClick={() => selectAllBulkItems(false)} className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Ninguna</button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {parsedBulkItems.map((item) => (
                <SearchBulkItemRow
                  key={item.id}
                  item={item}
                  toggleBulkItem={toggleBulkItem}
                  toggleBulkItemLink={toggleBulkItemLink}
                  updateBulkItemQty={updateBulkItemQty}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 pt-2 pb-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs z-10 border-t border-zinc-200/60 dark:border-zinc-800/60 -mx-1 px-1 shrink-0">
        {parsedBulkItems.length > 0 ? (
          <button type="button" onClick={confirmAddParsedBulkToDeck} disabled={parsedBulkItems.filter((i) => i.selected).length === 0} className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md">
            <Check className="w-4 h-4" />
            <span>Confirmar y Agregar ({parsedBulkItems.filter((i) => i.selected).reduce((acc, i) => acc + i.quantity, 0)} Cartas)</span>
          </button>
        ) : (
          <button type="button" onClick={handleProcessBulkText} disabled={analyzingBulk || !bulkText.trim()} className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md">
            {analyzingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{analyzingBulk ? 'Analizando Lote...' : 'Analizar Lote de Cartas'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
