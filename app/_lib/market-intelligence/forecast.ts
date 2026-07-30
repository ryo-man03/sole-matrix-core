import type { CanonicalSneakerIdentity, SneakerVariant } from "./identity";
import type { MarketProviderId } from "./provider";
import {
  getMarketSeriesKey,
  validateMarketSnapshot,
  type MarketPriceType,
  type MarketSnapshot,
} from "./snapshot";

export type ForecastModel =
  | "naive"
  | "moving_average"
  | "exponential_smoothing"
  | "linear_trend"
  | "holt";

export type MarketForecast = Readonly<{
  identity: CanonicalSneakerIdentity;
  variant: SneakerVariant;
  provider: MarketProviderId;
  priceType: MarketPriceType;
  currency: string;
  generatedAt: string;
  horizonDays: 7 | 30;
  pointEstimate: number;
  lowerBound: number;
  upperBound: number;
  model: ForecastModel;
  observationCount: number;
  historyDays: number;
  backtestMae: number;
  backtestSmape: number;
  directionalAccuracy: number | null;
  confidence: "low" | "medium" | "high";
  warnings: readonly string[];
}>;

export type MarketForecastResult =
  | { forecastStatus: "ready"; forecast: MarketForecast }
  | {
      forecastStatus: "insufficient_data";
      reason:
        | "observation_count"
        | "history_days"
        | "series_mismatch"
        | "invalid_snapshot"
        | "identity_not_exact";
    };

type Point = Readonly<{ day: number; amount: number }>;

type BacktestMetrics = Readonly<{
  model: ForecastModel;
  mae: number;
  smape: number;
  directionalAccuracy: number | null;
  residualStandardDeviation: number;
}>;

const MODELS: readonly ForecastModel[] = [
  "naive",
  "moving_average",
  "exponential_smoothing",
  "linear_trend",
  "holt",
];

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function linearPrediction(points: readonly Point[], futureDay: number): number {
  const xMean = average(points.map((point) => point.day));
  const yMean = average(points.map((point) => point.amount));
  const denominator = points.reduce(
    (sum, point) => sum + (point.day - xMean) ** 2,
    0,
  );
  if (denominator === 0) return points.at(-1)!.amount;
  const slope = points.reduce(
    (sum, point) =>
      sum + (point.day - xMean) * (point.amount - yMean),
    0,
  ) / denominator;
  return yMean + slope * (futureDay - xMean);
}

function holtPrediction(points: readonly Point[], horizonDays: number): number {
  if (points.length < 2) return points.at(-1)!.amount;
  const alpha = 0.4;
  const beta = 0.2;
  let level = points[0]!.amount;
  const firstGap = Math.max(1, points[1]!.day - points[0]!.day);
  let trend = (points[1]!.amount - points[0]!.amount) / firstGap;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    const previous = points[index - 1]!;
    const gap = Math.max(1, point.day - previous.day);
    const previousLevel = level;
    level = alpha * point.amount + (1 - alpha) * (level + trend * gap);
    trend = beta * ((level - previousLevel) / gap) + (1 - beta) * trend;
  }
  return level + trend * horizonDays;
}

function predict(
  model: ForecastModel,
  points: readonly Point[],
  futureDay: number,
): number {
  const last = points.at(-1)!;
  const horizonDays = Math.max(1, futureDay - last.day);
  if (model === "naive") return last.amount;
  if (model === "moving_average") {
    return average(points.slice(-Math.min(7, points.length)).map(
      (point) => point.amount,
    ));
  }
  if (model === "exponential_smoothing") {
    const alpha = 0.3;
    let level = points[0]!.amount;
    for (const point of points.slice(1)) {
      level = alpha * point.amount + (1 - alpha) * level;
    }
    return level;
  }
  if (model === "linear_trend") {
    return linearPrediction(points, futureDay);
  }
  return holtPrediction(points, horizonDays);
}

function standardDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = average(values);
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      values.length,
  );
}

function backtest(
  model: ForecastModel,
  points: readonly Point[],
): BacktestMetrics {
  const validationCount = Math.min(14, Math.max(7, Math.floor(points.length / 3)));
  const start = points.length - validationCount;
  const absoluteErrors: number[] = [];
  const smapeValues: number[] = [];
  let directionCorrect = 0;
  let directionTotal = 0;

  for (let index = start; index < points.length; index += 1) {
    const training = points.slice(0, index);
    const actual = points[index]!;
    const previous = training.at(-1)!;
    const estimate = Math.max(0.01, predict(model, training, actual.day));
    const error = estimate - actual.amount;
    absoluteErrors.push(Math.abs(error));
    const denominator = (Math.abs(estimate) + Math.abs(actual.amount)) / 2;
    smapeValues.push(denominator === 0 ? 0 : Math.abs(error) / denominator * 100);

    const actualDirection = Math.sign(actual.amount - previous.amount);
    if (actualDirection !== 0) {
      directionTotal += 1;
      if (Math.sign(estimate - previous.amount) === actualDirection) {
        directionCorrect += 1;
      }
    }
  }

  return {
    model,
    mae: average(absoluteErrors),
    smape: average(smapeValues),
    directionalAccuracy:
      directionTotal > 0 ? directionCorrect / directionTotal : null,
    residualStandardDeviation: standardDeviation(absoluteErrors),
  };
}

