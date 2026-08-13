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

    // Verificar si la línea es un passcode numérico de carta
    const passcode = parseInt(line, 10);
    if (!isNaN(passcode) && passcode > 0) {
      if (currentSection === 'main') {
        mainDeckCardIds.push(passcode);
      } else if (currentSection === 'extra') {
        extraDeckCardIds.push(passcode);
      } else if (currentSection === 'side') {
        sideDeckCardIds.push(passcode);
      } else {
        // Si no había sección definida aún, por defecto lo colocamos en main
        mainDeckCardIds.push(passcode);
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
