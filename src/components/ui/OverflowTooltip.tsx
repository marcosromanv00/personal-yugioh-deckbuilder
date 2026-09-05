'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OverflowTooltipProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  placement?: 'top' | 'bottom';
  alwaysShow?: boolean;
}

/**
 * OverflowTooltip: Detecta automáticamente si el texto está truncado o desbordado
 * (scrollWidth > clientWidth) y muestra un popup flotante oscuro con el contenido completo al hacer hover.
 */
export const OverflowTooltip: React.FC<OverflowTooltipProps> = ({
  text,
  children,
  className = '',
  containerClassName = '',
  placement = 'top',
  alwaysShow = false,
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const checkOverflow = () => {
    if (!textRef.current) return;
    const el = textRef.current;
    const hasOverflow = el.scrollWidth > el.clientWidth + 1;
    setIsOverflowed(hasOverflow);
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  const handleMouseEnter = () => {
    checkOverflow();
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
        width: rect.width,
      });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const shouldShowTooltip = (isOverflowed || alwaysShow) && isHovered && text.trim().length > 0;

  return (
    <span
      className={`relative inline-block max-w-full overflow-hidden align-middle ${containerClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        ref={textRef}
        title={text}
        className={`truncate block ${className}`}
      >
        {children || text}
      </span>

      <AnimatePresence>
        {shouldShowTooltip && (
          <motion.div
            initial={{ opacity: 0, y: placement === 'top' ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'top' ? 2 : -2, scale: 0.96 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: placement === 'top' ? `${coords.top - 8}px` : `${coords.top + 26}px`,
              left: `${coords.left}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className={`pointer-events-none z-9999 max-w-xs sm:max-w-sm px-2.5 py-1.5 bg-zinc-950/95 dark:bg-zinc-900/95 text-zinc-100 text-[11px] font-sans font-medium leading-tight rounded-xl border border-zinc-700/80 shadow-2xl backdrop-blur-xs text-center break-words select-none ${
              placement === 'bottom' ? 'translate-y-0' : '-translate-y-full'
            }`}
          >
            {text}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950/95 dark:bg-zinc-900/95 border-r border-b border-zinc-700/80 rotate-45 ${
                placement === 'top' ? 'bottom-[-5px]' : 'top-[-5px] border-t border-l border-r-0 border-b-0'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
