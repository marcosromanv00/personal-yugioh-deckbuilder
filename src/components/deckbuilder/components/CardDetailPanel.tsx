'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  Shield, 
  StickyNote, 
  Check,
  BrainCircuit
} from 'lucide-react';
import { Card, DeckCard, HoverCardBase } from '../types';
import { SleeveInventory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';

export interface CardDetailPanelProps {
  card: (Card | DeckCard | HoverCardBase) | null;
  deckCard?: DeckCard | null;
  isInDeck: boolean;
  allUserCards?: import('@/types/collection').UserCard[];
  locations?: import('@/types/collection').StorageLocation[];
  onUpdateDeckCard?: (cardId: number, updates: Partial<DeckCard>) => void;
  onUpdateCardPhysicalCopy?: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras', copyIndex: number, userCardId: string | 'proxy') => void;
  onResolveConflictAction?: (userCardId: string, action: 'move_to_deck' | 'deactivate_origin') => void;
  onRemoveFromDeck?: (cardId: number, section: 'main' | 'extra' | 'side' | 'extras') => void;
  onAddCardToDeck?: (card: Card, section?: 'main' | 'extra' | 'side' | 'extras') => void;
  onToggleFavorite?: (cardId: number) => void;
  isFavorite?: boolean;
  availableSleeves?: SleeveInventory[];
  format?: 'Master Duel' | 'TCG' | 'Duel Links';
}

const RARITIES = [
  'Common',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
  'Prismatic Secret Rare',
  'Prismatic Ultimate Rare',
  'Prismatic Platinum Rare',
  'Gold Rare',
  'Duel Terminal',
  'Starlight Rare',
  'Collector\'s Rare',
  'Ultimate Rare',
  'Ghost Rare',
  'Quarter Century Secret Rare',
  'Proxy',
];

const CONDITIONS = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
];

