'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Check, AlertCircle, Loader2, Hash, Camera } from 'lucide-react';
import { sanitizeBulkInput } from '@/lib/bulkSanitizer';
import { CardCodeScannerModal, YgoDetectedCard } from '@/components/scanner/CardCodeScannerModal';

interface YdkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onImportToDeck?: (ydkText: string) => Promise<void>;
}

export const YdkUploadModal: React.FC<YdkUploadModalProps> = ({ isOpen, onClose, onSuccess, onImportToDeck }) => {
  // Sub-mode: 'ydk' = .ydk file / names, 'ids' = raw numeric IDs
  const [importMode, setImportMode] = useState<'ydk' | 'ids'>('ydk');
  const [ydkText, setYdkText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScannerCardRegistered = (card: YgoDetectedCard, quantity: number) => {
    const lineToAdd = Array(quantity).fill(card.id.toString()).join('\n');
    setYdkText((prev) => (prev.trim() ? `${prev.trim()}\n${lineToAdd}` : lineToAdd));
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = (event.target?.result as string) || '';
      setYdkText(sanitizeBulkInput(raw, importMode === 'ids'));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedText = sanitizeBulkInput(ydkText, importMode === 'ids');
    setYdkText(cleanedText);

    if (!cleanedText.trim()) {
      setError('Por favor sube un archivo .ydk o pega el contenido / lista de IDs');
      return;
    }

    setLoading(true);
    setError('');
    setResultMessage('');

    try {
      if (onImportToDeck) {
        await onImportToDeck(cleanedText);
        setResultMessage('¡Éxito! Baraja cargada en el editor con las cartas indicadas.');
      } else {
        const res = await fetch('/api/collection/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ydkText: cleanedText }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Error al importar archivo .ydk');
        }

        setResultMessage(`¡Éxito! Se importaron ${json.insertedCount || json.parsedCount || 0} cartas a la bandeja Sin Clasificar.`);
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);

    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Fallo al procesar el archivo .ydk / lista de IDs');
    } finally {
      setLoading(false);
    }
  };


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl p-6 text-zinc-900 dark:text-zinc-100 shadow-2xl relative flex flex-col h-dvh sm:h-auto"
        >
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Importar Colección (.ydk)</span>
            </h2>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Sub-switch: .YDK / Nombre vs IDs Numéricos */}
            <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => { setImportMode('ydk'); setYdkText(''); setFileName(''); }}
                className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  importMode === 'ydk'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>.YDK / Nombre</span>
              </button>
              <button
                type="button"
                onClick={() => { setImportMode('ids'); setYdkText(''); setFileName(''); }}
                className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  importMode === 'ids'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>IDs Numéricos</span>
              </button>
            </div>

            {/* File Dropzone — only shown in ydk mode */}
            {importMode === 'ydk' && (
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-cyan-500 rounded-2xl p-6 text-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
                <input
                  type="file"
                  accept=".ydk,.txt"
                  onChange={handleFileUpload}
                  id="ydk-file-input"
                  className="hidden"
                />
                <label htmlFor="ydk-file-input" className="cursor-pointer flex flex-col items-center">
                  <FileText className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-2" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {fileName ? fileName : 'Haz clic para seleccionar tu archivo .ydk'}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1">Soporta formatos estándar .ydk de YGOPRODeck</span>
                </label>
              </div>
            )}

            {/* Paste Text Fallback */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black uppercase text-zinc-500 font-mono">
                  {importMode === 'ids' ? 'Pega IDs numéricos (uno por línea):' : 'O pega el contenido .ydk aquí:'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[9.5px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                  title="Escanear código de 8 dígitos con cámara"
                >
                  <Camera className="w-3 h-3" />
                  <span>Cámara</span>
                </button>
              </div>
              <textarea
                rows={4}
                inputMode={importMode === 'ids' ? 'numeric' : 'text'}
                placeholder={
                  importMode === 'ids'
                    ? '89631139\n46986414\n24094653\n14558127'
                    : '#main\n46986414\n#extra\n44508094\n!side'
                }
                value={ydkText}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = importMode === 'ids' ? sanitizeBulkInput(raw, true, true) : raw;
                  setYdkText(sanitized);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:border-red-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resultMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{resultMessage}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md shadow-red-600/25 cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{loading ? 'Importando...' : 'Cargar a Bandeja Sin Clasificar'}</span>
              </button>
            </div>
          </form>

          {/* MODAL DE ESCANEO DE CÓDIGOS OCR */}
          <CardCodeScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onCardRegistered={handleScannerCardRegistered}
            title="Escanear Código de Carta"
            subtitle="Apunta al código numérico de 8 dígitos de la esquina inferior"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
