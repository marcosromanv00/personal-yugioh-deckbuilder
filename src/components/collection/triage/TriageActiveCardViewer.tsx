'use client';

import React from 'react';
import { Tag, Sparkles, DollarSign, Award, Layers } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { CardSetPrintingsResponse } from '@/types/triage';

interface TriageActiveCardViewerProps {
  card: UserCard | null;
  setsData: CardSetPrintingsResponse | null;
  onOpenRarityModal: () => void;
}

export const TriageActiveCardViewer: React.FC<TriageActiveCardViewerProps> = ({
  card,
  setsData,
  onOpenRarityModal,
}) => {
  if (!card) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <Layers className="w-12 h-12 text-zinc-400 mb-3 opacity-40" />
        <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">No hay cartas en este alcance</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Cambia el contenedor o desactiva el filtro de &quot;Solo pendientes&quot; en la barra superior.
        </p>
      </div>
    );
  }

  const details = card.card_details;
  const imgUrl = details?.image_url || details?.image_url_small;
  const hasCustomPrice = card.sale_price !== null && card.sale_price !== undefined;
  const isHighValue = Boolean(
    (hasCustomPrice && card.sale_price! >= 3.0) || setsData?.highValueWarning
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-y-auto">
      {/* ─── Columna Izquierda: Imagen Grande de la Carta ─── */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`relative rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
            isHighValue
              ? 'ring-4 ring-amber-400/80 dark:ring-amber-400/60 shadow-amber-500/20 shadow-2xl'
              : 'border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt={details?.name || 'Carta'}
              className="w-56 sm:w-64 md:w-72 rounded-2xl object-cover select-none"
            />
          ) : (
            <div className="w-56 sm:w-64 md:w-72 h-80 sm:h-96 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400">
              Sin imagen
            </div>
          )}

          {isHighValue && (
            <div className="absolute top-2 right-2 bg-amber-500 text-zinc-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
              <Award className="w-3 h-3" />
              <span>Alto Valor</span>
            </div>
          )}
        </div>

        {/* Botón para cambiar Rareza y Ver Precios */}
        <button
          type="button"
          onClick={onOpenRarityModal}
          className="mt-3.5 w-full max-w-72 py-2 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500 text-xs font-mono font-bold flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs cursor-pointer transition-all active:scale-98"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="truncate text-zinc-800 dark:text-zinc-200">{card.rarity || 'Common'}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasCustomPrice ? (
              <span
                className="text-[11px] font-mono font-black text-amber-600 dark:text-amber-400"
                title="Valuación personalizada asignada"
              >
                ${card.sale_price!.toFixed(2)}
              </span>
            ) : (
              <span
                className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400"
                title="Precio oficial de mercado TCGPlayer"
              >
                ${(setsData?.marketPriceTcg ?? 0.25).toFixed(2)}
              </span>
            )}
            <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] text-zinc-500 rounded font-mono">
              R
            </kbd>
          </div>
        </button>
      </div>

      {/* ─── Columna Derecha: Detalles, Atributos y Efecto Completo ─── */}
      <div className="flex-1 space-y-4">
        {/* Cabecera del Monstruo/Mágica/Trampa */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {details?.type || 'Carta'}
            </span>
            {details?.attribute && (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {details.attribute}
              </span>
            )}
            {details?.race && (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                {details.race}
              </span>
            )}
            {details?.archetype && (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {details.archetype}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {details?.name || 'Nombre Desconocido'}
          </h2>

          {(details?.atk !== undefined || details?.def !== undefined) && (
            <div className="flex items-center gap-4 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-1">
              {details.level !== undefined && <span>Nivel/Rango: {details.level}</span>}
              <span>ATK: {details.atk ?? '?' }</span>
              <span>DEF: {details.def ?? '?'}</span>
            </div>
          )}
        </div>

        {/* Caja de Efecto / Descripción con Tipografía Optimizada */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Efecto / Descripción de la Carta:
          </div>
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans whitespace-pre-line">
            {details?.desc || 'Sin descripción disponible.'}
          </p>
        </div>
      </div>
    </div>
  );
};
