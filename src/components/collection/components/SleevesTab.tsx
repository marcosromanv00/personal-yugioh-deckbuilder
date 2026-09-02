import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SleeveInventory } from '@/types/collection';
import { SleeveInventoryCard, AddSleeveCard } from '../SleeveInventoryCard';

interface SleevesTabProps {
  loadingSleeves: boolean;
  sleeves: SleeveInventory[];
  setEditingSleeve: (s: SleeveInventory | null) => void;
  setIsSleeveFormOpen: (open: boolean) => void;
  handleDeleteSleeve: (sleeve: SleeveInventory) => Promise<void>;
  onAddStock?: (sleeve: SleeveInventory) => void;
  onAddSleeveClick?: () => void;
}

/**
 * SleevesTab Component
 * Renders the sleeves inventory dashboard list.
 */
export const SleevesTab: React.FC<SleevesTabProps> = ({
  loadingSleeves,
  sleeves,
  setEditingSleeve,
  setIsSleeveFormOpen,
  handleDeleteSleeve,
  onAddStock,
  onAddSleeveClick,
}) => {
  if (loadingSleeves) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-red-500 animate-spin mb-2" />
        <p className="text-xs font-mono text-zinc-500">Cargando inventario de fundas...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {sleeves.map((sleeve) => (
        <SleeveInventoryCard
          key={sleeve.id}
          sleeve={sleeve}
          onEdit={() => {
            setEditingSleeve(sleeve);
            setIsSleeveFormOpen(true);
          }}
          onDelete={() => handleDeleteSleeve(sleeve)}
          onAddStock={onAddStock}
        />
      ))}
      <AddSleeveCard
        onClick={() => {
          if (onAddSleeveClick) {
            onAddSleeveClick();
          } else {
            setEditingSleeve(null);
            setIsSleeveFormOpen(true);
          }
        }}
      />
    </div>
  );
};
