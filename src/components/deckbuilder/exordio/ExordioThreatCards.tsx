'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Info, X } from 'lucide-react';
import { ThreatCardItem } from '@/lib/engines/exordioAnalytics';

interface ExordioThreatCardsProps {
  threats: ThreatCardItem[];
  format?: string;
}

export const ExordioThreatCards: React.FC<ExordioThreatCardsProps> = ({
  threats,
  format = 'TCG',
}) => {
  const [selectedThreat, setSelectedThreat] = useState<ThreatCardItem | null>(null);

  const renderDangerBars = (level: number) => {
    return (
      <div className="flex items-center gap-1 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm ${
              i < level
                ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                : 'bg-zinc-300 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto tech-cut-tr overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-xl transition-colors relative">
      {/* Header Banner Estilo Exordio */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-red-600 text-white font-black tracking-wider text-sm md:text-base border-b border-red-700 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="bg-white text-red-600 px-2.5 py-0.5 font-black text-xs uppercase shadow-sm tech-cut-tr">
            [ 03 ] THREAT CARDS
          </span>
          <span className="italic font-black text-white/90">Deck Analysis - {format} Format</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-red-200 font-bold hidden sm:inline tracking-widest">// VULNERABILITIES //</span>
          <span className="text-[10px] font-mono text-white font-black tracking-widest">+ + +</span>
          <ShieldAlert className="w-5 h-5 text-amber-300 animate-pulse" />
        </div>
      </div>

      {/* Titular Central */}
      <div className="text-center pt-5 sm:pt-6 pb-2 px-4">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
          THREAT CARDS
        </h2>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-0.5">
          (ES: cartas peligrosas contra esta estrategia)
        </p>
      </div>

      {/* Galería Horizontal de Amenazas */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {threats.map((threat) => (
            <motion.div
              key={threat.id}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => setSelectedThreat(threat)}
              className="cursor-pointer flex flex-col items-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10 transition-all group"
            >
              {/* Header de peligro */}
              <div className="w-full flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-500">
                    DANGER ({threat.dangerLevel}/4)
                  </span>
                </div>
              </div>

              {/* Barra de peligro */}
              <div className="w-full mb-3">{renderDangerBars(threat.dangerLevel)}</div>

              {/* Imagen Vertical de la Carta */}
              <div className="w-full aspect-2/3 relative rounded-lg overflow-hidden border-2 border-red-500/40 shadow-md group-hover:border-red-500 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
                <Image
                  src={threat.image_url}
                  alt={threat.name}
                  fill
                  sizes="160px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>

              {/* Nombre con subrayado rojo */}
              <div className="mt-3 text-center w-full">
                <span className="text-xs font-black italic tracking-wide text-zinc-900 dark:text-white block truncate">
                  {threat.name}
                </span>
                <div className="h-0.5 w-8 mx-auto mt-1 bg-red-500 rounded-full group-hover:w-full transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal / Ficha Táctica Detallada */}
        <AnimatePresence>
          {selectedThreat && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 p-4 rounded-xl border border-red-500/40 bg-red-950/20 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{selectedThreat.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-mono uppercase font-bold">
                      Nivel {selectedThreat.dangerLevel}/4
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {selectedThreat.reason}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
