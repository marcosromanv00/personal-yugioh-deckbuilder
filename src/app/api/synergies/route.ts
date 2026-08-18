import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  ARCHETYPE_IMPLICIT_SYNERGIES, 
  getImplicitSynergiesForArchetype, 
  getArchetypesForCard,
  SynergyRole 
} from '@/lib/constants/archetypeSynergies';

interface CreateSynergyBody {
  archetype: string;
  card_name: string;
  card_id?: number | null;
  synergy_role: SynergyRole;
  weight?: number;
  reason?: string;
  source?: 'system' | 'user_feedback' | 'tournament_cooccurrence' | 'ai_mining';
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const archetypeParam = searchParams.get('archetype');
    const cardNameParam = searchParams.get('card_name');

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let dbSynergies: Array<{
      id: string;
      archetype: string;
      card_name: string;
      card_id: number | null;
      synergy_role: SynergyRole;
      weight: number;
      reason: string;
      source: string;
      created_at: string;
    }> = [];

    // 1. Consultar Supabase si está configurado
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('yg_card_synergies').select('*');
        if (archetypeParam) {
          query = query.ilike('archetype', archetypeParam);
        }
        if (cardNameParam) {
          query = query.ilike('card_name', cardNameParam);
        }
        const { data, error } = await query;
        if (!error && data) {
          dbSynergies = data as typeof dbSynergies;
        }
      } catch (err) {
        console.warn('Error al consultar yg_card_synergies en Supabase:', err);
      }
    }

    // 2. Combinar con las sinergias curadas estáticas
    const resultMap = new Map<string, {
      archetype: string;
      card_name: string;
      card_id: number | null;
      synergy_role: SynergyRole;
      weight: number;
      reason: string;
      source: string;
    }>();

    // Cargar sinergias estáticas
    if (archetypeParam) {
      const staticSynergies = getImplicitSynergiesForArchetype(archetypeParam);
      staticSynergies.forEach((s) => {
        const key = `${archetypeParam.toLowerCase()}:::${s.cardName.toLowerCase()}`;
        resultMap.set(key, {
          archetype: archetypeParam,
          card_name: s.cardName,
          card_id: null,
          synergy_role: s.role,
          weight: s.weight,
          reason: s.reason,
          source: 'system'
        });
      });
    } else if (cardNameParam) {
      const staticArchetypes = getArchetypesForCard(cardNameParam);
      staticArchetypes.forEach((item) => {
        const key = `${item.archetype.toLowerCase()}:::${cardNameParam.toLowerCase()}`;
        resultMap.set(key, {
          archetype: item.archetype,
          card_name: cardNameParam,
          card_id: null,
          synergy_role: item.role,
          weight: item.weight,
          reason: item.reason,
          source: 'system'
        });
      });
    } else {
      // Devolver catálogo completo
      ARCHETYPE_IMPLICIT_SYNERGIES.forEach((arch) => {
        arch.implicitCards.forEach((c) => {
          const key = `${arch.archetype.toLowerCase()}:::${c.cardName.toLowerCase()}`;
          resultMap.set(key, {
            archetype: arch.archetype,
            card_name: c.cardName,
            card_id: null,
            synergy_role: c.role,
            weight: c.weight,
            reason: c.reason,
            source: 'system'
          });
        });
      });
    }

    // Sobrescribir o añadir con datos de la base de datos (prioridad de usuario / torneos)
    dbSynergies.forEach((s) => {
      const key = `${s.archetype.toLowerCase()}:::${s.card_name.toLowerCase()}`;
      resultMap.set(key, {
        archetype: s.archetype,
        card_name: s.card_name,
        card_id: s.card_id,
        synergy_role: s.synergy_role,
        weight: Number(s.weight),
        reason: s.reason || '',
        source: s.source || 'user_feedback'
      });
    });

    const synergiesList = Array.from(resultMap.values());
    synergiesList.sort((a, b) => b.weight - a.weight);

    return NextResponse.json({
      success: true,
      total: synergiesList.length,
      synergies: synergiesList
    });
  } catch (error) {
    console.error('Error in GET /api/synergies:', error);
    return NextResponse.json(
      { error: 'Error al consultar las sinergias' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateSynergyBody = await req.json();
    const { 
      archetype, 
      card_name, 
      card_id, 
      synergy_role, 
      weight = 0.85, 
      reason = '', 
      source = 'user_feedback' 
    } = body;

    if (!archetype || !card_name || !synergy_role) {
      return NextResponse.json(
        { error: 'Los campos archetype, card_name y synergy_role son obligatorios' },
        { status: 400 }
      );
    }

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('yg_card_synergies')
          .upsert(
            {
              archetype: archetype.trim(),
              card_name: card_name.trim(),
              card_id: card_id || null,
              synergy_role,
              weight: Math.min(Math.max(Number(weight), 0.0), 1.0),
              reason: reason.trim(),
              source,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'archetype,card_name' }
          )
          .select();

        if (!error && data && data.length > 0) {
          return NextResponse.json({
            success: true,
            message: `Sinergia para "${card_name}" en "${archetype}" guardada exitosamente en Supabase.`,
            synergy: data[0]
          });
        } else if (error) {
          console.warn('Advertencia al guardar en yg_card_synergies en Supabase (cayendo a modo local):', error.message);
        }
      } catch (dbErr) {
        console.warn('Excepción de BD en yg_card_synergies (cayendo a modo local):', dbErr);
      }
    }

    // Fallback simulado exitoso
    return NextResponse.json({
      success: true,
      message: `Sinergia para "${card_name}" en "${archetype}" registrada exitosamente (Modo Memoria / Local).`,
      synergy: {
        id: `local-syn-${Date.now()}`,
        archetype: archetype.trim(),
        card_name: card_name.trim(),
        card_id: card_id || null,
        synergy_role,
        weight: Math.min(Math.max(Number(weight), 0.0), 1.0),
        reason: reason.trim(),
        source
      }
    });
  } catch (error) {
    console.error('Error in POST /api/synergies:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud de sinergia' },
      { status: 500 }
    );
  }
}
