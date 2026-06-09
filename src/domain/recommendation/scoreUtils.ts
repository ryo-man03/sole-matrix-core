export function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function normalizeWeights<T extends Record<string, number>>(weights: T): T {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, value / total])
  ) as T;
}

export function roundScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundWeight(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
