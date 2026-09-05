'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, CheckCircle2, RefreshCw } from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { SyncCardFormDrawer, NewCardRegistrationForm } from './SyncCardFormDrawer';
import { SyncRegisteredCardDrawer, CardSubstitution } from './SyncRegisteredCardDrawer';

interface SyncPendingCardRowProps {
  card: DeckCardDetail;
  isExpanded: boolean;
  onToggleExpand: () => void;
  action: 'register' | 'ignore';
  onChangeAction: (action: 'register' | 'ignore') => void;
  form: NewCardRegistrationForm;
  onUpdateForm: (fields: Partial<NewCardRegistrationForm>) => void;
  locations: StorageLocation[];
  defaultDeckSleeveName?: string;
  defaultStorageLocationId?: string | null;
  defaultCompartmentIndex?: number | null;
  availableSleeves?: SleeveInventory[];
  availableCopies?: UserCard[];
  substitutions: Record<string, CardSubstitution>;
  onUpdateSubstitution: (userCardId: string, sub: CardSubstitution | null) => void;
  onAddCopy: (cardId: number) => void;
  onSelectExistingCopy?: (copy: UserCard, sleeveId?: string) => void;
}

export const SyncPendingCardRow: React.FC<SyncPendingCardRowProps> = React.memo(({
  card,
  isExpanded,
  onToggleExpand,
  action,
  onChangeAction,
  form,
  onUpdateForm,
  locations,
  defaultDeckSleeveName,
  defaultStorageLocationId,
  defaultCompartmentIndex,
  availableSleeves = [],
  availableCopies = [],
  substitutions,
  onUpdateSubstitution,
  onAddCopy,
  onSelectExistingCopy,
}) => {
  const staged = card.physical_copies?.filter((cp) => cp.source_status === 'staged').length ?? 0;
  const existing = card.physical_copies?.filter((cp) => cp.source_status !== 'staged').length ?? 0;

  // Comprobar si alguna copia física de esta carta tiene sustitución programada
  const activeSubsCount = (card.physical_copies || []).filter(
    (cp) => cp.user_card_id && substitutions[cp.user_card_id]
  ).length;

  return (
    <div className="p-3 bg-white dark:bg-zinc-900/60 transition-colors">
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between gap-3 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-11 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden">
            {card.card_details?.image_url && (
              <Image
                src={card.card_details.image_url}
                alt=""
                fill
                sizes="32px"
                loading="lazy"
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-600 transition-colors">
              {card.card_details?.name}
            </p>
            {staged > 0 && existing > 0 ? (
              <p className="text-[10px] font-mono text-zinc-500">
                <span className="text-amber-500">+{staged} nueva{staged > 1 ? 's' : ''}</span>
                <span className="mx-1 text-zinc-400">/</span>
                <span className="text-emerald-500">{existing} ya registrada{existing > 1 ? 's' : ''}</span>
              </p>
            ) : staged > 0 ? (
              <p className="text-[10px] text-amber-500 font-mono">
                +{staged} copia{staged > 1 ? 's' : ''} sin registrar
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {existing} / {card.count} registrada{existing > 1 ? 's' : ''}
                </p>
                {activeSubsCount > 0 && (
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                    {activeSubsCount} {activeSubsCount === 1 ? 'cambio' : 'cambios'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {staged > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <button
                type="button"
                onClick={() => onChangeAction('register')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  action === 'register' ? 'bg-emerald-600 text-white' : 'text-zinc-500'
                }`}
              >
                Registrar
              </button>
              <button
                type="button"
                onClick={() => onChangeAction('ignore')}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  action === 'ignore' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                }`}
              >
                Ignorar
              </button>
            </div>
          ) : (
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Registrada
            </span>
          )}

          <span className="p-1 rounded-lg text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </div>

      {isExpanded && staged > 0 && action === 'register' && (
        <SyncCardFormDrawer
          cardId={card.card_id}
          form={form}
          onChange={onUpdateForm}
          locations={locations}
          defaultDeckSleeveName={defaultDeckSleeveName}
          defaultStorageLocationId={defaultStorageLocationId}
          defaultCompartmentIndex={defaultCompartmentIndex}
          availableSleeves={availableSleeves}
          availableCopies={availableCopies}
          onSelectExistingCopy={onSelectExistingCopy}
        />
      )}

      {isExpanded && staged === 0 && (
        <SyncRegisteredCardDrawer
          card={card}
          locations={locations}
          defaultDeckSleeveName={defaultDeckSleeveName}
          availableSleeves={availableSleeves}
          availableCopies={availableCopies}
          substitutions={substitutions}
          onUpdateSubstitution={onUpdateSubstitution}
          onAddCopy={onAddCopy}
        />
      )}
    </div>
  );
});

SyncPendingCardRow.displayName = 'SyncPendingCardRow';
