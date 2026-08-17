import { generateObject } from 'ai';
import { z } from 'zod';
import { getGoogleProvider, getTemporalContext } from '@/lib/ai/google';
import { DEFAULT_AI_MODEL, AIModelId } from '@/lib/constants/models';

const comboAdvisorSchema = z.object({
  comboTitle: z.string().describe('Título del combo (ej: 1-Card Combo con Starter A)'),
  startingHand: z.array(z.string()).describe('Cartas necesarias en mano'),
  primaryEndboard: z.string().describe('Tablero final obtenido (monstruos, negates, recursos)'),
  interruptionTolerance: z.enum(['low', 'medium', 'high']),
  steps: z.array(
    z.object({
      stepNumber: z.number(),
      action: z.string().describe('Acción ejecutada (ej: Normal Summon, Link Summon, Efecto en GY)'),
      cardName: z.string(),
      description: z.string().describe('Detalle de activación, target o coste'),
    })
  ),
  decisionBranches: z.array(
    z.object({
      interruptionPoint: z.string().describe('Momento donde el oponente interrumpe (ej: Ash en búsqueda)'),
      recommendedPivot: z.string().describe('Ruta alternativa o plan B para terminar en un tablero decente'),
      contingencyEndboard: z.string().describe('Tablero final tras mitigar la interrupción'),
    })
  ),
  tipsForOpponentMatchup: z.string().describe('Consejos tácticos al jugar este combo en el meta actual'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      handCards = [],
      deckCards = [],
      archetype = 'Custom Strategy',
      goingTurn = 1,
      model: requestedModel,
    } = body;

    const temporalContext = getTemporalContext();
    const provider = getGoogleProvider();

    const promptContext = `
Analiza la siguiente mano inicial y estructura el árbol de decisiones óptimo para el Turno ${goingTurn}:
- Arquetipo: ${archetype}
- Mano inicial dada: ${handCards.join(', ')}
- Cartas disponibles en el Deck/Extra: ${deckCards.slice(0, 30).map((c: { name: string }) => c.name).join(', ')}

Detalla la línea de combo paso a paso y los árboles de mitigación ante interrupciones clásicas (Ash Blossom, Nibiru, Impermanence, Droll).`;

    const modelToUse = (requestedModel as AIModelId) || DEFAULT_AI_MODEL;
    const model = provider(modelToUse);

    const result = await generateObject({
      model,
      schema: comboAdvisorSchema,
      system: `${temporalContext}\nEres el Asesor Táctico y Algoritmo de Combos de Yu-Gi-Oh! de nivel profesional. Generas secuencias exactas y viables bajo las reglas oficiales.`,
      prompt: promptContext,
      temperature: 0.2,
    });

    return Response.json({
      success: true,
      data: result.object,
    });
  } catch (error: unknown) {
    console.error('[API/AI/COMBO-ADVISOR] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar árbol de combo con IA';
    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
