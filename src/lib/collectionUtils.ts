import { CardStatusFlag, StorageLocation, UserCard } from '@/types/collection';

export interface CategoryBadgeInfo {
  status: CardStatusFlag;
  label: string;
  shortLabel: string;
  barColorClass: string;
  textColorClass: string;
  badgeBgClass: string;
  borderColorClass: string;
  dotColorClass: string;
  description: string;
}

/**
 * Mapeo canónico de colores y estilos para la barra de categoría y badges de estado
 */
export function getCategoryBadgeStyle(status?: CardStatusFlag | string | null): CategoryBadgeInfo {
  switch (status) {
    case 'collection':
      return {
        status: 'collection',
        label: 'Colección Personal',
        shortLabel: 'Colección',
        barColorClass: 'bg-blue-600 dark:bg-blue-500',
        textColorClass: 'text-blue-600 dark:text-blue-400',
        badgeBgClass: 'bg-blue-50 dark:bg-blue-950/50',
        borderColorClass: 'border-blue-300 dark:border-blue-800',
        dotColorClass: 'bg-blue-500',
        description: 'Carta resguardada en colección personal o carpeta protectora',
      };
    case 'in_deck':
    case 'memory_deck':
      return {
        status: 'in_deck',
        label: 'En Mazo Activo',
        shortLabel: 'En Deck',
        barColorClass: 'bg-red-600 dark:bg-red-500',
        textColorClass: 'text-red-600 dark:text-red-400',
        badgeBgClass: 'bg-red-50 dark:bg-red-950/50',
        borderColorClass: 'border-red-300 dark:border-red-800',
        dotColorClass: 'bg-red-500',
        description: 'Carta asignada a un proyecto de mazo para juego',
      };
    case 'trade_sale':
      return {
        status: 'trade_sale',
        label: 'Venta / Intercambio',
        shortLabel: 'Venta',
        barColorClass: 'bg-emerald-500 dark:bg-emerald-400',
        textColorClass: 'text-emerald-600 dark:text-emerald-400',
        badgeBgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
        borderColorClass: 'border-emerald-300 dark:border-emerald-800',
        dotColorClass: 'bg-emerald-500',
        description: 'Excedente o lote disponible para venta o trade',
      };
    case 'workshop':
      return {
        status: 'workshop',
        label: 'Taller / En Proceso',
        shortLabel: 'Taller',
        barColorClass: 'bg-amber-500 dark:bg-amber-400',
        textColorClass: 'text-amber-600 dark:text-amber-400',
        badgeBgClass: 'bg-amber-50 dark:bg-amber-950/50',
        borderColorClass: 'border-amber-300 dark:border-amber-800',
        dotColorClass: 'bg-amber-500',
        description: 'Carta en prueba, desarmado o revisión de condición',
      };
    case 'bulk':
    default:
      return {
        status: 'bulk',
        label: 'Bulk / Almacenamiento',
        shortLabel: 'Bulk',
        barColorClass: 'bg-zinc-400 dark:bg-zinc-600',
        textColorClass: 'text-zinc-600 dark:text-zinc-400',
        badgeBgClass: 'bg-zinc-100 dark:bg-zinc-900',
        borderColorClass: 'border-zinc-300 dark:border-zinc-700',
        dotColorClass: 'bg-zinc-400',
        description: 'Carta común o sin clasificar guardada en lote masivo',
      };
  }
}

export interface DispersedLocationEntry {
  locationId: string | null;
  locationName: string;
  locationType: string;
  compartmentIndex: number;
  compartmentName?: string;
  copiesCount: number;
  languages: string[];
  rarities: string[];
  userCardIds: string[];
  userCards: UserCard[];
}

export interface DispersedCardSummary {
  cardId: number;
  cardName: string;
  imageUrl?: string;
  totalCopies: number;
  distinctLocationsCount: number;
  distinctLanguagesCount: number;
  languagesList: string[];
  locations: DispersedLocationEntry[];
}

/**
 * Detecta copias de la misma carta (mismo card_id) dispersas en múltiples contenedores o idiomas
 */
