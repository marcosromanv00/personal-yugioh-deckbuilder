import { NextRequest, NextResponse } from 'next/server';
import { CardKnowledgeService } from '@/lib/services/cardKnowledgeService';
import { FormatType } from '@/types/knowledge';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name') || searchParams.get('card_name');
    const id = searchParams.get('id') || searchParams.get('card_id');
    const format = (searchParams.get('format') as FormatType) || 'TCG';

    if (!name && !id) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro "name" o "id" de la carta' },
        { status: 400 }
      );
    }

    const queryTarget = name || (id ? parseInt(id, 10) : '');
    const knowledgeData = await CardKnowledgeService.getCardKnowledge(queryTarget, format);

    if (!knowledgeData) {
      return NextResponse.json(
        { error: `No se encontraron datos de conocimiento para "${queryTarget}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: knowledgeData
    });
  } catch (error) {
    console.error('Error in GET /api/knowledge/card:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar la base de conocimiento' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { card_name, updated_data, audit_reason } = body;

    if (!card_name || !updated_data) {
      return NextResponse.json(
        { error: 'Se requieren "card_name" y "updated_data"' },
        { status: 400 }
      );
    }

    const result = await CardKnowledgeService.saveUserCorrection(
      card_name,
      updated_data,
      audit_reason || 'Modificación manual desde la Base de Conocimiento'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al guardar la corrección' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Conocimiento de "${card_name}" actualizado y verificado por el usuario.`,
      data: result.data
    });
  } catch (error) {
    console.error('Error in POST /api/knowledge/card:', error);
    return NextResponse.json(
      { error: 'Error al procesar la actualización de conocimiento' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const card_name = searchParams.get('card_name') || searchParams.get('name');

    if (!card_name) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro "card_name"' },
        { status: 400 }
      );
    }

    const result = await CardKnowledgeService.resetToMetaDefault(card_name);

    return NextResponse.json({
      success: true,
      message: `Datos de "${card_name}" restablecidos al Meta original.`,
      data: result.data
    });
  } catch (error) {
    console.error('Error in DELETE /api/knowledge/card:', error);
    return NextResponse.json(
      { error: 'Error al restablecer los datos de la carta' },
      { status: 500 }
    );
  }
}
