import { YdkParseResult } from '@/types/collection';

/**
 * Parsea el contenido de un archivo .ydk de Yu-Gi-Oh!
 * Extrae los passcodes de 8 dígitos para #main, #extra y !side.
 */
export function parseYdkContent(ydkText: string): YdkParseResult {
  const lines = ydkText.split(/\r?\n/);
  
  const mainDeckCardIds: number[] = [];
  const extraDeckCardIds: number[] = [];
  const sideDeckCardIds: number[] = [];
  const unknownPasscodes: string[] = [];

  let currentSection: 'main' | 'extra' | 'side' | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    // Secciones principales de un archivo .ydk
    if (line.toLowerCase().startsWith('#main')) {
      currentSection = 'main';
      continue;
    } else if (line.toLowerCase().startsWith('#extra')) {
      currentSection = 'extra';
      continue;
    } else if (line.toLowerCase().startsWith('!side') || line.toLowerCase().startsWith('#side')) {
      currentSection = 'side';
      continue;
    }

    // Ignorar otros comentarios de encabezado (ej. #created by...)
    if (line.startsWith('#') || line.startsWith('!')) {
      continue;
    }

    // Sanitizar línea numérica de posibles separadores
    const cleanNumeric = line.replace(/[^\d]/g, ' ').replace(/\s+/g, ' ').trim();
    const tokens = cleanNumeric ? cleanNumeric.split(' ').filter(Boolean) : [];

    if (tokens.length === 1) {
      const passcode = parseInt(tokens[0], 10);
      if (!isNaN(passcode) && passcode > 0) {
        const targetDeck = currentSection === 'extra' 
          ? extraDeckCardIds 
          : currentSection === 'side' 
          ? sideDeckCardIds 
          : mainDeckCardIds;
        targetDeck.push(passcode);
      } else {
        unknownPasscodes.push(line);
      }
    } else if (tokens.length === 2) {
      const v1 = parseInt(tokens[0], 10);
      const v2 = parseInt(tokens[1], 10);
      const targetDeck = currentSection === 'extra' 
        ? extraDeckCardIds 
        : currentSection === 'side' 
        ? sideDeckCardIds 
        : mainDeckCardIds;

      if (v1 <= 100 && v2 > 100) {
        for (let i = 0; i < v1; i++) targetDeck.push(v2);
      } else if (v2 <= 100 && v1 > 100) {
        for (let i = 0; i < v2; i++) targetDeck.push(v1);
      } else if (v1 > 100 && v2 > 100) {
        targetDeck.push(v1);
        targetDeck.push(v2);
      } else {
        unknownPasscodes.push(line);
      }
    } else if (line.length > 0) {
      unknownPasscodes.push(line);
    }
  }

  return {
    mainDeckCardIds,
    extraDeckCardIds,
    sideDeckCardIds,
    unknownPasscodes,
    totalCardsCount: mainDeckCardIds.length + extraDeckCardIds.length + sideDeckCardIds.length,
  };
}
