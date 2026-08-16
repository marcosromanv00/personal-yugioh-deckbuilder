import React from 'react';
import { RefreshCw } from 'lucide-react';
import { StorageLocation, Deck } from '@/types/collection';
import { StorageContainerCard, AddContainerCard } from '../StorageContainerCard';

interface ContainersTabProps {
  loading: boolean;
  locations: StorageLocation[];
  decks: Deck[];
  handleOpenContainer: (loc: StorageLocation) => void;
  handleEditContainerClick: (loc: StorageLocation) => void;
  handleCopyStorage: (loc: StorageLocation) => Promise<void>;
  handleDeleteStorage: (id: string) => Promise<void>;
  handleDropDeck: (deckId: string, locationId: string | null) => Promise<void>;
  handleNewContainerClick: () => void;
  onDeckClick?: (deck: Deck) => void;
}

/**
 * ContainersTab Component
 * Renders the dashboard view with all user-defined physical card containers (Binders, Boxes, etc).
 */
export const ContainersTab: React.FC<ContainersTabProps> = ({
  loading,
  locations,
  decks,
  handleOpenContainer,
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
        <p className="text-xs font-mono text-slate-500">Cargando contenedores...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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

      <AddContainerCard onClick={handleNewContainerClick} />
    </div>
  );
};
