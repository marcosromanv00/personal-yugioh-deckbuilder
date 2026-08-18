/**
 * Utilidad de sanitización para importadores bulk y listas de IDs.
 * 
 * Reglas:
 * 1. Mantiene directivas y comentarios que inician con '#' o '!' (#main, #extra, !side, etc.).
 * 2. Convierte símbolos de puntuación/separadores (comas, puntos, guiones, barras, dos puntos, etc.) en espacios.
 * 3. En modo numérico (isNumericOnly = true), convierte cualquier caracter no numérico (excepto # y !) en espacio.
 * 4. Si liveTyping = true, NO elimina espacios finales (.trim) para permitir continuar escribiendo fluidamente.
 * 5. Si liveTyping = false (antes de subir), realiza limpieza profunda eliminando espacios superfluos y líneas vacías.
 */
export function sanitizeBulkInput(
  text: string, 
  isNumericOnly: boolean = false,
  liveTyping: boolean = false
): string {
  if (!text || typeof text !== 'string') return '';

  const lines = text.split(/\r?\n/);
  const sanitizedLines = lines.map((rawLine) => {
    // Si la línea está vacía y estamos en live typing, preservar la línea vacía
    if (!rawLine) return '';

    const trimmedLeft = rawLine.replace(/^\s+/, '');
    // Preservar líneas de sección o directivas YDK (#main, #extra, !side, #created by...)
    if (trimmedLeft.startsWith('#') || trimmedLeft.startsWith('!')) {
      return liveTyping ? rawLine : rawLine.trim();
    }

    if (isNumericOnly) {
      // Reemplazar todo lo que no sea dígito 0-9 por espacio
      const cleaned = rawLine.replace(/[^\d]/g, ' ').replace(/ {2,}/g, ' ');
      return liveTyping ? cleaned : cleaned.trim();
    }

    // Modo general / nombres: reemplazar símbolos de puntuación comunes que separan cantidades o IDs
    const cleaned = rawLine
      .replace(/[,.;:\-_/\\|~*+=?()[\]{}"'«»“”<>]/g, ' ')
      .replace(/ {2,}/g, ' ');

    return liveTyping ? cleaned : cleaned.trim();
  });

  if (!liveTyping) {
    return sanitizedLines.filter(line => line.trim().length > 0).join('\n');
  }

  return sanitizedLines.join('\n');
}
