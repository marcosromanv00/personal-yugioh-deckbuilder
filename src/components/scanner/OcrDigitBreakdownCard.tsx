import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { DigitMetric } from '@/lib/ocr/ocrDigitStatsStore';

interface OcrDigitBreakdownCardProps {
  digitData: DigitMetric;
}

export const OcrDigitBreakdownCard: React.FC<OcrDigitBreakdownCardProps> = ({ digitData }) => {
  const total = digitData.hits + digitData.misses;
  const accuracy = total > 0 ? Math.round((digitData.hits / total) * 100) : 100;

  const topConfusionEntry = Object.entries(digitData.confusions)
    .map(([digit, count]) => [digit, Number(count)] as const)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)[0];

  const isGood = accuracy >= 80 || total === 0;
  const isModerate = accuracy >= 50 && accuracy < 80;

  return (
    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/70 hover:border-zinc-700 transition-colors space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-mono font-bold text-base text-zinc-100">
            {digitData.digit}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-200">
                {accuracy}% precisión
              </span>
              {total === 0 ? (
                <span className="text-xs text-zinc-400">Sin datos</span>
              ) : isGood ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <span className="text-xs text-zinc-400">
              {digitData.hits} aciertos · {digitData.misses} fallos
            </span>
          </div>
        </div>

        <div className="w-16 flex flex-col items-end gap-1">
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                isGood ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${total === 0 ? 100 : accuracy}%` }}
            />
          </div>
        </div>
      </div>

      {topConfusionEntry && digitData.misses > 0 && (
        <div className="pt-1.5 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-zinc-400">Fallo común:</span>
          <span className="flex items-center gap-1 font-mono text-zinc-300">
            <span>{digitData.digit}</span>
            <ArrowRight className="w-3 h-3 text-red-400" />
            <span className="font-bold text-red-400">{topConfusionEntry[0]}</span>
            <span className="text-zinc-400">({topConfusionEntry[1]}x)</span>
          </span>
        </div>
      )}
    </div>
  );
};
