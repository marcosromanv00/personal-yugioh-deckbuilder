'use client';

import React from 'react';
import { Layers, Tag, Sparkles } from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { CollectionCardHeader } from './CollectionCardHeader';
import { CollectionCardLocationField } from './CollectionCardLocationField';
import { 
  RARITY_OPTIONS, 
  CONDITION_OPTIONS, 
  LANGUAGE_OPTIONS, 
  STATUS_FLAG_OPTIONS 
} from '../constants/collectionCardOptions';

interface CollectionCardPropertiesFormProps {
  userCard: UserCard;
  locations: StorageLocation[];
  decks: Deck[];
  onUpdateField: (fields: Partial<UserCard>) => void;
  isSaving?: boolean;
}

export const CollectionCardPropertiesForm: React.FC<CollectionCardPropertiesFormProps> = ({
  userCard,
  locations,
  decks,
  onUpdateField,
  isSaving,
}) => {
  const assignedDeck = decks.find((d) => d.id === userCard.deck_id);

  return (
    <div className="space-y-3.5">
      <CollectionCardHeader userCard={userCard} assignedDeck={assignedDeck} isSaving={isSaving} />

      <div className="bg-zinc-50/70 dark:bg-zinc-950/60 p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
          Propiedades Físicas Editables
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fila 1: Cantidad de Copias y Tipo Proxy */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1">
              <Layers className="w-3 h-3 text-red-500" />
              <span>Copias Registradas</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateField({ quantity: Math.max(1, (userCard.quantity || 1) - 1) })}
                className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={userCard.quantity || 1}
                onChange={(e) => onUpdateField({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-16 h-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-black"
              />
              <button
                type="button"
                onClick={() => onUpdateField({ quantity: (userCard.quantity || 1) + 1 })}
                className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 font-bold text-xs cursor-pointer"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => onUpdateField({ is_proxy: !userCard.is_proxy, rarity: !userCard.is_proxy ? 'Proxy' : 'Common' })}
                className={`ml-auto px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  userCard.is_proxy
                    ? 'bg-amber-500/20 text-amber-600 border-amber-500/40 font-black'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {userCard.is_proxy ? '🖨️ Proxy' : 'Original'}
              </button>
            </div>
          </div>

          {/* Fila 1 Derecha: Rareza */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>Rareza</span>
            </label>
            <PremiumDropdown
              value={userCard.is_proxy ? 'Proxy' : (userCard.rarity || 'Common')}
              onChange={(val) => onUpdateField({ is_proxy: val === 'Proxy', rarity: val })}
              options={RARITY_OPTIONS}
              size="sm"
            />
          </div>

          {/* Fila 2: Condición */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Condición / Estado</label>
            <PremiumDropdown
              value={userCard.condition || 'Near Mint'}
              onChange={(val) => onUpdateField({ condition: val as UserCard['condition'] })}
              options={CONDITION_OPTIONS}
              size="sm"
            />
          </div>

          {/* Fila 2 Derecha: Idioma */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Idioma de Impresión</label>
            <PremiumDropdown
              value={(userCard.language || 'en').toLowerCase()}
              onChange={(val) => onUpdateField({ language: val })}
              options={LANGUAGE_OPTIONS}
              size="sm"
            />
          </div>

          {/* Fila 3: Ubicación y Decks */}
          <CollectionCardLocationField
            userCard={userCard}
            locations={locations}
            decks={decks}
            onUpdateField={onUpdateField}
          />

          {/* Fila 3 Derecha: Destino / Categoría */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1">
              <Tag className="w-3 h-3 text-cyan-500" />
              <span>Destino / Categoría</span>
            </label>
            <PremiumDropdown
              value={userCard.status_flag || 'collection'}
              onChange={(val) => onUpdateField({ status_flag: val })}
              options={STATUS_FLAG_OPTIONS}
              size="sm"
            />
          </div>

          {/* Notas */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">Notas / Edición Especial</label>
            <input
              type="text"
              value={userCard.notes || ''}
              onChange={(e) => onUpdateField({ notes: e.target.value })}
              placeholder="Ej: 1st Edition, regalo, arte alternativo..."
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
