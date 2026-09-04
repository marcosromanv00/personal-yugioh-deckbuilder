'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Save, Loader2, AlertCircle, PlusCircle, PackagePlus } from 'lucide-react';
import { SleeveInventory, SleeveCategory } from '@/types/collection';
import { useSleeveFormState, UseSleeveFormStateProps } from './sleeves/useSleeveFormState';
import { AddStockTab } from './sleeves/AddStockTab';
import { CreateOrEditSleeveTab } from './sleeves/CreateOrEditSleeveTab';

export interface SleeveInventoryFormModalProps extends Omit<UseSleeveFormStateProps, 'availableSleeves'> {
  isOpen: boolean;
  availableSleeves?: SleeveInventory[];
}

const SleeveInventoryFormModalContent: React.FC<UseSleeveFormStateProps> = (props) => {
  const {
    editingSleeve,
    onClose,
    availableSleeves = [],
    suggestedQuantity,
    sectionTotalQuantity,
  } = props;

  const {
    activeTab,
    setActiveTab,
    categoryFilter,
    handleCategoryFilterChange,
    selectedSleeveId,
    setSelectedSleeveId,
    selectedSleeve,
    filteredSleevesForStock,
    addQuantity,
    setAddQuantity,
    form,
    updateForm,
    submitting,
    error,
    setError,
    handleAddStockSubmit,
    handleCreateOrEditSubmit,
  } = useSleeveFormState(props);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl text-zinc-900 dark:text-zinc-100 flex flex-col max-h-dvh sm:max-h-[90vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-600 dark:text-red-500" />
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            {editingSleeve
              ? 'Editar Paquete de Fundas'
              : activeTab === 'add_stock'
              ? 'Añadir Stock a Fundas'
              : 'Registrar Nuevas Fundas'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pestañas de Modo (Solo si no estamos en edición) */}
      {!editingSleeve && (
        <div className="px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('add_stock');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation ${
                activeTab === 'add_stock'
                  ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs border border-zinc-200/60 dark:border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <PackagePlus className="w-4 h-4 shrink-0" />
              <span>Añadir Stock</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-11 touch-manipulation ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs border border-zinc-200/60 dark:border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Nuevo Modelo</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!editingSleeve && activeTab === 'add_stock' ? (
          <AddStockTab
            availableSleeves={availableSleeves}
            filteredSleeves={filteredSleevesForStock}
            selectedSleeve={selectedSleeve}
            selectedSleeveId={selectedSleeveId}
            onSelectSleeveId={(id) => {
              setSelectedSleeveId(id);
              setError('');
            }}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={handleCategoryFilterChange}
            addQuantity={addQuantity}
            setAddQuantity={setAddQuantity}
            suggestedQuantity={suggestedQuantity}
            sectionTotalQuantity={sectionTotalQuantity}
            onGoToCreate={() => setActiveTab('create')}
            onSubmit={handleAddStockSubmit}
          />
        ) : (
          <CreateOrEditSleeveTab
            form={form}
            update={updateForm}
            isEditing={Boolean(editingSleeve)}
            onSubmit={handleCreateOrEditSubmit}
          />
        )}

        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-500 font-bold">{error}</p>
          </div>
        )}
      </div>

      {/* Footer de Acciones */}
      <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/50">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer min-h-11 touch-manipulation"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form={!editingSleeve && activeTab === 'add_stock' ? 'add-stock-form' : 'create-sleeve-form'}
          disabled={submitting || (!editingSleeve && activeTab === 'add_stock' && !selectedSleeveId)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer min-h-11 touch-manipulation"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : !editingSleeve && activeTab === 'add_stock' ? (
            <PackagePlus className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>
            {editingSleeve
              ? 'Actualizar'
              : activeTab === 'add_stock'
              ? `Sumar +${addQuantity} Fundas`
              : 'Guardar Funda'}
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export const SleeveInventoryFormModal: React.FC<SleeveInventoryFormModalProps> = (props) => {
  const { isOpen, onClose, editingSleeve, initialTab, initialSleeveId, initialCategory } = props;
  if (!isOpen) return null;

  const contentKey = editingSleeve?.id || `${initialTab || 'add'}-${initialSleeveId || ''}-${initialCategory || ''}`;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <SleeveInventoryFormModalContent key={contentKey} {...props} />
      </div>
    </AnimatePresence>
  );
};
