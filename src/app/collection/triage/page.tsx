'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import { TriageWorkstation } from '@/components/collection/triage/TriageWorkstation';

function TriagePageInner() {
  const searchParams = useSearchParams();
  const initialLocationId = searchParams.get('location_id');
  const initialCompartmentParam = searchParams.get('compartment');
  const initialCompartmentIndex = initialCompartmentParam !== null ? parseInt(initialCompartmentParam, 10) : null;

  const [cards, setCards] = useState<UserCard[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTriageData() {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar en paralelo: Cartas con descripción completa, Contenedores y Mazos
        const [cardsRes, locationsRes, decksRes] = await Promise.all([
          fetch('/api/collection/cards?include_desc=true').then(r => r.json()),
          fetch('/api/collection/storage').then(r => r.json()),
          fetch('/api/decks').then(r => r.json()),
        ]);

        if (!isMounted) return;

        const loadedCards = Array.isArray(cardsRes?.data) ? cardsRes.data : [];
        const loadedLocations = Array.isArray(locationsRes?.data) ? locationsRes.data : [];
        const loadedDecks = Array.isArray(decksRes?.data) ? decksRes.data : [];

        setCards(loadedCards);
        setLocations(loadedLocations);
        setDecks(loadedDecks);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error cargando datos de la colección');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTriageData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 gap-3 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="text-xs">Cargando Mesa de Triaje y Colección...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 text-red-600 dark:text-red-400 gap-3 p-4 text-center">
        <AlertCircle className="w-10 h-10" />
        <h2 className="text-sm font-bold font-mono">No se pudo cargar la estación de triaje</h2>
        <p className="text-xs text-zinc-500 max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold font-mono cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <TriageWorkstation
      initialCards={cards}
      locations={locations}
      decks={decks}
      initialLocationId={initialLocationId}
      initialCompartmentIndex={initialCompartmentIndex}
    />
  );
}

export default function TriagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-2" />
          <span>Iniciando Mesa de Triaje...</span>
        </div>
      }
    >
      <TriagePageInner />
    </Suspense>
  );
}
