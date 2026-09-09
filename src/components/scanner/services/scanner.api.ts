import { YgoDetectedCard } from '../scanner.types';

export async function fetchCardByCodeApi(
  code: string,
  signal: AbortSignal
): Promise<YgoDetectedCard | null> {
  try {
    const res = await fetch(`/api/cards?id=${encodeURIComponent(code)}`, { signal });
    if (res.ok) {
      const json = await res.json();
      const cardData: YgoDetectedCard | undefined = json.data?.[0] || json.card;
      if (cardData && cardData.name) return cardData;
    }
  } catch (e: unknown) {
    if ((e as Error)?.name === 'AbortError') throw e;
  }
  return null;
}

export async function fetchCardWithCandidatesApi(
  primaryCode: string,
  candidates: string[],
  signal: AbortSignal
): Promise<{ cardData: YgoDetectedCard; matchedCode: string } | null> {
  // 1. Try primary exact code
  const primaryResult = await fetchCardByCodeApi(primaryCode, signal);
  if (primaryResult) return { cardData: primaryResult, matchedCode: primaryCode };

  // 2. Try candidates in parallel
  const filtered = candidates.filter((c) => c && c !== primaryCode).slice(0, 3);
  if (filtered.length === 0) return null;

  try {
    const parallelPromises = filtered.map(async (testCode) => {
      const res = await fetch(`/api/cards?id=${encodeURIComponent(testCode)}`, { signal });
      if (res.ok) {
        const json = await res.json();
        const cardData: YgoDetectedCard | undefined = json.data?.[0] || json.card;
        if (cardData && cardData.name) return { cardData, matchedCode: testCode };
      }
      throw new Error('Not found');
    });
    return await Promise.any(parallelPromises);
  } catch (e: unknown) {
    if ((e as Error)?.name === 'AbortError') throw e;
    return null;
  }
}
