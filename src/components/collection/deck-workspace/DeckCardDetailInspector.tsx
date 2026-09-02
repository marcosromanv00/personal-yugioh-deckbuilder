'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Trash2, 
  Layers, 
  Boxes, 
  Plus, 
  AlertCircle, 
  Sparkles, 
  Shield, 
  Tag,
  Scissors
} from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { DetailsCopiesMode } from '../workspace/types';
import { isExtraDeckCardType } from './useDeckWorkspaceState';

interface DeckCardDetailInspectorProps {
  selectedCardDetail: DeckCardDetail;
  selectedPhysicalUserCards: UserCard[];
  locations: StorageLocation[];
  storageLocationId: string;
  currentBaseLocation?: StorageLocation;
  availableSleeves?: SleeveInventory[];
  mainSleeveId?: string;
  extraSleeveId?: string;
  poolSleeveId?: string;
  onChangeCardSection: (cardId: number, currentSection: string, targetSection: string) => void;
  onUpdateCardPhysicalLocation: (userCardId: string, locationId: string | null, compartmentIdx: number) => void;
  onUpdateUserCard?: (userCardId: string, fields: Partial<UserCard>) => void;
  onAddPhysicalCopyForCard?: (cardId: number, isProxy?: boolean) => void;
  onDeleteUserCard?: (userCardId: string) => void;
  onRemoveCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'pool') => void;
}

const RARITY_OPTIONS = [
  { value: 'Common', label: 'Common (Común)' },
  { value: 'Rare', label: 'Rare (Rara)' },
  { value: 'Super Rare', label: 'Super Rare' },
  { value: 'Ultra Rare', label: 'Ultra Rare' },
  { value: 'Secret Rare', label: 'Secret Rare' },
  { value: 'Prismatic Secret Rare', label: 'Prismatic Secret Rare' },
  { value: 'Prismatic Ultimate Rare', label: 'Prismatic Ultimate Rare' },
  { value: 'Prismatic Platinum Rare', label: 'Prismatic Platinum Rare' },
  { value: 'Gold Rare', label: 'Gold (Dorada)' },
  { value: 'Duel Terminal', label: 'Duel Terminal' },
  { value: 'Ultimate Rare', label: 'Ultimate Rare' },
  { value: 'Ghost Rare', label: 'Ghost Rare' },
  { value: 'Starlight Rare', label: 'Starlight Rare' },
  { value: "Collector's Rare", label: "Collector's Rare" },
  { value: 'Quarter Century Secret Rare', label: '25th Quarter Century' },
  { value: 'Proxy', label: '🖨️ Proxy (Copia Impresa)' },
];

const CONDITION_OPTIONS = [
  { value: 'Near Mint', label: 'Near Mint (NM)' },
  { value: 'Lightly Played', label: 'Lightly Played (LP)' },
  { value: 'Moderately Played', label: 'Moderately Played (MP)' },
  { value: 'Heavily Played', label: 'Heavily Played (HP)' },
  { value: 'Damaged', label: 'Damaged (DMG)' },
];

const SLEEVE_OPTIONS = [
  { value: 'none', label: 'Sin Funda' },
  { value: 'single', label: 'Funda Simple' },
  { value: 'double', label: 'Funda Doble' },
  { value: 'triple', label: 'Funda Triple' },
];

