'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { StorageLocation, Deck, UserCard } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

interface CollectionCardLocationFieldProps {
  userCard: UserCard;
  locations: StorageLocation[];
  decks: Deck[];
  onUpdateField: (fields: Partial<UserCard>) => void;
}

export const CollectionCardLocationField: React.FC<CollectionCardLocationFieldProps> = ({
  userCard,
  locations,
  decks,
  onUpdateField,
}) => {
  const cardDetails = userCard.card_details;
  const storedLoc = locations.find((l) => l.id === userCard.storage_location_id);

  const locationOptions = [
    { value: 'inbox', label: '📥 Inbox (Sin clasificar)' },
    ...locations.map((loc) => ({ value: loc.id, label: `📁 ${loc.name} (${loc.type})` })),
    ...decks.map((d) => {
      const dLoc = locations.find((l) => l.id === d.storage_location_id);
      return { value: `deck:${d.id}`, label: `🃏 [Mazo] ${d.name}${dLoc ? ` (${dLoc.name})` : ''}` };
    }),
  ];

  const currentLocationValue = userCard.deck_id ? `deck:${userCard.deck_id}` : (userCard.storage_location_id || 'inbox');

  const handleLocationChange = (val: string) => {
    if (val.startsWith('deck:')) {
      const deckId = val.replace('deck:', '');
      const targetDeck = decks.find((d) => d.id === deckId);
      const isExtra = ['Fusion Monster', 'Link Monster', 'Synchro Monster', 'XYZ Monster'].some((t) =>
        cardDetails?.type?.includes(t)
      );
      onUpdateField({
        deck_id: deckId,
        deck_section: isExtra ? 'extra' : 'main',
        status_flag: 'in_deck',
        storage_location_id: targetDeck?.storage_location_id || null,
        compartment_index: targetDeck?.compartment_index ?? 0,
      });
    } else {
      onUpdateField({
        deck_id: undefined,
        deck_section: undefined,
        storage_location_id: val === 'inbox' ? null : val,
        compartment_index: 0,
        status_flag: userCard.status_flag === 'in_deck' ? 'collection' : userCard.status_flag,
      });
    }
  };

  return (
    <>
      <div className="space-y-1">
        <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-red-500" />
          <span>Ubicación o Mazo</span>
        </label>
        <PremiumDropdown
          value={currentLocationValue}
          onChange={handleLocationChange}
          options={locationOptions}
          size="sm"
        />
      </div>

      {storedLoc?.compartments && storedLoc.compartments.count > 1 && !userCard.deck_id && (
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-mono font-bold uppercase text-zinc-500">
            Carril en &quot;{storedLoc.name}&quot;
          </label>
          <PremiumDropdown
            value={userCard.compartment_index ?? 0}
            onChange={(val) => onUpdateField({ compartment_index: val })}
            options={storedLoc.compartments.names.map((name, idx) => ({
              value: idx,
              label: `📦 ${name || `Carril ${idx + 1}`}`,
            }))}
            size="sm"
          />
        </div>
      )}
    </>
  );
};
