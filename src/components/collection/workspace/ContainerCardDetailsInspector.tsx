'use client';

import React from 'react';
import { AlertCircle, Layers, Boxes, Plus, Trash2, Scissors, ArrowRightLeft, Inbox } from 'lucide-react';
import { StorageLocation, UserCard } from '@/types/collection';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { getCategoryBadgeStyle, getLanguageDisplay, DispersedCardSummary } from '@/lib/collectionUtils';
import { DetailsCopiesMode } from './types';

interface ContainerCardDetailsInspectorProps {
  selectedUserCard: UserCard;
  locations: StorageLocation[];
  location: StorageLocation | null;
  currentCardDispersedInfo: DispersedCardSummary | null;
  totalCopiesInContainer: number;
  detailsCopiesMode: DetailsCopiesMode;
  setDetailsCopiesMode: (mode: DetailsCopiesMode) => void;
  isVariantsExpanded: boolean;
  setIsVariantsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  activeVariants: UserCard[];
  onOpenPickListForCard: () => void;
  onUpdateVariantById: (variantId: string, fields: Partial<UserCard>) => void;
  onDeleteVariantById: (variantId: string) => void;
  onAddNewVariant: () => void;
  onUpdateCard: (fields: Partial<UserCard>) => void;
  onMoveCard: (newLocId: string | null) => void;
  onDeleteCard: () => void;
  onOpenSplitModal?: (card?: UserCard) => void;
  onOpenMoveVariantModal?: (variant: UserCard) => void;
  onSendToStaged?: () => void;
}

