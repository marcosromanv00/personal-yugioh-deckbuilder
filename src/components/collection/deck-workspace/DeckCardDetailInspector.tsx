'use client';

import React, { useState } from 'react';
import { 
  Trash2, 
  Layers, 
  Boxes, 
  Plus, 
  AlertCircle, 
  Shield, 
  PackagePlus,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag
} from 'lucide-react';
import { StorageLocation, UserCard, DeckCardDetail, SleeveInventory } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { DetailsCopiesMode } from '../workspace/types';
import { isExtraDeckCardType } from './useDeckWorkspaceState';
import { OverflowTooltip } from '@/components/ui/OverflowTooltip';

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
  onRequestRelocateCard?: (userCard: UserCard, locationId: string | null, compartmentIdx: number) => void;
  onUpdateUserCard?: (userCardId: string, fields: Partial<UserCard>) => void;
  onAddPhysicalCopyForCard?: (cardId: number, isProxy?: boolean) => void;
  onDeleteUserCard?: (userCardId: string) => void;
  onRemoveCardFromDeck: (cardId: number, section: 'main' | 'extra' | 'side' | 'pool') => void;
  onOpenRegisterSleeveForCard?: (userCard: UserCard) => void;
  onStageAssignCopy?: (cardId: number, section: string, copy: UserCard) => void;
  onStageUnassignCopy?: (cardId: number, section: string, userCardId: string) => void;
}

const RARITY_OPTIONS = [
  { value: 'Common', label: 'Common (Común)' },
  { value: 'Rare', label: 'Rare (Rara)' },
  { value: 'Super Rare', label: 'Super Rare' },
  { value: 'Ultra Rare', label: 'Ultra Rare' },
  { value: 'Secret Rare', label: 'Secret Rare' },
  { value: 'Prismatic Secret Rare', label: 'Prismatic Secret' },
  { value: 'Prismatic Ultimate Rare', label: 'Prismatic Ultimate' },
  { value: 'Prismatic Platinum Rare', label: 'Prismatic Platinum' },
  { value: 'Gold Rare', label: 'Gold (Dorada)' },
  { value: 'Duel Terminal', label: 'Duel Terminal' },
  { value: 'Ultimate Rare', label: 'Ultimate Rare' },
  { value: 'Ghost Rare', label: 'Ghost Rare' },
  { value: 'Starlight Rare', label: 'Starlight Rare' },
  { value: "Collector's Rare", label: "Collector's Rare" },
  { value: 'Quarter Century Secret Rare', label: '25th Quarter Century' },
  { value: 'Proxy', label: '🖨️ Proxy (Impresión)' },
];

