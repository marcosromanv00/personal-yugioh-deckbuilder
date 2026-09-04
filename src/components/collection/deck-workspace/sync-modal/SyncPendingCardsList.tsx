'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, CheckCircle2, PackagePlus } from 'lucide-react';
import { DeckCardDetail } from '@/types/collection';
import { SyncCardFormDrawer, NewCardRegistrationForm } from './SyncCardFormDrawer';
import { SyncCollapsibleSection } from './SyncCollapsibleSection';

interface SyncPendingCardsListProps {
  pendingCards: DeckCardDetail[];
  expandedCardId: number | null;
  setExpandedCardId: (id: number | null) => void;
  actions: Record<number, 'register' | 'ignore'>;
  setActions: React.Dispatch<React.SetStateAction<Record<number, 'register' | 'ignore'>>>;
  cardForms: Record<number, NewCardRegistrationForm>;
  onUpdateForm: (cardId: number, fields: Partial<NewCardRegistrationForm>) => void;
}

function countStaged(card: DeckCardDetail): number {
  return card.physical_copies?.filter((cp) => cp.source_status === 'staged').length ?? 0;
}

function countExisting(card: DeckCardDetail): number {
  return card.physical_copies?.filter((cp) => cp.source_status !== 'staged').length ?? 0;
}

function hasStagedCopies(card: DeckCardDetail): boolean {
  return countStaged(card) > 0;
}

// ─── Card Row ───────────────────────────────────────────────────────────────

interface CardRowProps {
  card: DeckCardDetail;
  expandedCardId: number | null;
  setExpandedCardId: (id: number | null) => void;
  actions: Record<number, 'register' | 'ignore'>;
  setActions: React.Dispatch<React.SetStateAction<Record<number, 'register' | 'ignore'>>>;
  cardForms: Record<number, NewCardRegistrationForm>;
  onUpdateForm: (cardId: number, fields: Partial<NewCardRegistrationForm>) => void;
}

const CardRow: React.FC<CardRowProps> = ({
  card, expandedCardId, setExpandedCardId, actions, setActions, cardForms, onUpdateForm,
}) => {
  const isExpanded = expandedCardId === card.card_id;
  const action = actions[card.card_id] || 'register';
  const form = cardForms[card.card_id] || { rarity: 'Common', condition: 'Near Mint', is_proxy: false };
  const staged = countStaged(card);
  const existing = countExisting(card);

  return (
    <div className="p-3 bg-white dark:bg-zinc-900/60 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-11 rounded bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden">
            {card.card_details?.image_url && (
              <Image src={card.card_details.image_url} alt="" fill sizes="32px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
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
              <p className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {existing} / {card.count} registrada{existing > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {staged > 0 ? (
            <>
              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActions((prev) => ({ ...prev, [card.card_id]: 'register' }))}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${action === 'register' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => setActions((prev) => ({ ...prev, [card.card_id]: 'ignore' }))}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${action === 'ignore' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                >
                  Ignorar
                </button>
              </div>

              {action === 'register' && (
                <button
                  type="button"
                  onClick={() => setExpandedCardId(isExpanded ? null : card.card_id)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </>
          ) : (
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Registrada
            </span>
          )}
        </div>
      </div>

      {action === 'register' && isExpanded && staged > 0 && (
        <SyncCardFormDrawer
          cardId={card.card_id}
          form={form}
          onChange={(fields) => onUpdateForm(card.card_id, fields)}
        />
      )}
    </div>
  );
};

// ─── Root ────────────────────────────────────────────────────────────────────

export const SyncPendingCardsList: React.FC<SyncPendingCardsListProps> = ({
  pendingCards, expandedCardId, setExpandedCardId, actions, setActions, cardForms, onUpdateForm,
}) => {
  if (pendingCards.length === 0) return null;

  const unregisteredCards = pendingCards.filter(hasStagedCopies);
  const registeredCards = pendingCards.filter((c) => !hasStagedCopies(c));

  const sharedProps = { expandedCardId, setExpandedCardId, actions, setActions, cardForms, onUpdateForm };

  return (
    <div className="space-y-4">
      {unregisteredCards.length > 0 && (
        <SyncCollapsibleSection
          title="Sin Registrar en Inventario"
          count={unregisteredCards.length}
          defaultOpen={true}
          accentClass="text-amber-500 bg-amber-500/10"
          icon={<PackagePlus className="w-3.5 h-3.5 inline" />}
        >
          {unregisteredCards.map((card) => (
            <CardRow key={`${card.section}-${card.card_id}`} card={card} {...sharedProps} />
          ))}
        </SyncCollapsibleSection>
      )}

      {registeredCards.length > 0 && (
        <SyncCollapsibleSection
          title="Cartas ya Registradas"
          count={registeredCards.length}
          defaultOpen={false}
          accentClass="text-emerald-500 bg-emerald-500/10"
          icon={<CheckCircle2 className="w-3.5 h-3.5 inline" />}
        >
          {registeredCards.map((card) => (
            <CardRow key={`${card.section}-${card.card_id}`} card={card} {...sharedProps} />
          ))}
        </SyncCollapsibleSection>
      )}
    </div>
  );
};

