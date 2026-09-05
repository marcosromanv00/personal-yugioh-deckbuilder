'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { UserCard } from '@/types/collection';
import { getSleeveColorHex } from '@/lib/sleeves';

interface CollectionCardArtworkColProps {
  userCard: UserCard;
  onToggleFavorite: (uc: UserCard) => Promise<void>;
}

export const CollectionCardArtworkCol: React.FC<CollectionCardArtworkColProps> = ({
  userCard,
  onToggleFavorite,
}) => {
  const cardDetails = userCard.card_details;
  const banlistTCG = cardDetails?.ban_tcg || 'Unlimited';
  const banlistMD = cardDetails?.ban_master_duel || 'Unlimited';
  const banlistDL = cardDetails?.ban_duel_links || 'Unlimited';

  const getBanlistColor = (status: string) => {
    switch (status) {
      case 'Forbidden':
      case 'Banned':
        return 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50';
      case 'Limited':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50';
      case 'Semi-Limited':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/50';
      default:
        return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50';
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 p-5 sm:p-6 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 shrink-0 lg:w-96">
      <div className="w-full flex flex-col items-center">
        {/* Imagen de la Carta */}
        <div 
          className="relative rounded-2xl overflow-hidden shadow-xl max-w-52 sm:max-w-60 transition-transform hover:scale-[1.02]"
          style={
            userCard.sleeve_type && userCard.sleeve_type !== 'none' && userCard.sleeve_color
              ? { borderColor: getSleeveColorHex(userCard.sleeve_color), borderWidth: '3px', borderStyle: 'solid' }
              : undefined
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardDetails?.image_url || cardDetails?.image_url_small || `https://images.ygoprodeck.com/images/cards/${userCard.card_id}.jpg`}
            alt={cardDetails?.name || 'Yu-Gi-Oh! Card'}
            className="w-full h-auto object-contain rounded-xl"
            onError={(e) => {
              e.currentTarget.src = 'https://images.ygoprodeck.com/images/cards/back.jpg';
            }}
          />

          {userCard.is_proxy && (
            <span className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded shadow-md uppercase">
              PROXY
            </span>
          )}

          {userCard.quantity > 1 && (
            <span className="absolute top-2 right-2 bg-zinc-950/90 text-white font-mono text-xs font-black px-2 py-0.5 rounded-lg shadow-md border border-zinc-700">
              x{userCard.quantity}
            </span>
          )}
        </div>

        {/* Botón Favorito Flotante */}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => onToggleFavorite(userCard)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation ${
              userCard.is_favorite
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-900/50 shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${userCard.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{userCard.is_favorite ? 'Favorita' : 'Marcar Favorita'}</span>
          </button>
        </div>

        {/* Descripción / Efecto */}
        {cardDetails?.desc && (
          <div className="w-full mt-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed max-h-28 overflow-y-auto scrollbar-thin">
            {cardDetails.desc}
          </div>
        )}
      </div>

      {/* Formatos y Banlist */}
      <div className="w-full mt-4 space-y-1.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block text-center">
          Estado en Formatos (Banlist)
        </span>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className={`p-1 rounded-lg border flex flex-col justify-between ${getBanlistColor(banlistTCG)}`}>
            <span className="text-[8px] font-black uppercase">TCG</span>
            <span className="text-[9px] font-bold truncate">{banlistTCG}</span>
          </div>
          <div className={`p-1 rounded-lg border flex flex-col justify-between ${getBanlistColor(banlistMD)}`}>
            <span className="text-[8px] font-black uppercase">Master Duel</span>
            <span className="text-[9px] font-bold truncate">{banlistMD}</span>
          </div>
          <div className={`p-1 rounded-lg border flex flex-col justify-between ${getBanlistColor(banlistDL)}`}>
            <span className="text-[8px] font-black uppercase">Duel Links</span>
            <span className="text-[9px] font-bold truncate">{banlistDL}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
