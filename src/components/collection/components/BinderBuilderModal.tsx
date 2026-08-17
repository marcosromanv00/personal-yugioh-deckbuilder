'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BinderBuilder from '../BinderBuilder';

interface BinderBuilderModalProps {
  isOpen: boolean;
  binderId: string | null;
  onClose: () => void;
}

export const BinderBuilderModal: React.FC<BinderBuilderModalProps> = ({
  isOpen,
  binderId,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && binderId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden"
        >
          <motion.div
            initial={{ y: 20, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative w-full max-w-7xl h-full md:h-[90vh] max-h-screen md:max-h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none md:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100"
          >
            <BinderBuilder binderId={binderId} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
