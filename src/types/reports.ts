import { z } from 'zod';

export const reportSourceSchema = z.enum([
  'global_chat',
  'deck_assistant',
  'deck_diagnostics',
  'collection_suggestions',
  'duel_copilot',
  'combo_advisor',
  'general',
]);

export type ReportSource = z.infer<typeof reportSourceSchema>;

export const suggestionReportInputSchema = z.object({
  source: reportSourceSchema,
  suggestionId: z.string().optional(),
  rating: z
    .number()
    .int('La calificación debe ser un número entero')
    .min(1, 'La calificación mínima es 1 (Totalmente erróneo)')
    .max(5, 'La calificación máxima es 5 (Excelente / Preciso)'),
  errorDescription: z
    .string()
    .trim()
    .min(5, 'La descripción del error debe tener al menos 5 caracteres')
    .max(2000, 'La descripción no puede superar los 2000 caracteres'),
  contextData: z.record(z.string(), z.unknown()).optional().default({}),
});

export type SuggestionReportInput = z.infer<typeof suggestionReportInputSchema>;

export interface SuggestionReportItem {
  id: string;
  created_at: string;
  user_id?: string | null;
  source: ReportSource;
  suggestion_id?: string | null;
  rating: number; // 1 - 5
  error_description: string;
  context_data?: Record<string, unknown>;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface SuggestionReportsStats {
  total: number;
  averageRating: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  sourceCounts: Record<string, number>;
}
