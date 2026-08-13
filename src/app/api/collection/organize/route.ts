import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateStorageRecommendations } from '@/lib/storageRecommender';

export async function POST() {
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        recommendation: {
          proposals: [],
          summary: { totalAssigned: 0, assignedByStorage: {}, unassignedCount: 0 }
        }
      });
    }

    // 1. Obtener cartas sin clasificar (storage_location_id IS NULL)
    const { data: unsortedCards, error: cardsError } = await supabase
      .from('yg_user_cards')
      .select('*, card_details:yg_cards(*)')
      .is('storage_location_id', null);

    if (cardsError) throw cardsError;

    // 2. Obtener contenedores de almacenamiento disponibles
    const { data: locations, error: locsError } = await supabase
      .from('yg_storage_locations')
      .select('*');

    if (locsError) throw locsError;

    if (!unsortedCards || unsortedCards.length === 0) {
      return NextResponse.json({
        message: 'No hay cartas sin clasificar en la bandeja Inbox.',
        recommendation: {
          proposals: [],
          summary: { totalAssigned: 0, assignedByStorage: {}, unassignedCount: 0 }
        }
      });
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({
        error: 'No hay contenedores registrados. Por favor registra al menos un Binder, Lata o Caja primero.'
      }, { status: 400 });
    }

    // 3. Ejecutar algoritmo de recomendación
    const result = generateStorageRecommendations(unsortedCards, locations);

    return NextResponse.json({ recommendation: result });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al generar recomendación de organización:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar la organización recomendada' }, { status: 500 });
  }
}
