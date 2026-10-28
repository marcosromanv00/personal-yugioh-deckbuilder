import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Retorna un bloque de contexto temporal fidedigno para evitar discrepancias de fechas
 * y asegurar que el modelo opere con conocimiento actualizado a Agosto de 2026.
 */
export function getTemporalContext(): string {
  const now = new Date();
  const formatted = now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Costa_Rica",
  });
  const monthYear = now.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    timeZone: "America/Costa_Rica",
  });
  return `=== DIRECTRICES DE ANCLAJE A DATOS EN VIVO Y CERO ALUCINACIÓN (CRÍTICO) ===
Hoy es ${formatted}. Esta es la fecha exacta y vigente al momento de esta consulta.
Formato competitivo Yu-Gi-Oh! analizado: Vigente a ${monthYear} (TCG / Master Duel / OCG).

REGLAS INVIOLABLES DE VERACIDAD FÁCTICA:
1. PROHIBICIÓN DE MEMORIA PARAMÉTRICA DESFASADA: No asumas precios de cartas, contenidos de latas/cajas ni listas de torneos sin fundamentación oficial.
2. NOMENCLATURA EXACTA (KONAMI / YGOPRODECK): Solo menciona cartas y arquetipos que existan oficialmente en la base de datos de Konami. Prohibido inventar cartas, efectos o tipos de invocación falsos.
3. CALIFICACIÓN CUANTITATIVA DE FUERZA (1.0 A 10.0): Toda evaluación de sinergia, baraja o tech card debe incluir una nota de 1.0 a 10.0 justificada en resultados de torneos competitivos documentados.
4. RECONOCIMIENTO DE INCERTIDUMBRE: Si no posees datos oficiales verificados sobre un ruling reciente o precio específico, declara explícitamente la limitación en lugar de conjeturar.
========================================================================\n`;
}

export function getGoogleProvider(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    console.warn("[AI-PROVIDER] No GOOGLE_GENERATIVE_AI_API_KEY found.");
  }

  return createGoogleGenerativeAI({
    apiKey: apiKey || "missing-api-key",
  });
}