function selectModel(metrics: readonly BacktestMetrics[]): BacktestMetrics {
  const naive = metrics.find((metric) => metric.model === "naive")!;
  const clearlyBetter = metrics.filter(
    (metric) =>
      metric.model !== "naive" &&
      metric.mae + 0.01 < naive.mae &&
      metric.smape + 0.01 < naive.smape &&
      metric.mae <= naive.mae * 0.95 &&
      metric.smape <= naive.smape * 0.98,
  );
  if (clearlyBetter.length === 0) return naive;

  return [...clearlyBetter].sort((left, right) => {
    const maeDifference = left.mae - right.mae;
    if (Math.abs(maeDifference) > naive.mae * 0.02) return maeDifference;
    return MODELS.indexOf(left.model) - MODELS.indexOf(right.model);
  })[0]!;
}

function normalizeDailyPoints(
  snapshots: readonly MarketSnapshot[],
): readonly Point[] {
  const sorted = [...snapshots].sort(
    (left, right) =>
      Date.parse(left.observedAt) - Date.parse(right.observedAt),
  );
  const origin = Date.parse(sorted[0]!.observedAt);
  const daily = new Map<number, number>();
  for (const snapshot of sorted) {
    const day = Math.floor(
      (Date.parse(snapshot.observedAt) - origin) / (24 * 60 * 60 * 1_000),
    );
    daily.set(day, snapshot.amount);
  }
  return [...daily.entries()].map(([day, amount]) => ({ day, amount }));
}

function confidenceFor(
  observationCount: number,
  historyDays: number,
  points: readonly Point[],
  metrics: BacktestMetrics,
): MarketForecast["confidence"] {
  const expectedDailyPoints = historyDays + 1;
  const missingRatio = Math.max(
    0,
    1 - points.length / expectedDailyPoints,
  );
  if (
    observationCount >= 90 &&
    historyDays >= 90 &&
    missingRatio <= 0.1 &&
    metrics.smape < 8
  ) {
    return "high";
  }
  if (
    observationCount < 45 ||
    historyDays < 45 ||
    missingRatio > 0.25 ||
    metrics.smape > 20
  ) {
    return "low";
  }
  return "medium";
}

export function forecastMarketSeries(
  snapshots: readonly MarketSnapshot[],
  horizonDays: 7 | 30,
  generatedAt = new Date().toISOString(),
): MarketForecastResult {
  if (snapshots.some((snapshot) => !validateMarketSnapshot(snapshot).valid)) {
    return { forecastStatus: "insufficient_data", reason: "invalid_snapshot" };
  }
  if (snapshots.length < 30) {
    return { forecastStatus: "insufficient_data", reason: "observation_count" };
  }
  const expectedKey = getMarketSeriesKey(snapshots[0]!);
  if (snapshots.some((snapshot) => getMarketSeriesKey(snapshot) !== expectedKey)) {
    return { forecastStatus: "insufficient_data", reason: "series_mismatch" };
  }
  if (snapshots.some((snapshot) => snapshot.identityMatch !== "exact")) {
    return { forecastStatus: "insufficient_data", reason: "identity_not_exact" };
  }

  const ordered = [...snapshots].sort(
    (left, right) =>
      Date.parse(left.observedAt) - Date.parse(right.observedAt),
  );
  const first = ordered[0]!;
  const latest = ordered.at(-1)!;
  const historyDays = Math.floor(
    (Date.parse(latest.observedAt) - Date.parse(first.observedAt)) /
      (24 * 60 * 60 * 1_000),
  );
  if (historyDays < 21) {
    return { forecastStatus: "insufficient_data", reason: "history_days" };
  }
  const points = normalizeDailyPoints(ordered);
  if (points.length < 30) {
    return { forecastStatus: "insufficient_data", reason: "observation_count" };
  }

  const metrics = MODELS.map((model) => backtest(model, points));
  const selected = selectModel(metrics);
  const lastDay = points.at(-1)!.day;
  const pointEstimate = Math.max(
    0.01,
    predict(selected.model, points, lastDay + horizonDays),
  );
  const intervalScale = Math.sqrt(horizonDays);
  const errorWidth = Math.max(
    selected.mae,
    selected.residualStandardDeviation,
  ) * 1.96 * intervalScale;
  const expectedDailyPoints = historyDays + 1;
  const missingRatio = Math.max(0, 1 - points.length / expectedDailyPoints);
  const warnings = [
    "過去データに基づく参考推移であり、実際の取引価格を保証しません。",
  ];
  if (missingRatio > 0.1) {
    warnings.push("観測日の欠損があるため予測区間を広く解釈してください。");
  }
  if (selected.model !== "naive") {
    warnings.push("単純モデルよりバックテスト誤差が明確に小さいモデルを採用しました。");
  }

  return {
    forecastStatus: "ready",
    forecast: {
      identity: latest.identity,
      variant: latest.variant,
      provider: latest.provider,
      priceType: latest.priceType,
      currency: latest.currency,
      generatedAt,
      horizonDays,
      pointEstimate: round(pointEstimate),
      lowerBound: round(Math.max(0.01, pointEstimate - errorWidth)),
      upperBound: round(pointEstimate + errorWidth),
      model: selected.model,
      observationCount: ordered.length,
      historyDays,
      backtestMae: round(selected.mae),
      backtestSmape: round(selected.smape),
      directionalAccuracy:
        selected.directionalAccuracy === null
          ? null
          : round(selected.directionalAccuracy),
      confidence: confidenceFor(
        ordered.length,
        historyDays,
        points,
        selected,
      ),
      warnings,
    },
  };
}
