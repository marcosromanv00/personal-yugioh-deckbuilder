import { NextRequest, NextResponse } from 'next/server';
import { synchronizeIdealEnvironment } from '@/lib/idealSyncService';

export async function POST(_req: NextRequest) {
  try {
    const result = await synchronizeIdealEnvironment();
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
