import { generateObject } from 'ai';
import { z } from 'zod';
import { getGoogleProvider, getTemporalContext } from '@/lib/ai/google';
import { DEFAULT_AI_MODEL, AIModelId } from '@/lib/constants/models';

const deckAssistantSchema = z.object({
  deckName: z.string().describe('Nombre del deck o variante'),
  archetype: z.string().describe('Arquetipo principal'),
  strategyOverview: z.string().describe('Resumen táctico de cómo funciona el deck'),
  targetFormat: z.enum(['TCG', 'Master Duel', 'OCG']),
  estimatedTier: z.string().describe('Tier estimado (ej: Tier 1, Tier 2, Rogue)'),
  mainDeckCards: z.array(
    z.object({
      name: z.string(),
      count: z.number().min(1).max(3),
      category: z.enum(['engine_starter', 'engine_extender', 'engine_boss', 'handtrap', 'board_breaker', 'utility_spell_trap']),
      justification: z.string().describe('Por qué se incluye y su ratio'),
    })
  ),
  extraDeckCards: z.array(
    z.object({
      name: z.string(),
      count: z.number().min(1).max(3),
      role: z.string().describe('Rol del monstruo en el Extra Deck (ej: Starter, Extender, Omni-negate, Board wipe)'),
    })
  ),
  nonEngineRatioEvaluation: z.string().describe('Evaluación de la cantidad de handtraps y breakers (ideal 15-20+)'),
  keyCombosSummary: z.array(z.string()).describe('Resumen de combos de 1 y 2 cartas principales'),
  budgetAlternatives: z.array(
    z.object({
      expensiveCard: z.string(),
      budgetReplacement: z.string(),
      synergyImpact: z.string(),
    })
  ).optional().describe('Alternativas económicas si aplica'),
});

const YGO_EXPERT_SYSTEM_PROMPT = `Eres un Duelista Campeón Mundial, Juez de Nivel 3 y Teórico Experto de Yu-Gi-Oh! (formato TCG / Master Duel / OCG a fecha vigente de Agosto 2026).
Tienes un conocimiento absoluto y riguroso de:
1. Las cartas oficiales vigentes (Snake-Eye, Fiendsmith, Tenpai Dragon, Yubel, Ryzeal, Maliss, Centur-Ion, Voiceless Voice, etc.).
2. La banlist oficial vigente a Agosto 2026.
3. Ratios matemáticos óptimos (40 cartas Main Deck preferido para máxima consistencia de starters, 15 Extra Deck, 15-20+ cartas de non-engine / handtraps para sobrevivir en el meta moderno).
4. Sinergias reales demostrables, sin inventar cartas inexistentes ni efectos falsos.

Responde SIEMPRE con honestidad técnica, estructuración precisa y recomendaciones de alto nivel competitivo.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mode = 'build_from_scratch', // 'build_from_scratch' | 'build_from_collection' | 'optimize_meta' | 'optimize_budget' | 'diagnose'
      prompt,
      currentDeckCards,
      userCollectionCards,
      format = 'TCG',
      budgetMax,
      model: requestedModel,
    } = body;

    const temporalContext = getTemporalContext();
    const provider = getGoogleProvider();

    let userPromptContext = `MODO DE ASISTENCIA: ${mode}\nFORMATO OBJETIVO: ${format}\nSOLICITUD DEL DUELISTA: ${prompt || 'Optimizar el deck para máxima competitividad'}\n`;

    if (currentDeckCards && currentDeckCards.length > 0) {
      userPromptContext += `\nDECKLIST ACTUAL DEL USUARIO:\n${JSON.stringify(
        currentDeckCards.map((c: { name: string; count: number; section: string }) => ({
          name: c.name,
          count: c.count,
          section: c.section,
        })),
        null,
        2
      )}\n`;
    }

    if (userCollectionCards && userCollectionCards.length > 0) {
      userPromptContext += `\nINVENTARIO DISPONIBLE DEL USUARIO (Prioriza usar estas cartas):\n${JSON.stringify(
        userCollectionCards.slice(0, 150).map((c: { name: string; total_quantity: number }) => ({
          name: c.name,
          available: c.total_quantity,
        })),
        null,
        2
      )}\n`;
    }

    if (budgetMax) {
      userPromptContext += `\nPRESUPUESTO MÁXIMO / CONDICIÓN ECONÓMICA: ${budgetMax} USD. Reemplaza staples costosas por opciones económicas accesibles.\n`;
    }

    const modelToUse = (requestedModel as AIModelId) || DEFAULT_AI_MODEL;
    const model = provider(modelToUse);

    const result = await generateObject({
      model,
      schema: deckAssistantSchema,
      system: `${temporalContext}\n${YGO_EXPERT_SYSTEM_PROMPT}`,
      prompt: userPromptContext,
      temperature: 0.2, // Baja temperatura para máxima rigurosidad y 0 alucinaciones
    });

    return Response.json({
      success: true,
      data: result.object,
    });
  } catch (error: unknown) {
    console.error('[API/AI/DECK-ASSISTANT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar con IA';
    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
