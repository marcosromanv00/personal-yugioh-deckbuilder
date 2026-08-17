/**
 * Motor de Cálculo Hipergeométrico y Simulación de Consistencia para Yu-Gi-Oh!
 * Calcula probabilidades exactas de manos iniciales y realiza simulaciones Monte Carlo.
 */

/**
 * Coeficiente binomial: C(n, k) = n! / (k! * (n-k)!)
 */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;

  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

/**
 * Función de masa de probabilidad hipergeométrica:
 * P(X = k) = [C(K, k) * C(N - K, n - k)] / C(N, n)
 * Donde:
 * - N = Tamaño del Deck (ej. 40)
 * - K = Total de cartas objetivo en el deck (ej. 9 starters)
 * - n = Tamaño de la mano inicial (5 en turno 1, 6 en turno 2)
 * - k = Cantidad exacta de cartas objetivo en la mano
 */
export function hypergeometricPMF(N: number, K: number, n: number, k: number): number {
  if (k > K || n - k > N - K || k > n || k < 0) return 0;
  const totalComb = combinations(N, n);
  if (totalComb === 0) return 0;
  return (combinations(K, k) * combinations(N - K, n - k)) / totalComb;
}

/**
 * Probabilidad acumulada de robar AL MENOS 'minSuccess' cartas objetivo:
 * P(X >= minSuccess)
 */
export function hypergeometricAtLeast(
  deckSize: number,
  targetCount: number,
  handSize: number = 5,
  minSuccess: number = 1
): number {
  if (deckSize <= 0 || targetCount <= 0 || handSize <= 0) return 0;
  if (targetCount >= deckSize) return 1;

  let probLessThan = 0;
  for (let k = 0; k < minSuccess; k++) {
    probLessThan += hypergeometricPMF(deckSize, targetCount, handSize, k);
  }

  const result = 1 - probLessThan;
  return Math.max(0, Math.min(1, result));
}

export interface HandSimulationStats {
  totalSimulations: number;
  starterInHandPercent: number; // % de tener al menos 1 starter
  brickPercent: number; // % de manos totalmente muertas (0 starters / solo bricks)
  twoOrMoreStartersPercent: number; // % de tener 2+ starters (resiliencia)
  handtrapInHandPercent: number; // % de tener al menos 1 handtrap
  goingSecondOTKPotential: number; // % de tener starter + board breaker
  averageStartersPerHand: number;
  averageHandtrapsPerHand: number;
}

/**
 * Ejecuta una simulación Monte Carlo de 10,000 manos iniciales
 * para calcular métricas realistas de consistencia.
 */
export function simulateHands(
  deckSize: number,
  starterCount: number,
  handtrapCount: number,
  extenderCount: number,
  brickCount: number,
  simulations: number = 10000
): HandSimulationStats {
  if (deckSize < 5) {
    return {
      totalSimulations: 0,
      starterInHandPercent: 0,
      brickPercent: 0,
      twoOrMoreStartersPercent: 0,
      handtrapInHandPercent: 0,
      goingSecondOTKPotential: 0,
      averageStartersPerHand: 0,
      averageHandtrapsPerHand: 0,
    };
  }

  // Crear representación del deck (0: otro, 1: starter, 2: handtrap, 3: extender, 4: brick)
  const deck: number[] = [];
  for (let i = 0; i < starterCount; i++) deck.push(1);
  for (let i = 0; i < handtrapCount; i++) deck.push(2);
  for (let i = 0; i < extenderCount; i++) deck.push(3);
  for (let i = 0; i < brickCount; i++) deck.push(4);
  while (deck.length < deckSize) deck.push(0);

  let starterCountTotal = 0;
  let handsWithStarter = 0;
  let handsWithTwoPlusStarters = 0;
  let handsWithHandtrap = 0;
  let handtrapsCountTotal = 0;
  let deadHands = 0;
  let otkHands = 0;

  for (let s = 0; s < simulations; s++) {
    // Fisher-Yates shuffle parcial para 5 cartas
    const drawn: number[] = [];
    const pool = [...deck];
    for (let d = 0; d < 5; d++) {
      const idx = Math.floor(Math.random() * pool.length);
      drawn.push(pool[idx]);
      pool[idx] = pool[pool.length - 1];
      pool.pop();
    }

    const starters = drawn.filter((c) => c === 1).length;
    const handtraps = drawn.filter((c) => c === 2).length;
    const extenders = drawn.filter((c) => c === 3).length;

    starterCountTotal += starters;
    handtrapsCountTotal += handtraps;

    if (starters >= 1) {
      handsWithStarter++;
      if (starters >= 2) handsWithTwoPlusStarters++;
      if (extenders >= 1 || starters >= 2) otkHands++;
    } else if (extenders >= 2) {
      // 2 extenders a veces componen una jugada
      handsWithStarter++;
    } else {
      deadHands++;
    }

    if (handtraps >= 1) handsWithHandtrap++;
  }

  return {
    totalSimulations: simulations,
    starterInHandPercent: Math.round((handsWithStarter / simulations) * 1000) / 10,
    brickPercent: Math.round((deadHands / simulations) * 1000) / 10,
    twoOrMoreStartersPercent: Math.round((handsWithTwoPlusStarters / simulations) * 1000) / 10,
    handtrapInHandPercent: Math.round((handsWithHandtrap / simulations) * 1000) / 10,
    goingSecondOTKPotential: Math.round((otkHands / simulations) * 1000) / 10,
    averageStartersPerHand: Math.round((starterCountTotal / simulations) * 100) / 100,
    averageHandtrapsPerHand: Math.round((handtrapsCountTotal / simulations) * 100) / 100,
  };
}
