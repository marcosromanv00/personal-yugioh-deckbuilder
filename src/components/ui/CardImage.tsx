'use client';

import React, { useState } from 'react';

interface CardImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const FALLBACK_CARD_BACK = 'https://images.ygoprodeck.com/images/cards/back.jpg';
const DEFAULT_PLACEHOLDER = 'https://images.ygoprodeck.com/images/cards/placeholder.jpg';

/**
 * Reusable, high-performance CardImage component with built-in skeleton loader,
 * graceful error fallback, and smooth fade-in transition.
 */
export const CardImage: React.FC<CardImageProps> = ({
  src,
  alt = 'Yu-Gi-Oh! Card',
  className = 'w-full h-full object-contain',
  containerClassName = '',
  aspectRatio,
  style,
  loading = 'lazy',
  draggable = false,
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const imageSrc = hasError ? FALLBACK_CARD_BACK : (src || DEFAULT_PLACEHOLDER);

  return (
    <div 
      className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* SKELETON LOADER ANIMATION */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-200/80 dark:bg-zinc-800/80 animate-pulse">
          <div className="w-6 h-8 rounded-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-300/40 dark:bg-zinc-700/40 flex items-center justify-center opacity-40">
            <span className="text-[9px] font-mono text-zinc-500 font-bold select-none">YG</span>
          </div>
        </div>
      )}

      {/* ACTUAL IMAGE */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        draggable={draggable}
        style={style}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setIsLoaded(true);
            onError?.();
          }
        }}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
