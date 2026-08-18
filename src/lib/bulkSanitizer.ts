/**
 * Utilidad de sanitización para importadores bulk y listas de IDs.
 * 
 * Reglas:
 * 1. Mantiene directivas y comentarios que inician con '#' o '!' (#main, #extra, !side, etc.).
 * 2. Convierte símbolos de puntuación/separadores (comas, puntos, guiones, barras, dos puntos, etc.) en espacios.
 * 3. En modo numérico (isNumericOnly = true), convierte cualquier caracter no numérico (excepto # y !) en espacio.
 * 4. Normaliza espacios consecutivos por línea manteniendo los saltos de línea (\n).
 */
export function sanitizeBulkInput(text: string, isNumericOnly: boolean = false): string {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split(/\r?\n/);
  const sanitizedLines = lines.map((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return '';

    // Preservar líneas de sección o directivas YDK (#main, #extra, !side, #created by...)
    if (trimmed.startsWith('#') || trimmed.startsWith('!')) {
      return trimmed;
    }

    if (isNumericOnly) {
      // Reemplazar todo lo que no sea dígito 0-9 por espacio
      return trimmed
        .replace(/[^\d]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Modo general / nombres: reemplazar símbolos de puntuación comunes que separan cantidades o IDs
    return trimmed
      .replace(/[,.;:\-_/\\|~*+=?()[\]{}"'«»“”<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  });

  return sanitizedLines.join('\n');
}
