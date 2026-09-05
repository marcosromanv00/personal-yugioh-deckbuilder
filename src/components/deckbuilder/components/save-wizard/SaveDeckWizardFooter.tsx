'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface SaveDeckWizardFooterProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  loadingDecks: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
}

export const SaveDeckWizardFooter: React.FC<SaveDeckWizardFooterProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  loadingDecks,
  onPrev,
  onNext,
  onSave,
}) => {
  return (
    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
      <button
        type="button"
        disabled={currentStep === 1}
        onClick={onPrev}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
          currentStep === 1
            ? 'opacity-30 cursor-not-allowed text-zinc-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Atrás</span>
      </button>

      <div className="flex items-center gap-2">
        {currentStep < totalSteps ? (
          <button
            type="button"
            disabled={!canProceed}
            onClick={onNext}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              canProceed
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loadingDecks}
            onClick={onSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{loadingDecks ? 'Guardando...' : 'Guardar Baraja'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
