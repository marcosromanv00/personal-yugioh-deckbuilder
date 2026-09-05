/**
 * Calcula la dirección óptima de apertura del dropdown (arriba o abajo)
 * evaluando los límites del viewport y contenedores con scroll.
 */
export function calculateDropdownDirection(
  triggerElement: HTMLElement,
  configuredDirection: 'auto' | 'down' | 'up'
): 'down' | 'up' {
  if (configuredDirection === 'up' || configuredDirection === 'down') {
    return configuredDirection;
  }

  const rect = triggerElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  let spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  let parent = triggerElement.parentElement;
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    if (/(auto|scroll|hidden)/.test(style.overflowY)) {
      const parentRect = parent.getBoundingClientRect();
      const parentSpaceBelow = parentRect.bottom - rect.bottom;
      spaceBelow = Math.min(spaceBelow, parentSpaceBelow);
      break;
    }
    parent = parent.parentElement;
  }

  if (spaceBelow < 220 && spaceAbove > 180) {
    return 'up';
  }
  return 'down';
}
