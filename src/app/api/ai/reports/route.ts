import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  suggestionReportInputSchema, 
  SuggestionReportItem, 
  SuggestionReportsStats 
} from '@/types/reports';

// Fallback en memoria para desarrollo o entornos sin Supabase
const globalForReports = global as unknown as {
  mockSuggestionReports?: SuggestionReportItem[];
};

if (!globalForReports.mockSuggestionReports) {
  globalForReports.mockSuggestionReports = [];
}

const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = suggestionReportInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join('. ');
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { source, suggestionId, rating, errorDescription, contextData } = parseResult.data;
    const now = new Date().toISOString();
    const newReport: SuggestionReportItem = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      source,
      suggestion_id: suggestionId || null,
      rating,
      error_description: errorDescription,
      context_data: contextData,
      status: 'pending',
    };

    if (!isSupabaseConfigured()) {
      globalForReports.mockSuggestionReports = [
        newReport,
        ...(globalForReports.mockSuggestionReports || []),
      ];
      return NextResponse.json({
        success: true,
        data: newReport,
        message: 'Reporte registrado exitosamente (Modo Local)',
      });
    }

    const { data, error } = await supabase
      .from('yg_suggestion_reports')
      .insert([
        {
          source,
          suggestion_id: suggestionId || null,
          rating,
          error_description: errorDescription,
          context_data: contextData,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[API/REPORTS] Fallback a memoria local por error de Supabase:', error.message);
      globalForReports.mockSuggestionReports = [
        newReport,
        ...(globalForReports.mockSuggestionReports || []),
      ];
      return NextResponse.json({
        success: true,
        data: newReport,
        message: 'Reporte guardado en memoria de sesión',
      });
    }

    return NextResponse.json({
      success: true,
      data: data as SuggestionReportItem,
      message: 'Reporte registrado exitosamente en la base de datos',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno al procesar el reporte';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const source = searchParams.get('source');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    let reports: SuggestionReportItem[] = [];

    if (!isSupabaseConfigured()) {
      reports = [...(globalForReports.mockSuggestionReports || [])];
      if (source) {
        reports = reports.filter((r) => r.source === source);
      }
      reports = reports.slice(0, limit);
    } else {
      let query = supabase
        .from('yg_suggestion_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[API/REPORTS] Fallback GET por error de Supabase:', error.message);
        reports = (globalForReports.mockSuggestionReports || []).slice(0, limit);
      } else {
        reports = (data as SuggestionReportItem[]) || [];
      }
    }

    // Calcular estadísticas resumidas
    const total = reports.length;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const sourceCounts: Record<string, number> = {};
    let sumRatings = 0;

    for (const r of reports) {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating as keyof typeof ratingCounts] =
          (ratingCounts[r.rating as keyof typeof ratingCounts] || 0) + 1;
        sumRatings += r.rating;
      }
      sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
    }

    const stats: SuggestionReportsStats = {
      total,
      averageRating: total > 0 ? Number((sumRatings / total).toFixed(2)) : 0,
      ratingCounts,
      sourceCounts,
    };

    return NextResponse.json({
      success: true,
      data: reports,
      stats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno al consultar reportes';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
