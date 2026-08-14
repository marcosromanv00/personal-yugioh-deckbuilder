'use client';

import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  /** Milliseconds to hold before triggering. Default: 600ms */
  delay?: number;
  /** Called when long press fires */
  onLongPress: () => void;
  /** Called on short tap (no long press) */
  onTap?: () => void;
}

/**
 * useLongPress — Touch-friendly long-press detector.
 * Returns props to spread onto any touchable element.
 * Cancels if the user moves the finger (scroll intent).
 */
export function useLongPress({ delay = 600, onLongPress, onTap }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const didFireRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      didFireRef.current = false;
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };

      timerRef.current = setTimeout(() => {
        didFireRef.current = true;
        onLongPress();
      }, delay);
    },
    [delay, onLongPress]
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPosRef.current.x);
    const dy = Math.abs(touch.clientY - startPosRef.current.y);
    // Cancel if moved more than 10px (user is scrolling)
    if (dx > 10 || dy > 10) {
      clear();
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!didFireRef.current && onTap) {
      onTap();
    }
    clear();
    startPosRef.current = null;
  }, [onTap]);

  const onTouchCancel = useCallback(() => {
    clear();
    startPosRef.current = null;
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
}
