'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BrainCircuit, Loader2 } from 'lucide-react';
import { CardKnowledgeData } from '@/types/knowledge';
import { CardIntelligenceView } from './CardIntelligenceView';

interface CardKnowledgeContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardNameOrId: string | number | null;
}

export const CardKnowledgeContextModal: React.FC<CardKnowledgeContextModalProps> = ({
  isOpen,
  onClose,
  cardNameOrId
}) => {
  const [knowledgeData, setKnowledgeData] = useState<CardKnowledgeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !cardNameOrId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchKnowledge = async () => {
      try {
        const queryParam = typeof cardNameOrId === 'number' 
          ? `id=${cardNameOrId}` 
          : `name=${encodeURIComponent(cardNameOrId)}`;

        const res = await fetch(`/api/knowledge/card?${queryParam}`);
        const result = await res.json();

        if (isMounted) {
          if (res.ok && result.success && result.data) {
            setKnowledgeData(result.data);
          } else {
            setError(result.error || 'No se pudo cargar la información de conocimiento.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Error de conexión con la Base de Conocimiento.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchKnowledge();

    return () => {
      isMounted = false;
    };
  }, [isOpen, cardNameOrId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 font-display">
                EX
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight font-display flex items-center gap-2">
                  Banco de Reglas &amp; Meta Intelligence
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Fuente de verdad, rankings oficiales y sinergias del meta.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider font-display">Consultando Banco de Reglas...</span>
              </div>
            )}

            {error && (
              <div className="p-6 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            {!isLoading && knowledgeData && (
              <CardIntelligenceView
                cardData={knowledgeData}
                onKnowledgeUpdated={(updated) => setKnowledgeData(updated)}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
