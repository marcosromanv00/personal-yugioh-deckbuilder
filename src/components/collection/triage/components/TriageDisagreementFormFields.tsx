'use client';

import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { TriageCardActionPayload } from '@/types/triage';

export const DESTINATION_OPTIONS: {
  type: TriageCardActionPayload['destinationType'];
  num: number;
  label: string;
}[] = [
  { type: 'active_deck', num: 1, label: 'Mazo Activo' },
  { type: 'thematic_pool', num: 2, label: 'Proyecto Temático' },
  { type: 'workshop_salad', num: 3, label: 'Ensalada Didáctica' },
  { type: 'collection_binder', num: 4, label: 'Binder Colección' },
  { type: 'trade_sale', num: 5, label: 'Poner en Venta' },
  { type: 'bulk_discard', num: 6, label: 'Desechar a Bulk' },
];

interface DestinationSelectorGridProps {
  selectedDestination: TriageCardActionPayload['destinationType'];
  onSelect: (dest: TriageCardActionPayload['destinationType']) => void;
}

export const DestinationSelectorGrid: React.FC<DestinationSelectorGridProps> = ({
  selectedDestination,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DESTINATION_OPTIONS.map(opt => {
        const isSelected = selectedDestination === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onSelect(opt.type)}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
              isSelected
                ? 'border-red-600 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 shadow-2xs'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <span>[{opt.num}] {opt.label}</span>
            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />}
          </button>
        );
      })}
    </div>
  );
};

interface StarRatingSelectorProps {
  rating: number;
  onChange: (rating: number) => void;
}

const RATING_LABELS = ['Totalmente erróneo', 'Inadecuado', 'Aceptable', 'Bueno', 'Excelente'];

export const StarRatingSelector: React.FC<StarRatingSelectorProps> = ({ rating, onChange }) => {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 cursor-pointer transition-transform hover:scale-110"
        >
          <Star
            className={`w-5 h-5 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'
            }`}
          />
        </button>
      ))}
      <span className="text-[11px] font-mono text-zinc-500 ml-2">
        {RATING_LABELS[rating - 1] || 'Calificación'}
      </span>
    </div>
  );
};
