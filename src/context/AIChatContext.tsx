'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatMessage, ChatSession } from '@/types/chat';
import { AI_MODELS, AIModelId, DEFAULT_AI_MODEL } from '@/lib/constants/models';

interface AIChatContextType {
  isDrawerOpen: boolean;
  openChatDrawer: () => void;
  closeChatDrawer: () => void;
  toggleChatDrawer: () => void;

  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  selectedModel: AIModelId;
  setSelectedModel: (model: AIModelId) => void;

  createNewSession: () => Promise<ChatSession | null>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  clearActiveSessionMessages: () => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>(DEFAULT_AI_MODEL);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Cargar sesiones iniciales
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
        return json.data as ChatSession[];
      }
    } catch (err) {
      console.warn('[AIChatContext] Error loading sessions:', err);
    }
    return [];
  }, []);

  // Cargar mensajes de una sesión
  const fetchSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?session_id=${sessionId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn('[AIChatContext] Error loading messages:', err);
      setMessages([]);
    }
  }, []);

  // Crear una nueva sesión de chat
  const createNewSession = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nueva Conversación' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newSess = json.data as ChatSession;
        setSessions((prev) => [newSess, ...prev.filter((s) => s.id !== newSess.id)]);
        setActiveSessionId(newSess.id);
        setMessages([]);
        return newSess;
      }
    } catch (err) {
      console.error('[AIChatContext] Error creating session:', err);
    }
    return null;
  }, []);

  // Inicialización: Al entrar, abre una sesión nueva por defecto si no hay o si se desea empezar limpio
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const loaded = await fetchSessions();
      if (isMounted) {
        // Regla: Abre uno nuevo por defecto cada vez que el usuario entre
        await createNewSession();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchSessions, createNewSession]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      await fetchSessionMessages(sessionId);
    },
    [fetchSessionMessages]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await fetch(`/api/chat/sessions?id=${sessionId}`, { method: 'DELETE' });
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          const remaining = sessions.filter((s) => s.id !== sessionId);
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
            await fetchSessionMessages(remaining[0].id);
          } else {
            await createNewSession();
          }
        }
      } catch (err) {
        console.error('[AIChatContext] Error deleting session:', err);
      }
    },
    [activeSessionId, sessions, fetchSessionMessages, createNewSession]
  );

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      await fetch('/api/chat/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, title: newTitle }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
    } catch (err) {
      console.error('[AIChatContext] Error renaming session:', err);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      let currentSessId = activeSessionId;
      if (!currentSessId) {
        const newSess = await createNewSession();
        if (!newSess) return;
        currentSessId = newSess.id;
      }

      const tempUserMsg: ChatMessage = {
        id: `temp_u_${Date.now()}`,
        session_id: currentSessId,
        role: 'user',
        content: text.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: currentSessId,
            message: text.trim(),
            model: selectedModel,
          }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          const assistantMsg = json.data as ChatMessage;
          setMessages((prev) => [...prev, assistantMsg]);

          if (json.sessionTitle) {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === currentSessId ? { ...s, title: json.sessionTitle } : s
              )
            );
          }
        } else {
          const errMsg: ChatMessage = {
            id: `err_${Date.now()}`,
            session_id: currentSessId,
            role: 'assistant',
            content: `⚠️ ${json.error || 'Ocurrió un error al contactar al Cerebro Virtual.'}`,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errMsg]);
        }
      } catch (err: unknown) {
        console.error('[AIChatContext] Error sending message:', err);
        const errMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          session_id: currentSessId,
          role: 'assistant',
          content: '⚠️ Error de conexión con el servidor.',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeSessionId, createNewSession, isLoading, selectedModel]
  );

  const clearActiveSessionMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const openChatDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeChatDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleChatDrawer = useCallback(() => setIsDrawerOpen((p) => !p), []);

  return (
    <AIChatContext.Provider
      value={{
        isDrawerOpen,
        openChatDrawer,
        closeChatDrawer,
        toggleChatDrawer,
        sessions,
        activeSessionId,
        activeSession,
        messages,
        isLoading,
        selectedModel,
        setSelectedModel,
        createNewSession,
        selectSession,
        deleteSession,
        renameSession,
        sendMessage,
        clearActiveSessionMessages,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}
