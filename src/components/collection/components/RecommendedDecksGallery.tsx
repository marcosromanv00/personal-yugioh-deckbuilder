'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Swords,
  Shield,
  Zap,
  Flame,
  Search,
  ArrowUpRight,
  Eye,
  X,
  BookOpen,
  Layers,
  Wrench,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserCard, StorageLocation, Deck } from '@/types/collection';
import {
  generateRecommendedDecksFromFreeCollection,
  RecommendedDeckRecipe,
  RecommendedDeckStyle,
} from '@/lib/recommendedDecksEngine';
import { useToast } from '@/components/ui/ToastProvider';

interface RecommendedDecksGalleryProps {
  allUserCards: UserCard[];
  decks: Deck[];
  locations: StorageLocation[];
}

export const RecommendedDecksGallery: React.FC<RecommendedDecksGalleryProps> = ({
  allUserCards,
  decks,
  locations,
}) => {
  const router = useRouter();
  const toast = useToast();

  const [selectedStyle, setSelectedStyle] = useState<RecommendedDeckStyle>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDeck, setPreviewDeck] = useState<RecommendedDeckRecipe | null>(null);

  // Calcular barajas recomendadas exclusivamente de cartas libres
  const recommendedRecipes = useMemo(() => {
    return generateRecommendedDecksFromFreeCollection(allUserCards, decks);
  }, [allUserCards, decks]);

  const filteredRecipes = useMemo(() => {
    return recommendedRecipes.filter((r) => {
      const matchesStyle = selectedStyle === 'all' || r.style === selectedStyle;
      const matchesSearch =
        !searchQuery.trim() ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.archetypes.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStyle && matchesSearch;
    });
  }, [recommendedRecipes, selectedStyle, searchQuery]);

  // Handler para abrir la baraja directamente en el Taller
  const handleOpenInWorkshop = (recipe: RecommendedDeckRecipe) => {
    try {
      const draftPayload = {
        deckName: recipe.name,
        deckDescription: `${recipe.description}\n\n[Estrategia]: ${recipe.strategyGuide}`,
        format: recipe.format,
        deckCards: recipe.cards.map((c) => ({
          id: c.id,
          name: c.name,
          count: c.count,
          section: c.section,
          type: c.type,
          image_url: c.image_url || `https://images.ygoprodeck.com/images/cards/${c.id}.jpg`,
          image_url_small: c.image_url_small || c.image_url || `https://images.ygoprodeck.com/images/cards_small/${c.id}.jpg`,
          archetype: c.archetype,
          atk: c.atk,
          def: c.def,
          level: c.level,
          race: c.race,
          attribute: c.attribute,
        })),
        timestamp: Date.now(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('yg_deck_draft', JSON.stringify(draftPayload));
      }

      toast.success(`Cargando "${recipe.name}" en el Taller...`);
      router.push('/?loadDraft=1');
    } catch (err) {
      console.error('Error opening deck in workshop:', err);
      toast.error('No se pudo transferir el deck al taller');
    }
  };

  const freeCardsCount = allUserCards.filter((c) => !c.deck_id).reduce((acc, c) => acc + (c.quantity || 1), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* BANNER INFORMATIVO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-red-600/10 via-amber-500/10 to-purple-600/10 border border-red-500/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-600/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
              Decks Listos para Jugar (Colección Libre)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Barajas ensambladas tomando <strong className="text-zinc-900 dark:text-zinc-200">únicamente las {freeCardsCount} cartas no asignadas a decks activos</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Cartas Físicas Disponibles
          </span>
        </div>
      </div>

      {/* FILTROS DE ESTILO & BUSCADOR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        
        {/* Style Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todos los Estilos', icon: Layers },
            { id: 'control', label: 'Control & Trampas', icon: Shield },
            { id: 'combo', label: 'Combo & Swarm', icon: Zap },
            { id: 'ensalada', label: 'Ensalada / Fun', icon: Flame },
            { id: 'tematico', label: 'Temático / Core', icon: Swords },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedStyle === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStyle(tab.id as RecommendedDeckStyle)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-48">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por arquetipo o estilo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:border-red-500"
          />
        </div>
      </div>

      {/* GRID DE BARAJAS RECOMENDADAS */}
      {filteredRecipes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-3">
          <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            No se encontraron barajas con este filtro
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Prueba cambiando de categoría o añadiendo más cartas libres a tu inventario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 dark:hover:border-red-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-linear-to-r ${recipe.styleColor} shadow-2xs`}
                  >
                    {recipe.styleLabel}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    {recipe.format}
                  </span>
                </div>

                <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 font-display group-hover:text-red-500 transition-colors line-clamp-1">
                  {recipe.name}
                </h4>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {recipe.description}
                </p>
              </div>

              {/* Mini Grilla de Cartas Clave */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>Cartas Principales</span>
                  <span>
                    {recipe.mainDeckCount} Main • {recipe.extraDeckCount} Extra
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {recipe.keyCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="w-10 h-14 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 shadow-2xs"
                      title={`${card.count}x ${card.name}`}
                    >
                      {card.image_url_small && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={card.image_url_small}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  ))}
                  {recipe.cards.length > 5 && (
                    <div className="w-10 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-black font-mono text-zinc-500 shrink-0">
                      +{recipe.cards.length - 5}
                    </div>
                  )}
                </div>
              </div>

              {/* Ratios Breakdown Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>👾 {recipe.monsterCount} Monstruos</span>
                  <span>🔮 {recipe.spellCount} Magias</span>
                  <span>🛡️ {recipe.trapCount} Trampas</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(recipe.monsterCount / recipe.mainDeckCount) * 100}%` }}
                    className="h-full bg-amber-500"
                  />
                  <div
                    style={{ width: `${(recipe.spellCount / recipe.mainDeckCount) * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                  <div
                    style={{ width: `${(recipe.trapCount / recipe.mainDeckCount) * 100}%` }}
                    className="h-full bg-pink-500"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDeck(recipe)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Receta</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenInWorkshop(recipe)}
                  className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 transition-all flex items-center gap-1.5 cursor-pointer font-display"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Abrir en Taller</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL DE PREVIEW DETALLADA DE LA RECETA */}
      <AnimatePresence>
        {previewDeck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDeck(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-linear-to-r ${previewDeck.styleColor} flex items-center justify-center text-white shadow-xs shrink-0`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 font-display">
                      {previewDeck.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-semibold">
                      {previewDeck.styleLabel} • {previewDeck.mainDeckCount} Cartas Main • {previewDeck.extraDeckCount} Extra
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewDeck(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Guía de Estrategia */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-black uppercase tracking-wider text-[10px] flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    Guía de Estrategia y Victoria
                  </span>
                  <p className="leading-relaxed">{previewDeck.strategyGuide}</p>
                </div>

                {/* Main Deck Cards Grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                    Main Deck ({previewDeck.mainDeckCount} Cartas)
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {previewDeck.cards
                      .filter((c) => c.section === 'main')
                      .map((card, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-5/7 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xs group"
                          title={`${card.count}x ${card.name}`}
                        >
                          {card.image_url_small && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={card.image_url_small}
                              alt={card.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {card.count > 1 && (
                            <span className="absolute top-1 right-1 px-1 rounded-md bg-black/80 text-white font-mono font-black text-[9px] border border-white/20">
                              x{card.count}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Extra Deck Cards Grid */}
                {previewDeck.extraDeckCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-display">
                      Extra Deck ({previewDeck.extraDeckCount} Cartas)
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {previewDeck.cards
                        .filter((c) => c.section === 'extra')
                        .map((card, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-5/7 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xs"
                            title={`${card.count}x ${card.name}`}
                          >
                            {card.image_url_small && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={card.image_url_small}
                                alt={card.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
                            {card.count > 1 && (
                              <span className="absolute top-1 right-1 px-1 rounded-md bg-black/80 text-white font-mono font-black text-[9px] border border-white/20">
                                x{card.count}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDeck(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenInWorkshop(previewDeck);
                    setPreviewDeck(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/25 flex items-center gap-2 font-display"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Cargar en Taller</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
