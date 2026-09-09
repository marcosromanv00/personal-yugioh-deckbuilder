import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ValuationSubTab } from './valuation.types';

export interface ValuationSubTabItem {
  id: ValuationSubTab;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface ValuationSubTabsNavProps {
  tabs: ValuationSubTabItem[];
  activeTab: ValuationSubTab;
  onSelectTab: (tab: ValuationSubTab) => void;
}

export const ValuationSubTabsNav: React.FC<ValuationSubTabsNavProps> = ({
  tabs,
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer touch-manipulation ${
              isActive
                ? 'bg-red-600 text-white shadow-xs font-black'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
