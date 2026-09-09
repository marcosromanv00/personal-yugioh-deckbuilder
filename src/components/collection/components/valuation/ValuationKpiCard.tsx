import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ValuationKpiItem {
  title: string;
  titleColor: string;
  iconBg: string;
  icon: LucideIcon;
  value: number;
  valueColor: string;
  footerLeft: string;
  footerRight: string;
}

interface ValuationKpiCardProps {
  kpi: ValuationKpiItem;
  currencySymbol: string;
}

export const ValuationKpiCard: React.FC<ValuationKpiCardProps> = ({ kpi, currencySymbol }) => {
  const Icon = kpi.icon;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-black uppercase tracking-wider font-mono ${kpi.titleColor}`}>
          {kpi.title}
        </span>
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${kpi.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className={`text-3xl font-black font-mono tracking-tight ${kpi.valueColor}`}>
          {currencySymbol}
          {kpi.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
          <span>{kpi.footerLeft}</span>
          <span>{kpi.footerRight}</span>
        </div>
      </div>
    </div>
  );
};
