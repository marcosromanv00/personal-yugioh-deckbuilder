'use client';

import React, { useMemo } from 'react';
import { PackagePlus, CheckCircle2 } from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { NewCardRegistrationForm } from './SyncCardFormDrawer';
import { CardSubstitution } from './SyncRegisteredCardDrawer';
import { SyncCollapsibleSection } from './SyncCollapsibleSection';
import { SyncPendingCardRow } from './SyncPendingCardRow';

interface SyncPendingCardsListProps {
  pendingCards: DeckCardDetail[];
  expandedCardId: number | null;
  setExpandedCardId: (id: number | null) => void;
  actions: Record<number, 'register' | 'ignore'>;
  setActions: React.Dispatch<React.SetStateAction<Record<number, 'register' | 'ignore'>>>;
  cardForms: Record<number, NewCardRegistrationForm>;
  onUpdateForm: (cardId: number, fields: Partial<NewCardRegistrationForm>) => void;
  locations: StorageLocation[];
  defaultDeckSleeveName?: string;
  storageLocationId?: string | null;
  compartmentIndex?: number | null;
  availableSleeves?: SleeveInventory[];
  userCards?: UserCard[];
  substitutions: Record<string, CardSubstitution>;
  onUpdateSubstitution: (userCardId: string, sub: CardSubstitution | null) => void;
  onAddCopy: (cardId: number) => void;
  onSelectExistingCopy?: (cardId: number, section: string, copy: UserCard, sleeveId?: string) => void;
}

function hasStagedCopies(card: DeckCardDetail): boolean {
  return (card.physical_copies?.filter((cp) => cp.source_status === 'staged').length ?? 0) > 0;
}

export const SyncPendingCardsList: React.FC<SyncPendingCardsListProps> = ({
  pendingCards,
  expandedCardId,
  setExpandedCardId,
  actions,
  setActions,
  cardForms,
  onUpdateForm,
  locations,
  defaultDeckSleeveName,
  storageLocationId,
  compartmentIndex,
  availableSleeves = [],
  userCards = [],
  substitutions,
  onUpdateSubstitution,
  onAddCopy,
  onSelectExistingCopy,
}) => {
  const unregisteredCards = useMemo(() => pendingCards.filter(hasStagedCopies), [pendingCards]);
  const registeredCards = useMemo(() => pendingCards.filter((c) => !hasStagedCopies(c)), [pendingCards]);

  // Indexar copias disponibles en colección para acceso O(1)
  const availableCopiesByCardId = useMemo(() => {
    const map: Record<number, UserCard[]> = {};
    userCards.forEach((uc) => {
      if (!map[uc.card_id]) map[uc.card_id] = [];
      map[uc.card_id].push(uc);
    });
    return map;
  }, [userCards]);

  if (pendingCards.length === 0) return null;

  const renderCardRow = (card: DeckCardDetail) => {
    const cardId = card.card_id;
    const isExpanded = expandedCardId === cardId;
    const action = actions[cardId] || 'register';
    const form = cardForms[cardId] || { rarity: 'Common', condition: 'Near Mint', is_proxy: false };
    const availableCopies = availableCopiesByCardId[cardId] || [];

    return (
      <SyncPendingCardRow
        key={`${card.section}-${card.card_id}`}
        card={card}
        isExpanded={isExpanded}
        onToggleExpand={() => setExpandedCardId(isExpanded ? null : cardId)}
        action={action}
        onChangeAction={(act) => setActions((prev) => ({ ...prev, [cardId]: act }))}
        form={form}
        onUpdateForm={(fields) => onUpdateForm(cardId, fields)}
        locations={locations}
        defaultDeckSleeveName={defaultDeckSleeveName}
        defaultStorageLocationId={storageLocationId}
        defaultCompartmentIndex={compartmentIndex}
        availableSleeves={availableSleeves}
        availableCopies={availableCopies}
        substitutions={substitutions}
        onUpdateSubstitution={onUpdateSubstitution}
        onAddCopy={onAddCopy}
        onSelectExistingCopy={(copy, sleeveId) => onSelectExistingCopy?.(cardId, card.section, copy, sleeveId)}
      />
    );
  };

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
          {unregisteredCards.map(renderCardRow)}
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
          {registeredCards.map(renderCardRow)}
        </SyncCollapsibleSection>
      )}
    </div>
  );
};
