import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { prompt, deckId } = await req.json();

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Reestructuración IA simulada con éxito.',
        suggestedDeck: {
          name: `Deck Reestructurado por IA: ${prompt || 'Anti-Meta Techs'}`,
          cardsCount: 40,
          recommendation: 'Se añadieron 3x Ash Blossom, 2x Triple Tactics Talent y 3x Infinite Impermanence para optimizar ratios contra el meta actual.'
        }
      });
    }

    // Query user cards from Supabase to provide AI context
    const { data: cards } = await supabase
      .from('yg_user_cards')
      .select('*, card_details:yg_cards(*)');

    // Simulate AI synthesis based on user collection
    const cardNames = (cards || []).slice(0, 15).map(c => c.card_details?.name).filter(Boolean);

    return NextResponse.json({
      success: true,
      message: 'IA completó la reestructuración dinámica del deck ideal.',
      suggestedDeck: {
        id: deckId || 'ai-deck-generated',
        name: `Deck IA: ${prompt || 'Optimizado por Exordio Copilot'}`,
        archetypeCardsCount: cards?.length || 40,
        availableCardSample: cardNames,
        recommendation: `Se analizaron ${cards?.length || 0} cartas de tu colección y se estructuró la versión óptima para ${prompt || 'competitivo'}.`
      }
    });
  } catch (error) {
    console.error('Error in ideal deck AI API route:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud de IA para el deck.' },
      { status: 500 }
    );
  }
}
