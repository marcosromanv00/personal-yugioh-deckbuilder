'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, LayoutList, TrendingUp, MoreHorizontal } from 'lucide-react';

export type MobileTab = 'deck' | 'search' | 'meta' | 'more';

interface MobileNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  mainCardsCount: number;
}

const TABS: {
  id: MobileTab;
  icon: React.ReactNode;
  label: string;
}[] = [
  {
    id: 'search',
    icon: <Search className="w-5 h-5" />,
    label: 'Buscar',
  },
  {
    id: 'deck',
    icon: <LayoutList className="w-5 h-5" />,
    label: 'Deck',
  },
  {
    id: 'meta',
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'Meta',
  },
  {
    id: 'more',
    icon: <MoreHorizontal className="w-5 h-5" />,
    label: 'Más',
  },
];

/**
 * MobileNav — Bottom navigation bar (mobile only, hidden on md+).
 * Renders a fixed bottom tab bar with 4 tabs.
 * Active tab is highlighted with an animated pill indicator.
 */
export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  mainCardsCount,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe shadow-lg"
    >
      <div className="flex items-stretch h-16">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors touch-manipulation cursor-pointer ${
                isActive
                  ? 'text-red-600 dark:text-red-500 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-red-600 shadow-sm shadow-red-600/50"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}

              {/* Icon with badge for deck count */}
              <div className="relative">
                {tab.icon}
                {tab.id === 'deck' && mainCardsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black font-mono px-1 py-px rounded-full leading-none min-w-4 text-center shadow-xs">
                    {mainCardsCount}
                  </span>
                )}
              </div>

              <span className="text-[10px] uppercase tracking-wider font-bold leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
