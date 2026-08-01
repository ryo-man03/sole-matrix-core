"use client";

import { useEffect, useMemo, useState } from "react";
import type { CandidateProfile } from "../_lib/core-v1/types";
import { forecastMarketSeries, type MarketForecast } from "../_lib/market-intelligence/forecast";
import { matchSneakerIdentity } from "../_lib/market-intelligence/identity";
import { importMarketData, type ManualImportRejection } from "../_lib/market-intelligence/manualImport";
import { getMarketSeriesKey, MARKET_PRICE_LABELS, type MarketPriceType, type MarketSnapshot } from "../_lib/market-intelligence/snapshot";
import { calculateMarketSeriesSummary, type MarketSeriesSummary } from "../_lib/market-intelligence/statistics";
import {
  MARKET_UI_STATE_LABELS,
  marketStatusMessage,
  parseMarketProviderStatusPayload,
  type MarketProviderStatusPayload,
  type MarketUiState,
} from "../_lib/market-intelligence/ui";

type Props = {
  candidate: Pick<
    CandidateProfile,
    "brand" | "name" | "modelName" | "colorwayName" | "styleCode" | "factualVerification"
  >;
};

export type ContextSeries = Readonly<{
  key: string;
  snapshots: readonly MarketSnapshot[];
  summaries: ReadonlyMap<MarketPriceType, MarketSeriesSummary>;
  forecasts7: ReadonlyMap<MarketPriceType, MarketForecast>;
  forecasts30: ReadonlyMap<MarketPriceType, MarketForecast>;
}>;

const DISPLAY_PRICE_TYPES: readonly MarketPriceType[] = [
  "lowest_ask",
  "highest_bid",
  "listing_price",
  "sold_price",
];

const SERIES_STYLES: Readonly<Record<MarketPriceType, {
  color: string;
  dash: string;
  marker: string;
}>> = {
  lowest_ask: { color: "#f97316", dash: "", marker: "●" },
  highest_bid: { color: "#2563eb", dash: "8 5", marker: "■" },
  listing_price: { color: "#7c3aed", dash: "2 5", marker: "▲" },
  sold_price: { color: "#15803d", dash: "12 4 2 4", marker: "◆" },
  recommended_sell: { color: "#a16207", dash: "6 6", marker: "◇" },
  recommended_buy: { color: "#0f766e", dash: "4 6", marker: "○" },
};

function contextKey(snapshot: MarketSnapshot): string {
  const parts = getMarketSeriesKey(snapshot).split("|");
  parts.splice(-2, 1);
  return parts.join("|");
}

function verifiedCandidateIdentity(candidate: Props["candidate"]) {
  const styleStatus = candidate.factualVerification?.styleCode;
  if (
    !candidate.styleCode ||
    !["officially_verified", "independently_verified"].includes(styleStatus ?? "")
  ) {
    return null;
  }
  return {
    brand: candidate.brand ?? "",
    modelName: candidate.modelName ?? candidate.name,
    colorwayName: candidate.colorwayName ?? null,
    styleCode: candidate.styleCode,
    releaseYear: null,
  };
}

export function buildMarketContexts(snapshots: readonly MarketSnapshot[]): readonly ContextSeries[] {
  const contexts = new Map<string, MarketSnapshot[]>();
  for (const snapshot of snapshots) {
    const key = contextKey(snapshot);
    const values = contexts.get(key) ?? [];
    values.push(snapshot);
    contexts.set(key, values);
  }

  return [...contexts.entries()].map(([key, values]) => {
    const byPriceType = new Map<MarketPriceType, MarketSnapshot[]>();
    for (const snapshot of values) {
      const series = byPriceType.get(snapshot.priceType) ?? [];
      series.push(snapshot);
      byPriceType.set(snapshot.priceType, series);
    }
    const summaries = new Map<MarketPriceType, MarketSeriesSummary>();
    const forecasts7 = new Map<MarketPriceType, MarketForecast>();
    const forecasts30 = new Map<MarketPriceType, MarketForecast>();
    for (const [priceType, series] of byPriceType) {
      const summary = calculateMarketSeriesSummary(series);
      if (summary.status === "success") summaries.set(priceType, summary.data);
      const seven = forecastMarketSeries(series, 7);
      if (seven.forecastStatus === "ready") forecasts7.set(priceType, seven.forecast);
      const thirty = forecastMarketSeries(series, 30);
      if (thirty.forecastStatus === "ready") forecasts30.set(priceType, thirty.forecast);
    }
    return {
      key,
      snapshots: values,
      summaries,
      forecasts7,
      forecasts30,
    };
  });
}

