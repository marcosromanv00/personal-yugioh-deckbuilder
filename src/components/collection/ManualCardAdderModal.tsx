'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Camera } from 'lucide-react';
import { CardCodeScannerModal } from '@/components/scanner/CardCodeScannerModal';
import { ManualCardAdderModalProps } from './manual-adder/manualAdder.types';
import { useManualCardAdderState } from './manual-adder/useManualCardAdderState';
import { ManualAdderHeader } from './manual-adder/ManualAdderHeader';
import { ManualAdderSearchSection } from './manual-adder/ManualAdderSearchSection';
import { ManualAdderBulkSection } from './manual-adder/ManualAdderBulkSection';
import { ManualAdderQueueSection } from './manual-adder/ManualAdderQueueSection';
import { ManualAdderDetailsSection } from './manual-adder/ManualAdderDetailsSection';

export const ManualCardAdderModal: React.FC<ManualCardAdderModalProps> = ({
  isOpen,
  onClose,
  locations,
  onSuccess,
}) => {
  const {
    activeLeftTab,
    setActiveLeftTab,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    searchResults,
    searching,
    bulkText,
    setBulkText,
    analyzingBulk,
    unmatchedBulkCards,
    handleAnalyzeBulk,
    queuedCards,
    setQueuedCards,
    activeCardId,
    setActiveCardId,
    activeCard,
    defaultLocationId,
    handleApplyLocationToAll,
    handleAddCardToQueue,
    handleScannerCardRegistered,
    handleUpdateActiveCard,
    handleRemoveQueuedCard,
    handleSaveAllCards,
    submitting,
    errorMsg,
    successMsg,
    isScannerOpen,
    setIsScannerOpen,
    totalCardUnits,
  } = useManualCardAdderState({ isOpen, onClose, onSuccess });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="relative w-full max-w-7xl h-dvh sm:h-[92vh] sm:max-h-[92vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 z-10"
        >
          <ManualAdderHeader
            locations={locations}
            defaultLocationId={defaultLocationId}
            onApplyLocationToAll={handleApplyLocationToAll}
            onClose={onClose}
          />

          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* PANEL IZQUIERDO: BUSCADOR / ENTRADA EN LOTE */}
            <div className="w-full lg:w-80 xl:w-96 p-4 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3 gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('search')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeLeftTab === 'search'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('bulk')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeLeftTab === 'bulk'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>En Lote</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="py-1.5 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 transition-all cursor-pointer shadow-xs"
                  title="Escanear código con cámara"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Cámara</span>
                </button>
              </div>

              {activeLeftTab === 'search' ? (
                <ManualAdderSearchSection
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  searchResults={searchResults}
                  searching={searching}
                  onAddCardToQueue={handleAddCardToQueue}
                />
              ) : (
                <ManualAdderBulkSection
                  bulkText={bulkText}
                  setBulkText={setBulkText}
                  analyzingBulk={analyzingBulk}
                  unmatchedBulkCards={unmatchedBulkCards}
                  onAnalyzeBulk={handleAnalyzeBulk}
                />
              )}
            </div>

            {/* PANEL CENTRAL: GRID DE COLA DE REGISTRO */}
            <ManualAdderQueueSection
              queuedCards={queuedCards}
              activeCardId={activeCardId}
              totalCardUnits={totalCardUnits}
              onSelectCard={setActiveCardId}
              onRemoveCard={handleRemoveQueuedCard}
              onClearAll={() => {
                setQueuedCards([]);
                setActiveCardId(null);
              }}
              onSaveAllCards={handleSaveAllCards}
              submitting={submitting}
              errorMsg={errorMsg}
              successMsg={successMsg}
            />

            {/* PANEL DERECHO: DETALLES & EDICIÓN DE CARTA ACTIVA */}
            <ManualAdderDetailsSection
              activeCard={activeCard}
              locations={locations}
              onUpdateActiveCard={handleUpdateActiveCard}
            />
          </div>

          <CardCodeScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onCardRegistered={handleScannerCardRegistered}
            title="Escanear Código de Carta"
            subtitle="Apunta al código numérico de 8 dígitos de la esquina inferior"
            maxQuantity={99}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
