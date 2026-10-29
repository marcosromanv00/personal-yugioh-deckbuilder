'use client';

import React from 'react';
import { ExternalLink, Database, ShoppingBag } from 'lucide-react';

interface TriageExternalLinksProps {
  cardName: string;
  cardId?: number;
}

export const TriageExternalLinks: React.FC<TriageExternalLinksProps> = ({
  cardName,
  cardId,
}) => {
  const encodedName = encodeURIComponent(cardName);
  const ygoprodeckUrl = cardId
    ? `https://ygoprodeck.com/card/?search=${cardId}`
    : `https://ygoprodeck.com/card/?search=${encodedName}`;
  const tcgplayerUrl = `https://www.tcgplayer.com/search/yugioh/product?q=${encodedName}`;
  const cardmarketUrl = `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodedName}`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <a
        href={ygoprodeckUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir ficha oficial en YGOPRODeck (nueva ventana o rueda del ratón)"
        className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 transition-colors shadow-2xs"
      >
        <Database className="w-3 h-3" />
        <span>YGOPRODeck</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </a>

      <a
        href={tcgplayerUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir cotizaciones de compra/venta en TCGPlayer (nueva ventana o rueda del ratón)"
        className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 transition-colors shadow-2xs"
      >
        <ShoppingBag className="w-3 h-3" />
        <span>TCGPlayer</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </a>

      <a
        href={cardmarketUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir en Cardmarket Europa (nueva ventana o rueda del ratón)"
        className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 transition-colors shadow-2xs"
      >
        <span>Cardmarket</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </a>
    </div>
  );
};
