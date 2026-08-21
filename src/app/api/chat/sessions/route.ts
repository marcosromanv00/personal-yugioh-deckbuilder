import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ChatSession } from '@/types/chat';

// Fallback in-memory store for demo / local without supabase
const globalForChat = global as unknown as {
  mockChatSessions?: ChatSession[];
};

if (!globalForChat.mockChatSessions) {
  globalForChat.mockChatSessions = [];
}

const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// GET: Obtener todas las sesiones de chat
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      const sorted = [...(globalForChat.mockChatSessions || [])].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      return NextResponse.json({ success: true, data: sorted });
    }

    const { data, error } = await supabase
      .from('yg_chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[API/CHAT/SESSIONS] Supabase query error, falling back to local store:', error.message);
      return NextResponse.json({ success: true, data: globalForChat.mockChatSessions || [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al obtener sesiones de chat';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST: Crear una nueva sesión de chat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body.title && String(body.title).trim()) || 'Nueva Conversación';

    const now = new Date().toISOString();
    const newSession: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      created_at: now,
      updated_at: now,
    };

    if (!isSupabaseConfigured()) {
      globalForChat.mockChatSessions = [newSession, ...(globalForChat.mockChatSessions || [])];
      return NextResponse.json({ success: true, data: newSession });
    }

    const { data, error } = await supabase
      .from('yg_chat_sessions')
      .insert([{ title, updated_at: now }])
      .select()
      .single();

    if (error) {
      console.warn('[API/CHAT/SESSIONS] Error inserting in Supabase, using fallback:', error.message);
      globalForChat.mockChatSessions = [newSession, ...(globalForChat.mockChatSessions || [])];
      return NextResponse.json({ success: true, data: newSession });
    }

    return NextResponse.json({ success: true, data: data || newSession });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al crear sesión de chat';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PUT: Renombrar título de una sesión
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title } = body;

    if (!id || !title) {
      return NextResponse.json({ success: false, error: 'ID y título son requeridos' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (!isSupabaseConfigured()) {
      if (globalForChat.mockChatSessions) {
        globalForChat.mockChatSessions = globalForChat.mockChatSessions.map((s) =>
          s.id === id ? { ...s, title, updated_at: now } : s
        );
      }
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('yg_chat_sessions')
      .update({ title, updated_at: now })
      .eq('id', id);

    if (error) {
      console.warn('[API/CHAT/SESSIONS] Error updating in Supabase:', error.message);
      if (globalForChat.mockChatSessions) {
        globalForChat.mockChatSessions = globalForChat.mockChatSessions.map((s) =>
          s.id === id ? { ...s, title, updated_at: now } : s
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al actualizar sesión de chat';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE: Eliminar sesión de chat
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de sesión requerido' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      if (globalForChat.mockChatSessions) {
        globalForChat.mockChatSessions = globalForChat.mockChatSessions.filter((s) => s.id !== id);
      }
      return NextResponse.json({ success: true });
    }

    // Delete messages first, then session
    await supabase.from('yg_chat_messages').delete().eq('session_id', id);
    const { error } = await supabase.from('yg_chat_sessions').delete().eq('id', id);

    if (error) {
      console.warn('[API/CHAT/SESSIONS] Error deleting from Supabase:', error.message);
      if (globalForChat.mockChatSessions) {
        globalForChat.mockChatSessions = globalForChat.mockChatSessions.filter((s) => s.id !== id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al eliminar sesión de chat';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
