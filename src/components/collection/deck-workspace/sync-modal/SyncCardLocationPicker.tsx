'use client';

import React from 'react';
import { MapPin, Boxes } from 'lucide-react';
import { StorageLocation } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface SyncCardLocationPickerProps {
  locations?: StorageLocation[];
  selectedLocationId?: string | null;
  selectedCompartmentIndex?: number | null;
  onChange: (updates: {
    storage_location_id?: string | null;
    compartment_index?: number | null;
  }) => void;
}

export const SyncCardLocationPicker: React.FC<SyncCardLocationPickerProps> = ({
  locations = [],
  selectedLocationId,
  selectedCompartmentIndex = 0,
  onChange,
}) => {
  const currentLocation = locations.find((l) => l.id === selectedLocationId) || null;
  const numCompartments = currentLocation?.compartments?.count ?? 1;
  const compNames = currentLocation?.compartments?.names ?? [];

  const locationOptions = [
    { value: '', label: '📥 Inbox (Sin clasificar)' },
    ...locations.map((loc) => ({
      value: loc.id,
      label: `📦 ${loc.name}`,
    })),
  ];

  const compartmentOptions = Array.from({ length: numCompartments }, (_, i) => ({
    value: String(i),
    label: compNames[i] ? `Carril ${i + 1}: ${compNames[i]}` : `Carril ${i + 1}`,
  }));

  return (
    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
      <div>
        <label className="block text-[10px] font-mono font-black uppercase text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span>Ubicación de Almacenamiento:</span>
        </label>
        <PremiumDropdown
          value={selectedLocationId || ''}
          onChange={(val) => {
            const locId = String(val) || null;
            onChange({ storage_location_id: locId, compartment_index: 0 });
          }}
          size="sm"
          align="full"
          options={locationOptions}
        />
      </div>

      {numCompartments > 1 && (
        <div>
          <label className="block text-[9px] font-mono font-bold text-zinc-500 uppercase mb-0.5 flex items-center gap-1">
            <Boxes className="w-3 h-3 text-amber-500" />
            <span>Carril / Compartimento:</span>
          </label>
          <PremiumDropdown
            value={String(selectedCompartmentIndex ?? 0)}
            onChange={(val) => onChange({ compartment_index: Number(val) })}
            size="sm"
            align="full"
            options={compartmentOptions}
          />
        </div>
      )}
    </div>
  );
};
