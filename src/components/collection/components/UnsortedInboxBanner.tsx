import React from 'react';
import { Inbox, Sparkles } from 'lucide-react';

interface UnsortedInboxBannerProps {
  inboxCount: number;
  onOrganizeClick: () => void;
}

/**
 * UnsortedInboxBanner Component
 * Shows a disclaimer warning when there are unsorted physical cards inside
 * the general "Inbox" queue. Features a button to run the AI Auto Organizer.
 */
export const UnsortedInboxBanner: React.FC<UnsortedInboxBannerProps> = ({
  inboxCount,
  onOrganizeClick,
}) => {
  if (inboxCount === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-900/30 text-amber-400">
          <Inbox className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-200 text-sm">
            Bandeja &quot;Sin Clasificar&quot; ({inboxCount} cartas)
          </h3>
          <p className="text-xs text-amber-300/80 font-mono mt-0.5">
            Tienes cartas importadas pendientes de ser asignadas a un Binder, Lata o Deckbox.
          </p>
        </div>
      </div>

      <button
        onClick={onOrganizeClick}
        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-md shadow-amber-500/10"
      >
        <Sparkles className="w-4 h-4" />
        <span>Distribuir Automáticamente</span>
      </button>
    </div>
  );
};