export function findDispersedCardsAcrossLocations(
  allCards: UserCard[],
  locations: StorageLocation[]
): DispersedCardSummary[] {
  const locMap = new Map<string, StorageLocation>();
  for (const loc of locations) {
    locMap.set(loc.id, loc);
  }

  // Agrupar todas las copias por card_id
  const cardGroupMap = new Map<number, UserCard[]>();
  for (const uc of allCards) {
    if (!uc.card_id) continue;
    const list = cardGroupMap.get(uc.card_id) || [];
    list.push(uc);
    cardGroupMap.set(uc.card_id, list);
  }

  const dispersedList: DispersedCardSummary[] = [];

  cardGroupMap.forEach((userCards, cardId) => {
    // Analizar distribución de ubicaciones
    const locationEntriesMap = new Map<string, DispersedLocationEntry>();
    const allLanguages = new Set<string>();

    let totalCopies = 0;
    const representative = userCards[0];
    const cardName = representative.card_details?.name || `Carta #${cardId}`;
    const imageUrl = representative.card_details?.image_url_small || representative.card_details?.image_url;

    for (const uc of userCards) {
      const qty = uc.quantity || 1;
      totalCopies += qty;
      const lang = uc.language || 'en';
      allLanguages.add(lang);

      const locId = uc.storage_location_id || null;
      const compIdx = uc.compartment_index || 0;
      const key = `${locId ?? 'inbox'}_${compIdx}`;

      if (!locationEntriesMap.has(key)) {
        let locName = 'Sin Clasificar (Inbox)';
        let locType = 'inbox';
        let compName = 'Inbox';

        if (locId) {
          const foundLoc = locMap.get(locId);
          if (foundLoc) {
            locName = foundLoc.name;
            locType = foundLoc.type;
            compName = foundLoc.compartments?.names?.[compIdx] || `Carril ${compIdx + 1}`;
          } else {
            locName = 'Contenedor';
          }
        }

        locationEntriesMap.set(key, {
          locationId: locId,
          locationName: locName,
          locationType: locType,
          compartmentIndex: compIdx,
          compartmentName: compName,
          copiesCount: 0,
          languages: [],
          rarities: [],
          userCardIds: [],
          userCards: [],
        });
      }

      const entry = locationEntriesMap.get(key)!;
      entry.copiesCount += qty;
      if (!entry.languages.includes(lang)) entry.languages.push(lang);
      if (uc.rarity && !entry.rarities.includes(uc.rarity)) entry.rarities.push(uc.rarity);
      entry.userCardIds.push(uc.id);
      entry.userCards.push(uc);
    }

    const locationsArray = Array.from(locationEntriesMap.values());
    const distinctLocationsCount = locationsArray.length;
    const distinctLanguagesCount = allLanguages.size;

    // Se considera dispersa si está en más de 1 ubicación física o si tiene más de 1 idioma
    if (distinctLocationsCount > 1 || (distinctLanguagesCount > 1 && totalCopies > 1)) {
      dispersedList.push({
        cardId,
        cardName,
        imageUrl,
        totalCopies,
        distinctLocationsCount,
        distinctLanguagesCount,
        languagesList: Array.from(allLanguages),
        locations: locationsArray,
      });
    }
  });

  // Ordenar por mayor número de ubicaciones dispersas primero
  return dispersedList.sort((a, b) => b.distinctLocationsCount - a.distinctLocationsCount || b.totalCopies - a.totalCopies);
}

/**
 * Obtiene el nombre y bandera legible del idioma
 */
export function getLanguageDisplay(langCode?: string): { name: string; flag: string; badge: string } {
  const code = (langCode || 'en').toLowerCase();
  switch (code) {
    case 'es':
    case 'spa':
    case 'spanish':
      return { name: 'Español', flag: '🇪🇸', badge: 'ES' };
    case 'en':
    case 'eng':
    case 'english':
      return { name: 'Inglés', flag: '🇺🇸', badge: 'EN' };
    case 'ja':
    case 'jp':
    case 'japanese':
      return { name: 'Japonés (OCG)', flag: '🇯🇵', badge: 'JP' };
    case 'de':
    case 'german':
      return { name: 'Alemán', flag: '🇩🇪', badge: 'DE' };
    case 'fr':
    case 'french':
      return { name: 'Francés', flag: '🇫🇷', badge: 'FR' };
    case 'it':
    case 'italian':
      return { name: 'Italiano', flag: '🇮🇹', badge: 'IT' };
    case 'pt':
    case 'portuguese':
      return { name: 'Portugués', flag: '🇧🇷', badge: 'PT' };
    case 'ko':
    case 'korean':
      return { name: 'Coreano', flag: '🇰🇷', badge: 'KO' };
    default:
      return { name: code.toUpperCase(), flag: '🌐', badge: code.toUpperCase() };
  }
}
