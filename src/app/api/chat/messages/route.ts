import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getGoogleProvider, getTemporalContext } from '@/lib/ai/google';
import { DEFAULT_AI_MODEL, AIModelId } from '@/lib/constants/models';
import { supabase } from '@/lib/supabase';
import { ChatMessage, ChatSession } from '@/types/chat';

// Fallback in-memory store
const globalForMessages = global as unknown as {
  mockChatMessages?: ChatMessage[];
  mockChatSessions?: ChatSession[];
};

if (!globalForMessages.mockChatMessages) {
  globalForMessages.mockChatMessages = [];
}
if (!globalForMessages.mockChatSessions) {
  globalForMessages.mockChatSessions = [];
}

const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

const GLOBAL_BRAIN_SYSTEM_PROMPT = `Eres el "Cerebro Virtual Exordio", la Inteligencia Artificial Maestra y Juez Oficial de Yu-Gi-Oh! (Actualizado al metagame oficial de Agosto 2026).

Posees acceso omnisciente al ecosistema completo del usuario:
1. **Colección Física & Almacenamiento**: Conoces sus contenedores físicos (Carpetas/Binders, Deckboxes, Latas, Cajas de almacenamiento), sus capacidades y las cartas ubicadas en cada uno.
2. **Decks Registrados**: Conoces sus barajas construidas, formatos (TCG, Master Duel, Duel Links), fundas asignadas y cartas que las componen.
3. **Reglas Oficiales y Rulings (Konami)**: Resuelves con precisión absoluta interacciones complejas de cadenas (SEGOC, Timing "When... you can", Costos vs Efectos, Negación de Activación vs Negación de Efecto, Lingering effects, Rulings de cartas actuales).
4. **Metagame & Estrategia**: Sabes qué arquetipos dominan (Snake-Eye, Fiendsmith, Tenpai Dragon, Yubel, Ryzeal, Maliss, Mitsu, Branded Despia, etc.), los ratios competitivos reales (ej. 1 o 2 Cartesia, 3 Aluber, 3 Ash, 3 Imperm, etc.) y cómo armar barajas divertidas y consistentes con cartas disponibles.

DIRECTRICES DE RESPUESTA:
- Sé empático, sumamente técnico cuando se requiera y directo al grano.
- Cuando el usuario pregunte sobre su inventario, haz referencia a sus contenedores y datos reales provistos en el contexto del sistema.
- Utiliza formato Markdown con títulos limpios, listas con viñetas y negritas para nombres de cartas.
- NUNCA inventes cartas ficticias ni efectos falsos.`;

