import { SleeveInventory } from '@/types/collection';

/**
 * Resolves the hex color code for a given sleeve color name or pattern.
 * Checks the loaded sleeves inventory first, falls back to common name matches,
 * and returns empty string if no sleeve is assigned.
 */
export const getSleeveColorHex = (
  colorName?: string,
  availableSleeves?: SleeveInventory[]
): string => {
  if (!colorName || colorName.toLowerCase() === 'none') return '';
  if (colorName.startsWith('#')) return colorName;

  // Try to find in the loaded sleeves inventory
  if (availableSleeves) {
    const matched = availableSleeves.find(
      (s) => s.color_pattern?.toLowerCase() === colorName.toLowerCase()
    );
    if (matched?.color_hex) return matched.color_hex;
  }

  // Fallback map (English & Spanish)
  const lower = colorName.toLowerCase().trim();
  if (lower.includes('black') || lower.includes('negra')) return '#1a1a2e';
  if (lower.includes('white') || lower.includes('blanca')) return '#f0f0f0';
  if (lower.includes('blue') || lower.includes('azul')) return '#1e3a5f';
  if (lower.includes('purple') || lower.includes('morada') || lower.includes('violeta') || lower.includes('orchid')) return '#3b1f4a';
  if (lower.includes('green') || lower.includes('verde')) return '#1f3d2a';
  if (lower.includes('red') || lower.includes('roja') || lower.includes('cherry')) return '#4a1c1c';
  if (lower.includes('gold') || lower.includes('oro') || lower.includes('dorada')) return '#3d2e10';
  if (lower.includes('grey') || lower.includes('gray') || lower.includes('gris') || lower.includes('smokey')) return '#2a2a2a';
  if (lower.includes('orange') || lower.includes('naranja')) return '#f97316';
  if (lower.includes('yellow') || lower.includes('amarilla')) return '#eab308';
  if (lower.includes('pink') || lower.includes('rosa')) return '#ec4899';
  if (lower.includes('jade')) return '#0f766e';
  if (lower.includes('crimson')) return '#991b1b';

  return '#4b5563'; // Fallback grey border if there is a sleeve but color name is unrecognized
};
