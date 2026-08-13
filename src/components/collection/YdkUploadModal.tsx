'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';

interface YdkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const YdkUploadModal: React.FC<YdkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [ydkText, setYdkText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setYdkText(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ydkText.trim()) {
      setError('Por favor sube un archivo .ydk o pega el contenido');
      return;
    }

    setLoading(true);
    setError('');
    setResultMessage('');

    try {
      const res = await fetch('/api/collection/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ydkText }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al importar archivo .ydk');
      }

      setResultMessage(`¡Éxito! Se importaron ${json.insertedCount || json.parsedCount || 0} cartas a la bandeja Sin Clasificar.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Fallo al procesar el archivo .ydk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl relative"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              Importar Colección (.ydk)
            </h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-6 text-center bg-slate-950/50 transition-colors">
              <input
                type="file"
                accept=".ydk,.txt"
                onChange={handleFileUpload}
                id="ydk-file-input"
                className="hidden"
              />
              <label htmlFor="ydk-file-input" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-10 h-10 text-purple-400 mb-2" />
                <span className="text-sm font-medium text-slate-200">
                  {fileName ? fileName : 'Haz clic para seleccionar tu archivo .ydk'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Soporta formatos estándar .ydk de YGOPRODeck</span>
              </label>
            </div>

            {/* Paste Text Fallback */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">O pega el texto .ydk aquí:</label>
              <textarea
                rows={5}
                placeholder="#main&#10;46986414&#10;#extra&#10;44508094&#10;!side"
                value={ydkText}
                onChange={(e) => setYdkText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 resize-none focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {resultMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{resultMessage}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-purple-900/30"
              >
                <span>{loading ? 'Importando...' : 'Cargar a Bandeja Sin Clasificar'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
