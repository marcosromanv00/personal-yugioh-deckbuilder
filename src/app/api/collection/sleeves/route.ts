import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeCardSleeving } from '@/lib/sleevingAdvisor';

export async function POST() {
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        report: {
          recommendations: [],
          summary: { doubleSleeveNeededCount: 0, tournamentComplianceIssues: 0, bulkSavingsCount: 0 }
        }
      });
    }

    const { data: userCards, error } = await supabase
      .from('yg_user_cards')
      .select('*, card_details:yg_cards(*)');

    if (error) throw error;

    const report = analyzeCardSleeving(userCards || []);

    return NextResponse.json({ report });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al generar informe de fundas:', err);
    return NextResponse.json({ error: err.message || 'Error al analizar fundas y protección' }, { status: 500 });
  }
}
