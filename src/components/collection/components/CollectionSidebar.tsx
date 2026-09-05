'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Sparkles, 
  Shield, 
  FileText, 
  Layers, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Plus,
  Inbox,
  TrendingUp
} from 'lucide-react';

export type CollectionTab = 'containers' | 'suggestions' | 'sleeves' | 'decks' | 'complete' | 'favorites' | 'valuation';

interface CollectionSidebarProps {
  activeTab: CollectionTab;
  setActiveTab: (tab: CollectionTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileOpen: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Counts for badges
  containersCount: number;
  suggestionsCount: number;
  sleevesCount: number;
  decksCount: number;
  totalCardsCount: number;
  inboxCount: number;
  onOpenInbox?: () => void;
  onNewContainerClick?: () => void;
  onPrefetchFullCollection?: () => void;
}

interface SidebarNavItem {
  id: CollectionTab;
  label: string;
  icon: React.ElementType;
  count?: number;
  color: string;
  isNew?: boolean;
}

export const CollectionSidebar: React.FC<CollectionSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  containersCount,
  suggestionsCount,
  sleevesCount,
  decksCount,
  totalCardsCount,
  inboxCount,
  onOpenInbox,
  onNewContainerClick,
  onPrefetchFullCollection,
}) => {
  const physicalNavItems: SidebarNavItem[] = [
    {
      id: 'containers' as CollectionTab,
      label: 'Almacenamiento',
      icon: Box,
      count: containersCount,
      color: 'text-zinc-700 dark:text-zinc-300',
    },
    {
      id: 'decks' as CollectionTab,
      label: 'Mis Decks',
      icon: FileText,
      count: decksCount,
      color: 'text-zinc-700 dark:text-zinc-300',
    },
    {
      id: 'sleeves' as CollectionTab,
      label: 'Mis Fundas',
      icon: Shield,
      count: sleevesCount,
      color: 'text-zinc-700 dark:text-zinc-300',
    },
    {
      id: 'complete' as CollectionTab,
      label: 'Colección',
      icon: Layers,
      count: totalCardsCount,
      color: 'text-zinc-700 dark:text-zinc-300',
    },
  ];

  const intelligenceNavItems: SidebarNavItem[] = [
    {
      id: 'suggestions' as CollectionTab,
      label: 'Sugerencias',
      icon: Sparkles,
      count: suggestionsCount,
      color: 'text-amber-500',
      isNew: true,
    },
    {
      id: 'valuation' as CollectionTab,
      label: 'Costos & Valor',
      icon: TrendingUp,
      color: 'text-emerald-500',
    },
    {
      id: 'favorites' as CollectionTab,
      label: 'Favoritas',
      icon: Heart,
      color: 'text-red-500',
    },
  ];

  const renderNavGroup = (title: string, items: SidebarNavItem[]) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
            {title}
          </span>
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const isHeavyTab = item.id === 'complete' || item.id === 'favorites' || item.id === 'valuation' || item.id === 'suggestions';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              onMouseEnter={() => {
                if (isHeavyTab) onPrefetchFullCollection?.();
              }}
              onFocus={() => {
                if (isHeavyTab) onPrefetchFullCollection?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer text-xs font-bold ${
                isActive
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-xs border-l-2 border-red-600'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={item.label}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-600 dark:text-red-400' : item.color} ${item.id === 'favorites' && isActive ? 'fill-red-500' : ''}`} />
                {isCollapsed && item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white font-mono text-[8px] font-bold px-1 rounded-full">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate uppercase font-display tracking-wider">
                    {item.label}
                  </span>
                  {item.count !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ml-1.5 ${
                      isActive
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-3 select-none">
      {/* Navigation Groups */}
      <div className="space-y-4">
        {/* Header de Sidebar */}
        <div className="flex items-center justify-between px-2 pt-1">
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
              Vistas de Colección
            </span>
          )}
          {/* Botón Colapsar (Solo Desktop) */}
          <button
            type="button"
            onClick={() => setIsCollapsed(p => !p)}
            className="hidden lg:flex p-1 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer ml-auto"
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sección 1: Inventario Físico */}
        {renderNavGroup('Inventario Físico', physicalNavItems)}

        {/* Sección 2: Inteligencia & Análisis */}
        {renderNavGroup('Inteligencia & Análisis', intelligenceNavItems)}
      </div>

      {/* Quick Inbox & Container Actions at Bottom */}
      <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        {inboxCount > 0 && onOpenInbox && (
          <button
            type="button"
            onClick={onOpenInbox}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all cursor-pointer text-xs font-bold ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title={`📥 Inbox (${inboxCount} cartas sin clasificar)`}
          >
            <Inbox className="w-4 h-4 text-amber-500 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className="truncate uppercase font-display tracking-wider">Inbox</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500 text-zinc-950 rounded-full font-black">
                  {inboxCount}
                </span>
              </div>
            )}
          </button>
        )}

        {onNewContainerClick && (
          <button
            type="button"
            onClick={onNewContainerClick}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer text-xs font-black uppercase tracking-wider shadow-sm min-h-10 touch-manipulation ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Crear Nuevo Contenedor"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate font-display">Nuevo Contenedor</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR (STICKY) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white/95 dark:bg-zinc-950/95 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200 sticky top-16 h-[calc(100vh-4rem)] z-30 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-4/5 max-w-xs bg-white dark:bg-zinc-950 h-full shadow-2xl z-10 flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-800"
            >
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-[10px]">
                    EX
                  </div>
                  <span className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
                    Navegación
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {sidebarContent}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
