import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, cardIds, targetLocationId } = body as {
      category?: string;
      cardIds?: string[];
      targetLocationId?: string;
    };

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Modo demo / Supabase no configurado: Etapa simulada con éxito.'
      });
    }

    if (cardIds && cardIds.length > 0 && targetLocationId) {
      const { error } = await supabase
        .from('yg_user_cards')
        .update({ storage_location_id: targetLocationId })
        .in('id', cardIds);

      if (error) {
        throw error;
      }
    }

    // Mark sync log as applied if category provided
    if (category) {
      await supabase
        .from('yg_ideal_sync_logs')
        .update({ is_applied_to_physical: true })
        .eq('category', category);
    }

    return NextResponse.json({
      success: true,
      message: 'Etapa aplicada con éxito a la Colección Real.'
    });
  } catch (error) {
    console.error('Error applying ideal stage to physical collection:', error);
    return NextResponse.json(
      { success: false, error: 'Error al aplicar etapa a la colección real.' },
      { status: 500 }
    );
  }
}
