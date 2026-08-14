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
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[hsl(224,22%,9%)]/95 backdrop-blur-md border-t border-[hsl(224,15%,16%)] pb-safe"
    >
      <div className="flex items-stretch h-16">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors touch-manipulation cursor-pointer ${
                isActive ? 'text-[hsl(263,85%,72%)]' : 'text-[hsl(215,15%,55%)]'
              }`}
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[hsl(263,85%,64%)]"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}

              {/* Icon with badge for deck count */}
              <div className="relative">
                {tab.icon}
                {tab.id === 'deck' && mainCardsCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[hsl(263,85%,64%)] text-white text-[9px] font-black font-mono px-1 py-px rounded-full leading-none min-w-[1rem] text-center">
                    {mainCardsCount}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
