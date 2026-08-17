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
  const year = now.getFullYear();
  return `=== CONTEXTO TEMPORAL Y DE FORMATO COMPETITIVO (CRÍTICO) ===
Hoy es ${formatted} (año ${year}). Esta es la fecha REAL y vigente del mundo al momento de esta consulta.
Formato competitivo Yu-Gi-Oh! vigente: Agosto 2026 (TCG / Master Duel / OCG).
Todas las cartas, arquetipos (ej. Snake-Eye, Fiendsmith, Tenpai Dragon, Yubel, Ryzeal, Maliss, Mitsu, etc.), banlists y rulings deben reflejar con absoluta precisión los datos oficiales y demostrables.
NO inventes cartas inexistentes ni banlists ficticias.
============================================================\n`;
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
