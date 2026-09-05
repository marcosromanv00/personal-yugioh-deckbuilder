'use client';

import React from 'react';
import { DeckCard } from '../../types';

interface SaveDeckStep4InventoryProps {
  deckCards: DeckCard[];
  registerToInventory: boolean;
  setRegisterToInventory: (val: boolean) => void;
  cardsToRegister: Record<number, boolean>;
  setCardsToRegister: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  userInventoryCounts: Record<number, number>;
  cardQuantities: Record<number, number>;
  setCardQuantities: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  deckName: string;
  saveFormat: string;
  saveIsActive: boolean;
  targetLocationName: string;
  mainSleeveName?: string;
  extraSleeveName?: string;
}

export const SaveDeckStep4Inventory: React.FC<SaveDeckStep4InventoryProps> = ({
  deckCards,
  registerToInventory,
  setRegisterToInventory,
  cardsToRegister,
  setCardsToRegister,
  userInventoryCounts,
  cardQuantities,
  setCardQuantities,
  deckName,
  saveFormat,
  saveIsActive,
  targetLocationName,
  mainSleeveName,
  extraSleeveName,
}) => {
  const selectAll = (val: boolean) => {
    const updated: Record<number, boolean> = {};
    deckCards.forEach((c) => {
      updated[c.id] = val;
    });
    setCardsToRegister(updated);
  };

  const totalCardsToRegister = deckCards
    .filter((c) => cardsToRegister[c.id] !== false)
    .reduce((acc, c) => acc + (cardQuantities[c.id] ?? c.count), 0);

  return (
    <div className="space-y-4 py-1">
      {/* Resumen previo al guardado */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span className="text-zinc-400 text-[10px] block uppercase">Baraja:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate block">{deckName}</span>
        </div>
        <div>
          <span className="text-zinc-400 text-[10px] block uppercase">Formato & Estado:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{saveFormat} ({saveIsActive ? 'Activo' : 'Receta'})</span>
        </div>
        <div>
          <span className="text-zinc-400 text-[10px] block uppercase">Ubicación Físico:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{targetLocationName}</span>
        </div>
        <div>
          <span className="text-zinc-400 text-[10px] block uppercase">Fundas Asignadas:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {mainSleeveName || extraSleeveName ? 'Sí (Configuradas)' : 'Sin fundas'}
          </span>
        </div>
      </div>

      {/* Checkbox de Registro */}
      <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={registerToInventory}
            onChange={(e) => setRegisterToInventory(e.target.checked)}
            className="rounded border-zinc-300 text-red-600 focus:ring-0 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Registrar automáticamente las cartas físicas de esta receta en mi inventario
          </span>
        </label>

        {registerToInventory && (
          <div className="pt-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                Cartas a registrar: <b className="text-red-600 dark:text-red-400 font-mono">+{totalCardsToRegister} nuevas</b>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectAll(true)}
                  className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[9px] font-bold"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => selectAll(false)}
                  className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[9px] font-bold"
                >
                  Ninguna
                </button>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
              {deckCards.map((c) => {
                const isSelected = cardsToRegister[c.id] !== false;
                const qty = cardQuantities[c.id] ?? c.count;
                const owned = userInventoryCounts[c.id] || 0;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
                  >
                    <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setCardsToRegister((prev) => ({ ...prev, [c.id]: !isSelected }))}
                        className="rounded text-red-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="truncate font-bold text-[11px]">{c.name}</span>
                      <span className="text-[9px] text-zinc-400 font-mono">(Posees: {owned})</span>
                    </label>

                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setCardQuantities((prev) => ({ ...prev, [c.id]: Math.max(1, qty - 1) }))}
                          className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-mono font-bold text-[11px]">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setCardQuantities((prev) => ({ ...prev, [c.id]: Math.min(c.count, qty + 1) }))}
                          className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
