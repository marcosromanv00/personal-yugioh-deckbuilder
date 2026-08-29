'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Heart, 
  Trash2, 
  Scissors, 
  Box, 
  Shield, 
  Layers, 
  BookOpen, 
  ExternalLink,
  MapPin,
  Check,
  RotateCcw,
  Sparkles,
  Tag,
  FileText
} from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { getCategoryBadgeStyle, getLanguageDisplay } from '@/lib/collectionUtils';
import { getSleeveColorHex } from '@/lib/sleeves';
import { PremiumDropdown } from '@/components/ui/PremiumDropdown';
import { DuplicateMatchInfo } from '@/lib/collectionSuggestions';

interface CollectionCardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCard: UserCard | null;
  locations: StorageLocation[];
  decks?: Deck[];
  onToggleFavorite: (uc: UserCard) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onMoveLocation?: (id: string, locationId: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenSplitModal?: (card?: UserCard) => void;
  onOpenContainer?: (loc: StorageLocation) => void;
  duplicateInfo?: DuplicateMatchInfo;
}

export const CollectionCardDetailModal: React.FC<CollectionCardDetailModalProps> = ({
  isOpen,
  onClose,
  userCard,
  locations,
  decks = [],
  onToggleFavorite,
  onUpdateStatus,
  onMoveLocation,
  onDelete,
  onOpenSplitModal,
  onOpenContainer,
  duplicateInfo,
}) => {
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !userCard) return null;

  const cardDetails = userCard.card_details;
  const storedLocation = locations.find(l => l.id === userCard.storage_location_id);
  const category = getCategoryBadgeStyle(userCard.status_flag);
  const lang = getLanguageDisplay(userCard.language);

  const statusOptions = [
    { value: 'collection', label: '📦 Mi Colección (Físico)' },
    { value: 'in_deck', label: '🃏 Asignada a Baraja (En Deck)' },
    { value: 'trade_sale', label: '🤝 Intercambio / Venta' },
    { value: 'workshop', label: '🛠️ Mesa de Taller / Testeo' },
    { value: 'bulk', label: '📦 Lote / Bulk' },
    { value: 'memory_deck', label: '✨ Deck Histórico / Recuerdo' },
  ];

  const locationOptions = [
    { value: 'inbox', label: '📥 Inbox (Sin clasificar)' },
    ...locations.map(loc => ({
      value: loc.id,
      label: `📦 ${loc.name} (${loc.type})`,
    })),
  ];

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(userCard.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLocationChange = async (newLocId: string) => {
    if (!onMoveLocation) return;
    setIsUpdatingLocation(true);
    try {
      await onMoveLocation(userCard.id, newLocId === 'inbox' ? null : newLocId);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const banlistTCG = cardDetails?.ban_tcg || 'Unlimited';
  const banlistMD = cardDetails?.ban_master_duel || 'Unlimited';
  const banlistDL = cardDetails?.ban_duel_links || 'Unlimited';

  const getBanlistColor = (status: string) => {
    switch (status) {
      case 'Forbidden':
      case 'Banned':
        return 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50';
      case 'Limited':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50';
      case 'Semi-Limited':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/50';
      default:
        return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[92vh] text-zinc-900 dark:text-zinc-100"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* COLUMNA IZQUIERDA: Arte de la Carta + Estados de Banlist + Favorito */}
          <div className="md:w-5/12 bg-zinc-50 dark:bg-zinc-950 p-5 sm:p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="w-full flex-1 flex flex-col items-center justify-center">
              {/* Imagen de la Carta */}
              <div 
                className="relative rounded-2xl overflow-hidden shadow-xl max-w-56 sm:max-w-64 transition-transform hover:scale-[1.02]"
                style={
                  userCard.sleeve_type && userCard.sleeve_type !== 'none' && userCard.sleeve_color
                    ? { borderColor: getSleeveColorHex(userCard.sleeve_color), borderWidth: '3px', borderStyle: 'solid' }
                    : undefined
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardDetails?.image_url || cardDetails?.image_url_small || `https://images.ygoprodeck.com/images/cards/${userCard.card_id}.jpg`}
                  alt={cardDetails?.name || 'Yu-Gi-Oh! Card'}
                  className="w-full h-auto object-contain rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg';
                  }}
                />

                {/* Badge de Proxy */}
                {userCard.is_proxy && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded shadow-md uppercase">
                    PROXY
                  </span>
                )}

                {/* Badge de Cantidad de Copias */}
                {userCard.quantity > 1 && (
                  <span className="absolute top-2 right-2 bg-zinc-950/90 text-white font-mono text-xs font-black px-2 py-0.5 rounded-lg shadow-md border border-zinc-700">
                    x{userCard.quantity}
                  </span>
                )}
              </div>

              {/* Botón Favorito Flotante */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => onToggleFavorite(userCard)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    userCard.is_favorite
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-900/50 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${userCard.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{userCard.is_favorite ? 'Favorita' : 'Marcar Favorita'}</span>
                </button>
              </div>
            </div>

            {/* Formatos y Banlist */}
            <div className="w-full mt-4 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block text-center">
                Estado en Formatos (Banlist)
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className={`p-1.5 rounded-xl border flex flex-col justify-between ${getBanlistColor(banlistTCG)}`}>
                  <span className="text-[8.5px] font-black uppercase tracking-wider">TCG</span>
                  <span className="text-[9.5px] font-bold truncate mt-0.5">{banlistTCG}</span>
                </div>
                <div className={`p-1.5 rounded-xl border flex flex-col justify-between ${getBanlistColor(banlistMD)}`}>
                  <span className="text-[8.5px] font-black uppercase tracking-wider">Master Duel</span>
                  <span className="text-[9.5px] font-bold truncate mt-0.5">{banlistMD}</span>
                </div>
                <div className={`p-1.5 rounded-xl border flex flex-col justify-between ${getBanlistColor(banlistDL)}`}>
                  <span className="text-[8.5px] font-black uppercase tracking-wider">Duel Links</span>
                  <span className="text-[9.5px] font-bold truncate mt-0.5">{banlistDL}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Datos Técnicos, Inventario Físico y Acciones */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-5 scrollbar-thin">
            <div className="space-y-4">
              
              {/* Encabezado y Tipo */}
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase">
                    {cardDetails?.type || 'Carta'}
                  </span>
                  {cardDetails?.archetype && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                      {cardDetails.archetype}
                    </span>
                  )}
                  {cardDetails?.attribute && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {cardDetails.attribute}
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 font-display leading-tight">
                  {cardDetails?.name || `Carta #${userCard.card_id}`}
                </h2>

                {/* Stats de Monstruo (ATK / DEF / Level) */}
                {(cardDetails?.atk !== undefined || cardDetails?.level !== undefined) && (
                  <div className="flex items-center gap-3 text-xs font-mono font-bold mt-1.5 text-zinc-600 dark:text-zinc-400">
                    {cardDetails.level !== undefined && (
                      <span>★ Nivel/Rango: <b className="text-zinc-900 dark:text-zinc-100">{cardDetails.level}</b></span>
                    )}
                    {cardDetails.atk !== undefined && (
                      <span>ATK: <b className="text-zinc-900 dark:text-zinc-100">{cardDetails.atk}</b></span>
                    )}
                    {cardDetails.def !== undefined && (
                      <span>DEF: <b className="text-zinc-900 dark:text-zinc-100">{cardDetails.def}</b></span>
                    )}
                  </div>
                )}
              </div>

              {/* Descripción / Efecto de la Carta */}
              {cardDetails?.desc && (
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed max-h-36 overflow-y-auto scrollbar-thin">
                  {cardDetails.desc}
                </div>
              )}

              {/* ═══ DATOS DEL INVENTARIO FÍSICO ═══ */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Propiedades Físicas en Colección
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div>
                    <span className="text-zinc-400 text-[10px] block">Rareza:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{userCard.rarity || 'Common'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">Estado:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{userCard.condition || 'Near Mint'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">Idioma:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{lang.flag} {lang.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">Funda (Sleeve):</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                      {userCard.sleeve_type && userCard.sleeve_type !== 'none' ? `${userCard.sleeve_color || ''} (${userCard.sleeve_type})` : 'Sin funda'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">Copias Registradas:</span>
                    <span className="font-black text-red-600 dark:text-red-400">x{userCard.quantity}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[10px] block">ID Base de Datos:</span>
                    <span className="font-bold text-zinc-500">#{userCard.card_id}</span>
                  </div>
                </div>

                {userCard.notes && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                    <span className="text-[10px] font-mono text-zinc-400 block">Notas:</span>
                    <p className="text-zinc-700 dark:text-zinc-300 italic">{userCard.notes}</p>
                  </div>
                )}
              </div>

              {/* ═══ SELECTORES DE GESTIÓN RÁPIDA ═══ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Selector de Ubicación */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>Ubicación de Almacén</span>
                  </label>
                  <PremiumDropdown
                    value={userCard.storage_location_id || 'inbox'}
                    onChange={handleLocationChange}
                    options={locationOptions}
                    disabled={isUpdatingLocation}
                  />
                </div>

                {/* Selector de Destino / Estado */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-cyan-500" />
                    <span>Destino / Categoría</span>
                  </label>
                  <PremiumDropdown
                    value={userCard.status_flag || 'collection'}
                    onChange={handleStatusChange}
                    options={statusOptions}
                    disabled={isUpdatingStatus}
                  />
                </div>
              </div>
            </div>

            {/* ═══ BOTONERA INFERIOR DE ACCIONES ═══ */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Separar Copias (si tiene más de 1) */}
                {userCard.quantity > 1 && onOpenSplitModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSplitModal(userCard);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                    title="Separar una o más copias a un registro independiente"
                  >
                    <Scissors className="w-3.5 h-3.5 text-amber-500" />
                    <span>Separar Copias</span>
                  </button>
                )}

                {/* Ir al contenedor directo */}
                {storedLocation && onOpenContainer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenContainer(storedLocation);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Abrir Contenedor</span>
                  </button>
                )}
              </div>

              {/* Botón Eliminar Carta */}
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await onDelete(userCard.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold transition-all cursor-pointer ml-auto"
                title="Eliminar esta carta del inventario"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
