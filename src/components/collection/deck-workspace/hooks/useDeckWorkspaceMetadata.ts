import { useState, useMemo } from 'react';
import { Deck, UserCard, StorageLocation } from '@/types/collection';
import { saveDeckMetadataApi, fetchDeckDetailsApi, fetchUserCardsApi, fetchSleevesInventoryApi } from '../services/deckWorkspace.api';
import { useToast } from '@/components/ui/ToastProvider';

export function useDeckWorkspaceMetadata(
  initialDeck: Deck | null,
  locations: StorageLocation[],
  onSuccess?: () => void
) {
  const toast = useToast();
  const [currentDeck, setCurrentDeck] = useState<Deck | null>(initialDeck || null);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMutated, setHasMutated] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState('TCG');
  const [isActive, setIsActive] = useState(true);
  const [storageLocationId, setStorageLocationId] = useState<string>('');
  const [compartmentIndex, setCompartmentIndex] = useState<number>(0);
  const [savingDeck, setSavingDeck] = useState(false);
  const [savingDeckCards, setSavingDeckCards] = useState(false);

  const [initialFormState, setInitialFormState] = useState<Record<string, unknown> | null>(null);

  const handleSaveDeck = async (sleevesPayload: { sleeve_id: string; section: string }[]) => {
    if (!currentDeck) return;
    setSavingDeck(true);
    try {
      const payload = {
        name: name.trim() || currentDeck.name,
        format,
        is_active: isActive,
        storage_location_id: storageLocationId || null,
        compartment_index: compartmentIndex,
        storageLocationId: storageLocationId || null,
        compartmentIndex,
        sleeves: sleevesPayload,
      };

      const ok = await saveDeckMetadataApi(currentDeck.id, payload);
      if (!ok) throw new Error('Error al actualizar el deck');

      toast.success('Ficha técnica del mazo guardada correctamente');
      setHasMutated(true);
      setInitialFormState(payload);

      const [sleevesData, cardsData] = await Promise.all([fetchSleevesInventoryApi(), fetchUserCardsApi()]);
      if (cardsData.length) setUserCards(cardsData);
      if (onSuccess) onSuccess();
      return sleevesData;
    } catch (err) {
      console.error('Error al guardar el deck:', err);
      toast.error('No se pudo guardar la ficha técnica del deck');
      return null;
    } finally {
      setSavingDeck(false);
    }
  };

  return {
    currentDeck, setCurrentDeck,
    name, setName,
    format, setFormat,
    isActive, setIsActive,
    storageLocationId, setStorageLocationId,
    compartmentIndex, setCompartmentIndex,
    savingDeck, setSavingDeck,
    savingDeckCards, setSavingDeckCards,
    userCards, setUserCards,
    loading, setLoading,
    hasMutated, setHasMutated,
    initialFormState, setInitialFormState,
    handleSaveDeck,
  };
}
