'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  success: (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => string;
  error: (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => string;
  info: (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => string;
  warning: (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, action, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, action, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Mantener máx 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => {
      return showToast({ type: 'success', message, ...options });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => {
      return showToast({ type: 'error', message, ...options });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => {
      return showToast({ type: 'info', message, ...options });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: { title?: string; action?: ToastAction; duration?: number }) => {
      return showToast({ type: 'warning', message, ...options });
    },
    [showToast]
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-slate-950/90 shadow-emerald-950/20';
      case 'error':
        return 'border-red-500/30 bg-slate-950/90 shadow-red-950/20';
      case 'warning':
        return 'border-amber-500/30 bg-slate-950/90 shadow-amber-950/20';
      case 'info':
      default:
        return 'border-cyan-500/30 bg-slate-950/90 shadow-cyan-950/20';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, success, error, info, warning }}>
      {children}

      {/* TOAST CONTAINER FIXED - En mobile: top-4 inset-x-4, en desktop: bottom-5 right-5 */}
      <div className="fixed top-4 sm:top-auto sm:bottom-5 inset-x-4 sm:inset-x-auto sm:right-5 z-60 flex flex-col gap-2.5 max-w-sm w-auto sm:w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-xl p-3.5 border shadow-xl backdrop-blur-md flex items-start justify-between gap-3 text-xs ${getBorderColor(
                toast.type
              )}`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {getIcon(toast.type)}
                <div className="min-w-0 flex-1">
                  {toast.title && <h4 className="font-bold text-slate-100 mb-0.5">{toast.title}</h4>}
                  <p className="text-slate-300 leading-relaxed wrap-break-word">{toast.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-center">
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      dismissToast(toast.id);
                    }}
                    className="px-2 py-1 rounded bg-[hsl(263,85%,64%)] hover:bg-[hsl(263,85%,58%)] text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