export const ContainerCardDetailsInspector: React.FC<ContainerCardDetailsInspectorProps> = ({
  selectedUserCard,
  locations,
  location,
  currentCardDispersedInfo,
  totalCopiesInContainer,
  detailsCopiesMode,
  setDetailsCopiesMode,
  isVariantsExpanded,
  setIsVariantsExpanded,
  activeVariants,
  onOpenPickListForCard,
  onUpdateVariantById,
  onDeleteVariantById,
  onAddNewVariant,
  onUpdateCard,
  onMoveCard,
  onDeleteCard,
  onOpenSplitModal,
  onOpenMoveVariantModal,
  onSendToStaged,
}) => {
  const cat = getCategoryBadgeStyle(selectedUserCard.status_flag);

  return (
    <div className="space-y-4">
      {/* Vista previa de carta con Badge de Categoría */}
      <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5">
        <div className="flex gap-3.5 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedUserCard.card_details?.image_url_small || selectedUserCard.card_details?.image_url}
            alt={selectedUserCard.card_details?.name || ''}
            className="w-20 rounded-xl shadow-md shrink-0 border border-zinc-200 dark:border-zinc-800"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="text-xs font-black text-zinc-900 dark:text-white leading-snug">
              {selectedUserCard.card_details?.name}
            </h4>
            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono uppercase font-semibold">
              {selectedUserCard.card_details?.type}
            </p>
            {selectedUserCard.card_details?.archetype && (
              <span className="inline-block text-[9.5px] font-mono text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-800/60 px-2 py-0.5 rounded-md mt-1 font-bold">
                {selectedUserCard.card_details.archetype}
              </span>
            )}
          </div>
        </div>

        {/* Badge de Categoría Actual */}
        <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${cat.badgeBgClass} ${cat.borderColorClass}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${cat.dotColorClass} shrink-0`} />
            <div className="min-w-0">
              <span className={`text-[11px] font-mono font-black uppercase ${cat.textColorClass} block truncate`}>
                {cat.label}
              </span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {cat.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Copias Dispersas en Otras Ubicaciones / Idiomas */}
      {currentCardDispersedInfo && currentCardDispersedInfo.locations.length > 1 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Copias en otros lugares ({currentCardDispersedInfo.totalCopies}x total)</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-md">
              {currentCardDispersedInfo.distinctLocationsCount} ubicaciones
            </span>
          </div>

          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
            Tienes copias de esta carta distribuidas en otras cajas, carpetas o idiomas:
          </p>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {currentCardDispersedInfo.locations.map((loc, lIdx) => (
              <div key={lIdx} className="p-2 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-[10.5px] font-mono">
                <span className="text-zinc-700 dark:text-zinc-300 truncate">
                  📦 {loc.locationName} ({loc.compartmentName})
                </span>
                <span className="font-black text-amber-700 dark:text-amber-400 shrink-0">
                  {loc.copiesCount}x ({loc.languages.map(l => getLanguageDisplay(l).badge).join(', ')})
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenPickListForCard}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Ruta para reunir todas las copias aquí</span>
          </button>
        </div>
      )}

      {/* Sección de Copias: Selector Agrupada vs Desglosada */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-visible bg-zinc-50/50 dark:bg-zinc-900/30 shadow-2xs">
        <div className="p-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/60">
          <span className="flex items-center gap-1.5 text-xs font-mono font-black text-zinc-800 dark:text-zinc-200">
            <Layers className="w-3.5 h-3.5 text-red-500" />
            <span>Copias ({totalCopiesInContainer} en este contenedor)</span>
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
              title="Vista Desglosada: Desglose completo de cada copia y variante física"
            >
              <Layers className="w-3 h-3" />
              <span>Desglosada</span>
            </button>
          </div>
        </div>

        {detailsCopiesMode === 'grouped' ? (
          /* Vista Agrupada: Resumen y Acordeón */
          <div className="p-3 space-y-2.5 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">Total físico:</span>
              <span className="font-black text-zinc-900 dark:text-zinc-100">{totalCopiesInContainer}x {totalCopiesInContainer === 1 ? 'copia' : 'copias'}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">Variantes/Rarezas:</span>
              <span className="font-black text-purple-600 dark:text-purple-400">{activeVariants.length} registradas</span>
            </div>

            <button
              type="button"
              onClick={() => setIsVariantsExpanded(p => !p)}
              className="w-full py-1.5 px-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Editar rarezas / cantidades</span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-mono">{isVariantsExpanded ? '▲ Ocultar' : '▼ Expandir'}</span>
            </button>

            {isVariantsExpanded && (
              <div className="space-y-3 pt-2">
                {activeVariants.map((v, idx) => (
                  <div key={v.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase">
                          Variante #{idx + 1} ({v.quantity || 1} {v.quantity === 1 ? 'copia' : 'copias'})
                        </span>
                        {(v.is_proxy || v.rarity === 'Proxy') && (
                          <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                            🖨️ PROXY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => onOpenMoveVariantModal?.(v)}
                          className="text-[10.5px] text-blue-600 dark:text-blue-400 hover:text-blue-500 font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
                          title="Mover esta variante a otro contenedor o bandeja"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Mover</span>
                        </button>
                        {(v.quantity || 1) > 1 && (
                          <button
                            type="button"
                            onClick={() => onOpenSplitModal?.(v)}
                            className="text-[10.5px] text-purple-600 dark:text-purple-400 hover:text-purple-500 font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
                            title="Hacer copia individual a partir de este grupo"
                          >
                            <Scissors className="w-3 h-3" />
                            <span>Separar</span>
                          </button>
                        )}
                        {activeVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteVariantById(v.id)}
                            className="text-[10px] text-red-500 hover:text-red-400 font-mono font-bold hover:underline cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
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
                          value={v.quantity || 1}
                          onChange={(e) => onUpdateVariantById(v.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Rareza:
                        </label>
                        <PremiumDropdown
                          value={v.is_proxy ? 'Proxy' : (v.rarity || 'Common')}
                          onChange={(val) => {
                            if (val === 'Proxy') {
                              onUpdateVariantById(v.id, { is_proxy: true, rarity: 'Proxy' });
                            } else {
                              onUpdateVariantById(v.id, { is_proxy: false, rarity: val });
                            }
                          }}
                          align="full"
                          size="sm"
                          options={[
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
                          ]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Condición:
                        </label>
                        <PremiumDropdown
                          value={v.condition || 'Near Mint'}
                          onChange={(val) => onUpdateVariantById(v.id, { condition: val as UserCard['condition'] })}
                          align="full"
                          size="sm"
                          options={[
                            { value: 'Near Mint', label: 'Near Mint (NM)' },
                            { value: 'Lightly Played', label: 'Lightly Played (LP)' },
                            { value: 'Moderately Played', label: 'Moderately Played (MP)' },
                            { value: 'Heavily Played', label: 'Heavily Played (HP)' },
                            { value: 'Damaged', label: 'Damaged (DMG)' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                          Funda / Sleeving:
                        </label>
                        <PremiumDropdown
                          value={v.sleeve_type || 'none'}
                          onChange={(val) => onUpdateVariantById(v.id, { sleeve_type: val as UserCard['sleeve_type'] })}
                          align="full"
                          size="sm"
                          options={[
                            { value: 'none', label: 'Sin Funda' },
                            { value: 'single', label: 'Funda Simple' },
                            { value: 'double', label: 'Funda Doble' },
                            { value: 'triple', label: 'Funda Triple' },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={onAddNewVariant}
                  className="w-full py-2 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
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
              {activeVariants.map((v, idx) => (
                <div key={v.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-black text-purple-600 dark:text-purple-400 uppercase">
                        Variante #{idx + 1} ({v.quantity || 1} {v.quantity === 1 ? 'copia' : 'copias'})
                      </span>
                      {(v.is_proxy || v.rarity === 'Proxy') && (
                        <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                          🖨️ PROXY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onOpenMoveVariantModal?.(v)}
                        className="text-[10.5px] text-blue-600 dark:text-blue-400 hover:text-blue-500 font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
                        title="Mover esta variante a otro contenedor o bandeja"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Mover</span>
                      </button>
                      {(v.quantity || 1) > 1 && (
                        <button
                          type="button"
                          onClick={() => onOpenSplitModal?.(v)}
                          className="text-[10.5px] text-purple-600 dark:text-purple-400 hover:text-purple-500 font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
                          title="Hacer copia individual a partir de este grupo"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>Separar</span>
                        </button>
                      )}
                      {activeVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteVariantById(v.id)}
                          className="text-[10px] text-red-500 hover:text-red-400 font-mono font-bold hover:underline cursor-pointer"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
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
                        value={v.quantity || 1}
                        onChange={(e) => onUpdateVariantById(v.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Rareza:
                      </label>
                      <PremiumDropdown
                        value={v.is_proxy ? 'Proxy' : (v.rarity || 'Common')}
                        onChange={(val) => {
                          if (val === 'Proxy') {
                            onUpdateVariantById(v.id, { is_proxy: true, rarity: 'Proxy' });
                          } else {
                            onUpdateVariantById(v.id, { is_proxy: false, rarity: val });
                          }
                        }}
                        align="full"
                        size="sm"
                        options={[
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
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Condición:
                      </label>
                      <PremiumDropdown
                        value={v.condition || 'Near Mint'}
                        onChange={(val) => onUpdateVariantById(v.id, { condition: val as UserCard['condition'] })}
                        align="full"
                        size="sm"
                        options={[
                          { value: 'Near Mint', label: 'Near Mint (NM)' },
                          { value: 'Lightly Played', label: 'Lightly Played (LP)' },
                          { value: 'Moderately Played', label: 'Moderately Played (MP)' },
                          { value: 'Heavily Played', label: 'Heavily Played (HP)' },
                          { value: 'Damaged', label: 'Damaged (DMG)' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                        Funda / Sleeving:
                      </label>
                      <PremiumDropdown
                        value={v.sleeve_type || 'none'}
                        onChange={(val) => onUpdateVariantById(v.id, { sleeve_type: val as UserCard['sleeve_type'] })}
                        align="full"
                        size="sm"
                        options={[
                          { value: 'none', label: 'Sin Funda' },
                          { value: 'single', label: 'Funda Simple' },
                          { value: 'double', label: 'Funda Doble' },
                          { value: 'triple', label: 'Funda Triple' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onAddNewVariant}
              className="w-full py-2 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>➕ Añadir variante / rareza diferente</span>
            </button>
          </div>
        )}
      </div>

      {/* Destino / Status flag */}
      <div>
        <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          Destino / Clasificación
        </label>
        <PremiumDropdown
          value={selectedUserCard.status_flag || 'collection'}
          onChange={(val) => onUpdateCard({ status_flag: val as UserCard['status_flag'] })}
          align="full"
          size="md"
          options={[
            { value: 'collection', label: 'Colección Permanente' },
            { value: 'trade_sale', label: 'Venta / Trade' },
            { value: 'bulk', label: 'Bulk (Sobrantes)' },
            { value: 'workshop', label: 'Taller / Decks Activos' },
          ]}
        />
      </div>

      {/* Carril / Compartimento */}
      {location?.compartments && location.compartments.count > 1 && (
        <div>
          <label className="text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Carril / Compartimento</span>
          </label>
          <PremiumDropdown
            value={selectedUserCard.compartment_index ?? 0}
            onChange={(val) => onUpdateCard({ compartment_index: val })}
            align="full"
            size="md"
            options={location.compartments.names.map((compName, idx) => ({
              value: idx,
              label: `📦 ${compName || `Carril ${idx + 1}`}`,
            }))}
          />
        </div>
      )}

      {/* Mover todas las copias del contenedor */}
      <div>
        <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          Mover todas las copias de este contenedor
        </label>
        <PremiumDropdown
          value={selectedUserCard.storage_location_id || 'inbox'}
          onChange={(val) => onMoveCard(val)}
          align="full"
          size="md"
          options={[
            { value: 'inbox', label: '📥 Bandeja Sin Clasificar (Inbox)' },
            ...locations.map((loc) => ({
              value: loc.id,
              label: `📦 ${loc.name} (${loc.type})`,
            })),
          ]}
        />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-[10.5px] font-mono font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          Notas adicionales
        </label>
        <input
          type="text"
          value={selectedUserCard.notes || ''}
          onChange={(e) => onUpdateCard({ notes: e.target.value })}
          placeholder="1st edition, foil bleed, etc."
          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-red-500 focus:outline-none shadow-2xs"
        />
      </div>

      {/* Botones de Acción: Enviar a Pendiente & Eliminar */}
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
        {location?.type === 'binder' && (
          <button
            type="button"
            onClick={onSendToStaged}
            disabled={!selectedUserCard.binder_page && !selectedUserCard.binder_slot}
            className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:hover:bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:text-amber-500 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs min-h-11 touch-manipulation"
            title={
              !selectedUserCard.binder_page && !selectedUserCard.binder_slot
                ? 'Esta carta ya está en la bandeja de pendientes'
                : 'Quitar del slot asignado y enviar a pendientes'
            }
          >
            <Inbox className="w-4 h-4" />
            <span>Enviar a Pendiente</span>
          </button>
        )}
        <button
          type="button"
          onClick={onDeleteCard}
          className={`${location?.type === 'binder' ? 'flex-1' : 'w-full'} py-2.5 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs min-h-11 touch-manipulation`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar de Colección</span>
        </button>
      </div>
    </div>
  );
};
