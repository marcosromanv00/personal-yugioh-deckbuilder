import { generateObject } from 'ai';
import { z } from 'zod';
import { getGoogleProvider, getTemporalContext } from '@/lib/ai/google';
import { DEFAULT_AI_MODEL, AIModelId } from '@/lib/constants/models';
import { generateExordioDeckAnalysis, calculateCardConsistencyDelta } from '@/lib/engines/exordioAnalytics';
import { DeckCard } from '@/components/deckbuilder/types';

const deckDiagnosticsSchema = z.object({
  tacticalSummary: z.string().describe('Resumen táctico del estado competitivo de la baraja'),
  consistencyVerdict: z.string().describe('Veredicto sobre el ratio de starters, extenders y bricks'),
  metaVulnerabilities: z.array(
    z.object({
      threatName: z.string().describe('Nombre de la carta o arquetipo amenaza (ej. Droll & Lock Bird, Nibiru)'),
      impactDescription: z.string().describe('Por qué afecta críticamente al mazo'),
      counterStrategy: z.string().describe('Cómo mitigar o jugar alrededor de esta amenaza'),
    })
  ).describe('Puntos ciegos principales contra el metajuego'),
  recommendedTechs: z.array(
    z.object({
      cardName: z.string().describe('Nombre exacto de la carta recomendada'),
      role: z.string().describe('Rol táctico (ej. Starter, Extender, Handtrap, Board Breaker)'),
      consistencyDelta: z.string().describe('Impacto estimado en consistencia (ej: +4.2% Consistencia)'),
      strategicReason: z.string().describe('Justificación técnica de por qué mejora la estrategia'),
    })
  ).describe('Top 3 a 5 cartas recomendadas para optimizar el mazo'),
  idealTurn1Combo: z.object({
    startingStarter: z.string().describe('Iniciador principal requerido'),
    endBoard: z.string().describe('Tablero final obtenido'),
    primaryRoute: z.array(z.string()).describe('Pasos clave de invocación y activación'),
    antiHandtrapPivot: z.string().describe('Desvío recomendado si el oponente interrumpe con Ash Blossom o Imperm'),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      cards = [],
      archetype = 'Custom Strategy',
      format = 'Master Duel',
      model: requestedModel,
    } = body;

    const deckCards = cards as DeckCard[];
    const analysis = generateExordioDeckAnalysis(deckCards, archetype);

    const temporalContext = getTemporalContext();
    const provider = getGoogleProvider();

    const mainCount = deckCards.filter(c => c.section !== 'extra' && c.section !== 'side').reduce((acc, c) => acc + (c.count || 1), 0);
    const extraCount = deckCards.filter(c => c.section === 'extra').reduce((acc, c) => acc + (c.count || 1), 0);

    const promptContext = `
Analiza la siguiente baraja competitiva de Yu-Gi-Oh! bajo el formato ${format}:
- Arquetipo Principal: ${archetype}
- Cantidad de Cartas: ${mainCount} Main Deck, ${extraCount} Extra Deck
- Puntuación Global de Consistencia: ${analysis.finalScore}/10 (${analysis.scoreRankBadge})
- Tasa de Bricks / Manos Muertas: ${analysis.testingData.deadHands.count * 10}%
- Starters Principales Detectados: ${analysis.keyCards.mainStarters.map(c => `${c.count}x ${c.name}`).join(', ') || 'Pocos starters'}
- Amenazas Meta Detectadas por el Motor: ${analysis.threatCards.map(t => t.name).join(', ')}

Cartas del Deck:
${deckCards.map(c => `${c.count || 1}x ${c.name} (${c.section || 'main'})`).join('\n')}

Genera un diagnóstico táctico riguroso, evaluando la consistencia real, los puntos ciegos contra el meta actual y las cartas de optimización prioritarias.`;

    const modelToUse = (requestedModel as AIModelId) || DEFAULT_AI_MODEL;
    const model = provider(modelToUse);

    const result = await generateObject({
      model,
      schema: deckDiagnosticsSchema,
      system: `${temporalContext}\nEres el Copiloto Estratégico y Analista de Torneos de Yu-Gi-Oh!. Proporcionas diagnósticos objetivos basados en teoría de ventaja de cartas, ratios de consistencia y el meta competitivo vigente.`,
      prompt: promptContext,
      temperature: 0.2,
    });

    return Response.json({
      success: true,
      data: result.object,
      simulatedStats: {
        consistencyScore: analysis.mainStats.consistency,
        brickPercent: analysis.testingData.deadHands.count * 10,
        otkPotential: analysis.testingData.otk.count * 10,
        tierRank: analysis.tierRank,
      }
    });
  } catch (error: unknown) {
    console.error('[API/AI/DECK-DIAGNOSTICS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar diagnóstico de IA';
    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