// GET: Obtener mensajes de una sesión
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'session_id es requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      const messages = (globalForMessages.mockChatMessages || [])
        .filter((m) => m.session_id === sessionId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return NextResponse.json({ success: true, data: messages });
    }

    const { data, error } = await supabase
      .from('yg_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[API/CHAT/MESSAGES] Supabase query error, fallback:', error.message);
      const messages = (globalForMessages.mockChatMessages || [])
        .filter((m) => m.session_id === sessionId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return NextResponse.json({ success: true, data: messages });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener mensajes';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: Enviar mensaje, recopilar contexto y generar respuesta
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, message, model: requestedModel } = body;

    if (!session_id || !message || !String(message).trim()) {
      return NextResponse.json({ success: false, error: 'session_id y message son requeridos' }, { status: 400 });
    }

    const trimmedUserMsg = String(message).trim();
    const now = new Date().toISOString();

    // 1. Guardar mensaje del usuario
    const userMsgObj: ChatMessage = {
      id: `msg_u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id,
      role: 'user',
      content: trimmedUserMsg,
      created_at: now,
    };

    if (!isSupabaseConfigured()) {
      globalForMessages.mockChatMessages = [...(globalForMessages.mockChatMessages || []), userMsgObj];
    } else {
      await supabase.from('yg_chat_messages').insert([
        {
          session_id,
          role: 'user',
          content: trimmedUserMsg,
        },
      ]);
    }

    // 2. Extraer snapshot de contexto del sistema (Colección, Decks, Contenedores)
    let systemContextSummary = '';
    try {
      if (isSupabaseConfigured()) {
        const [locsRes, decksRes, sampleCardsRes] = await Promise.all([
          supabase.from('yg_storage_locations').select('id, name, type, capacity'),
          supabase.from('yg_decks').select('id, name, format, is_active'),
          supabase.from('yg_user_cards').select('card_id, quantity, storage_location_id, deck_id, card_details:yg_cards(name, type, archetype)').limit(150),
        ]);

        const locs = locsRes.data || [];
        const decks = decksRes.data || [];
        const userCards = sampleCardsRes.data || [];

        const locSummary = locs.map((l) => `${l.name} (${l.type}, Capacidad: ${l.capacity})`).join('; ');
        const deckSummary = decks.map((d) => `${d.name} [${d.format}${d.is_active ? ' - Activo' : ''}]`).join('; ');

        // Distinct archetypes in user collection
        const archetypes = Array.from(
          new Set(
            userCards
              .map((c) => (c.card_details as { archetype?: string })?.archetype)
              .filter(Boolean)
          )
        ).slice(0, 15);

        systemContextSummary = `
[ESTADO ACTUAL DEL USUARIO EN EXORDIO DECKLAB]
- Contenedores Físicos registrados: ${locSummary || 'Ninguno aún'}
- Barajas / Decks registrados: ${deckSummary || 'Ninguno aún'}
- Arquetipos destacados detectados en colección: ${archetypes.join(', ') || 'Varios'}
`;
      }
    } catch (ctxErr) {
      console.warn('[API/CHAT/MESSAGES] Context fetch warning:', ctxErr);
    }

    // 3. Obtener historial previo de la sesión
    let historyMessages: ChatMessage[] = [];
    if (!isSupabaseConfigured()) {
      historyMessages = (globalForMessages.mockChatMessages || []).filter((m) => m.session_id === session_id);
    } else {
      const { data } = await supabase
        .from('yg_chat_messages')
        .select('*')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true });
      historyMessages = data || [];
    }

    const formattedHistory = historyMessages
      .map((m) => `${m.role === 'user' ? 'DUELISTA' : 'CEREBRO EXORDIO'}: ${m.content}`)
      .join('\n\n');

    // 4. Invocar a Google Gemini
    const temporalContext = getTemporalContext();
    const provider = getGoogleProvider();
    const modelToUse = (requestedModel as AIModelId) || DEFAULT_AI_MODEL;
    const model = provider(modelToUse);

    const response = await generateText({
      model,
      system: `${temporalContext}\n${GLOBAL_BRAIN_SYSTEM_PROMPT}\n${systemContextSummary}`,
      prompt: formattedHistory || trimmedUserMsg,
      temperature: 0.35,
    });

    const assistantContent = response.text || 'He procesado tu consulta, pero no se generó texto de respuesta.';
    const assistantNow = new Date().toISOString();

    const assistantMsgObj: ChatMessage = {
      id: `msg_a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id,
      role: 'assistant',
      content: assistantContent,
      created_at: assistantNow,
      metadata: {
        model: modelToUse,
      },
    };

    // 5. Guardar respuesta del asistente
    if (!isSupabaseConfigured()) {
      globalForMessages.mockChatMessages = [...(globalForMessages.mockChatMessages || []), assistantMsgObj];
    } else {
      await supabase.from('yg_chat_messages').insert([
        {
          session_id,
          role: 'assistant',
          content: assistantContent,
        },
      ]);
    }

    // 6. Actualizar fecha de la sesión y auto-generar título si es la primera interacción
    let updatedTitle: string | undefined = undefined;
    const isFirstExchange = historyMessages.filter((m) => m.role === 'user').length <= 1;

    if (isFirstExchange) {
      // Título sugerido conciso a partir del primer mensaje
      updatedTitle = trimmedUserMsg.slice(0, 35) + (trimmedUserMsg.length > 35 ? '...' : '');
    }

    if (!isSupabaseConfigured()) {
      if (globalForMessages.mockChatSessions) {
        globalForMessages.mockChatSessions = globalForMessages.mockChatSessions.map((s) => {
          if (s.id === session_id) {
            return {
              ...s,
              title: updatedTitle || s.title,
              updated_at: assistantNow,
            };
          }
          return s;
        });
      }
    } else {
      const sessionUpdatePayload: Record<string, string> = { updated_at: assistantNow };
      if (updatedTitle) {
        sessionUpdatePayload.title = updatedTitle;
      }
      await supabase.from('yg_chat_sessions').update(sessionUpdatePayload).eq('id', session_id);
    }

    return NextResponse.json({
      success: true,
      data: assistantMsgObj,
      sessionTitle: updatedTitle,
    });
  } catch (error: unknown) {
    console.error('[API/CHAT/MESSAGES] Error:', error);
    const msg = error instanceof Error ? error.message : 'Error al procesar el mensaje con Cerebro Virtual';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
