import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para manejar el estado de redimensionamiento
 * y visibilidad colapsable de los paneles laterales.
 */
export function usePanelResize() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);

  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const startResizeLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingLeft.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftPanelWidth;
    document.body.style.cursor = 'col-resize';
  }, [leftPanelWidth]);

  const startResizeRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRight.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = rightPanelWidth;
    document.body.style.cursor = 'col-resize';
  }, [rightPanelWidth]);

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft.current) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          const deltaX = e.clientX - startXRef.current;
          const newWidth = Math.max(260, Math.min(550, startWidthRef.current + deltaX));
          setLeftPanelWidth(newWidth);
        });
      } else if (isResizingRight.current) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          const deltaX = e.clientX - startXRef.current;
          const newWidth = Math.max(260, Math.min(550, startWidthRef.current - deltaX));
          setRightPanelWidth(newWidth);
        });
      }
    };

    const handleMouseUp = () => {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return {
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    leftPanelWidth,
    rightPanelWidth,
    startResizeLeft,
    startResizeRight,
  };
}