export const CardDetailPanel: React.FC<CardDetailPanelProps> = ({
  card,
  deckCard,
  isInDeck,
  allUserCards = [],
  locations = [],
  onUpdateDeckCard,
  onUpdateCardPhysicalCopy,
  onResolveConflictAction,
  onRemoveFromDeck,
  onAddCardToDeck,
  onToggleFavorite,
  isFavorite = false,
  availableSleeves = [],
  format = 'Master Duel',
}) => {
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-zinc-400 dark:text-zinc-500">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl mb-3 shadow-inner">
          🃏
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          Ninguna carta seleccionada
        </p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-55 leading-relaxed">
          Haz clic o añade cualquier carta en el buscador o en el deck para editar sus atributos, rareza y proxies.
        </p>
      </div>
    );
  }

  const isMonster = card.type?.toLowerCase().includes('monster');
  const isExtra = card.type ? (
    card.type.includes('Fusion') ||
    card.type.includes('Link') ||
    card.type.includes('Synchro') ||
    card.type.includes('XYZ')
  ) : false;

  const currentCount = deckCard?.count || 1;
  const currentProxyCount = deckCard?.proxy_count || 0;
  const currentRarity = deckCard?.rarity || 'Common';
  const currentCondition = deckCard?.condition || 'Near Mint';
  const currentNotes = deckCard?.notes || '';
  const currentSleeveId = deckCard?.sleeve_id || '';
  const currentSection = deckCard?.section || (isExtra ? 'extra' : 'main');

  const cardData = card as Card;

  const getBanlistBadge = (status?: string) => {
    if (!status || status === 'Unlimited') {
      return (
        <span className="text-[9px] font-bold text-emerald-500">Ilimitada</span>
      );
    }
    if (status === 'Forbidden') {
      return <span className="text-[9px] font-black text-red-500 uppercase">Prohibida</span>;
    }
    if (status === 'Limited') {
      return <span className="text-[9px] font-black text-amber-500 uppercase">Limitada (1)</span>;
    }
    if (status === 'Semi-Limited') {
      return <span className="text-[9px] font-black text-yellow-400 uppercase">Semi-Lim. (2)</span>;
    }
    return <span className="text-[9px] font-medium text-zinc-400">{status}</span>;
  };

  return (
    <div className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-200">
      
      {/* ── CARD HEADER & IMAGE ── */}
      <div className="flex gap-3 bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative w-20 shrink-0 aspect-[3/4.4] rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-900 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.image_url || card.image_url_small || 'https://images.ygoprodeck.com/images/cards/back.jpg'}
            alt={card.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg';
            }}
          />
          {isFavorite && (
            <div className="absolute top-1 right-1 p-0.5 bg-red-600 rounded-full text-white shadow">
              <Heart className="w-2.5 h-2.5 fill-current" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] font-mono font-bold text-zinc-400">
                ID #{card.id}
              </span>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(card.id)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isFavorite
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                  }`}
                  title={isFavorite ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            <h3 className="font-black text-xs sm:text-sm leading-snug line-clamp-2 text-zinc-900 dark:text-zinc-100">
              {card.name}
            </h3>

            {card.archetype && (
              <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[9px] font-black rounded uppercase tracking-wider">
                {card.archetype}
              </span>
            )}
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
            {card.type}
          </div>
        </div>
      </div>

      {/* ── STATS BADGES (If Monster) ── */}
      {isMonster && (
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono uppercase text-zinc-400">ATK</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-mono font-black">{cardData.atk ?? '—'}</span>
          </div>
          <div className="flex flex-col border-x border-zinc-200 dark:border-zinc-800 px-1">
            <span className="text-[8px] font-mono uppercase text-zinc-400">
              {card.type?.includes('Link') ? 'LINK' : 'DEF'}
            </span>
            <span className="text-zinc-800 dark:text-zinc-200 font-mono font-black">
              {card.type?.includes('Link') ? cardData.level ?? '—' : cardData.def ?? '—'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono uppercase text-zinc-400">
              {card.type?.includes('XYZ') ? 'RANGO' : card.type?.includes('Link') ? 'RATING' : 'NIVEL'}
            </span>
            <span className="text-zinc-800 dark:text-zinc-200 font-mono font-black">⭐ {cardData.level ?? '—'}</span>
          </div>
        </div>
      )}

      {/* ── BANLIST SUMMARY ── */}
      <div className="grid grid-cols-3 gap-1 text-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col items-center">
          <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-400">TCG</span>
          {getBanlistBadge(cardData.ban_tcg)}
        </div>
        <div className="flex flex-col items-center border-x border-zinc-200 dark:border-zinc-800 px-1">
          <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-400">Master Duel</span>
          {getBanlistBadge(cardData.ban_master_duel)}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-400">Duel Links</span>
          {getBanlistBadge(cardData.ban_duel_links)}
        </div>
      </div>

      {/* ── IF IN DECK: QUICK CUSTOMIZATION & PROXY CONTROLS ── */}
      {isInDeck && deckCard && onUpdateDeckCard ? (
        <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          
          {/* SECCIÓN & CANTIDAD */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                Sección
              </label>
              <PremiumDropdown
                value={currentSection}
                onChange={(val) => onUpdateDeckCard(deckCard.id, { section: val as 'main' | 'extra' | 'side' | 'extras' })}
                align="full"
                size="sm"
                options={[
                  { value: 'main', label: 'Main Deck' },
                  { value: 'extra', label: 'Extra Deck' },
                  { value: 'side', label: 'Side Deck' },
                  { value: 'extras', label: 'Extras / Sugeridas' },
                ]}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                Copias en Deck
              </label>
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-300 dark:border-zinc-800 p-1 min-h-11 sm:min-h-9">
                <button
                  type="button"
                  onClick={() => onUpdateDeckCard(deckCard.id, { count: Math.max(1, currentCount - 1) })}
                  className="w-10 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-black cursor-pointer touch-manipulation"
                >
                  <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
                <span className="flex-1 text-center font-mono font-black text-sm sm:text-xs">
                  {currentCount}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateDeckCard(deckCard.id, { count: Math.min(3, currentCount + 1) })}
                  className="w-10 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-black cursor-pointer touch-manipulation"
                >
                  <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* CONTROL DE PROXIES / PLACEHOLDERS */}
          <div className="p-3 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <Printer className="w-4 h-4" />
                <span>¿Copias Proxy / Impresas?</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-red-500">
                {currentProxyCount} de {currentCount}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newProxies = currentProxyCount > 0 ? 0 : currentCount;
                  onUpdateDeckCard(deckCard.id, { proxy_count: newProxies });
                }}
                className={`px-3.5 py-2.5 sm:py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 touch-manipulation min-h-11 sm:min-h-8 ${
                  currentProxyCount > 0
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {currentProxyCount > 0 ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{currentProxyCount > 0 ? 'Es Proxy' : 'No es Proxy'}</span>
              </button>

              {currentProxyCount > 0 && currentCount > 1 && (
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-xl border border-red-300 dark:border-red-900/50 min-h-11 sm:min-h-8">
                  <button
                    type="button"
                    onClick={() => onUpdateDeckCard(deckCard.id, { proxy_count: Math.max(0, currentProxyCount - 1) })}
                    className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 touch-manipulation"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-black text-red-600 dark:text-red-400 px-1.5">
                    {currentProxyCount}x
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateDeckCard(deckCard.id, { proxy_count: Math.min(currentCount, currentProxyCount + 1) })}
                    className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 touch-manipulation"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ASIGNACIÓN DE COPIAS FÍSICAS INDIVIDUALES */}
          {onUpdateCardPhysicalCopy && (
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 font-mono">
                  <span>📦</span>
                  <span>Copias Físicas Asignadas ({currentCount})</span>
                </span>
                <span className="text-[9.5px] font-mono text-zinc-400">
                  {allUserCards.filter(uc => uc.card_id === card.id).reduce((sum, uc) => sum + (uc.quantity || 1), 0)} en colección
                </span>
              </div>

              <div className="space-y-2">
                {Array.from({ length: currentCount }).map((_, copyIdx) => {
                  const assignedPc = deckCard.physical_copies?.[copyIdx];
                  const userCardsForCard = allUserCards.filter(uc => uc.card_id === card.id);
                  const selectedVal = assignedPc?.is_proxy || !assignedPc?.user_card_id ? 'proxy' : assignedPc.user_card_id;

                  const options = [
                    { value: 'proxy', label: '⚫ Receta Virtual / Proxy' },
                    ...userCardsForCard.map((uc) => {
                      const loc = locations.find(l => l.id === uc.storage_location_id);
                      const locName = loc ? loc.name : 'Inbox / Sin clasificar';
                      let locDetail = '';
                      if (loc?.type === 'binder' && uc.binder_page) {
                        locDetail = ` (Pág ${uc.binder_page}${uc.binder_slot ? `, Ranura ${uc.binder_slot}` : ''})`;
                      } else if (uc.compartment_index !== undefined) {
                        locDetail = ` (Carril ${uc.compartment_index + 1})`;
                      }
                      const inDeckTag = uc.deck_id ? ` • ⚔️ ${uc.deck_details?.name || 'En Deck Activo'}` : '';
                      const qtyTag = (uc.quantity || 1) > 1 ? ` (${uc.quantity} disponibles)` : '';

                      return {
                        value: uc.id,
                        label: `${uc.rarity || 'Common'} • ${locName}${locDetail}${inDeckTag}${qtyTag}`
                      };
                    })
                  ];

                  return (
                    <div key={copyIdx} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-zinc-500 font-mono">Copia #{copyIdx + 1}</span>
                        {assignedPc?.is_proxy ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Receta / Proxy</span>
                        ) : assignedPc?.is_in_active_deck ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">⚔️ En Deck Activo</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">🟢 Lista: {assignedPc?.location_name}</span>
                        )}
                      </div>

                      <PremiumDropdown
                        value={selectedVal}
                        onChange={(val) => onUpdateCardPhysicalCopy(deckCard.id, deckCard.section, copyIdx, val)}
                        align="full"
                        size="sm"
                        options={options}
                      />

                      {assignedPc?.is_in_active_deck && assignedPc.user_card_id && onResolveConflictAction && (
                        <div className="pt-1.5 border-t border-amber-500/20 flex flex-col gap-1">
                          <p className="text-[9.5px] text-amber-400 font-medium leading-tight">
                            Pertenece a: <strong>{assignedPc.active_deck_name || 'Deck Activo'}</strong>
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => onResolveConflictAction(assignedPc.user_card_id!, 'move_to_deck')}
                              className="flex-1 py-1 px-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                            >
                              Mover a este Deck
                            </button>
                            <button
                              type="button"
                              onClick={() => onResolveConflictAction(assignedPc.user_card_id!, 'deactivate_origin')}
                              className="flex-1 py-1 px-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                            >
                              Inactivar Origen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RAREZA Y CONDICIÓN FÍSICA */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                Rareza
              </label>
              <PremiumDropdown
                value={currentRarity}
                onChange={(val) => onUpdateDeckCard(deckCard.id, { rarity: val })}
                align="full"
                size="sm"
                options={RARITIES.map((r) => ({ value: r, label: r }))}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                Condición
              </label>
              <PremiumDropdown
                value={currentCondition}
                onChange={(val) => onUpdateDeckCard(deckCard.id, { condition: val })}
                align="full"
                size="sm"
                options={CONDITIONS.map((c) => ({ value: c, label: c }))}
              />
            </div>
          </div>

          {/* ASIGNACIÓN DE FUNDA INDIVIDUAL */}
          {availableSleeves.length > 0 && (
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
                Funda Específica (Opcional)
              </label>
              <PremiumDropdown
                value={currentSleeveId}
                onChange={(sId) => {
                  const found = availableSleeves.find((s) => s.id === sId);
                  onUpdateDeckCard(deckCard.id, {
                    sleeve_id: sId || undefined,
                    sleeve_color_hex: found ? found.color_hex : undefined,
                  });
                }}
                align="full"
                size="sm"
                placeholder="Heredar funda del Deck"
                options={[
                  { value: '', label: 'Heredar funda del Deck' },
                  ...availableSleeves.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.color_pattern})`,
                  })),
                ]}
              />
            </div>
          )}

          {/* NOTAS TÁCTICAS O EDICIÓN */}
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">
              Notas de la Carta
            </label>
            <input
              type="text"
              placeholder="ej: 1st Edition, Ultimate Rare, Firma..."
              value={currentNotes}
              onChange={(e) => onUpdateDeckCard(deckCard.id, { notes: e.target.value })}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none placeholder:text-zinc-400"
            />
          </div>

          {/* BOTÓN REMOVER DEL DECK */}
          {onRemoveFromDeck && (
            <button
              type="button"
              onClick={() => onRemoveFromDeck(deckCard.id, deckCard.section)}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover del {deckCard.section.toUpperCase()} Deck</span>
            </button>
          )}
        </div>
      ) : (
        /* SI NO ESTÁ EN EL DECK (SELECCIONADA DESDE EL BUSCADOR) */
        <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase text-zinc-500 font-mono block">
            Añadir al Deck
          </span>
          <div className="grid grid-cols-2 gap-2">
            {onAddCardToDeck && (
              <>
                <button
                  type="button"
                  onClick={() => onAddCardToDeck(cardData, isExtra ? 'extra' : 'main')}
                  className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ {isExtra ? 'Extra Deck' : 'Main Deck'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddCardToDeck(cardData, 'side')}
                  className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Side Deck</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CARD EFFECT DESCRIPTION ── */}
      {cardData.desc && (
        <div className="mt-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono block mb-1">
            Efecto / Descripción
          </span>
          <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-36 overflow-y-auto scrollbar-thin">
            {cardData.desc}
          </p>
        </div>
      )}

      {/* ── LINK TO KNOWLEDGE BASE (BANCO DE REGLAS) ── */}
      {cardData.name && (
        <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href={`/knowledge`}
            className="w-full py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs font-display"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Ver en Banco de Reglas</span>
          </Link>
        </div>
      )}

    </div>
  );
};
