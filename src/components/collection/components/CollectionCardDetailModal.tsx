'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { DuplicateMatchInfo } from '@/lib/collectionSuggestions';
import { CollectionCardArtworkCol } from './CollectionCardArtworkCol';
import { CollectionCardPropertiesForm } from './CollectionCardPropertiesForm';
import { CollectionCardActionsBar } from './CollectionCardActionsBar';

interface CollectionCardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCard: UserCard | null;
  locations: StorageLocation[];
  decks?: Deck[];
  onToggleFavorite: (uc: UserCard) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onMoveLocation?: (id: string, locationId: string | null) => Promise<void>;
  onUpdateUserCard?: (id: string, fields: Partial<UserCard>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenSplitModal?: (card?: UserCard) => void;
  onOpenContainer?: (loc: StorageLocation) => void;
  duplicateInfo?: DuplicateMatchInfo;
}

interface CollectionCardDetailDialogProps {
  onClose: () => void;
  userCard: UserCard;
  locations: StorageLocation[];
  decks?: Deck[];
  onToggleFavorite: (uc: UserCard) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onMoveLocation?: (id: string, locationId: string | null) => Promise<void>;
  onUpdateUserCard?: (id: string, fields: Partial<UserCard>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenSplitModal?: (card?: UserCard) => void;
  onOpenContainer?: (loc: StorageLocation) => void;
}

const CollectionCardDetailDialog: React.FC<CollectionCardDetailDialogProps> = ({
  onClose,
  userCard,
  locations,
  decks = [],
  onToggleFavorite,
  onUpdateStatus,
  onMoveLocation,
  onUpdateUserCard,
  onDelete,
  onOpenSplitModal,
  onOpenContainer,
}) => {
  const [localCard, setLocalCard] = useState<UserCard>(userCard);
  const [isSaving, setIsSaving] = useState(false);

  const storedLocation = locations.find((l) => l.id === localCard.storage_location_id);

  const handleUpdateField = async (fields: Partial<UserCard>) => {
    setLocalCard((prev) => ({ ...prev, ...fields }));
    setIsSaving(true);
    try {
      if (onUpdateUserCard) {
        await onUpdateUserCard(localCard.id, fields);
      } else {
        await fetch('/api/collection/cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: localCard.id, ...fields }),
        });
      }
      if (fields.status_flag && fields.status_flag !== localCard.status_flag) {
        onUpdateStatus(localCard.id, fields.status_flag);
      }
      if (fields.storage_location_id !== undefined && onMoveLocation) {
        onMoveLocation(localCard.id, fields.storage_location_id);
      }
    } catch (err) {
      console.error('Error al actualizar carta:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="relative w-full max-w-5xl xl:max-w-6xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col lg:flex-row max-h-[92vh] text-zinc-900 dark:text-zinc-100"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Columna Izquierda: Arte, Banlist & Favorito */}
        <CollectionCardArtworkCol
          userCard={localCard}
          onToggleFavorite={async (uc) => {
            await onToggleFavorite(uc);
            setLocalCard((prev) => ({ ...prev, is_favorite: !prev.is_favorite }));
          }}
        />

        {/* Columna Derecha: Formulario de Propiedades y Acciones */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-4 scrollbar-thin">
          <CollectionCardPropertiesForm
            userCard={localCard}
            locations={locations}
            decks={decks}
            onUpdateField={handleUpdateField}
            isSaving={isSaving}
          />

          <CollectionCardActionsBar
            userCard={localCard}
            storedLocation={storedLocation}
            onOpenSplitModal={onOpenSplitModal}
            onOpenContainer={onOpenContainer}
            onDelete={onDelete}
            onClose={onClose}
            isSaving={isSaving}
          />
        </div>
      </motion.div>
    </div>
  );
};

export const CollectionCardDetailModal: React.FC<CollectionCardDetailModalProps> = ({
  isOpen,
  onClose,
  userCard,
  locations,
  decks = [],
  onToggleFavorite,
  onUpdateStatus,
  onMoveLocation,
  onUpdateUserCard,
  onDelete,
  onOpenSplitModal,
  onOpenContainer,
}) => {
  if (!isOpen || !userCard) return null;

  return (
    <AnimatePresence>
      <CollectionCardDetailDialog
        key={userCard.id}
        userCard={userCard}
        onClose={onClose}
        locations={locations}
        decks={decks}
        onToggleFavorite={onToggleFavorite}
        onUpdateStatus={onUpdateStatus}
        onMoveLocation={onMoveLocation}
        onUpdateUserCard={onUpdateUserCard}
        onDelete={onDelete}
        onOpenSplitModal={onOpenSplitModal}
        onOpenContainer={onOpenContainer}
      />
    </AnimatePresence>
  );
};
