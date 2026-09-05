'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Box, Shield, Layers } from 'lucide-react';
import { SaveDeckModalProps } from '../types/saveDeckModal.types';
import { SaveDeckWizardHeader } from './save-wizard/SaveDeckWizardHeader';
import { SaveDeckWizardFooter } from './save-wizard/SaveDeckWizardFooter';
import { SaveDeckStep1Basic } from './save-wizard/SaveDeckStep1Basic';
import { SaveDeckStep2Storage } from './save-wizard/SaveDeckStep2Storage';
import { SaveDeckStep3Sleeves } from './save-wizard/SaveDeckStep3Sleeves';
import { SaveDeckStep4Inventory } from './save-wizard/SaveDeckStep4Inventory';

const WIZARD_STEPS = [
  { id: 1, label: 'Datos Básicos', icon: Sparkles },
  { id: 2, label: 'Almacenamiento', icon: Box },
  { id: 3, label: 'Fundas', icon: Shield },
  { id: 4, label: 'Guardar', icon: Layers },
];

export const SaveDeckModal: React.FC<SaveDeckModalProps> = ({
  isOpen,
  onClose,
  deckName,
  setDeckName,
  deckDescription,
  setDeckDescription,
  saveFormat,
  setSaveFormat,
  saveIsActive,
  setSaveIsActive,
  deckCards,
  loadingDecks,
  locations,
  userInventoryCounts = {},
  registerToInventory,
  setRegisterToInventory,
  targetLocationId,
  setTargetLocationId,
  selectedLaneIndex = 0,
  setSelectedLaneIndex,
  cardsToRegister,
  setCardsToRegister,
  availableSleeves,
  selectedMainSleeveId,
  setSelectedMainSleeveId,
  mainSleeveMode = 'take',
  setMainSleeveMode = () => {},
  mainSleeveAddedQty = 60,
  setMainSleeveAddedQty = () => {},
  selectedExtraSleeveId,
  setSelectedExtraSleeveId,
  extraSleeveMode = 'take',
  setExtraSleeveMode = () => {},
  extraSleeveAddedQty = 15,
  setExtraSleeveAddedQty = () => {},
  handleSaveDeck,
  extractionPickList = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [cardQuantities, setCardQuantities] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    deckCards.forEach((c) => { init[c.id] = c.count; });
    return init;
  });

  if (!isOpen) return null;

  const totalCards = deckCards.reduce((acc, c) => acc + c.count, 0);
  const totalMainSide = deckCards.filter((c) => c.section === 'main' || c.section === 'side').reduce((sum, c) => sum + c.count, 0);
  const totalExtra = deckCards.filter((c) => c.section === 'extra').reduce((sum, c) => sum + c.count, 0);
  const selectedLoc = locations.find((l) => l.id === targetLocationId);
  const mainSleeve = availableSleeves.find((s) => s.id === selectedMainSleeveId);
  const extraSleeve = availableSleeves.find((s) => s.id === selectedExtraSleeveId);
  const canProceed = currentStep !== 1 || Boolean(deckName.trim());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[92vh]"
        >
          <SaveDeckWizardHeader
            currentStep={currentStep}
            totalCards={totalCards}
            totalMainSide={totalMainSide}
            totalExtra={totalExtra}
            steps={WIZARD_STEPS}
            canProceed={canProceed}
            onStepClick={(id) => setCurrentStep(id)}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
            {currentStep === 1 && (
              <SaveDeckStep1Basic
                deckName={deckName}
                setDeckName={setDeckName}
                deckDescription={deckDescription}
                setDeckDescription={setDeckDescription}
                saveFormat={saveFormat}
                setSaveFormat={setSaveFormat}
                saveIsActive={saveIsActive}
                setSaveIsActive={setSaveIsActive}
              />
            )}
            {currentStep === 2 && (
              <SaveDeckStep2Storage
                locations={locations}
                targetLocationId={targetLocationId}
                setTargetLocationId={setTargetLocationId}
                selectedLaneIndex={selectedLaneIndex}
                setSelectedLaneIndex={setSelectedLaneIndex}
                extractionPickList={extractionPickList}
              />
            )}
            {currentStep === 3 && (
              <SaveDeckStep3Sleeves
                availableSleeves={availableSleeves}
                selectedMainSleeveId={selectedMainSleeveId}
                setSelectedMainSleeveId={setSelectedMainSleeveId}
                mainSleeveMode={mainSleeveMode}
                setMainSleeveMode={setMainSleeveMode}
                mainSleeveAddedQty={mainSleeveAddedQty}
                setMainSleeveAddedQty={setMainSleeveAddedQty}
                selectedExtraSleeveId={selectedExtraSleeveId}
                setSelectedExtraSleeveId={setSelectedExtraSleeveId}
                extraSleeveMode={extraSleeveMode}
                setExtraSleeveMode={setExtraSleeveMode}
                extraSleeveAddedQty={extraSleeveAddedQty}
                setExtraSleeveAddedQty={setExtraSleeveAddedQty}
                totalMainSideCards={totalMainSide}
                totalExtraCards={totalExtra}
              />
            )}
            {currentStep === 4 && (
              <SaveDeckStep4Inventory
                deckCards={deckCards}
                registerToInventory={registerToInventory}
                setRegisterToInventory={setRegisterToInventory}
                cardsToRegister={cardsToRegister}
                setCardsToRegister={setCardsToRegister}
                userInventoryCounts={userInventoryCounts}
                cardQuantities={cardQuantities}
                setCardQuantities={setCardQuantities}
                deckName={deckName}
                saveFormat={saveFormat}
                saveIsActive={saveIsActive}
                targetLocationName={selectedLoc?.name || 'Inbox'}
                mainSleeveName={mainSleeve?.name}
                extraSleeveName={extraSleeve?.name}
              />
            )}
          </div>

          <SaveDeckWizardFooter
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            canProceed={canProceed}
            loadingDecks={loadingDecks}
            onPrev={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            onNext={() => setCurrentStep((prev) => Math.min(WIZARD_STEPS.length, prev + 1))}
            onSave={handleSaveDeck}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
