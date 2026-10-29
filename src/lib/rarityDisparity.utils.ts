import { CardSetPrintingsResponse, RarityAlertEvaluation, RarityAlertLevel } from '@/types/triage';

const COLLECTOR_RARITY_PATTERNS = [
  'quarter century secret rare',
  'qcsr',
  '25th anniversary',
  'starlight rare',
  "collector's rare",
  '(cr)',
  'ultimate rare',
  'ghost rare',
  "pharaoh's rare",
  "pharaoh's secret",
  'platinum secret rare',
  'prismatic secret rare',
  '10000 secret rare',
  'gold ghost rare',
  'holographic rare',
];

export function isCollectorRarity(rarityName: string, rarityCode?: string): boolean {
  const target = `${rarityName} ${rarityCode || ''}`.toLowerCase();
  return COLLECTOR_RARITY_PATTERNS.some(pattern => target.includes(pattern));
}

export function analyzeRarityDisparity(
  setsData: CardSetPrintingsResponse | null
): RarityAlertEvaluation {
  const fallbackPrice = setsData?.marketPriceTcg ?? 0.25;

  if (!setsData || !Array.isArray(setsData.printings) || setsData.printings.length === 0) {
    return {
      hasDisparity: false,
      alertLevel: 'none',
      minPrice: fallbackPrice,
      maxPrice: fallbackPrice,
      priceDifference: 0,
      priceMultiplier: 1,
      hasCollectorRarity: false,
      collectorRaritiesFound: [],
      highestPricedPrinting: null,
      lowestPricedPrinting: null,
      alertTitle: 'Precio Estándar',
      alertMessage: `Precio estimado de referencia: $${fallbackPrice.toFixed(2)}.`,
      badgeLabel: `~$${fallbackPrice.toFixed(2)}`,
      badgeColor: 'zinc',
      isSafeSamePrice: true,
    };
  }

  const printings = setsData.printings;
  const validPricedPrintings = printings.filter(p => p.setPrice > 0);
  const effectivePrintings = validPricedPrintings.length > 0 ? validPricedPrintings : printings;

  let minPrinting = effectivePrintings[0];
  let maxPrinting = effectivePrintings[0];

  for (const p of effectivePrintings) {
    if (p.setPrice < minPrinting.setPrice) minPrinting = p;
    if (p.setPrice > maxPrinting.setPrice) maxPrinting = p;
  }

  const minPrice = minPrinting.setPrice > 0 ? minPrinting.setPrice : fallbackPrice;
  const maxPrice = maxPrinting.setPrice > 0 ? maxPrinting.setPrice : fallbackPrice;
  const priceDifference = Math.max(0, maxPrice - minPrice);
  const priceMultiplier = maxPrice / Math.max(minPrice, 0.05);

  const collectorRaritiesFound = Array.from(
    new Set(
      printings
        .filter(p => isCollectorRarity(p.setRarity, p.setRarityCode))
        .map(p => p.setRarity)
    )
  );
  const hasCollectorRarity = collectorRaritiesFound.length > 0;

  // Clasificación de Severidad de Alerta
  let alertLevel: RarityAlertLevel = 'none';
  let badgeColor: RarityAlertEvaluation['badgeColor'] = 'zinc';
  let alertTitle = 'Precio Uniforme';
  let alertMessage = `Esta carta mantiene un valor similar (~$${minPrice.toFixed(2)}) en sus distintas ediciones. No requieres verificar su rareza.`;
  let badgeLabel = `Uniforme (~$${minPrice.toFixed(2)})`;
  let hasDisparity = false;
  let isSafeSamePrice = true;

  if (hasCollectorRarity && maxPrice >= 3.0) {
    alertLevel = 'critical';
    badgeColor = 'amber';
    hasDisparity = true;
    isSafeSamePrice = false;
    alertTitle = '¡Edición de Coleccionista Disponible!';
    const raritiesStr = collectorRaritiesFound.join(', ');
    alertMessage = `Existe en ${raritiesStr} (alcanza hasta $${maxPrice.toFixed(2)}). ¡Inspecciona el brillo físico y código de set de tu carta!`;
    badgeLabel = `⚠️ Coleccionista ($${maxPrice.toFixed(2)})`;
  } else if (priceDifference >= 4.0 || (maxPrice >= 8.0 && priceMultiplier >= 2.0)) {
    alertLevel = 'critical';
    badgeColor = 'red';
    hasDisparity = true;
    isSafeSamePrice = false;
    alertTitle = '¡Verificación Física Obligatoria!';
    alertMessage = `Rango amplio: desde $${minPrice.toFixed(2)} (${minPrinting.setRarity}) hasta $${maxPrice.toFixed(2)} (${maxPrinting.setRarity}). ¡Diferencia de +$${priceDifference.toFixed(2)}!`;
    badgeLabel = `⚠️ Disparidad ($${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`;
  } else if (priceDifference >= 1.5 && priceMultiplier >= 1.8) {
    alertLevel = 'warning';
    badgeColor = 'amber';
    hasDisparity = true;
    isSafeSamePrice = false;
    alertTitle = 'Disparidad de Rareza Detectada';
    alertMessage = `El valor oscila entre $${minPrice.toFixed(2)} y $${maxPrice.toFixed(2)} según la impresión. Revisa el código del set antes de clasificar.`;
    badgeLabel = `⚠️ Revisar ($${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`;
  } else if (priceDifference >= 0.6 || hasCollectorRarity) {
    alertLevel = 'info';
    badgeColor = 'blue';
    hasDisparity = true;
    isSafeSamePrice = false;
    alertTitle = 'Variación Moderada de Rareza';
    alertMessage = `Existe una ligera variación de precio ($${minPrice.toFixed(2)} a $${maxPrice.toFixed(2)}) entre las versiones disponibles.`;
    badgeLabel = `Varía ($${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`;
  }

  return {
    hasDisparity,
    alertLevel,
    minPrice,
    maxPrice,
    priceDifference,
    priceMultiplier,
    hasCollectorRarity,
    collectorRaritiesFound,
    highestPricedPrinting: maxPrinting,
    lowestPricedPrinting: minPrinting,
    alertTitle,
    alertMessage,
    badgeLabel,
    badgeColor,
    isSafeSamePrice,
  };
}
