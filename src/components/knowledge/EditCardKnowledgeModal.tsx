'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Sparkles,
  ShieldAlert,
  BrainCircuit,
  Layers
} from 'lucide-react';
import { CardKnowledgeData, FormatType, CardRuling } from '@/types/knowledge';
import { useToast } from '@/components/ui/ToastProvider';

interface EditCardKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: CardKnowledgeData;
  activeFormat: FormatType;
  onKnowledgeUpdated: (updated: CardKnowledgeData) => void;
}

export const EditCardKnowledgeModal: React.FC<EditCardKnowledgeModalProps> = ({
  isOpen,
  onClose,
  cardData,
  activeFormat,
  onKnowledgeUpdated
}) => {
  const toast = useToast();
  const [assignedArchetype, setAssignedArchetype] = useState<string>(cardData.archetype || '');
  const [rulings, setRulings] = useState<CardRuling[]>(
    JSON.parse(JSON.stringify(cardData.rulings || []))
  );
  const [verificationNotes, setVerificationNotes] = useState<string>(
    cardData.userVerificationNotes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Nuevo ruling draft
  const [newTopic, setNewTopic] = useState('');
  const [newRulingText, setNewRulingText] = useState('');

  if (!isOpen) return null;

  const handleAddRuling = () => {
    if (!newTopic.trim() || !newRulingText.trim()) return;
    setRulings([
      ...rulings,
      {
        id: `custom-rul-${Date.now()}`,
        topic: newTopic.trim(),
        rulingText: newRulingText.trim(),
        source: 'User Override',
        is_user_verified: true
      }
    ]);
    setNewTopic('');
    setNewRulingText('');
  };

  const handleRemoveRuling = (index: number) => {
    setRulings(rulings.filter((_, i) => i !== index));
  };

  const handleRulingChange = (index: number, field: 'topic' | 'rulingText', value: string) => {
    const updated = [...rulings];
    updated[index] = {
      ...updated[index],
      [field]: value,
      is_user_verified: true
    };
    setRulings(updated);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const updatedCardData: CardKnowledgeData = {
      ...cardData,
      archetype: assignedArchetype.trim() || undefined,
      rulings,
      is_user_verified: true,
      userVerificationNotes: verificationNotes.trim() || 'Interpretación corregida manualmente por el usuario'
    };

    try {
      const res = await fetch('/api/knowledge/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_name: cardData.cardName,
          updated_data: updatedCardData,
          audit_reason: verificationNotes.trim() || 'Ajuste de interpretaciones y rulings del agente'
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Error al guardar los cambios');
      }

      toast.success(`Interpretaciones de "${cardData.cardName}" guardadas en el Banco de Reglas.`);
      onKnowledgeUpdated(updatedCardData);

      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar cambios';
      setStatusMessage({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToMeta = async () => {
    if (!confirm('¿Restablecer las interpretaciones de esta carta a los valores automáticos iniciales?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/knowledge/card?card_name=${encodeURIComponent(cardData.cardName)}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success && result.data) {
        toast.info(`Interpretaciones de "${cardData.cardName}" restablecidas a valores base.`);
        onKnowledgeUpdated(result.data);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-dvh sm:h-auto sm:max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 font-display">
                EX
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight font-display flex items-center gap-2">
                  Corregir Interpretaciones del Agente
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono font-bold">
                    {cardData.cardName}
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Edita la clasificación de arquetipo, rulings de juez y notas estratégicas del agente.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* Archetype Assignment */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-red-500" />
                  Arquetipo Asignado por la IA
                </label>
                <span className="text-[10px] text-zinc-400">
                  Familia principal para el Deckbuilder y la Colección
                </span>
              </div>
              <input
                type="text"
                placeholder="Ej. Branded, Beetrooper, Snake-Eye, Genérica / Staple..."
                value={assignedArchetype}
                onChange={(e) => setAssignedArchetype(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Rulings Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Rulings e Interacciones de Juez ({rulings.length})
                </h3>
              </div>

              {/* Existing Rulings List */}
              <div className="space-y-3">
                {rulings.map((ruling, idx) => (
                  <div 
                    key={ruling.id || idx}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={ruling.topic}
                        onChange={(e) => handleRulingChange(idx, 'topic', e.target.value)}
                        placeholder="Tema / Interacción..."
                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRuling(idx)}
                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Eliminar este ruling"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={ruling.rulingText}
                      onChange={(e) => handleRulingChange(idx, 'rulingText', e.target.value)}
                      placeholder="Explicación detallada del ruling..."
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-700 dark:text-zinc-300 focus:border-red-500 resize-none leading-relaxed"
                    />
                  </div>
                ))}

                {/* Add new Ruling Box */}
                <div className="p-3.5 rounded-xl bg-red-50/30 dark:bg-red-950/10 border border-dashed border-red-200 dark:border-red-900/40 space-y-2">
                  <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 font-mono block">
                    + Añadir Nuevo Ruling Oficial / Regla de Juez
                  </span>
                  <input
                    type="text"
                    placeholder="Tema / Mecánica (ej. 'Resolución en Cadena', 'Damage Step')..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:border-red-500 placeholder-zinc-400"
                  />
                  <textarea
                    rows={2}
                    placeholder="Texto explicativo del ruling oficial..."
                    value={newRulingText}
                    onChange={(e) => setNewRulingText(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-red-500 resize-none placeholder-zinc-400 leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleAddRuling}
                    disabled={!newTopic.trim() || !newRulingText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer font-display"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Ruling</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Strategic Notes / Audit Motive */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono mb-1.5">
                Notas Tácticas & Motivo de Corrección
              </label>
              <textarea
                rows={2}
                placeholder="Indica la razón de tu corrección para que el agente la recuerde en futuros análisis (ej. 'No incluir en arquetipos Link puros debido a su restricción de Extra Deck')..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Status Feedback */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                )}
                <span>{statusMessage.text}</span>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80">
            <button
              type="button"
              onClick={handleResetToMeta}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-300 dark:border-amber-900/40 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer a Datos Base</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 active:scale-98 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-red-600/25 cursor-pointer font-display"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar en Banco de Reglas</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