export const DeckCardDetailInspector: React.FC<DeckCardDetailInspectorProps> = ({
  selectedCardDetail,
  selectedPhysicalUserCards,
  locations,
  storageLocationId,
  currentBaseLocation,
  availableSleeves = [],
  mainSleeveId = '',
  extraSleeveId = '',
  poolSleeveId = '',
  onChangeCardSection,
  onUpdateCardPhysicalLocation,
  onUpdateUserCard,
  onAddPhysicalCopyForCard,
  onDeleteUserCard,
  onRemoveCardFromDeck,
}) => {
  const [detailsCopiesMode, setDetailsCopiesMode] = useState<DetailsCopiesMode>('grouped');
  const [isVariantsExpanded, setIsVariantsExpanded] = useState(false);

  const totalPhysicalCopies = selectedPhysicalUserCards.reduce(
    (sum, c) => sum + (c.quantity || 1),
    0
  );

  // Determinar la funda por defecto según la sección del mazo
  const isExtra = isExtraDeckCardType(selectedCardDetail.card_details?.type);
  let targetDeckSleeveId = mainSleeveId;
  let sectionLabel = 'Main Deck';

  if (selectedCardDetail.section === 'extra' || (selectedCardDetail.section === 'side' && isExtra)) {
    targetDeckSleeveId = extraSleeveId;
    sectionLabel = selectedCardDetail.section === 'side' ? 'Extra (en Side)' : 'Extra Deck';
  } else if (selectedCardDetail.section === 'pool' || selectedCardDetail.section === 'extras') {
    targetDeckSleeveId = poolSleeveId;
    sectionLabel = 'Reserva / Pool';
  } else if (selectedCardDetail.section === 'side') {
    targetDeckSleeveId = mainSleeveId;
    sectionLabel = 'Main (en Side)';
  }

  const defaultDeckSleeve = availableSleeves.find(s => s.id === targetDeckSleeveId) || null;

  const renderSleeveControls = (uc: UserCard) => {
    // Buscar si uc tiene funda específica por marca/color
    const matchedSleeve = (uc.sleeve_brand && uc.sleeve_color)
      ? availableSleeves.find(s => s.brand === uc.sleeve_brand && s.color_pattern === uc.sleeve_color)
      : (uc.sleeve_type !== 'none' ? defaultDeckSleeve : null);

    const isInherited = !uc.sleeve_brand || (defaultDeckSleeve && uc.sleeve_brand === defaultDeckSleeve.brand && uc.sleeve_color === defaultDeckSleeve.color_pattern);
    const activeHex = matchedSleeve?.color_hex || defaultDeckSleeve?.color_hex || '#1a1a2e';

    // Determinar valor para el dropdown
    let dropdownVal = 'none';
    if (uc.sleeve_type !== 'none') {
      if (isInherited && defaultDeckSleeve) {
        dropdownVal = 'inherit';
      } else if (matchedSleeve) {
        dropdownVal = matchedSleeve.id;
      } else if (defaultDeckSleeve) {
        dropdownVal = 'inherit';
      }
    }

    return (
      <div className="p-2.5 bg-zinc-100/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black uppercase text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            <span>Funda de la Carta:</span>
          </span>
          {uc.sleeve_type !== 'none' ? (
            <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border ${
              isInherited
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
            }`}>
              {isInherited ? `✨ Mazo (${sectionLabel})` : '⚙️ Personalizada'}
            </span>
          ) : (
            <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              Sin Funda
            </span>
          )}
        </div>

        {/* Dropdown selector de modelo de funda */}
        <PremiumDropdown
          value={dropdownVal}
          onChange={(val) => {
            if (val === 'inherit') {
              if (defaultDeckSleeve) {
                onUpdateUserCard?.(uc.id, {
                  sleeve_type: uc.sleeve_type === 'none' ? 'single' : (uc.sleeve_type || 'single'),
                  sleeve_brand: defaultDeckSleeve.brand,
                  sleeve_color: defaultDeckSleeve.color_pattern,
                  sleeve_condition: defaultDeckSleeve.condition || 'good',
                });
              } else {
                onUpdateUserCard?.(uc.id, { sleeve_type: 'none', sleeve_brand: '', sleeve_color: '' });
              }
            } else if (val === 'none') {
              onUpdateUserCard?.(uc.id, { sleeve_type: 'none', sleeve_brand: '', sleeve_color: '' });
            } else {
              const picked = availableSleeves.find(s => s.id === val);
              if (picked) {
                onUpdateUserCard?.(uc.id, {
                  sleeve_type: uc.sleeve_type === 'none' ? 'single' : (uc.sleeve_type || 'single'),
                  sleeve_brand: picked.brand,
                  sleeve_color: picked.color_pattern,
                  sleeve_condition: picked.condition || 'good',
                });
              }
            }
          }}
          align="full"
          size="sm"
          options={[
            ...(defaultDeckSleeve ? [{
              value: 'inherit',
              label: `✨ Heredar del Mazo (🛡️ ${defaultDeckSleeve.name} - ${defaultDeckSleeve.color_pattern})`
            }] : []),
            { value: 'none', label: '⚪ Sin Funda Asignada' },
            ...availableSleeves.map(s => ({
              value: s.id,
              label: `🛡️ ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_available ?? s.quantity_total} disp.]`
            }))
          ]}
        />

        {/* Tipo de enmicado y muestra visual de color */}
        {uc.sleeve_type !== 'none' && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <div>
              <label className="block text-[9.5px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                Tipo Enmicado:
              </label>
              <PremiumDropdown
                value={uc.sleeve_type || 'single'}
                onChange={(val) => onUpdateUserCard?.(uc.id, { sleeve_type: val as UserCard['sleeve_type'] })}
                align="full"
                size="sm"
                options={SLEEVE_OPTIONS.filter(o => o.value !== 'none')}
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                Color y Marca:
              </label>
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono truncate min-h-8">
                <span
                  className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-xs"
                  style={{ backgroundColor: activeHex }}
                />
                <span className="truncate font-bold text-zinc-800 dark:text-zinc-200 text-[10.5px]">
                  {uc.sleeve_brand || defaultDeckSleeve?.brand || 'Genérica'} {uc.sleeve_color ? `- ${uc.sleeve_color}` : (defaultDeckSleeve ? `- ${defaultDeckSleeve.color_pattern}` : '')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSectionBadge = (section: string) => {
    switch (section) {
      case 'extra':
        return { label: 'EXTRA DECK', bg: 'bg-purple-100 dark:bg-purple-950/40', border: 'border-purple-300 dark:border-purple-800/60', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' };
      case 'side':
        return { label: 'SIDE DECK', bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' };
      case 'pool':
      case 'extras':
        return { label: 'CARTAS EXTRA / POOL', bg: 'bg-cyan-100 dark:bg-cyan-950/40', border: 'border-cyan-300 dark:border-cyan-800/60', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' };
      case 'main':
      default:
        return { label: 'MAIN DECK', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-900/40', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' };
    }
  };

  const secBadge = getSectionBadge(selectedCardDetail.section);

  return (
    <div className="space-y-4">
      {/* ── Vista Previa de la Carta con Badge de Arquetipo y Estado ── */}
      <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5">
        <div className="flex gap-3.5 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedCardDetail.card_details?.image_url_small || selectedCardDetail.card_details?.image_url}
            alt={selectedCardDetail.card_details?.name || 'Carta'}
            className="w-20 rounded-xl shadow-md shrink-0 border border-zinc-200 dark:border-zinc-800"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="text-xs font-black text-zinc-900 dark:text-white leading-snug">
              {selectedCardDetail.card_details?.name}
            </h4>
            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono uppercase font-semibold">
              {selectedCardDetail.card_details?.type}
            </p>
            {selectedCardDetail.card_details?.archetype && (
              <span className="inline-block text-[9.5px] font-mono text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-2 py-0.5 rounded-md mt-1 font-bold">
                {selectedCardDetail.card_details.archetype}
              </span>
            )}
          </div>
        </div>

        {/* Badge de Estado en el Mazo */}
        <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${secBadge.bg} ${secBadge.border}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${secBadge.dot} shrink-0 animate-pulse`} />
            <div className="min-w-0">
              <span className={`text-[11px] font-mono font-black uppercase ${secBadge.text} block truncate`}>
                EN {secBadge.label}
              </span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {selectedCardDetail.count}x {selectedCardDetail.count === 1 ? 'copia asignada' : 'copias asignadas'} a este proyecto de mazo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cambiar Sección en el Deck ── */}
      <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 shadow-2xs">
        <label className="text-[10.5px] font-mono font-black uppercase text-zinc-700 dark:text-zinc-300 block">
          Sección en el Deck:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'main')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 sm:min-h-9 touch-manipulation flex items-center justify-center gap-1.5 ${
              selectedCardDetail.section === 'main'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>⚔️</span>
            <span>Main Deck</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'extra')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 sm:min-h-9 touch-manipulation flex items-center justify-center gap-1.5 ${
              selectedCardDetail.section === 'extra'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>🔮</span>
            <span>Extra Deck</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'side')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 sm:min-h-9 touch-manipulation flex items-center justify-center gap-1.5 ${
              selectedCardDetail.section === 'side'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>🛡️</span>
            <span>Side Deck</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'pool')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 sm:min-h-9 touch-manipulation flex items-center justify-center gap-1.5 ${
              selectedCardDetail.section === 'pool' || selectedCardDetail.section === 'extras'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>📦</span>
            <span>Cartas Extra / Pool</span>
          </button>
        </div>
      </div>

      {/* ── Sección de Copias y Variantes Físicas en Colección ── */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-visible bg-zinc-50/50 dark:bg-zinc-900/30 shadow-2xs">
        <div className="p-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/60">
          <span className="flex items-center gap-1.5 text-xs font-mono font-black text-zinc-800 dark:text-zinc-200">
            <Layers className="w-3.5 h-3.5 text-red-500" />
            <span>Copias ({totalPhysicalCopies} en inventario)</span>
          </span>
          <div className="flex items-center p-0.5 bg-zinc-200/80 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => setDetailsCopiesMode('grouped')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                detailsCopiesMode === 'grouped'
                  ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
              title="Vista Agrupada: Resumen compacto de copias y rarezas"
            >
              <Boxes className="w-3 h-3" />
              <span>Agrupada</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailsCopiesMode('breakdown')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                detailsCopiesMode === 'breakdown'
                  ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
              title="Vista Desglosada: Desglose completo de cada copia física"
            >
              <Layers className="w-3 h-3" />
              <span>Desglosada</span>
            </button>
          </div>
        </div>

        {selectedPhysicalUserCards.length === 0 ? (
          /* Estado vacío: Sin copias físicas registradas */
          <div className="p-4 space-y-3 bg-white dark:bg-zinc-950">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl space-y-1.5 text-center">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Sin copias físicas registradas</span>
              </p>
              <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 leading-snug">
                Esta carta no tiene ejemplares asignados en tus cajas o carpetas de colección.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onAddPhysicalCopyForCard?.(selectedCardDetail.card_id, false)}
                className="py-2 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs min-h-11 sm:min-h-9 touch-manipulation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Original</span>
              </button>
              <button
                type="button"
                onClick={() => onAddPhysicalCopyForCard?.(selectedCardDetail.card_id, true)}
                className="py-2 px-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs min-h-11 sm:min-h-9 touch-manipulation"
              >
                <span>🖨️</span>
                <span>Registrar como Proxy</span>
              </button>
            </div>
          </div>
        ) : detailsCopiesMode === 'grouped' ? (
          /* Vista Agrupada: Resumen y Acordeón */
          <div className="p-3 space-y-2.5 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">Total físico en inventario:</span>
              <span className="font-black text-zinc-900 dark:text-zinc-100">
                {totalPhysicalCopies}x {totalPhysicalCopies === 1 ? 'copia' : 'copias'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">Variantes/Rarezas:</span>
              <span className="font-black text-purple-600 dark:text-purple-400">
                {selectedPhysicalUserCards.length} registradas
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsVariantsExpanded(p => !p)}
              className="w-full py-2 px-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors min-h-11 sm:min-h-9 touch-manipulation"
            >
              <span>Editar rarezas / cantidades / ubicaciones</span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-mono">
                {isVariantsExpanded ? '▲ Ocultar' : '▼ Expandir'}
              </span>
            </button>

            {isVariantsExpanded && (
              <div className="space-y-3 pt-2">
                {selectedPhysicalUserCards.map((uc, idx) => {
                  const targetLoc = locations.find(l => l.id === uc.storage_location_id);
                  return (
                    <div key={uc.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase">
                            Variante #{idx + 1} ({uc.quantity || 1} {uc.quantity === 1 ? 'copia' : 'copias'})
                          </span>
                          {(uc.is_proxy || uc.rarity === 'Proxy') && (
                            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                              🖨️ PROXY
                            </span>
                          )}
                        </div>
                        {selectedPhysicalUserCards.length > 1 && onDeleteUserCard && (
                          <button
                            type="button"
                            onClick={() => onDeleteUserCard(uc.id)}
                            className="text-[10px] text-red-500 hover:text-red-400 font-mono font-bold hover:underline cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                            Copias:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={uc.quantity || 1}
                            onChange={(e) => onUpdateUserCard?.(uc.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                            Rareza:
                          </label>
                          <PremiumDropdown
                            value={uc.is_proxy ? 'Proxy' : (uc.rarity || 'Common')}
                            onChange={(val) => {
                              if (val === 'Proxy') {
                                onUpdateUserCard?.(uc.id, { is_proxy: true, rarity: 'Proxy' });
                              } else {
                                onUpdateUserCard?.(uc.id, { is_proxy: false, rarity: val });
                              }
                            }}
                            align="full"
                            size="sm"
                            options={RARITY_OPTIONS}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Condición de la Carta:
                        </label>
                        <PremiumDropdown
                          value={uc.condition || 'Near Mint'}
                          onChange={(val) => onUpdateUserCard?.(uc.id, { condition: val as UserCard['condition'] })}
                          align="full"
                          size="sm"
                          options={CONDITION_OPTIONS}
                        />
                      </div>

                      {/* Control de Fundas Detallado */}
                      {renderSleeveControls(uc)}

                      {/* Ubicación Física */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Ubicación Física:
                        </label>
                        <PremiumDropdown
                          value={uc.storage_location_id || ''}
                          onChange={(val) => onUpdateCardPhysicalLocation(uc.id, val || null, 0)}
                          align="full"
                          size="sm"
                          options={[
                            { value: '', label: `📦 Ubicación Base del Deck (${currentBaseLocation?.name || 'Deckbox'})` },
                            { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
                            ...locations.map((l) => ({
                              value: l.id,
                              label: `📁 ${l.name} (${l.type})`,
                            })),
                          ]}
                        />
                      </div>

                      {/* Carril / Compartimento si aplica */}
                      {targetLoc?.compartments && targetLoc.compartments.count > 1 && (
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                            Carril / Compartimento:
                          </label>
                          <PremiumDropdown
                            value={uc.compartment_index ?? 0}
                            onChange={(val) => onUpdateUserCard?.(uc.id, { compartment_index: val })}
                            align="full"
                            size="sm"
                            options={targetLoc.compartments.names.map((compName, cIdx) => ({
                              value: cIdx,
                              label: `📦 ${compName || `Carril ${cIdx + 1}`}`,
                            }))}
                          />
                        </div>
                      )}

                      {/* Notas individuales */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Notas:
                        </label>
                        <input
                          type="text"
                          value={uc.notes || ''}
                          onChange={(e) => onUpdateUserCard?.(uc.id, { notes: e.target.value })}
                          placeholder="1st Ed, Proxy temporal, etc."
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => onAddPhysicalCopyForCard?.(selectedCardDetail.card_id, false)}
                  className="w-full py-2 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-h-11 sm:min-h-9 touch-manipulation"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>➕ Añadir variante / rareza diferente</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Vista Desglosada: Todas las variantes desplegadas directamente */
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-white dark:bg-zinc-950">
            <div className="space-y-3">
              {selectedPhysicalUserCards.map((uc, idx) => {
                const targetLoc = locations.find(l => l.id === uc.storage_location_id);
                return (
                  <div key={uc.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase">
                          Variante #{idx + 1} ({uc.quantity || 1} {uc.quantity === 1 ? 'copia' : 'copias'})
                        </span>
                        {(uc.is_proxy || uc.rarity === 'Proxy') && (
                          <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                            🖨️ PROXY
                          </span>
                        )}
                      </div>
                      {selectedPhysicalUserCards.length > 1 && onDeleteUserCard && (
                        <button
                          type="button"
                          onClick={() => onDeleteUserCard(uc.id)}
                          className="text-[10px] text-red-500 hover:text-red-400 font-mono font-bold hover:underline cursor-pointer"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Copias:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={uc.quantity || 1}
                          onChange={(e) => onUpdateUserCard?.(uc.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Rareza:
                        </label>
                        <PremiumDropdown
                          value={uc.is_proxy ? 'Proxy' : (uc.rarity || 'Common')}
                          onChange={(val) => {
                            if (val === 'Proxy') {
                              onUpdateUserCard?.(uc.id, { is_proxy: true, rarity: 'Proxy' });
                            } else {
                              onUpdateUserCard?.(uc.id, { is_proxy: false, rarity: val });
                            }
                          }}
                          align="full"
                          size="sm"
                          options={RARITY_OPTIONS}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Condición de la Carta:
                      </label>
                      <PremiumDropdown
                        value={uc.condition || 'Near Mint'}
                        onChange={(val) => onUpdateUserCard?.(uc.id, { condition: val as UserCard['condition'] })}
                        align="full"
                        size="sm"
                        options={CONDITION_OPTIONS}
                      />
                    </div>

                    {/* Control de Fundas Detallado */}
                    {renderSleeveControls(uc)}

                    {/* Ubicación Física */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Ubicación Física:
                      </label>
                      <PremiumDropdown
                        value={uc.storage_location_id || ''}
                        onChange={(val) => onUpdateCardPhysicalLocation(uc.id, val || null, 0)}
                        align="full"
                        size="sm"
                        options={[
                          { value: '', label: `📦 Ubicación Base del Deck (${currentBaseLocation?.name || 'Deckbox'})` },
                          { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
                          ...locations.map((l) => ({
                            value: l.id,
                            label: `📁 ${l.name} (${l.type})`,
                          })),
                        ]}
                      />
                    </div>

                    {/* Carril / Compartimento si aplica */}
                    {targetLoc?.compartments && targetLoc.compartments.count > 1 && (
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Carril / Compartimento:
                        </label>
                        <PremiumDropdown
                          value={uc.compartment_index ?? 0}
                          onChange={(val) => onUpdateUserCard?.(uc.id, { compartment_index: val })}
                          align="full"
                          size="sm"
                          options={targetLoc.compartments.names.map((compName, cIdx) => ({
                            value: cIdx,
                            label: `📦 ${compName || `Carril ${cIdx + 1}`}`,
                          }))}
                        />
                      </div>
                    )}

                    {/* Notas individuales */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Notas:
                      </label>
                      <input
                        type="text"
                        value={uc.notes || ''}
                        onChange={(e) => onUpdateUserCard?.(uc.id, { notes: e.target.value })}
                        placeholder="1st Ed, Proxy temporal, etc."
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onAddPhysicalCopyForCard?.(selectedCardDetail.card_id, false)}
              className="w-full py-2 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-h-11 sm:min-h-9 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>➕ Añadir variante / rareza diferente</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Quitar Carta del Deck ── */}
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onRemoveCardFromDeck(selectedCardDetail.card_id, selectedCardDetail.section as 'main' | 'extra' | 'side' | 'pool')}
          className="w-full py-2.5 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs min-h-11 sm:min-h-9 touch-manipulation"
        >
          <Trash2 className="w-4 h-4" />
          <span>Quitar 1 Copia del Deck</span>
        </button>
      </div>
    </div>
  );
};

