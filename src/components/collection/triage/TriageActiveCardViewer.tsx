'use client';

import React, { useMemo } from 'react';
import { Sparkles, Award, Layers, ExternalLink } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { CardSetPrintingsResponse } from '@/types/triage';
import { analyzeRarityDisparity } from '@/lib/rarityDisparity.utils';
import { TriageRarityAlertBanner } from './components/TriageRarityAlertBanner';
import { TriageExternalLinks } from './components/TriageExternalLinks';

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
  const details = card?.card_details;
  const imgUrl = details?.image_url || details?.image_url_small;
  const hasCustomPrice = card?.sale_price !== null && card?.sale_price !== undefined;

  const rarityEval = useMemo(
    () => setsData?.rarityAlert || analyzeRarityDisparity(setsData),
    [setsData]
  );

  const isHighValue = Boolean(
    (hasCustomPrice && card!.sale_price! >= 3.0) ||
      setsData?.highValueWarning ||
      rarityEval.hasDisparity
  );

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

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-y-auto select-text">
      {/* ─── Columna Izquierda: Imagen Grande de la Carta y Selector de Rareza ─── */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`relative rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
            isHighValue
              ? 'ring-4 ring-amber-400/80 dark:ring-amber-400/60 shadow-amber-500/20 shadow-2xl'
              : 'border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          {imgUrl ? (
            <a
              href={imgUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir imagen en nueva ventana (soporta click con rueda del ratón)"
              className="block group relative cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={details?.name || 'Carta'}
                className="w-56 sm:w-64 md:w-72 rounded-2xl object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-2.5 py-1 rounded-lg bg-black/80 text-white font-mono text-[10.5px] flex items-center gap-1.5 shadow-md">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Arte Completo</span>
                </span>
              </div>
            </a>
          ) : (
            <div className="w-56 sm:w-64 md:w-72 h-80 sm:h-96 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400">
              Sin imagen
            </div>
          )}

          {isHighValue && (
            <div className="absolute top-2 right-2 bg-amber-500 text-zinc-950 text-[10px] font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider select-none">
              <Award className="w-3 h-3" />
              <span>{rarityEval.hasCollectorRarity ? 'Colección' : 'Alto Valor'}</span>
            </div>
          )}
        </div>

        {/* Botón para cambiar Rareza y Ver Precios */}
        <button
          type="button"
          onClick={onOpenRarityModal}
          className={`mt-3.5 w-full max-w-72 py-2 px-3.5 rounded-xl border bg-white dark:bg-zinc-900 text-xs font-mono font-bold flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs cursor-pointer transition-all active:scale-98 ${
            rarityEval.hasDisparity
              ? 'border-amber-400 dark:border-amber-500/80 hover:border-amber-500'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-red-500'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${rarityEval.hasDisparity ? 'text-amber-500' : 'text-red-600 dark:text-red-400'}`} />
            <span className="truncate text-zinc-800 dark:text-zinc-200">{card.rarity || 'Common'}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasCustomPrice ? (
              <span className="text-[11px] font-mono font-black text-amber-600 dark:text-amber-400" title="Valuación personalizada">
                ${card.sale_price!.toFixed(2)}
              </span>
            ) : (
              <span className={`text-[11px] font-mono font-black ${rarityEval.hasDisparity ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                ${(setsData?.marketPriceTcg ?? 0.25).toFixed(2)}
              </span>
            )}
            <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] text-zinc-500 rounded font-mono">
              R
            </kbd>
          </div>
        </button>
      </div>

      {/* ─── Columna Derecha: Alerta de Rareza, Atributos y Efecto Seleccionable ─── */}
      <div className="flex-1 space-y-3.5 select-text">
        {/* Banner Visible desde Afuera de Disparidad de Rareza */}
        <TriageRarityAlertBanner
          evaluation={rarityEval}
          onOpenRarityModal={onOpenRarityModal}
        />

        {/* Cabecera del Monstruo/Mágica/Trampa y Enlaces a Nueva Ventana */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight select-text">
              {details?.name || 'Nombre Desconocido'}
            </h2>
            <TriageExternalLinks cardName={details?.name || ''} cardId={card.card_id} />
          </div>

          {(details?.atk !== undefined || details?.def !== undefined) && (
            <div className="flex items-center gap-4 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-1 select-text">
              {details.level !== undefined && <span>Nivel/Rango: {details.level}</span>}
              <span>ATK: {details.atk ?? '?'}</span>
              <span>DEF: {details.def ?? '?'}</span>
            </div>
          )}
        </div>

        {/* Caja de Efecto con Texto 100% Seleccionable para Copiar y Pegar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2 select-text">
          <div className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider select-none">
            Efecto / Descripción de la Carta:
          </div>
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans whitespace-pre-line select-text cursor-text">
            {details?.desc || 'Sin descripción disponible.'}
          </p>
        </div>
      </div>
    </div>
  );
};
