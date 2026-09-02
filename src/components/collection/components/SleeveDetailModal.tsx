'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Search, 
  Layers, 
  Package, 
  PackagePlus, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { SleeveInventory, UserCard, Deck, StorageLocation } from '@/types/collection';
import { CardImage } from '@/components/ui/CardImage';

interface TrackedCardItem {
  key: string;
  card_id: number;
  name: string;
  type?: string;
  image_url?: string;
  image_url_small?: string;
  count: number;
  sourceType: 'deck' | 'container' | 'inbox';
  sourceName: string;
  sectionOrSlot?: string;
  rarity?: string;
}

interface SleeveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleeve: SleeveInventory | null;
  allUserCards?: UserCard[];
  decks?: Deck[];
  locations?: StorageLocation[];
  onEdit?: (sleeve: SleeveInventory) => void;
  onAddStock?: (sleeve: SleeveInventory) => void;
}

const SIZE_LABELS: Record<string, string> = {
  standard: 'Estándar',
  'mini-japanese': 'Mini Japonesas',
  european: 'Europeas',
};

const CONDITION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Nuevas', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  good: { label: 'Buenas', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  worn: { label: 'Desgastadas', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
};

export const SleeveDetailModal: React.FC<SleeveDetailModalProps> = ({
  isOpen,
  onClose,
  sleeve,
  allUserCards = [],
  decks = [],
  locations = [],
  onEdit,
  onAddStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'deck' | 'collection'>('all');

  // Resolver todas las cartas individuales que usan esta funda
  const trackedCards = useMemo(() => {
    if (!sleeve) return [];
    const items: TrackedCardItem[] = [];

    // 1. Cartas de Mazos que tienen asignada esta funda
    for (const deck of decks) {
      const deckSleeves = deck.sleeves || [];
      const assignedSections: string[] = [];

      for (const ds of deckSleeves) {
        const sId = (ds as { sleeve_id?: string }).sleeve_id;
        const sSec = (ds as { section_type?: string; section?: string }).section_type || (ds as { section?: string }).section;
        if (sId === sleeve.id && sSec) {
          assignedSections.push(sSec);
        }
      }

      if (assignedSections.length === 0) continue;

      const deckCards = deck.cards || [];
      for (const dc of deckCards) {
        let matchesSection = false;
        const isMainOrSide = dc.section === 'main' || dc.section === 'side';
        const isExtra = dc.section === 'extra';
        const isPool = dc.section === 'extras' || dc.section === 'pool' || dc.section === 'skill';

        if (isMainOrSide && assignedSections.some(s => s.startsWith('main'))) {
          matchesSection = true;
        } else if (isExtra && assignedSections.some(s => s.startsWith('extra'))) {
          matchesSection = true;
        } else if (isPool && assignedSections.some(s => s.startsWith('pool') || s.startsWith('extras'))) {
          matchesSection = true;
        }

        if (matchesSection) {
          items.push({
            key: `deck-${deck.id}-${dc.card_id}-${dc.section}`,
            card_id: dc.card_id,
            name: dc.card_details?.name || `Carta #${dc.card_id}`,
            type: dc.card_details?.type,
            image_url: dc.card_details?.image_url,
            image_url_small: dc.card_details?.image_url_small || dc.card_details?.image_url,
            count: dc.count,
            sourceType: 'deck',
            sourceName: deck.name,
            sectionOrSlot: dc.section.toUpperCase(),
          });
        }
      }
    }

    // 2. Cartas sueltas de la colección asignadas con esta funda (directa por ID o marca/color)
    for (const uc of allUserCards) {
      // Ignorar si ya está asociada a un deck (ya procesada arriba)
      if (uc.deck_id) continue;

      const isDirectIdMatch = uc.sleeve_fit_id === sleeve.id || uc.sleeve_regular_id === sleeve.id || uc.sleeve_over_id === sleeve.id;
      const matchesBrand = uc.sleeve_brand && uc.sleeve_brand.toLowerCase() === sleeve.brand.toLowerCase();
      const matchesColor = uc.sleeve_color && uc.sleeve_color.toLowerCase() === sleeve.color_pattern.toLowerCase();
      const isBrandColorMatch = matchesBrand && matchesColor && uc.sleeve_type && uc.sleeve_type !== 'none';

      if (isDirectIdMatch || isBrandColorMatch) {
        const locName = uc.storage_location_id
          ? locations.find((l) => l.id === uc.storage_location_id)?.name || 'Contenedor'
          : 'Inbox Sin Clasificar';

        items.push({
          key: `usercard-${uc.id}`,
          card_id: uc.card_id,
          name: uc.card_details?.name || `Carta #${uc.card_id}`,
          type: uc.card_details?.type,
          image_url: uc.card_details?.image_url,
          image_url_small: uc.card_details?.image_url_small || uc.card_details?.image_url,
          count: uc.quantity || 1,
          sourceType: uc.storage_location_id ? 'container' : 'inbox',
          sourceName: locName,
          rarity: uc.rarity,
          sectionOrSlot: uc.binder_page ? `Pág. ${uc.binder_page}` : undefined,
        });
      }
    }

    return items;
  }, [sleeve, decks, allUserCards, locations]);

  // Filtrar cartas según búsqueda y selector
  const filteredTrackedCards = useMemo(() => {
    return trackedCards.filter((card) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || card.name.toLowerCase().includes(q) || card.sourceName.toLowerCase().includes(q);
      const matchesSource =
        sourceFilter === 'all'
          ? true
          : sourceFilter === 'deck'
          ? card.sourceType === 'deck'
          : card.sourceType === 'container' || card.sourceType === 'inbox';
      return matchesQuery && matchesSource;
    });
  }, [trackedCards, searchQuery, sourceFilter]);

  if (!isOpen || !sleeve) return null;

  const totalCardsTracked = trackedCards.reduce((acc, c) => acc + c.count, 0);
  const qtyTotal = sleeve.quantity_total || 0;
  const qtyUsedInDecks = sleeve.quantity_used || 0;
  const available = sleeve.quantity_available ?? Math.max(0, qtyTotal - qtyUsedInDecks);
  const cond = CONDITION_LABELS[sleeve.condition] || CONDITION_LABELS.good;

  // Auditoría: Comparación entre cartas encontradas vs cantidad registrada como usada
  const hasDiscrepancy = totalCardsTracked !== qtyUsedInDecks;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Top Decorative Stripe */}
          <div
            className="h-3 w-full shrink-0 shadow-xs"
            style={{ backgroundColor: sleeve.color_hex || '#1a1a2e' }}
          />

          {/* Header Section */}
          <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl border-2 border-white dark:border-zinc-800 shadow-md flex items-center justify-center shrink-0 relative overflow-hidden"
                style={{ backgroundColor: sleeve.color_hex || '#1a1a2e' }}
              >
                <Shield className="w-6 h-6 text-white/90 drop-shadow-md" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 truncate">
                    {sleeve.name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      sleeve.category === 'fit'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : sleeve.category === 'over'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {sleeve.category === 'fit' ? '🟢 Fit (Inner)' : sleeve.category === 'over' ? '✨ Oversleeve' : '🎴 Regular'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cond.bg} ${cond.color}`}>
                    {cond.label}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
                  {sleeve.brand} • {sleeve.color_pattern} • {SIZE_LABELS[sleeve.size_type] || sleeve.size_type}
                </p>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {onAddStock && (
                <button
                  type="button"
                  onClick={() => onAddStock(sleeve)}
                  className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-10 touch-manipulation"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Añadir Stock</span>
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onEdit(sleeve);
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                  title="Editar funda"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center touch-manipulation"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Bar & Audit Banner */}
          <div className="px-4 sm:px-6 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">Total en Inventario</span>
              <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{qtyTotal}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">Fundas Libres</span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{available}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">En Uso Registrado</span>
              <span className="text-base font-black font-mono text-red-600 dark:text-red-400">{qtyUsedInDecks}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">Cartas Trackeadas</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {totalCardsTracked}
                </span>
                {!hasDiscrepancy ? (
                  <span title="Auditoría correcta: todas las fundas coinciden con cartas físicas">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </span>
                ) : (
                  <span title="Discrepancia detectada: número de cartas físicas difiere de fundas registradas">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Audit Notification if discrepancy */}
          {hasDiscrepancy && (
            <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center gap-2.5 text-xs font-mono text-amber-800 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Auditoría de Fundas:</strong> Se detectaron {totalCardsTracked} cartas físicas enfundadas pero el registro de mazos marca {qtyUsedInDecks} fundas en uso (diferencia de {Math.abs(totalCardsTracked - qtyUsedInDecks)}).
              </span>
            </div>
          )}

          {/* Filter & Search Toolbar */}
          <div className="p-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
            {/* Buscador interno */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar carta por nombre o mazo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Selector de origen */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
              {(
                [
                  { id: 'all', label: 'Todas' },
                  { id: 'deck', label: '🃏 En Mazos' },
                  { id: 'collection', label: '📦 Colección' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSourceFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    sourceFilter === tab.id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Tracked Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-60">
            {filteredTrackedCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                <Layers className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3 stroke-[1.5]" />
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {searchQuery ? 'No se encontraron cartas con ese término' : 'No hay cartas asignadas a esta funda'}
                </h4>
                <p className="text-xs font-mono text-zinc-500 mt-1 max-w-sm">
                  {searchQuery
                    ? 'Prueba modificando la búsqueda o cambiando el filtro de origen.'
                    : 'Asigna esta funda a un mazo en el Taller de Mazos o configúrala en tus cartas individuales para verlas aquí.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {filteredTrackedCards.map((card) => (
                  <div
                    key={card.key}
                    className="group relative bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 rounded-2xl p-2 flex flex-col justify-between shadow-2xs transition-all"
                  >
                    {/* Card Thumbnail */}
                    <div className="relative aspect-421/614 w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-2">
                      <CardImage
                        src={card.image_url_small || card.image_url || ''}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {/* Count Badge */}
                      {card.count > 1 && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-zinc-950/80 text-white rounded-md text-[10px] font-black font-mono shadow-xs">
                          x{card.count}
                        </span>
                      )}
                      {/* Section Badge */}
                      {card.sectionOrSlot && (
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-red-600/90 text-white rounded-md text-[9px] font-black font-mono uppercase shadow-xs">
                          {card.sectionOrSlot}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate line-clamp-1" title={card.name}>
                        {card.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-full">
                          {card.sourceType === 'deck' ? `🃏 ${card.sourceName}` : `📦 ${card.sourceName}`}
                        </span>
                      </div>
                      {card.rarity && (
                        <span className="inline-block text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900/30 truncate">
                          {card.rarity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:px-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500 shrink-0">
            <span>
              Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{filteredTrackedCards.length}</strong> cartas de <strong className="text-red-600 dark:text-red-400">{trackedCards.length}</strong> enfundadas
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer min-h-10 touch-manipulation"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
