'use client';

import React from 'react';
import { Save, X, LucideIcon } from 'lucide-react';

interface StepDef {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface SaveDeckWizardHeaderProps {
  currentStep: number;
  totalCards: number;
  totalMainSide: number;
  totalExtra: number;
  steps: StepDef[];
  canProceed: boolean;
  onStepClick: (stepId: number) => void;
  onClose: () => void;
}

export const SaveDeckWizardHeader: React.FC<SaveDeckWizardHeaderProps> = ({
  currentStep,
  totalCards,
  totalMainSide,
  totalExtra,
  steps,
  canProceed,
  onStepClick,
  onClose,
}) => {
  return (
    <div className="shrink-0 space-y-3">
      {/* Barra superior de título y cerrar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-600">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wider font-display">Guardar Baraja</h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              Paso {currentStep} de {steps.length} • {totalCards} cartas ({totalMainSide} Main/Side, {totalExtra} Extra)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isPast = currentStep > step.id;
          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep && !canProceed}
              onClick={() => canProceed && onStepClick(step.id)}
              className={`py-1.5 px-2 rounded-xl text-[10.5px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                isActive
                  ? 'bg-red-600 text-white shadow-xs'
                  : isPast
                  ? 'bg-white/80 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 font-bold'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
