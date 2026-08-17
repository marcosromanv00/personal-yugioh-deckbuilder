import React from 'react';
import { RefreshCw } from 'lucide-react';
import { StorageLocation, Deck } from '@/types/collection';
import { StorageContainerCard, AddContainerCard, UnclassifiedContainerCard } from '../StorageContainerCard';

interface ContainersTabProps {
  loading: boolean;
  locations: StorageLocation[];
  decks: Deck[];
  inboxCount: number;
  handleOpenContainer: (loc: StorageLocation) => void;
  handleOpenInbox: () => void;
  handleOrganizeInbox?: () => void;
  handleEditContainerClick: (loc: StorageLocation) => void;
  handleCopyStorage: (loc: StorageLocation) => Promise<void>;
  handleDeleteStorage: (id: string) => Promise<void>;
  handleDropDeck: (deckId: string, locationId: string | null) => Promise<void>;
  handleNewContainerClick: () => void;
  onDeckClick?: (deck: Deck) => void;
}

/**
 * ContainersTab Component
 * Renders the dashboard view with all user-defined physical card containers (Binders, Boxes, etc)
 * along with a fixed Unclassified Inbox card in the first position.
 */
export const ContainersTab: React.FC<ContainersTabProps> = ({
  loading,
  locations,
  decks,
  inboxCount,
  handleOpenContainer,
  handleOpenInbox,
  handleOrganizeInbox,
  handleEditContainerClick,
  handleCopyStorage,
  handleDeleteStorage,
  handleDropDeck,
  handleNewContainerClick,
  onDeckClick,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mb-2" />
        <p className="text-xs font-mono text-zinc-500">Cargando contenedores...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* 1. Posición fija para Slot Sin Clasificar (Inbox) */}
      <UnclassifiedContainerCard
        inboxCount={inboxCount}
        onClick={handleOpenInbox}
        onOrganizeClick={handleOrganizeInbox}
      />

      {/* 2. Contenedores del usuario (Binders, Latas, Cajas, Deckboxes) */}
      {locations.map((loc) => (
        <StorageContainerCard
          key={loc.id}
          location={loc}
          decks={decks}
          onClick={handleOpenContainer}
          onEdit={handleEditContainerClick}
          onCopy={handleCopyStorage}
          onDelete={handleDeleteStorage}
          onDropDeck={handleDropDeck}
          onDeckClick={onDeckClick}
        />
      ))}

      {/* 3. Slot para crear nuevo contenedor */}
      <AddContainerCard onClick={handleNewContainerClick} />
    </div>
  );
};
