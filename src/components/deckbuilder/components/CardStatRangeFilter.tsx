import React from 'react';

interface CardStatRangeFilterProps {
  label: string;
  minVal: string;
  maxVal: string;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
}

export const CardStatRangeFilter: React.FC<CardStatRangeFilterProps> = ({
  label,
  minVal,
  maxVal,
  onMinChange,
  onMaxChange,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 font-mono">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={minVal}
          onChange={(e) => onMinChange(e.target.value)}
          className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-mono font-bold shadow-xs transition-colors"
        />
        <span className="text-zinc-400 text-xs font-bold">-</span>
        <input
          type="number"
          placeholder="Max"
          value={maxVal}
          onChange={(e) => onMaxChange(e.target.value)}
          className="w-full p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 font-mono font-bold shadow-xs transition-colors"
        />
      </div>
    </div>
  );
};
