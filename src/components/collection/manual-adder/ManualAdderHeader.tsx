import React from 'react';
import { X } from 'lucide-react';
import { StorageLocation } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface ManualAdderHeaderProps {
  locations: StorageLocation[];
  defaultLocationId: string;
  onApplyLocationToAll: (locId: string) => void;
  onClose: () => void;
}

export const ManualAdderHeader: React.FC<ManualAdderHeaderProps> = ({
  locations,
  defaultLocationId,
  onApplyLocationToAll,
  onClose,
}) => {
  return (
    <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-600/30 font-display tracking-wider">
          EX
        </div>
        <div>
          <h2 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Registro de Cartas en Colección</span>
            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-mono font-black">
              3 Paneles
            </span>
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono">
            Buscador • Grid de Registro • Detalle Táctico
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-[10px] font-black uppercase text-zinc-400 font-mono">
            Destino por defecto:
          </span>
          <PremiumDropdown
            value={defaultLocationId}
            onChange={(val) => onApplyLocationToAll(val)}
            size="sm"
            menuWidth="min-w-64"
            options={[
              { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
              ...locations.map((loc) => ({
                value: loc.id,
                label: `📦 ${loc.name} (${loc.type})`,
              })),
            ]}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
