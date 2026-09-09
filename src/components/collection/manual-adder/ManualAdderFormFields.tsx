import React from 'react';
import { Minus, Plus, Printer } from 'lucide-react';
import { StorageLocation, CardCondition, CardStatusFlag, SleeveType } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { QueuedCardItem, RARITIES, CONDITIONS, STATUS_FLAGS } from './manualAdder.types';

interface ManualAdderFormFieldsProps {
  activeCard: QueuedCardItem;
  locations: StorageLocation[];
  onUpdateActiveCard: (updates: Partial<QueuedCardItem>) => void;
}

export const ManualAdderFormFields: React.FC<ManualAdderFormFieldsProps> = ({
  activeCard,
  locations,
  onUpdateActiveCard,
}) => {
  return (
    <div className="space-y-3 text-xs">
      {/* Cantidad e Idioma */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
            Cantidad
          </label>
          <div className="flex items-center bg-white dark:bg-zinc-950 rounded-lg border border-zinc-300 dark:border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => onUpdateActiveCard({ quantity: Math.max(1, activeCard.quantity - 1) })}
              className="w-7 h-6 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 font-black cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="flex-1 text-center font-mono font-black text-xs">
              {activeCard.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateActiveCard({ quantity: activeCard.quantity + 1 })}
              className="w-7 h-6 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 font-black cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
            Idioma
          </label>
          <PremiumDropdown
            value={activeCard.language}
            onChange={(val) => onUpdateActiveCard({ language: val as 'en' | 'es' | 'jp' })}
            align="full"
            size="sm"
            options={[
              { value: 'en', label: 'Inglés (EN)' },
              { value: 'es', label: 'Español (ES)' },
              { value: 'jp', label: 'Japonés (JP)' },
            ]}
          />
        </div>
      </div>

      {/* Contenedor de Destino */}
      <div>
        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
          Contenedor de Destino
        </label>
        <PremiumDropdown
          value={activeCard.storage_location_id}
          onChange={(val) => onUpdateActiveCard({ storage_location_id: val })}
          align="full"
          size="sm"
          options={[
            { value: 'inbox', label: '📥 Bandeja "Sin Clasificar" (Inbox)' },
            ...locations.map((loc) => ({
              value: loc.id,
              label: `📦 ${loc.name} (${loc.type})`,
            })),
          ]}
        />
      </div>

      {/* Rareza y Condición */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
            Rareza
          </label>
          <PremiumDropdown
            value={activeCard.rarity}
            onChange={(val) => onUpdateActiveCard({ rarity: val })}
            align="full"
            size="sm"
            options={RARITIES.map((r) => ({ value: r, label: r }))}
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
            Condición
          </label>
          <PremiumDropdown
            value={activeCard.condition}
            onChange={(val) => onUpdateActiveCard({ condition: val as CardCondition })}
            align="full"
            size="sm"
            options={CONDITIONS.map((cond) => ({ value: cond, label: cond }))}
          />
        </div>
      </div>

      {/* Estado / Intención y Funda */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
            Estado / Intención
          </label>
          <PremiumDropdown
            value={activeCard.status_flag}
            onChange={(val) => onUpdateActiveCard({ status_flag: val as CardStatusFlag })}
            align="full"
            size="sm"
            options={STATUS_FLAGS.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
            Funda
          </label>
          <PremiumDropdown
            value={activeCard.sleeve_type}
            onChange={(val) => onUpdateActiveCard({ sleeve_type: val as SleeveType })}
            align="full"
            size="sm"
            options={[
              { value: 'none', label: 'Sin Funda' },
              { value: 'single', label: 'Single Sleeve' },
              { value: 'double', label: 'Double Sleeve' },
              { value: 'triple', label: 'Triple Sleeve' },
            ]}
          />
        </div>
      </div>

      {/* Switch de Proxy */}
      <div className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" />
            <span>¿Es una carta Proxy / Impresa?</span>
          </span>
          <input
            type="checkbox"
            checked={activeCard.is_proxy}
            onChange={(e) => onUpdateActiveCard({ is_proxy: e.target.checked })}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Notas Adicionales */}
      <div>
        <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
          Notas Adicionales
        </label>
        <input
          type="text"
          placeholder="Edición especial, firma, caja de procedencia..."
          value={activeCard.notes}
          onChange={(e) => onUpdateActiveCard({ notes: e.target.value })}
          className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 focus:border-red-500 focus:outline-none placeholder:text-zinc-400"
        />
      </div>
    </div>
  );
};
