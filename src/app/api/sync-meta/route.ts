import { NextResponse } from 'next/server';
import { runMetaSync } from '@/lib/sync';

export async function POST() {
  try {
    console.log('API Endpoint: Iniciando sincronización de meta a petición del usuario...');
    const result = await runMetaSync();
    
    return NextResponse.json({
      success: result.success,
      mode: result.mode,
      message: result.message,
      stats: result.stats
    });
  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Error en /api/sync-meta:', errorObj);
    return NextResponse.json({ 
      success: false, 
      error: errorObj.message || 'Error interno del servidor durante la sincronización' 
    }, { status: 500 });
  }
}
