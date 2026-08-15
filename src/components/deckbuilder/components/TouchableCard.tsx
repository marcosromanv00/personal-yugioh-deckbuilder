'use client';

import React from 'react';
import { useLongPress } from '../hooks/useLongPress';
import { HoverCardBase } from '../types';

interface TouchableCardProps {
  card: HoverCardBase;
  /** Primary action on tap (add to deck, remove, etc.) */
  onTap: () => void;
  /** Called with the card to open the preview modal (long press on touch, hover on desktop) */
  onOpenPreview: (card: HoverCardBase) => void;
  onMouseEnter?: (card: HoverCardBase) => void;
  onMouseLeave?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
  children: React.ReactNode;
  /** Extra info button visible permanently on mobile/tablet */
  showInfoButton?: boolean;
  style?: React.CSSProperties;
}

/**
 * TouchableCard
 * Wrapper that unifies touch (long-press → preview, tap → action)
 * and desktop (hover 1.5s → preview, click → action) interactions.
 *
 * On desktop: delegates to onMouseEnter/onMouseLeave for the existing hover preview.
 * On mobile/tablet: uses long-press (600ms) to open the preview modal,
 *                   and tap to execute the primary action.
 */
export const TouchableCard: React.FC<TouchableCardProps> = ({
  card,
  onTap,
  onOpenPreview,
  onMouseEnter,
  onMouseLeave,
  draggable = false,
  onDragStart,
  className = '',
  children,
  showInfoButton = false,
  style,
}) => {
  const longPress = useLongPress({
    delay: 600,
    onLongPress: () => onOpenPreview(card),
    onTap,
  });

  return (
    <div
      className={`relative ${className}`}
      style={style}
      /* ── Desktop interactions ── */
      onMouseEnter={onMouseEnter ? () => onMouseEnter(card) : undefined}
      onMouseLeave={onMouseLeave}
      onClick={onTap}
      /* ── Touch interactions ── */
      onTouchStart={longPress.onTouchStart}
      onTouchMove={longPress.onTouchMove}
      onTouchEnd={longPress.onTouchEnd}
      onTouchCancel={longPress.onTouchCancel}
      /* ── Drag (desktop only) ── */
      draggable={draggable}
      onDragStart={onDragStart}
    >
      {children}

      {/* Info button — always visible on touch devices, hidden on desktop */}
      {showInfoButton && (
        <button
          className="md:hidden absolute bottom-1 right-1 z-20 w-5 h-5 bg-black/70 border border-zinc-600 rounded-full flex items-center justify-center text-[9px] text-slate-300 hover:text-white transition-colors touch-manipulation"
          onTouchEnd={(e) => {
            e.stopPropagation();
            onOpenPreview(card);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview(card);
          }}
          aria-label={`Ver ficha de ${card.name}`}
          title="Ver ficha técnica"
        >
          ℹ
        </button>
      )}
    </div>
  );
};
