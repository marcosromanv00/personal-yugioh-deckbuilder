'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { IdealOptimizerOutput } from '@/lib/idealOptimizer';
import { IdealSyncLog } from '@/types/collection';

interface IdealEnvironmentContextType {
  isIdealMode: boolean;
  isSyncing: boolean;
  syncStepMessage: string;
  syncData: IdealOptimizerOutput | null;
  logs: IdealSyncLog[];
  isReportModalOpen: boolean;
  isAssistantModalOpen: boolean;
  toggleIdealMode: () => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  openAssistantModal: () => void;
  closeAssistantModal: () => void;
  triggerResync: () => Promise<void>;
}

const IdealEnvironmentContext = createContext<IdealEnvironmentContextType | undefined>(undefined);

export function IdealEnvironmentProvider({ children }: { children: ReactNode }) {
  const [isIdealMode, setIsIdealMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStepMessage, setSyncStepMessage] = useState<string>('');
  const [syncData, setSyncData] = useState<IdealOptimizerOutput | null>(null);
  const [logs, setLogs] = useState<IdealSyncLog[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState<boolean>(false);

  // Hydration safety: check localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('yg_ideal_mode_active');
    if (saved === 'true') {
      setIsIdealMode(true);
    }
  }, []);

  const runSyncProcess = useCallback(async () => {
    setIsSyncing(true);
    setSyncStepMessage('🔄 Clonando inventario y contenedores actuales...');
    
    await new Promise(r => setTimeout(r, 600));
    setSyncStepMessage('🧠 Analizando sinergias de arquetipos y motores...');
    
    await new Promise(r => setTimeout(r, 600));
    setSyncStepMessage('🃏 Construyendo decks optimizados y variantes...');

    await new Promise(r => setTimeout(r, 600));
    setSyncStepMessage('💎 Promoviendo staples y cartas de alta rareza a Binders...');

    try {
      const res = await fetch('/api/collection/ideal/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setSyncData(json.data);
        const mappedLogs: IdealSyncLog[] = (json.data.logs || []).map((l: Omit<IdealSyncLog, 'id' | 'created_at'>, idx: number) => ({
          ...l,
          id: `log-${Date.now()}-${idx}`,
          created_at: new Date().toISOString()
        }));
        setLogs(mappedLogs);
      }
    } catch (e) {
      console.error('Error running ideal sync:', e);
    } finally {
      setSyncStepMessage('📋 Informe de reorganización ideal generado.');
      await new Promise(r => setTimeout(r, 400));
      setIsSyncing(false);
      setIsReportModalOpen(true);
    }
  }, []);

  const toggleIdealMode = useCallback(() => {
    const nextState = !isIdealMode;
    setIsIdealMode(nextState);
    localStorage.setItem('yg_ideal_mode_active', String(nextState));

    if (nextState) {
      runSyncProcess();
    }
  }, [isIdealMode, runSyncProcess]);

  const triggerResync = useCallback(async () => {
    await runSyncProcess();
  }, [runSyncProcess]);

  const openReportModal = useCallback(() => setIsReportModalOpen(true), []);
  const closeReportModal = useCallback(() => setIsReportModalOpen(false), []);
  const openAssistantModal = useCallback(() => setIsAssistantModalOpen(true), []);
  const closeAssistantModal = useCallback(() => setIsAssistantModalOpen(false), []);

  return (
    <IdealEnvironmentContext.Provider
      value={{
        isIdealMode,
        isSyncing,
        syncStepMessage,
        syncData,
        logs,
        isReportModalOpen,
        isAssistantModalOpen,
        toggleIdealMode,
        openReportModal,
        closeReportModal,
        openAssistantModal,
        closeAssistantModal,
        triggerResync
      }}
    >
      {children}
    </IdealEnvironmentContext.Provider>
  );
}

export function useIdealEnvironment() {
  const context = useContext(IdealEnvironmentContext);
  if (!context) {
    throw new Error('useIdealEnvironment must be used within an IdealEnvironmentProvider');
  }
  return context;
}
