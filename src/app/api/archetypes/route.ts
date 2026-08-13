import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ArchetypeItem {
  name: string;
  cardCount: number;
  tier: 'Tier 1' | 'Tier 2' | 'Rogue' | 'Meta';
  description: string;
  playstyle: string;
  popularityScore: number;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'Master Duel';

    const isSupabaseConfigured = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let archetypes: ArchetypeItem[] = [];
    let loadedFromDb = false;

    // 1. Intentar consultar desde Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('yg_archetype_breakdown')
          .select('archetype_name, card_id')
          .eq('format', format)
          .order('archetype_name', { ascending: true });

        if (!error && data && data.length > 0) {
          // Agrupar y contar
          const countsMap = new Map<string, number>();
          data.forEach((item: { archetype_name: string; card_id: number }) => {
            countsMap.set(item.archetype_name, (countsMap.get(item.archetype_name) || 0) + 1);
          });

          // Formatear
          countsMap.forEach((count, name) => {
            // Clasificación heurística de Tier según conteo u otros factores para el mock de demo
            let tier: 'Tier 1' | 'Tier 2' | 'Rogue' | 'Meta' = 'Meta';
            if (['Yubel', 'Snake-Eye', 'Tenpai Dragon'].includes(name)) tier = 'Tier 1';
            else if (['Branded', 'Kashtira', 'Tearlaments', 'Labrynth'].includes(name)) tier = 'Tier 2';
            else if (['Zoodiac', 'Purrely'].includes(name)) tier = 'Rogue';

            archetypes.push({
              name,
              cardCount: count,
              tier,
              description: `Arquetipo enfocado en combos competitivos usando cartas de la familia ${name}.`,
              playstyle: ['Yubel', 'Branded', 'Tearlaments'].includes(name) ? 'Fusión / Combo' : 
                         ['Zoodiac', 'Kashtira'].includes(name) ? 'XYZ / Control' : 'Midrange / OTK',
              popularityScore: tier === 'Tier 1' ? 95 : tier === 'Tier 2' ? 80 : 55
            });
          });
          loadedFromDb = true;
        }
      } catch (dbError) {
        console.warn('Error al buscar arquetipos en BD, cayendo a mock:', dbError);
      }
    }

    // 2. Fallback de Mock Data rica si no cargó de la BD
    if (!loadedFromDb) {
      archetypes = [
        {
          name: 'Yubel',
          cardCount: 4,
          tier: 'Tier 1',
          description: 'Estrategia basada en invocar monstruos Yubel que no pueden ser destruidos por batalla y reflejan el daño de batalla al oponente.',
          playstyle: 'Fusión / Combo / Control',
          popularityScore: 98
        },
        {
          name: 'Branded',
          cardCount: 15,
          tier: 'Tier 2',
          description: 'Estrategia sumamente versátil basada en fusiones masivas utilizando Fallen of Albaz y magias/trampas Branded.',
          playstyle: 'Fusión / Recursos / Midrange',
          popularityScore: 92
        },
        {
          name: 'Snake-Eye',
          cardCount: 8,
          tier: 'Tier 1',
          description: 'Motor de monstruos de Fuego de Nivel 1 que permite invocar de modo especial de forma encadenada y controlar las zonas mágicas.',
          playstyle: 'Enlace / Combo Masivo',
          popularityScore: 96
        },
        {
          name: 'Tenpai Dragon',
          cardCount: 6,
          tier: 'Tier 1',
          description: 'Estrategia súper agresiva orientada a ir de segundo para realizar Synchro summon rápidas y lograr OTK en la Battle Phase.',
          playstyle: 'Sincronía / OTK Agresivo',
          popularityScore: 95
        },
        {
          name: 'Zoodiac',
          cardCount: 3,
          tier: 'Rogue',
          description: 'Monstruos XYZ que se pueden invocar utilizando una sola carta Zoodiac como material, facilitando jugadas de un solo turno.',
          playstyle: 'XYZ / Control / Zeus Turbo',
          popularityScore: 60
        },
        {
          name: 'Kashtira',
          cardCount: 9,
          tier: 'Tier 2',
          description: 'Control de campo agresivo que destierra las cartas del oponente boca abajo y bloquea las zonas de juego inutilizándolas.',
          playstyle: 'XYZ / Control de Zonas',
          popularityScore: 85
        },
        {
          name: 'Tearlaments',
          cardCount: 12,
          tier: 'Tier 2',
          description: 'Estrategia que realiza fusiones enviando cartas al cementerio por efectos de cartas, logrando encadenamientos de cadena masivos.',
          playstyle: 'Fusión / Envío al cementerio',
          popularityScore: 88
        },
        {
          name: 'Labrynth',
          cardCount: 10,
          tier: 'Tier 2',
          description: 'Control absoluto del juego usando cartas trampa normales que activan los efectos de las damas demonio en el castillo.',
          playstyle: 'Control de Trampas / Recursos',
          popularityScore: 84
        },
        {
          name: 'Purrely',
          cardCount: 7,
          tier: 'Rogue',
          description: 'Evolución de un pequeño gato mascota (Purrely) en monstruos XYZ gigantes mediante el apego de magias rápidas de juego.',
          playstyle: 'XYZ / Monstruo Jefe Inafectado',
          popularityScore: 65
        },
        {
          name: 'Fire King',
          cardCount: 8,
          tier: 'Tier 2',
          description: 'Destrucción de tus propios monstruos de fuego en mano o campo para disparar efectos de resurrección y destrucción del rival.',
          playstyle: 'Destrucción / Combo / Resurrección',
          popularityScore: 80
        }
      ];
    }

    return NextResponse.json({
      success: true,
      archetypes
    });

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Error en /api/archetypes:', errorObj);
    return NextResponse.json({ error: errorObj.message || 'Error al listar arquetipos' }, { status: 500 });
  }
}
