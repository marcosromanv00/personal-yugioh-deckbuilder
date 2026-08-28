import { NextRequest, NextResponse } from 'next/server';
import { synchronizeIdealEnvironment } from '@/lib/idealSyncService';

export async function POST(req: NextRequest) {
  try {
    let config = undefined;
    try {
      const body = await req.json();
      if (body && body.config) {
        config = body.config;
      }
    } catch {
      // Body may be empty, fallback to default config
    }

    const result = await synchronizeIdealEnvironment(config);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in ideal sync route:', error);
    return NextResponse.json(
      { success: false, error: 'Error al sincronizar la Colección Ideal.' },
      { status: 500 }
    );
  }
}