export function MarketIntelligencePanel({ candidate }: Props) {
  const [providerStatus, setProviderStatus] =
    useState<MarketProviderStatusPayload | null>(null);
  const [providerState, setProviderState] =
    useState<MarketUiState>("not_configured");
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [rejections, setRejections] = useState<readonly ManualImportRejection[]>([]);
  const [importState, setImportState] =
    useState<MarketUiState>("insufficient_data");
  const [activeContextKey, setActiveContextKey] = useState("");
  const candidateIdentity = verifiedCandidateIdentity(candidate);
  const contexts = useMemo(() => buildMarketContexts(snapshots), [snapshots]);
  const activeContext =
    contexts.find((context) => context.key === activeContextKey) ??
    contexts[0] ??
    null;

  useEffect(() => {
    let active = true;
    void fetch("/api/market/intelligence/status", { cache: "no-store" })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        const parsed = parseMarketProviderStatusPayload(payload);
        if (!active) return;
        if (!response.ok || !parsed) {
          setProviderState("temporarily_unavailable");
          return;
        }
        setProviderStatus(parsed);
        setProviderState(
          parsed.stockx === "configured"
            ? "insufficient_data"
            : "not_configured",
        );
      })
      .catch(() => {
        if (active) setProviderState("temporarily_unavailable");
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleImport(file: File | null) {
    if (!file) return;
    if (file.size > 2_000_000) {
      setRejections([{ row: 1, errors: ["ファイルは2MB以下にしてください"] }]);
      setImportState("partial");
      return;
    }
    const lowerName = file.name.toLocaleLowerCase("en-US");
    const format = lowerName.endsWith(".json")
      ? "json"
      : lowerName.endsWith(".csv")
        ? "csv"
        : null;
    const allowedMimeTypes = format === "json"
      ? new Set(["", "application/json", "text/json"])
      : new Set(["", "text/csv", "application/csv", "text/plain"]);
    if (!format || !allowedMimeTypes.has(file.type.toLocaleLowerCase("en-US"))) {
      setRejections([{
        row: 1,
        errors: ["CSVまたはJSON形式のファイルを選択してください"],
      }]);
      setImportState("partial");
      return;
    }
    const result = importMarketData(await file.text(), format);
    const matched = candidateIdentity
      ? result.accepted.filter(
          (snapshot) =>
            matchSneakerIdentity(candidateIdentity, snapshot.identity).match ===
            "exact",
        )
      : [];
    const identityRejected = result.accepted.length - matched.length;
    const nextRejections = [
      ...result.rejected,
      ...(identityRejected > 0
        ? [{
            row: 1,
            errors: [`推薦候補と完全一致しない${identityRejected}件を除外しました`],
          }]
        : []),
    ];
    setSnapshots(matched);
    setRejections(nextRejections);
    const nextContexts = buildMarketContexts(matched);
    setActiveContextKey(nextContexts[0]?.key ?? "");
    setImportState(
      matched.length === 0
        ? "insufficient_data"
        : nextRejections.length > 0
          ? "partial"
          : "loaded",
    );
  }

  const state = snapshots.length > 0 ? importState : providerState;
  const latestSnapshot = activeContext?.snapshots.reduce<MarketSnapshot | null>(
    (latest, snapshot) =>
      !latest || Date.parse(snapshot.observedAt) > Date.parse(latest.observedAt)
        ? snapshot
        : latest,
    null,
  ) ?? null;

  return (
    <section
      className="market-intelligence"
      aria-labelledby="market-intelligence-title"
      data-market-state={state}
    >
      <div className="market-intelligence-heading">
        <div>
          <p className="diagnosis-summary-kicker">Market intelligence</p>
          <h4 id="market-intelligence-title">相場・推移</h4>
          <p>推薦判断とは分離した参考情報です。価格の種類と出典を混ぜずに表示します。</p>
        </div>
        <strong data-status={state}>{MARKET_UI_STATE_LABELS[state]}</strong>
      </div>

      <div className="market-provider-statuses" aria-label="プロバイダー状態">
        <ProviderBadge
          label="StockX"
          state={providerStatus?.stockx === "configured" ? "insufficient_data" : providerState}
          detail={providerStatus?.stockx === "configured"
            ? "公式APIの接続設定済み。自動取得は行っていません。"
            : marketStatusMessage(providerState)}
        />
        <ProviderBadge label="SNKRDUNK" state="not_authorized" detail={marketStatusMessage("not_authorized")} />
        <ProviderBadge label="Mercari" state="not_authorized" detail={marketStatusMessage("not_authorized")} />
      </div>

      <p className="market-intelligence-status" role="status" aria-live="polite">
        {marketStatusMessage(state)}
      </p>

      <div className="market-manual-import">
        <div>
          <h5>正当に取得したデータを読み込む</h5>
          <p>出典・取得日時・style code・サイズ・状態・通貨・価格種別を含むCSV / JSONのみ。ブラウザ内で確認し、自動収集はしません。</p>
        </div>
        <label>
          CSV / JSONを選択
          <input
            accept=".csv,.json,text/csv,application/json"
            disabled={!candidateIdentity}
            onChange={(event) => void handleImport(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
        {!candidateIdentity ? (
          <p className="market-import-warning">推薦候補のstyle codeが公式・独立情報で確認できないため、価格データを商品へ紐づけません。</p>
        ) : null}
      </div>

      {rejections.length > 0 ? (
        <details className="market-import-rejections">
          <summary>読み込めなかった行を確認（{rejections.length}件）</summary>
          <ul>{rejections.slice(0, 20).map((rejection, index) => (
            <li key={`${rejection.row}-${index}`}>行 {rejection.row}: {rejection.errors.join(" / ")}</li>
          ))}</ul>
        </details>
      ) : null}

      {contexts.length > 1 ? (
        <label className="market-context-select">
          表示するサイズ・状態
          <select value={activeContext?.key ?? ""} onChange={(event) => setActiveContextKey(event.target.value)}>
            {contexts.map((context) => {
              const first = context.snapshots[0]!;
              return (
                <option key={context.key} value={context.key}>
                  {first.provider} / {first.variant.sizeSystem} {first.variant.sizeValue} / {first.variant.condition} / {first.currency}
                </option>
              );
            })}
          </select>
        </label>
      ) : null}

      {activeContext && latestSnapshot ? (
        <>
          <dl className="market-context-metadata">
            <div><dt>Provider</dt><dd>{latestSnapshot.provider}</dd></div>
            <div><dt>最終取得</dt><dd>{formatDate(latestSnapshot.observedAt)}</dd></div>
            <div><dt>サイズ</dt><dd>{latestSnapshot.variant.sizeSystem} {latestSnapshot.variant.sizeValue}</dd></div>
            <div><dt>Condition</dt><dd>{latestSnapshot.variant.condition}</dd></div>
            <div><dt>Currency</dt><dd>{latestSnapshot.currency}</dd></div>
            <div><dt>Data quality</dt><dd>{latestSnapshot.sourceQuality} / {latestSnapshot.identityMatch}</dd></div>
          </dl>

          <div className="market-price-grid">
            {DISPLAY_PRICE_TYPES.map((priceType) => (
              <MarketPriceCard
                currency={latestSnapshot.currency}
                key={priceType}
                priceType={priceType}
                summary={activeContext.summaries.get(priceType)}
              />
            ))}
          </div>

          <AccessibleMarketChart context={activeContext} currency={latestSnapshot.currency} />

          <div className="market-forecast-grid">
            {DISPLAY_PRICE_TYPES.map((priceType) => (
              <ForecastCard
                currency={latestSnapshot.currency}
                forecast7={activeContext.forecasts7.get(priceType)}
                forecast30={activeContext.forecasts30.get(priceType)}
                key={priceType}
                priceType={priceType}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="market-intelligence-empty">
          <strong>表示できる相場データはありません</strong>
          <p>価格がない項目を0円として表示しません。正式連携または検証可能なmanual importが必要です。</p>
        </div>
      )}
    </section>
  );
}

function ProviderBadge({ label, state, detail }: {
  label: string;
  state: MarketUiState;
  detail: string;
}) {
  return (
    <article data-status={state}>
      <div><strong>{label}</strong><span>{MARKET_UI_STATE_LABELS[state]}</span></div>
      <p>{detail}</p>
    </article>
  );
}

function MarketPriceCard({ currency, priceType, summary }: {
  currency: string;
  priceType: MarketPriceType;
  summary: MarketSeriesSummary | undefined;
}) {
  return (
    <article>
      <span>{MARKET_PRICE_LABELS[priceType]}</span>
      <strong>{summary ? formatMoney(summary.median, currency) : "—"}</strong>
      <dl>
        <div><dt>最新</dt><dd>{summary ? formatMoney(summary.latest, currency) : "—"}</dd></div>
        <div><dt>Sample</dt><dd>{summary ? `${summary.observations}件` : "データなし"}</dd></div>
        <div><dt>7日変化</dt><dd>{formatChange(summary?.change7d)}</dd></div>
        <div><dt>30日変化</dt><dd>{formatChange(summary?.change30d)}</dd></div>
      </dl>
    </article>
  );
}

function ForecastCard({ currency, forecast7, forecast30, priceType }: {
  currency: string;
  forecast7: MarketForecast | undefined;
  forecast30: MarketForecast | undefined;
  priceType: MarketPriceType;
}) {
  return (
    <article>
      <h5>{MARKET_PRICE_LABELS[priceType]}の参考推移</h5>
      {!forecast7 || !forecast30 ? (
        <p>推移予測に必要なデータが不足しています</p>
      ) : (
        <>
          <p><strong>7日</strong> {formatMoney(forecast7.pointEstimate, currency)} <span>区間 {formatMoney(forecast7.lowerBound, currency)}–{formatMoney(forecast7.upperBound, currency)}</span></p>
          <p><strong>30日</strong> {formatMoney(forecast30.pointEstimate, currency)} <span>区間 {formatMoney(forecast30.lowerBound, currency)}–{formatMoney(forecast30.upperBound, currency)}</span></p>
          <small>model: {forecast7.model} / confidence: {forecast7.confidence} / backtest MAE {formatMoney(forecast7.backtestMae, currency)}</small>
          <p>過去の価格データに基づく参考推移です。実際の取引価格を保証するものではありません。</p>
        </>
      )}
    </article>
  );
}

export function AccessibleMarketChart({ context, currency }: {
  context: ContextSeries;
  currency: string;
}) {
  const width = 720;
  const height = 260;
  const padding = 34;
  const values = context.snapshots.map((snapshot) => snapshot.amount);
  const times = context.snapshots.map((snapshot) => Date.parse(snapshot.observedAt));
  const minTime = Math.min(...times);
  const maxActualTime = Math.max(...times);
  const maxTime = maxActualTime + 30 * 24 * 60 * 60 * 1_000;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(1, maxValue - minValue);
  const yMin = Math.max(0, minValue - spread * 0.1);
  const yMax = maxValue + spread * 0.1;
  const x = (timestamp: number) =>
    padding + (timestamp - minTime) / Math.max(1, maxTime - minTime) * (width - padding * 2);
  const y = (amount: number) =>
    height - padding - (amount - yMin) / Math.max(1, yMax - yMin) * (height - padding * 2);
  const byPriceType = new Map<MarketPriceType, MarketSnapshot[]>();
  for (const snapshot of context.snapshots) {
    const series = byPriceType.get(snapshot.priceType) ?? [];
    series.push(snapshot);
    byPriceType.set(snapshot.priceType, series);
  }

  if (context.snapshots.length < 2 || minTime === maxActualTime) {
    return <p className="market-chart-empty">実測点が少ないため、グラフを表示していません。</p>;
  }

  return (
    <figure className="market-chart">
      <figcaption>価格推移（実線・記号は実測、破線は予測、縦線は予測区間）</figcaption>
      <div className="market-chart-legend" aria-label="系列の凡例">
        {[...byPriceType.keys()].map((priceType) => (
          <span key={priceType}>
            <i style={{ backgroundColor: SERIES_STYLES[priceType].color }} />
            {SERIES_STYLES[priceType].marker} {MARKET_PRICE_LABELS[priceType]}
          </span>
        ))}
      </div>
      <svg
        aria-label={`${currency}建ての実測価格と参考予測。各点はキーボードで確認できます。`}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line className="market-chart-axis" x1={padding} x2={padding} y1={padding} y2={height - padding} />
        <line className="market-chart-axis" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        {[...byPriceType.entries()].map(([priceType, unsorted]) => {
          const series = [...unsorted].sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt));
          const style = SERIES_STYLES[priceType];
          const forecast = context.forecasts30.get(priceType);
          const latest = series.at(-1)!;
          return (
            <g key={priceType}>
              <polyline
                fill="none"
                points={series.map((snapshot) => `${x(Date.parse(snapshot.observedAt))},${y(snapshot.amount)}`).join(" ")}
                stroke={style.color}
                strokeDasharray={style.dash}
                strokeWidth="3"
              />
              {series.map((snapshot) => (
                <circle
                  aria-label={`${MARKET_PRICE_LABELS[priceType]} ${formatDate(snapshot.observedAt)} ${formatMoney(snapshot.amount, currency)}`}
                  cx={x(Date.parse(snapshot.observedAt))}
                  cy={y(snapshot.amount)}
                  fill={style.color}
                  key={snapshot.observedAt}
                  r="5"
                  role="img"
                  tabIndex={0}
                >
                  <title>{`${MARKET_PRICE_LABELS[priceType]} / ${formatDate(snapshot.observedAt)} / ${formatMoney(snapshot.amount, currency)}`}</title>
                </circle>
              ))}
              {forecast ? (
                <>
                  <line
                    aria-label={`${MARKET_PRICE_LABELS[priceType]} 30日予測`}
                    stroke={style.color}
                    strokeDasharray="7 7"
                    strokeWidth="3"
                    x1={x(Date.parse(latest.observedAt))}
                    x2={x(maxActualTime + 30 * 24 * 60 * 60 * 1_000)}
                    y1={y(latest.amount)}
                    y2={y(forecast.pointEstimate)}
                  />
                  <line
                    aria-label={`${MARKET_PRICE_LABELS[priceType]} 30日予測区間`}
                    stroke={style.color}
                    strokeOpacity="0.55"
                    strokeWidth="8"
                    x1={x(maxTime)}
                    x2={x(maxTime)}
                    y1={y(forecast.lowerBound)}
                    y2={y(forecast.upperBound)}
                  />
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="market-chart-help">データ点へTabキーで移動すると、日付・系列・価格を読み上げます。</p>
    </figure>
  );
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}

function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatDate(timestamp: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
