export const AI_MODELS = [
  {
    id: "gemini-3.1-flash-lite-preview",
    label: "3.1 Flash Lite (Recomendado)",
  },
  { id: "gemini-3-flash", label: "3 Flash" },
  { id: "gemini-2.5-flash", label: "2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "2.5 Flash Lite" },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]["id"];

export const DEFAULT_AI_MODEL: AIModelId = "gemini-3.1-flash-lite-preview";