const CONDITION_OPTIONS = [
  { value: 'Near Mint', label: 'Near Mint (NM)' },
  { value: 'Lightly Played', label: 'Lightly Played (LP)' },
  { value: 'Moderately Played', label: 'Moderately Played (MP)' },
  { value: 'Heavily Played', label: 'Heavily Played (HP)' },
  { value: 'Damaged', label: 'Damaged (DMG)' },
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
  onRequestRelocateCard,
  onUpdateUserCard,
  onAddPhysicalCopyForCard,
  onDeleteUserCard,
  onRemoveCardFromDeck,
  onOpenRegisterSleeveForCard,
  onStageAssignCopy,
  onStageUnassignCopy,
}) => {
  const [detailsCopiesMode, setDetailsCopiesMode] = useState<DetailsCopiesMode>('grouped');
  // Set de IDs de variantes abiertas
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});

  const toggleVariant = (id: string) => {
    setExpandedVariants(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isExpanded = (id: string, idx: number) => {
    // Si solo hay 1 variante, por defecto expandida si no se ha colapsado
    if (selectedPhysicalUserCards.length === 1 && expandedVariants[id] === undefined) {
      return true;
    }
    // Si hay múltiples variantes, por defecto colapsadas (salvo la primera o si el usuario la abrió)
    if (expandedVariants[id] === undefined) {
      return idx === 0 && selectedPhysicalUserCards.length <= 2;
    }
    return !!expandedVariants[id];
  };

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

  const getSectionBadge = (section: string) => {
    switch (section) {
      case 'extra':
        return { label: 'EXTRA DECK', bg: 'bg-purple-100 dark:bg-purple-950/40', border: 'border-purple-300 dark:border-purple-800/60', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' };
      case 'side':
        return { label: 'SIDE DECK', bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' };
      case 'pool':
      case 'extras':
        return { label: 'RESERVA / POOL', bg: 'bg-cyan-100 dark:bg-cyan-950/40', border: 'border-cyan-300 dark:border-cyan-800/60', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' };
      case 'main':
      default:
        return { label: 'MAIN DECK', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-900/40', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' };
    }
  };

  const secBadge = getSectionBadge(selectedCardDetail.section);

  const renderSleeveControls = (uc: UserCard) => {
    const activeLevel = uc.sleeve_type || 'single';
    const fitSleeve = availableSleeves.find(s => s.id === uc.sleeve_fit_id) || (activeLevel !== 'none' && uc.sleeve_inner_brand ? availableSleeves.find(s => s.brand === uc.sleeve_inner_brand) : null);
    const regularSleeve = availableSleeves.find(s => s.id === uc.sleeve_regular_id) || (activeLevel !== 'none' && uc.sleeve_brand ? availableSleeves.find(s => s.brand === uc.sleeve_brand && s.color_pattern === uc.sleeve_color) : defaultDeckSleeve);
    const overSleeve = availableSleeves.find(s => s.id === uc.sleeve_over_id) || (activeLevel === 'triple' && uc.sleeve_outer_brand ? availableSleeves.find(s => s.brand === uc.sleeve_outer_brand) : null);

    return (
      <div className="p-2 bg-zinc-100/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9.5px] font-mono font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-500" />
            <span>Fundas:</span>
          </span>
          <div className="flex items-center gap-0.5">
            {(
              [
                { id: 'none', label: 'Sin' },
                { id: 'single', label: 'Simple' },
                { id: 'double', label: 'Doble' },
                { id: 'triple', label: 'Triple' },
              ] as const
            ).map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  onUpdateUserCard?.(uc.id, {
                    sleeve_type: lvl.id,
                    ...(lvl.id === 'none' ? { sleeve_fit_id: null, sleeve_regular_id: null, sleeve_over_id: null, sleeve_brand: '', sleeve_color: '' } : {})
                  });
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  activeLevel === lvl.id
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {activeLevel !== 'none' && (
          <div className="space-y-1.5 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
            {/* Capa 1: Fit / Inner (Doble o Triple) */}
            {(activeLevel === 'double' || activeLevel === 'triple') && (
              <div>
                <span className="text-[8.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                  🟢 Capa 1: Inner / Fit
                </span>
                <PremiumDropdown
                  value={uc.sleeve_fit_id || ''}
                  onChange={(val) => {
                    const picked = availableSleeves.find(s => s.id === val);
                    onUpdateUserCard?.(uc.id, {
                      sleeve_fit_id: val || undefined,
                      sleeve_inner_brand: picked?.brand || undefined,
                      sleeve_inner_color: picked?.color_pattern || undefined,
                    });
                  }}
                  align="full"
                  size="sm"
                  options={[
                    { value: '', label: '-- Sin Inner Sleeve --' },
                    ...availableSleeves
                      .filter(s => s.category === 'fit' || !availableSleeves.some(x => x.category === 'fit'))
                      .map(s => ({
                        value: s.id,
                        label: `🟢 ${s.name} (${s.brand}) [${s.quantity_available ?? s.quantity_total} disp.]`,
                      }))
                  ]}
                />
              </div>
            )}

            {/* Capa 2: Regular */}
            <div>
              <span className="text-[8.5px] font-mono font-bold text-zinc-600 dark:text-zinc-400 block mb-0.5">
                🎴 Capa {activeLevel === 'single' ? 'Única' : '2'}: Principal (Regular)
              </span>
              <PremiumDropdown
                value={uc.sleeve_regular_id || (uc.sleeve_brand && regularSleeve ? regularSleeve.id : 'inherit')}
                onChange={(val) => {
                  if (val === 'inherit') {
                    if (defaultDeckSleeve) {
                      onUpdateUserCard?.(uc.id, {
                        sleeve_regular_id: defaultDeckSleeve.id,
                        sleeve_brand: defaultDeckSleeve.brand,
                        sleeve_color: defaultDeckSleeve.color_pattern,
                        sleeve_condition: defaultDeckSleeve.condition || 'good',
                      });
                    }
                  } else {
                    const picked = availableSleeves.find(s => s.id === val);
                    if (picked) {
                      onUpdateUserCard?.(uc.id, {
                        sleeve_regular_id: picked.id,
                        sleeve_brand: picked.brand,
                        sleeve_color: picked.color_pattern,
                        sleeve_condition: picked.condition || 'good',
                      });
                    } else {
                      onUpdateUserCard?.(uc.id, { sleeve_regular_id: undefined, sleeve_brand: '', sleeve_color: '' });
                    }
                  }
                }}
                align="full"
                size="sm"
                options={[
                  ...(defaultDeckSleeve ? [{
                    value: 'inherit',
                    label: `✨ Heredar del Mazo (🎴 ${defaultDeckSleeve.name})`
                  }] : []),
                  { value: '', label: '-- Sin Funda Principal --' },
                  ...availableSleeves
                    .filter(s => (s.category || 'regular') === 'regular' || (!s.category && s.category !== 'fit' && s.category !== 'over'))
                    .map(s => ({
                      value: s.id,
                      label: `🎴 ${s.name} (${s.brand} - ${s.color_pattern}) [${s.quantity_available ?? s.quantity_total} disp.]`
                    }))
                ]}
              />
            </div>

            {/* Capa 3: Over (Triple) */}
            {activeLevel === 'triple' && (
              <div>
                <span className="text-[8.5px] font-mono font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
                  ✨ Capa 3: Oversleeve (Exterior)
                </span>
                <PremiumDropdown
                  value={uc.sleeve_over_id || ''}
                  onChange={(val) => {
                    const picked = availableSleeves.find(s => s.id === val);
                    onUpdateUserCard?.(uc.id, {
                      sleeve_over_id: val || undefined,
                      sleeve_outer_brand: picked?.brand || undefined,
                      sleeve_outer_color: picked?.color_pattern || undefined,
                    });
                  }}
                  align="full"
                  size="sm"
                  options={[
                    { value: '', label: '-- Sin Oversleeve --' },
                    ...availableSleeves
                      .filter(s => s.category === 'over' || !availableSleeves.some(x => x.category === 'over'))
                      .map(s => ({
                        value: s.id,
                        label: `✨ ${s.name} (${s.brand}) [${s.quantity_available ?? s.quantity_total} disp.]`,
                      }))
                  ]}
                />
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenRegisterSleeveForCard?.(uc)}
          className="w-full mt-0.5 py-1 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-600 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs touch-manipulation"
          title="Registrar o sumar el stock de esta funda física a tu inventario"
        >
          <PackagePlus className="w-3 h-3 text-red-500" />
          <span>Sumar a Mis Fundas (+1 Stock)</span>
        </button>
      </div>
    );
  };

  // Renderizador de una tarjeta de variante (acordeón compacto)
  const renderVariantItem = (uc: UserCard, idx: number) => {
    const expanded = detailsCopiesMode === 'breakdown' || isExpanded(uc.id, idx);
    const targetLoc = locations.find(l => l.id === uc.storage_location_id);
    const locLabel = targetLoc ? targetLoc.name : (storageLocationId ? (currentBaseLocation?.name || 'En Deckbox') : 'Sin clasificar');
    
    // Obtener nombre de funda para la vista colapsada
    const regularSleeve = availableSleeves.find(s => s.id === uc.sleeve_regular_id) || (uc.sleeve_brand ? availableSleeves.find(s => s.brand === uc.sleeve_brand && s.color_pattern === uc.sleeve_color) : defaultDeckSleeve);
    const sleeveSummary = uc.sleeve_type === 'none' 
      ? 'Sin funda' 
      : (regularSleeve ? regularSleeve.name : 'Funda asignada');

    return (
      <div 
        key={uc.id} 
        className={`bg-zinc-50/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-visible transition-all shadow-2xs relative ${expanded ? 'z-20' : 'z-10'}`}
      >
        {/* Cabecera de la variante (Línea compacta que actúa como trigger de acordeón) */}
        <div 
          onClick={() => toggleVariant(uc.id)}
          className="p-2 flex items-center justify-between gap-1.5 cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 select-none transition-colors"
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[10px] font-mono font-black text-purple-600 dark:text-purple-400 shrink-0">
              #{idx + 1}
            </span>
            <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 font-mono shrink-0 px-1 py-0.2 bg-zinc-200/80 dark:bg-zinc-800 rounded">
              {uc.quantity || 1}x
            </span>
            <OverflowTooltip
              text={uc.is_proxy ? '🖨️ Proxy' : (uc.rarity || 'Common')}
              containerClassName="min-w-0 flex-1"
              className="text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200 truncate"
            />
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
              ({uc.condition === 'Near Mint' ? 'NM' : uc.condition === 'Lightly Played' ? 'LP' : uc.condition || 'NM'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Ubicación Compacta Icon-Only con Tooltip */}
            <span 
              title={`Ubicación: ${locLabel}`} 
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0 flex items-center cursor-help"
            >
              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
            </span>
            
            {/* Color de funda dot */}
            {regularSleeve && uc.sleeve_type !== 'none' && (
              <span 
                className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 shadow-2xs" 
                style={{ backgroundColor: regularSleeve.color_hex || '#e11d48' }}
                title={`Funda: ${sleeveSummary}`}
              />
            )}

            {/* Control directo de asignación al mazo */}
            {(() => {
              const isAssigned = selectedCardDetail.physical_copies?.some((cp) => cp.user_card_id === uc.id);
              return isAssigned ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStageUnassignCopy?.(selectedCardDetail.card_id, selectedCardDetail.section, uc.id);
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9.5px] font-black uppercase hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all cursor-pointer shadow-xs min-h-6"
                  title="Asignada a este mazo. Clic para desvincular"
                >
                  ✓ En Mazo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStageAssignCopy?.(selectedCardDetail.card_id, selectedCardDetail.section, uc);
                  }}
                  className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[9.5px] font-black uppercase transition-all cursor-pointer shadow-xs min-h-6"
                  title="Vincular esta copia física al mazo"
                >
                  + Vincular
                </button>
              );
            })()}

            {selectedPhysicalUserCards.length > 1 && onDeleteUserCard && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteUserCard(uc.id);
                }}
                className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Eliminar esta variante"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Formulario Desplegable Compacto (2 Columnas) */}
        {expanded && (
          <div className="p-2.5 pt-1.5 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2 bg-white/50 dark:bg-zinc-950/50">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">
                  Copias:
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={uc.quantity || 1}
                  onChange={(e) => onUpdateUserCard?.(uc.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">
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

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">
                  Condición:
                </label>
                <PremiumDropdown
                  value={uc.condition || 'Near Mint'}
                  onChange={(val) => onUpdateUserCard?.(uc.id, { condition: val as UserCard['condition'] })}
                  align="full"
                  size="sm"
                  options={CONDITION_OPTIONS}
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">
                  Ubicación:
                </label>
                <PremiumDropdown
                  value={uc.storage_location_id || ''}
                  onChange={(val) => {
                    if (onRequestRelocateCard) {
                      onRequestRelocateCard(uc, val || null, 0);
                    } else {
                      onUpdateCardPhysicalLocation(uc.id, val || null, 0);
                    }
                  }}
                  align="full"
                  size="sm"
                  options={[
                    { value: '', label: `📦 Base (${currentBaseLocation?.name || 'Deckbox'})` },
                    { value: 'inbox', label: '📥 Inbox' },
                    ...locations.map((l) => ({
                      value: l.id,
                      label: `📁 ${l.name}`,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Carril si aplica */}
            {targetLoc?.compartments && targetLoc.compartments.count > 1 && (
              <div>
                <label className="block text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-0.5">
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

            {/* Control de Fundas */}
            {renderSleeveControls(uc)}

            {/* Notas ultra-compactas */}
            <div>
              <input
                type="text"
                value={uc.notes || ''}
                onChange={(e) => onUpdateUserCard?.(uc.id, { notes: e.target.value })}
                placeholder="Notas (1st Ed, idioma, etc.)..."
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* ── 1. Vista Previa de la Carta con Badge Compacto ── */}
      <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
        <div className="flex gap-2.5 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedCardDetail.card_details?.image_url_small || selectedCardDetail.card_details?.image_url}
            alt={selectedCardDetail.card_details?.name || 'Carta'}
            className="w-14 h-19 object-contain rounded-lg shadow-sm shrink-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
            onError={(e) => { e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg'; }}
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <OverflowTooltip
              text={selectedCardDetail.card_details?.name || 'Carta'}
              className="text-xs font-black text-zinc-900 dark:text-white leading-tight"
            />
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase font-semibold truncate">
              {selectedCardDetail.card_details?.type}
            </p>
            {selectedCardDetail.card_details?.archetype && (
              <span className="inline-block text-[9px] font-mono text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-1.5 py-0.2 rounded font-bold truncate max-w-full">
                {selectedCardDetail.card_details.archetype}
              </span>
            )}
          </div>
        </div>

        {/* Badge de Estado en el Mazo (1 Línea Compacta) */}
        <div className={`px-2 py-1 rounded-xl border flex items-center justify-between gap-2 ${secBadge.bg} ${secBadge.border}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full ${secBadge.dot} shrink-0 animate-pulse`} />
            <span className={`text-[10px] font-mono font-black uppercase ${secBadge.text} truncate`}>
              EN {secBadge.label}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
            {selectedCardDetail.count}x {selectedCardDetail.count === 1 ? 'copia' : 'copias'}
          </span>
        </div>
      </div>

      {/* ── 2. Cambiar Sección en el Deck (Grid Compacto 2x2) ── */}
      <div className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-1.5 shadow-2xs">
        <label className="text-[10px] font-mono font-black uppercase text-zinc-600 dark:text-zinc-400 block">
          Sección en el Deck:
        </label>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'main')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer min-h-8 touch-manipulation flex items-center justify-center gap-1 ${
              selectedCardDetail.section === 'main'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>⚔️</span>
            <span>Main</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'extra')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer min-h-8 touch-manipulation flex items-center justify-center gap-1 ${
              selectedCardDetail.section === 'extra'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>🔮</span>
            <span>Extra</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'side')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer min-h-8 touch-manipulation flex items-center justify-center gap-1 ${
              selectedCardDetail.section === 'side'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>🛡️</span>
            <span>Side</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCardSection(selectedCardDetail.card_id, selectedCardDetail.section, 'pool')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer min-h-8 touch-manipulation flex items-center justify-center gap-1 ${
              selectedCardDetail.section === 'pool' || selectedCardDetail.section === 'extras'
                ? 'bg-cyan-600 text-white shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>📦</span>
            <span>Reserva</span>
          </button>
        </div>
      </div>

      {/* ── 3. Sección de Copias y Variantes Físicas en Colección (Acordeón Ultra-Compacto) ── */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-visible bg-zinc-50/50 dark:bg-zinc-900/30 shadow-2xs">
        <div className="p-2.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/60">
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-black text-zinc-800 dark:text-zinc-200">
            <Layers className="w-3.5 h-3.5 text-red-500" />
            <span>Copias ({totalPhysicalCopies}x en inventario)</span>
          </span>
          <div className="flex items-center p-0.5 bg-zinc-200/80 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => setDetailsCopiesMode('grouped')}
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                detailsCopiesMode === 'grouped'
                  ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
              title="Vista Agrupada: Resumen compacto en acordeón"
            >
              <Boxes className="w-3 h-3" />
              <span>Agrupada</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailsCopiesMode('breakdown')}
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                detailsCopiesMode === 'breakdown'
                  ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
              title="Vista Desglosada: Todas las variantes abiertas"
            >
              <Layers className="w-3 h-3" />
              <span>Desglosada</span>
            </button>
          </div>
        </div>

        {selectedPhysicalUserCards.length === 0 ? (
          /* Estado vacío: Sin copias físicas registradas */
          <div className="p-3 space-y-2 bg-white dark:bg-zinc-950">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl space-y-1 text-center">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Sin copias físicas registradas</span>
              </p>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-tight">
                No hay ejemplares en tus cajas de colección.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => onAddPhysicalCopyForCard?.(selectedCardDetail.card_id, false)}
                className="py-1.5 px-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs min-h-8 touch-manipulation"
              >
                <Plus className="w-3 h-3" />
                <span>+ Original</span>
              </button>
              <button
                type="button"
                onClick={() => onAddPhysicalCopyForCard?.(selectedCardDetail.card_id, true)}
                className="py-1.5 px-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs min-h-8 touch-manipulation"
              >
                <span>🖨️</span>
                <span>+ Proxy</span>
              </button>
            </div>
          </div>
        ) : (
          /* Lista de Variantes en Acordeón */
          <div className="p-2 space-y-1.5 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between text-[10px] font-mono px-1 pb-1 border-b border-zinc-100 dark:border-zinc-800/60">
              <span className="text-zinc-500 dark:text-zinc-400">
                {selectedPhysicalUserCards.length} {selectedPhysicalUserCards.length === 1 ? 'variante' : 'variantes'}:
              </span>
              {selectedPhysicalUserCards.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = selectedPhysicalUserCards.every(uc => expandedVariants[uc.id]);
                    const next: Record<string, boolean> = {};
                    selectedPhysicalUserCards.forEach(uc => {
                      next[uc.id] = !allOpen;
                    });
                    setExpandedVariants(next);
                  }}
                  className="text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer"
                >
                  {selectedPhysicalUserCards.every(uc => expandedVariants[uc.id]) ? 'Colapsar todas' : 'Expandir todas'}
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {selectedPhysicalUserCards.map((uc, idx) => renderVariantItem(uc, idx))}
            </div>

            <button
              type="button"
              onClick={() => onAddPhysicalCopyForCard?.(selectedCardDetail.card_id, false)}
              className="w-full mt-1 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200 font-bold text-[10.5px] rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs min-h-8 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Añadir variante / rareza diferente</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 4. Quitar Carta del Deck ── */}
      <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onRemoveCardFromDeck(selectedCardDetail.card_id, selectedCardDetail.section as 'main' | 'extra' | 'side' | 'pool')}
          className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 hover:text-red-400 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs min-h-9 touch-manipulation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Quitar 1 Copia del Deck</span>
        </button>
      </div>
    </div>
  );
};


