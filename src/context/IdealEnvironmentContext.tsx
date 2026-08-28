'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { IdealOptimizerOutput } from '@/lib/idealOptimizer';
import { IdealSyncLog, IdealOptimizationConfig } from '@/types/collection';
import { IdealOptimizationConfigModal } from '@/components/collection/IdealOptimizationConfigModal';
import { DEFAULT_IDEAL_CONFIG } from '@/lib/idealOptimizer';

interface IdealEnvironmentContextType {
  isIdealMode: boolean;
  isSyncing: boolean;
  syncStepMessage: string;
  syncData: IdealOptimizerOutput | null;
  logs: IdealSyncLog[];
  isReportModalOpen: boolean;
  isAssistantModalOpen: boolean;
  isConfigModalOpen: boolean;
  toggleIdealMode: () => void;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  openAssistantModal: () => void;
  closeAssistantModal: () => void;
  triggerResync: (config?: IdealOptimizationConfig) => Promise<void>;
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
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Hydration safety: synchronize localStorage asynchronously after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('yg_ideal_mode_active');
      if (saved === 'true') {
        queueMicrotask(() => {
          setIsIdealMode(true);
        });
      }
    } catch {
      // localStorage unavailable in SSR or private mode
    }
  }, []);

  const runSyncProcess = useCallback(async (config: IdealOptimizationConfig = DEFAULT_IDEAL_CONFIG) => {
    setIsSyncing(true);
    setSyncStepMessage('🔄 Clonando inventario y contenedores actuales...');
    
    await new Promise(r => setTimeout(r, 500));
    setSyncStepMessage('🧠 Aplicando reglas de arquetipos puros y preservando decks activos...');
    
    await new Promise(r => setTimeout(r, 500));
    setSyncStepMessage('🃏 Estructurando mosaicos de Exodia, Dioses y apilando slots...');

    await new Promise(r => setTimeout(r, 500));
    setSyncStepMessage('💎 Separando binders de Colección/Temática y Staples competitivas...');

    try {
      const res = await fetch('/api/collection/ideal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
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
      await new Promise(r => setTimeout(r, 350));
      setIsSyncing(false);
      setIsReportModalOpen(true);
    }
  }, []);

  const toggleIdealMode = useCallback(() => {
    if (!isIdealMode) {
      // Open config modal when turning on ideal mode
      setIsConfigModalOpen(true);
    } else {
      setIsIdealMode(false);
      localStorage.setItem('yg_ideal_mode_active', 'false');
    }
  }, [isIdealMode]);

  const handleConfirmConfigAndSync = useCallback((config: IdealOptimizationConfig) => {
    setIsConfigModalOpen(false);
    setIsIdealMode(true);
    localStorage.setItem('yg_ideal_mode_active', 'true');
    runSyncProcess(config);
  }, [runSyncProcess]);

  const triggerResync = useCallback(async (config?: IdealOptimizationConfig) => {
    await runSyncProcess(config || DEFAULT_IDEAL_CONFIG);
  }, [runSyncProcess]);

  const openConfigModal = useCallback(() => setIsConfigModalOpen(true), []);
  const closeConfigModal = useCallback(() => setIsConfigModalOpen(false), []);
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
        isConfigModalOpen,
        toggleIdealMode,
        openConfigModal,
        closeConfigModal,
        openReportModal,
        closeReportModal,
        openAssistantModal,
        closeAssistantModal,
        triggerResync
      }}
    >
      {children}

      {/* Modal de Configuración y Parámetros Previos al Sync */}
      <IdealOptimizationConfigModal
        isOpen={isConfigModalOpen}
        onClose={closeConfigModal}
        onConfirm={handleConfirmConfigAndSync}
      />
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
