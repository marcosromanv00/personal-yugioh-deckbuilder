'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Box, Check } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { getSleeveColorHex } from '@/lib/sleeves';
import { getCategoryBadgeStyle, getLanguageDisplay } from '@/lib/collectionUtils';
import { DuplicateCardAlertPopover } from '../DuplicateCardAlertPopover';
import { DuplicateMatchInfo } from '@/lib/collectionSuggestions';
import { GridCardGroup, MobileTab } from './types';

interface ContainerGridViewProps {
  filteredCards: UserCard[];
  paginatedGridCards: GridCardGroup[];
  selectedUserCard: UserCard | null;
  onSelectCard: (uc: UserCard) => void;
  isMobile: boolean;
  setMobileTab: (tab: MobileTab) => void;
  currentGridPage: number;
  setCurrentGridPage: React.Dispatch<React.SetStateAction<number>>;
  totalGridPages: number;
  isSelectMode?: boolean;
  selectedCardIds?: string[];
  onToggleSelectGroup?: (group: GridCardGroup) => void;
  duplicateMap?: Map<number, DuplicateMatchInfo>;
  onOpenConsolidate?: (cardId: number) => void;
}

export const ContainerGridView: React.FC<ContainerGridViewProps> = ({
  filteredCards,
  paginatedGridCards,
  selectedUserCard,
  onSelectCard,
  isMobile,
  setMobileTab,
  currentGridPage,
  setCurrentGridPage,
  totalGridPages,
  isSelectMode = false,
  selectedCardIds = [],
  onToggleSelectGroup,
  duplicateMap,
  onOpenConsolidate,
}) => {
  if (filteredCards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
        <Box className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-3" />
        <h3 className="text-sm font-black uppercase text-zinc-600 dark:text-zinc-300">
          No hay cartas en este contenedor
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Usa el panel izquierdo para buscar cartas individuales o importar un archivo .YDK / lista en bloque.
        </p>
      </div>
    );
  }

  const hasActiveSelection = isSelectMode || selectedCardIds.length > 0;

  return (
    <div className={`space-y-6 transition-all ${hasActiveSelection ? 'pb-28 sm:pb-32' : 'pb-4'}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
        {paginatedGridCards.map((group) => {
          const uc = group.representativeUserCard;
          const isInspected = selectedUserCard?.card_id === group.card_id;
          const isGroupSelected = group.allVariants.some(v => selectedCardIds.includes(v.id));
          const isSelected = isSelectMode ? isGroupSelected : isInspected;
          const sleeveColor = uc.sleeve_type !== 'none' && uc.sleeve_color ? getSleeveColorHex(uc.sleeve_color) : undefined;
          
          return (
            <motion.div
              key={`${group.card_id}_${group.compartment_index}`}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (isSelectMode) {
                  onToggleSelectGroup?.(group);
                } else {
                  onSelectCard(uc);
                  if (isMobile) setMobileTab('right');
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (isSelectMode) {
                  onToggleSelectGroup?.(group);
                } else {
                  onSelectCard(uc);
                  if (isMobile) setMobileTab('right');
                }
              }}
              className={`relative rounded-xl p-1.5 border transition-all cursor-pointer overflow-hidden group shadow-sm ${
                isSelected
                  ? 'border-red-500 bg-red-950/20 ring-2 ring-red-500/60 shadow-md'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
              style={{
                borderColor: isSelected ? undefined : sleeveColor,
              }}
            >
              <div className="aspect-3/4 rounded-lg overflow-hidden relative bg-zinc-950">
                {uc.card_details && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={uc.card_details.image_url_small || uc.card_details.image_url}
                    alt={uc.card_details.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Checkbox de Selección Múltiple o Indicador de Alerta de Duplicados */}
                {isSelectMode ? (
                  <div 
                    className={`absolute top-1 left-1 w-5 h-5 rounded-md flex items-center justify-center transition-all shadow-md z-10 ${
                      isGroupSelected
                        ? 'bg-red-600 text-white ring-1 ring-white/40 scale-105'
                        : 'bg-black/60 border border-white/50 text-transparent hover:border-white'
                    }`}
                  >
                    {isGroupSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                  </div>
                ) : (
                  <div className="absolute top-1 left-1 flex items-center gap-1 z-10">
                    {/* Alerta de Coincidencias en otros contenedores */}
                    {duplicateMap?.has(group.card_id) && (
                      <DuplicateCardAlertPopover
                        matchInfo={duplicateMap.get(group.card_id)}
                        onOpenConsolidate={onOpenConsolidate}
                        size="sm"
                      />
                    )}

                    {/* Badge de Proxy */}
                    {uc.is_proxy && (
                      <div className="bg-red-600 text-white font-mono text-[8px] px-1 py-0.5 rounded font-black uppercase shadow-xs">
                        Proxy
                      </div>
                    )}
                  </div>
                )}

                <div className="absolute top-1 right-1 bg-zinc-950/90 text-white font-mono text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 font-black shadow-xs">
                  {group.totalQuantity}x
                </div>
              </div>
              <div className="mt-1.5 px-1">
                <h4 className="text-[11px] font-black text-zinc-200 truncate group-hover:text-red-400 transition-colors">
                  {uc.card_details?.name || 'Carta'}
                </h4>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mt-0.5">
                  <span className="truncate">
                    {group.allVariants.length > 1 ? `${group.allVariants.length} Variantes` : (uc.rarity || 'Common')}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-zinc-400">
                    <span>{getLanguageDisplay(uc.language).flag}</span>
                    <span>{getLanguageDisplay(uc.language).badge}</span>
                  </span>
                </div>
                {/* Barra inferior de Categoría */}
                <div 
                  className={`w-full h-1 mt-1.5 rounded-full overflow-hidden shadow-2xs ${getCategoryBadgeStyle(uc.status_flag).barColorClass}`}
                  title={`Estado: ${getCategoryBadgeStyle(uc.status_flag).label} (${getCategoryBadgeStyle(uc.status_flag).description})`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Paginación de la grid */}
      {totalGridPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 font-mono text-xs">
          <button
            disabled={currentGridPage <= 1}
            onClick={() => setCurrentGridPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg disabled:opacity-40 cursor-pointer"
          >
            ← Anterior
          </button>
          <span className="text-zinc-500 dark:text-zinc-400">
            Página {currentGridPage} de {totalGridPages}
          </span>
          <button
            disabled={currentGridPage >= totalGridPages}
            onClick={() => setCurrentGridPage(p => Math.min(totalGridPages, p + 1))}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg disabled:opacity-40 cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};
