'use client';

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface SaveDeckStep1BasicProps {
  deckName: string;
  setDeckName: (name: string) => void;
  deckDescription: string;
  setDeckDescription: (desc: string) => void;
  saveFormat: 'Master Duel' | 'TCG' | 'Duel Links';
  setSaveFormat: (format: 'Master Duel' | 'TCG' | 'Duel Links') => void;
  saveIsActive: boolean;
  setSaveIsActive: (active: boolean) => void;
}

export const SaveDeckStep1Basic: React.FC<SaveDeckStep1BasicProps> = ({
  deckName,
  setDeckName,
  deckDescription,
  setDeckDescription,
  saveFormat,
  setSaveFormat,
  saveIsActive,
  setSaveIsActive,
}) => {
  return (
    <div className="space-y-4 py-1">
      {/* Selector de Estado Ensamblado / Activo */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${saveIsActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {saveIsActive ? 'Deck Físico Activo (Ensamblado)' : 'Receta Virtual (Desensamblada)'}
            </h4>
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            {saveIsActive
              ? 'Las cartas físicas se reservarán para este mazo y se generará su plan de extracción.'
              : 'El mazo se guardará solo como receta sin bloquear copias físicas.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSaveIsActive(!saveIsActive)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation shrink-0 ${
            saveIsActive
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          {saveIsActive ? '● ACTIVO' : '○ INACTIVO'}
        </button>
      </div>

      {/* Nombre y Formato */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-red-500" />
            <span>Nombre de la Baraja *</span>
          </label>
          <input
            type="text"
            required
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Ej: Branded Despia, Traptrix..."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-red-500 focus:outline-none font-bold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyan-500" />
            <span>Formato de Reglas</span>
          </label>
          <PremiumDropdown
            value={saveFormat}
            onChange={(val) => setSaveFormat(val as 'Master Duel' | 'TCG' | 'Duel Links')}
            align="full"
            size="sm"
            options={[
              { value: 'Master Duel', label: 'Master Duel' },
              { value: 'TCG', label: 'TCG (Formato Físico Oficial)' },
              { value: 'Duel Links', label: 'Duel Links' },
            ]}
          />
        </div>
      </div>

      {/* Descripción y Notas */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
          Descripción / Notas de Estrategia
        </label>
        <textarea
          rows={3}
          value={deckDescription}
          onChange={(e) => setDeckDescription(e.target.value)}
          placeholder="Combos de 1 carta, side deck enfocado contra meta..."
          className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-red-500 focus:outline-none scrollbar-thin resize-none"
        />
      </div>
    </div>
  );
};
