'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Sparkles, 
  X, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Layers, 
  Flame,
  ShieldCheck,
  Search,
  BookOpen
} from 'lucide-react';
import { SynergyRole } from '@/lib/constants/archetypeSynergies';
import { useToast } from '@/components/ui/ToastProvider';

interface TeachSynergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultArchetype?: string;
  defaultCardName?: string;
  onSynergySaved?: (synergy: {
    archetype: string;
    card_name: string;
    synergy_role: SynergyRole;
    weight: number;
    reason: string;
  }) => void;
}

const ROLES_CONFIG: Array<{
  role: SynergyRole;
  label: string;
  badgeClass: string;
  icon: React.ElementType;
  description: string;
}> = [
  { 
    role: 'starter', 
    label: 'Starter (Iniciador)', 
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30', 
    icon: Zap,
    description: 'Inicia el combo principal o busca una pieza fundamental en Turno 1.' 
  },
  { 
    role: 'searcher', 
    label: 'Buscador / Engine', 
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30', 
    icon: Search,
    description: 'Busca o coloca magias, trampas o monstruos clave del arquetipo.' 
  },
  { 
    role: 'extender', 
    label: 'Extensor de Jugadas', 
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', 
    icon: Layers,
    description: 'Permite continuar el combo tras una interrupción o generar más presencia.' 
  },
  { 
    role: 'dump_target', 
    label: 'Objetivo GY (Dump Target)', 
    badgeClass: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/30', 
    icon: Flame,
    description: 'Se activa o genera ventaja al enviarse al Cementerio desde el Deck o mano.' 
  },
  { 
    role: 'tech', 
    label: 'Tech Secreta / Sorpresa', 
    badgeClass: 'bg-amber-500/10 text-amber-500 dark:text-amber-300 border-amber-500/30', 
    icon: Sparkles,
    description: 'Carta no convencional que rompe el formato o resuelve situaciones difíciles.' 
  },
  { 
    role: 'floodgate_counter', 
    label: 'Anti-Meta / Floodgate', 
    badgeClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30', 
    icon: ShieldCheck,
    description: 'Bloquea estrategias populares sin perjudicar tu propio flujo de juego.' 
  },
  { 
    role: 'engine', 
    label: 'Engine Híbrido', 
    badgeClass: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-300 border-cyan-500/30', 
    icon: BrainCircuit,
    description: 'Paquete de cartas de otra familia con sinergia perfecta (ej. Horus, Bystial).' 
  },
  { 
    role: 'boss', 
    label: 'Monstruo Jefe (Boss)', 
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', 
    icon: Flame,
    description: 'Monstruo de cierre de campo, alta interrupción o daño masivo.' 
  }
];

export const TeachSynergyModal: React.FC<TeachSynergyModalProps> = ({
  isOpen,
  onClose,
  defaultArchetype = '',
  defaultCardName = '',
  onSynergySaved
}) => {
  const toast = useToast();
  const [archetype, setArchetype] = useState(defaultArchetype);
  const [cardName, setCardName] = useState(defaultCardName);
  const [selectedRole, setSelectedRole] = useState<SynergyRole>('starter');
  const [weight, setWeight] = useState<number>(0.90);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archetype.trim() || !cardName.trim()) {
      setStatusMessage({ type: 'error', text: 'El arquetipo y el nombre de la carta son requeridos.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/synergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetype: archetype.trim(),
          card_name: cardName.trim(),
          synergy_role: selectedRole,
          weight,
          reason: reason.trim(),
          source: 'user_feedback'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al registrar la sinergia');
      }

      toast.success(`Interpretación aprendida: "${cardName.trim()}" en ${archetype.trim()}`);

      if (onSynergySaved) {
        onSynergySaved({
          archetype: archetype.trim(),
          card_name: cardName.trim(),
          synergy_role: selectedRole,
          weight,
          reason: reason.trim()
        });
      }

      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la interpretación';
      setStatusMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
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
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-dvh sm:h-auto sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 font-display">
                EX
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight font-display flex items-center gap-2">
                  Enseñar Interpretación al Agente
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono font-bold">
                    Banco de Reglas
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Asigna el rol táctico y la razón de sinergia para que el agente la utilice en sus recomendaciones.
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {/* Input Row: Archetype & Card Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono mb-1.5">
                  Arquetipo Objetivo
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Beetrooper, HERO, Branded..."
                    value={archetype}
                    onChange={(e) => setArchetype(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono mb-1.5">
                  Nombre de la Carta (Soporte / Tech)
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Resonance Insect, Fossil Dig..."
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono mb-2">
                Rol Táctico Interpretado por la IA
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES_CONFIG.map(({ role, label, badgeClass, icon: Icon, description }) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? `${badgeClass} ring-2 ring-red-500 shadow-sm bg-red-50/50 dark:bg-zinc-800`
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`} />
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {label}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Synergy Strength Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono">
                  Importancia de Inclusión en el Core
                </label>
                <span className="text-xs font-mono font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-900/40">
                  {Math.round(weight * 100)}% ({weight >= 0.9 ? 'Core 3x' : weight >= 0.75 ? 'Recomendada 2-3x' : 'Tech Opcional 1x'})
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="1.00"
                step="0.05"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
                <span>30% Tech Opcional</span>
                <span>75% Recomendada</span>
                <span>100% Mandatoria</span>
              </div>
            </div>

            {/* Technical Explanation */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono mb-1.5">
                Razón Técnica / Mecánica de Juego
              </label>
              <textarea
                rows={3}
                placeholder="Explica la interacción con el arquetipo (ej: 'Al enviarse al GY busca cualquier Insecto Nivel 5+ disparando el loop de Beetrooper')..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none leading-relaxed"
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
          </form>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80">
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
              onClick={handleSubmit}
              disabled={isSubmitting || !archetype.trim() || !cardName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-red-600/25 cursor-pointer font-display"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar en Banco de Reglas</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
