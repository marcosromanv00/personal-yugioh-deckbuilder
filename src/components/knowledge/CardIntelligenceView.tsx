'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  Edit3, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  ExternalLink,
  Flame,
  BrainCircuit,
  Plus
} from 'lucide-react';
import { CardKnowledgeData, FormatType } from '@/types/knowledge';
import { EditCardKnowledgeModal } from './EditCardKnowledgeModal';
import { TeachSynergyModal } from '@/components/deckbuilder/ai/TeachSynergyModal';
import { getImplicitSynergiesForArchetype } from '@/lib/constants/archetypeSynergies';

interface CardIntelligenceViewProps {
  cardData: CardKnowledgeData;
  onKnowledgeUpdated?: (updated: CardKnowledgeData) => void;
}

export const CardIntelligenceView: React.FC<CardIntelligenceViewProps> = ({
  cardData: initialCardData,
  onKnowledgeUpdated
}) => {
  const [cardData, setCardData] = useState<CardKnowledgeData>(initialCardData);
  const [activeFormat, setActiveFormat] = useState<FormatType>('TCG');
  const [deckSearchQuery, setDeckSearchQuery] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTeachSynergyModalOpen, setIsTeachSynergyModalOpen] = useState(false);

  // Sync state if initial changes
  React.useEffect(() => {
    setCardData(initialCardData);
  }, [initialCardData]);

  const currentFormatStats = cardData.formats[activeFormat] || {
    format: activeFormat,
    ranking: { overallRank: 99, categoryRank: 50, categoryName: 'Among Monsters', overallUsagePercent: 10 },
    archetypeBreakdowns: [],
    recentDecks: []
  };

  // Filtrado de arquetipos por búsqueda reactiva
  const filteredArchetypes = useMemo(() => {
    if (!deckSearchQuery.trim()) return currentFormatStats.archetypeBreakdowns;
    const query = deckSearchQuery.toLowerCase();
    return currentFormatStats.archetypeBreakdowns.filter(a =>
      a.archetypeName.toLowerCase().includes(query)
    );
  }, [currentFormatStats.archetypeBreakdowns, deckSearchQuery]);

  // Sinergias implícitas si la carta tiene arquetipo principal
  const implicitSynergies = useMemo(() => {
    if (!cardData.archetype) return [];
    return getImplicitSynergiesForArchetype(cardData.archetype);
  }, [cardData.archetype]);

  const handleUpdateSuccess = (updated: CardKnowledgeData) => {
    setCardData(updated);
    if (onKnowledgeUpdated) {
      onKnowledgeUpdated(updated);
    }
  };

  return (
    <div className="w-full space-y-6 text-zinc-900 dark:text-zinc-100 pb-12 transition-colors duration-200">
      {/* Top Banner / Card Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Card Image */}
          <div className="relative shrink-0 w-36 sm:w-44 aspect-[59/86] rounded-xl overflow-hidden shadow-md border border-zinc-300 dark:border-zinc-700/80 group bg-zinc-950">
            <Image
              src={cardData.imageUrl || cardData.imageUrlSmall}
              alt={cardData.cardName}
              fill
              sizes="(max-width: 768px) 144px, 176px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority
            />
          </div>

          {/* Card Details & Actions */}
          <div className="flex-1 space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
                    {cardData.cardName}
                  </h1>
                  {cardData.is_user_verified && (
                    <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Regla Verificada por Usuario
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex-wrap">
                  {cardData.attribute && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono font-bold">
                      {cardData.attribute}
                    </span>
                  )}
                  {cardData.race && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono font-bold">
                      {cardData.race}
                    </span>
                  )}
                  {cardData.type && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono font-bold">
                      {cardData.type}
                    </span>
                  )}
                  {cardData.archetype && (
                    <span className="px-2.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 font-bold">
                      Arquetipo: {cardData.archetype}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeachSynergyModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800/60 hover:bg-cyan-100 dark:hover:bg-cyan-950/70 text-cyan-700 dark:text-cyan-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-display"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Enseñar Sinergia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all cursor-pointer font-display"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Corregir Interpretación IA</span>
                </button>
              </div>
            </div>

            {/* Effect Description */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
              {cardData.desc}
            </div>

            {/* Market & Release Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">TCGplayer Market</div>
                  <div className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
                    ${cardData.marketInfo.tcgplayerPrice?.toFixed(2) || '0.12'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Release TCG</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate font-mono">
                    {cardData.marketInfo.releaseDates.tcg || 'Aug 2020'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Release OCG</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate font-mono">
                    {cardData.marketInfo.releaseDates.ocg || 'Apr 2020'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Release MD</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate font-mono">
                    {cardData.marketInfo.releaseDates.masterDuel || 'Jan 2022'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Format Selector Pills (TCG Stats | OCG Stats | Master Duel Stats) */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          {(['TCG', 'OCG', 'Master Duel'] as FormatType[]).map((fmt) => {
            const isSelected = activeFormat === fmt;
            return (
              <button
                type="button"
                key={fmt}
                onClick={() => setActiveFormat(fmt)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-display ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {fmt} Stats
              </button>
            );
          })}
        </div>
      </div>

      {/* Popularity Ranking Section */}
      <div className="space-y-3">
        <h2 className="text-center text-xs font-black tracking-widest text-zinc-500 uppercase font-mono">
          Popularity Ranking (YuGiOhMeta / MDM Reference)
        </h2>
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          {/* Overall Rank Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
            <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono mb-0.5">Overall Rank</div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-500 font-display">
              {currentFormatStats.ranking.overallRank}th
            </div>
          </div>

          {/* Category Rank Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
            <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono mb-0.5">
              {currentFormatStats.ranking.categoryName}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-500 font-display">
              {currentFormatStats.ranking.categoryRank}th
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Usage Statistics Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
              Desglose de Torneos por Arquetipo
            </h2>
            <p className="text-xs text-zinc-500">
              Distribución de copias jugadas (3x / 2x / 1x / 0x) en torneos oficiales.
            </p>
          </div>

          {/* Search Bar inside Decks */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar mazo..."
              value={deckSearchQuery}
              onChange={(e) => setDeckSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Archetype Breakdown Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredArchetypes.map((arch, index) => (
            <motion.div
              key={arch.archetypeName + index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <Image
                      src={arch.archetypeBadgeImage || cardData.imageUrlSmall}
                      alt={arch.archetypeName}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate font-display">
                      {arch.archetypeName}
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {arch.sampleDeckCount ? `${arch.sampleDeckCount} decks` : 'Meta Oficial'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ratios Breakdown (3x | 2x | 1x | 0x) */}
              <div className="grid grid-cols-4 gap-1 pt-0.5">
                {/* 3x */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[9px] font-black font-mono text-red-600 dark:text-red-400">3x</span>
                  <span className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-200">{arch.ratio_3x_pct}%</span>
                  <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${arch.ratio_3x_pct}%` }} />
                  </div>
                </div>

                {/* 2x */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[9px] font-black font-mono text-amber-500">2x</span>
                  <span className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-200">{arch.ratio_2x_pct}%</span>
                  <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${arch.ratio_2x_pct}%` }} />
                  </div>
                </div>

                {/* 1x */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[9px] font-black font-mono text-cyan-600 dark:text-cyan-400">1x</span>
                  <span className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-200">{arch.ratio_1x_pct}%</span>
                  <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${arch.ratio_1x_pct}%` }} />
                  </div>
                </div>

                {/* 0x */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[9px] font-black font-mono text-zinc-400">0x</span>
                  <span className="text-[11px] font-mono font-bold text-zinc-500">{arch.ratio_0x_pct}%</span>
                  <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full" style={{ width: `${arch.ratio_0x_pct}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredArchetypes.length === 0 && (
          <div className="p-6 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
            No se encontraron arquetipos que coincidan con &quot;{deckSearchQuery}&quot;.
          </div>
        )}
      </div>

      {/* Rulings & Judge Decisions Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-600 dark:text-red-500" />
            <span>Rulings Oficiales y Decisiones de Juez</span>
          </h2>
          <span className="text-[10px] font-mono text-zinc-500">{cardData.rulings.length} rulings indexados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cardData.rulings.map((ruling, idx) => (
            <div
              key={ruling.id || idx}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 font-display">{ruling.topic}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-mono font-semibold">
                  {ruling.source}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">{ruling.rulingText}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sinergias Implícitas & Cross-Engines */}
      {implicitSynergies.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Sinergias Implícitas & Soporte No Nominal ({cardData.archetype})</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">{implicitSynergies.length} cartas de soporte</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {implicitSynergies.map((syn, idx) => (
              <div
                key={syn.cardName + idx}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 hover:border-red-500/40 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{syn.cardName}</span>
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono">
                    {syn.role}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{syn.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Decks Recientes */}
      {currentFormatStats.recentDecks && currentFormatStats.recentDecks.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Top Decks Recientes en Torneos ({activeFormat})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentFormatStats.recentDecks.map((deck) => (
              <div
                key={deck.id}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{deck.deckName}</div>
                  <div className="text-[11px] text-zinc-500">
                    {deck.tournamentName} • {deck.player} ({deck.placement})
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-mono font-bold">
                  {deck.copiesUsed}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <EditCardKnowledgeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        cardData={cardData}
        activeFormat={activeFormat}
        onKnowledgeUpdated={handleUpdateSuccess}
      />

      <TeachSynergyModal
        isOpen={isTeachSynergyModalOpen}
        onClose={() => setIsTeachSynergyModalOpen(false)}
        defaultArchetype={cardData.archetype || ''}
        defaultCardName={cardData.cardName}
      />
    </div>
  );
};
