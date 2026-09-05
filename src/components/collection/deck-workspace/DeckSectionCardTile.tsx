'use client';

import React from 'react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { MobileDeckTab } from './types';
import { isExtraDeckCardType } from './useDeckWorkspaceState';
import { OverflowTooltip } from '@/components/ui/OverflowTooltip';

interface DeckSectionCardTileProps {
  cardDetail: DeckCardDetail;
  idx: number;
  sectionKey: 'main' | 'extra' | 'side' | 'pool';
  isSelected: boolean;
  onSelectCard: (card: DeckCardDetail) => void;
  userCards: UserCard[];
  locations: StorageLocation[];
  storageLocationId: string;
  currentBaseLocation?: StorageLocation;
  availableSleeves?: SleeveInventory[];
  mainSleeveId?: string;
  extraSleeveId?: string;
  poolSleeveId?: string;
  isMobile: boolean;
  setMobileTab: (tab: MobileDeckTab) => void;
  badgeLabel?: string;
  badgeColorClass?: string;
  handleDragCardStart?: (e: React.DragEvent, cardData: { id: number; name: string; type?: string; image_url?: string; archetype?: string; fromSection?: 'main' | 'extra' | 'side' | 'pool' | 'extras' }) => void;
}

export const DeckSectionCardTile: React.FC<DeckSectionCardTileProps> = ({
  cardDetail,
  idx,
  sectionKey,
  isSelected,
  onSelectCard,
  userCards,
  locations,
  storageLocationId,
  currentBaseLocation,
  availableSleeves = [],
  mainSleeveId = '',
  extraSleeveId = '',
  poolSleeveId = '',
  isMobile,
  setMobileTab,
  badgeLabel,
  badgeColorClass = 'bg-zinc-900/90 text-zinc-200 border-zinc-700/50',
  handleDragCardStart,
}) => {
  const assignedPhysicalCopy = cardDetail.physical_copies?.find((cp) => cp.user_card_id && cp.source_status !== 'staged');
  const assignedUserCard = assignedPhysicalCopy?.user_card_id
    ? userCards.find((uc) => uc.id === assignedPhysicalCopy.user_card_id)
    : userCards.find((uc) =>
        uc.card_id === cardDetail.card_id &&
        uc.deck_id &&
        ((cardDetail.section === 'pool' || cardDetail.section === 'extras') ? !uc.deck_section : uc.deck_section === cardDetail.section)
      );

  const isAssignedToDeck = Boolean(assignedPhysicalCopy || assignedUserCard);
  const targetLocId = assignedPhysicalCopy?.storage_location_id || assignedUserCard?.storage_location_id;
  const cardLoc = targetLocId ? locations.find((l) => l.id === targetLocId) : null;
  const allInventoryCopies = userCards.filter((uc) => uc.card_id === cardDetail.card_id);

  // Determinar la funda de esta carta para la franja visual
  const isExtra = isExtraDeckCardType(cardDetail.card_details?.type);
  let targetDeckSleeveId = mainSleeveId;
  if (cardDetail.section === 'extra' || (cardDetail.section === 'side' && isExtra)) {
    targetDeckSleeveId = extraSleeveId;
  } else if (cardDetail.section === 'pool' || cardDetail.section === 'extras') {
    targetDeckSleeveId = poolSleeveId;
  }

  const customSleeve = (assignedUserCard?.sleeve_brand && assignedUserCard?.sleeve_color)
    ? availableSleeves.find((s) => s.brand === assignedUserCard.sleeve_brand && s.color_pattern === assignedUserCard.sleeve_color)
    : null;

  const deckSleeve = availableSleeves.find((s) => s.id === targetDeckSleeveId) || null;
  const activeSleeve = customSleeve || deckSleeve;
  const locationText = cardLoc ? cardLoc.name : (storageLocationId ? (currentBaseLocation?.name || 'En Deckbox') : 'Sin clasificar');

  return (
    <div
      key={`${sectionKey}-${cardDetail.card_id}-${idx}`}
      draggable={!isMobile}
      onDragStart={!isMobile ? (e) => {
        handleDragCardStart?.(e, {
          id: cardDetail.card_id,
          name: cardDetail.card_details?.name || '',
          type: cardDetail.card_details?.type,
          image_url: cardDetail.card_details?.image_url_small || cardDetail.card_details?.image_url,
          archetype: cardDetail.card_details?.archetype,
          fromSection: cardDetail.section as 'main' | 'extra' | 'side' | 'pool' | 'extras',
        });
      } : undefined}
      onClick={() => {
        onSelectCard(cardDetail);
        if (isMobile) setMobileTab('right');
      }}
      className={`relative aspect-3/4.4 bg-white dark:bg-zinc-900 rounded-xl border p-1 flex flex-col justify-between overflow-hidden cursor-pointer transition-all shadow-2xs group select-none ${
        isSelected
          ? 'border-red-500 ring-2 ring-red-500/40 shadow-md scale-102'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
      }`}
    >
      <div className="relative flex-1 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardDetail.card_details?.image_url_small || cardDetail.card_details?.image_url}
          alt={cardDetail.card_details?.name || 'Carta'}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
          loading="lazy"
        />
        <div className="absolute top-1 right-1 bg-black/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-xs">
          {cardDetail.count}x
        </div>
        {badgeLabel && (
          <div className="absolute top-1 left-1">
            <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${badgeColorClass}`}>
              {badgeLabel}
            </span>
          </div>
        )}
      </div>
      <div className="mt-1 px-0.5 text-center min-w-0 w-full flex flex-col items-center">
        <OverflowTooltip 
          text={cardDetail.card_details?.name || 'Carta'} 
          className="text-[9.5px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-500 transition-colors"
          containerClassName="w-full"
        />
        <div className="mt-0.5 w-full flex justify-center">
          {isAssignedToDeck ? (
            <OverflowTooltip
              text={`📍 ${locationText}`}
              className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 block"
              containerClassName="w-full"
            />
          ) : allInventoryCopies.length > 0 ? (
            <OverflowTooltip
              text={`⚠️ Solo Receta (${allInventoryCopies.length} en colección)`}
              className="text-[8px] font-mono text-amber-600 dark:text-amber-400 font-bold block"
              containerClassName="w-full"
            />
          ) : (
            <span className="text-[8px] font-mono text-amber-600 dark:text-amber-400 font-bold block truncate">
              ⚠️ Solo Receta
            </span>
          )}
        </div>
      </div>

      {/* Franja de Color de Funda */}
      {activeSleeve && (
        <div
          className="h-1 w-full rounded-full mt-1 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: activeSleeve.color_hex || '#1a1a2e' }}
          title={`Funda: ${activeSleeve.name} (${activeSleeve.brand} - ${activeSleeve.color_pattern})`}
        />
      )}
    </div>
  );
};
