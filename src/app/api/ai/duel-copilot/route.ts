import { generateText } from 'ai';
import { getGoogleProvider, getTemporalContext } from '@/lib/ai/google';
import { DEFAULT_AI_MODEL, AIModelId } from '@/lib/constants/models';

const DUEL_COPILOT_SYSTEM_PROMPT = `Eres el "Duel Copilot & Master Judge AI" de Yu-Gi-Oh!, un asistente táctico de duelo y juez oficial de nivel mundial (vigente a Agosto 2026).

Tus capacidades incluyen:
1. **Asistencia Táctica en Tiempo Real**: Analizar la mano actual del usuario, el campo del oponente y recomendar la secuencia exacta de jugadas paso a paso.
2. **Mitigación de Handtraps & Interrupts**: Explicar qué hacer si el oponente interrumpe una búsqueda (Ash Blossom, Droll, Nibiru, Impermanence, Dominus Impulse).
3. **Rulings Oficiales y Resolución de Cadenas**: Resolver dudas complejas de reglas (Timing "When... you can", Costos vs Efectos, Negación de Activación vs Negación de Efecto, Interacciones de Campo).
4. **Estrategia Going 1st / Going 2nd**: Recomendar si conviene armar un tablero defensivo con omni-negates o priorizar romper campos con breakers.

REGLAS DE RESPUESTA:
- Sé conciso, directo y estructurado (usa viñetas y pasos numerados).
- No inventes cartas ni cambies textos oficiales de cartas.
- Utiliza la terminología oficial en español/inglés aceptada por la comunidad competitiva.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages = [],
      currentDeckName,
      currentDeckCards = [],
      handCards = [],
      opponentBoard = '',
      format = 'TCG',
      model: requestedModel,
    } = body;

    const temporalContext = getTemporalContext();
    const provider = getGoogleProvider();

    let contextSummary = `\n[CONTEXTO DEL DUELO ACTUAL]\nFormato: ${format}\n`;
    if (currentDeckName) contextSummary += `Deck del usuario: ${currentDeckName}\n`;
    if (handCards.length > 0) {
      contextSummary += `Mano actual del usuario: ${handCards.join(', ')}\n`;
    }
    if (opponentBoard) {
      contextSummary += `Campo / Amenazas del oponente: ${opponentBoard}\n`;
    }
    if (currentDeckCards.length > 0) {
      contextSummary += `Cartas clave en el deck: ${currentDeckCards.slice(0, 20).map((c: { name: string }) => c.name).join(', ')}\n`;
    }

    const conversationHistory = messages.map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const modelToUse = (requestedModel as AIModelId) || DEFAULT_AI_MODEL;
    const model = provider(modelToUse);

    const response = await generateText({
      model,
      system: `${temporalContext}\n${DUEL_COPILOT_SYSTEM_PROMPT}\n${contextSummary}`,
      prompt: conversationHistory || 'Hola, ¿cómo puedo ayudarte en tu duelo o análisis táctico hoy?',
      temperature: 0.3,
    });

    return Response.json({
      success: true,
      reply: response.text,
    });
  } catch (error: unknown) {
    console.error('[API/AI/DUEL-COPILOT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al comunicarse con Duel Copilot';
    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
