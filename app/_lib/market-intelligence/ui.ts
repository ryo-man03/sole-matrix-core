export type MarketUiState =
  | "loaded"
  | "partial"
  | "not_configured"
  | "not_authorized"
  | "insufficient_data"
  | "rate_limited"
  | "temporarily_unavailable";

export const MARKET_UI_STATE_LABELS: Readonly<Record<MarketUiState, string>> = {
  loaded: "読込済み",
  partial: "一部のみ読込済み",
  not_configured: "未設定",
  not_authorized: "公式連携なし",
  insufficient_data: "データ不足",
  rate_limited: "取得上限に到達",
  temporarily_unavailable: "一時的に利用できません",
};

export type MarketProviderStatusPayload = Readonly<{
  stockx: "configured" | "not_configured";
  snkrdunk: "not_authorized";
  mercari: "not_authorized";
  automaticRequestMade: false;
}>;

export function parseMarketProviderStatusPayload(
  value: unknown,
): MarketProviderStatusPayload | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    (record.stockx !== "configured" && record.stockx !== "not_configured") ||
    record.snkrdunk !== "not_authorized" ||
    record.mercari !== "not_authorized" ||
    record.automaticRequestMade !== false
  ) {
    return null;
  }
  return record as MarketProviderStatusPayload;
}

export function marketStatusMessage(state: MarketUiState): string {
  return {
    loaded: "正規化済みの相場データを表示しています。",
    partial: "一部の行だけを表示しています。拒否理由を確認してください。",
    not_configured: "StockXの承認済み認証情報は設定されていません。",
    not_authorized: "現在、このサービスから自動相場を取得できる公式連携は設定されていません。",
    insufficient_data: "推移予測に必要なデータが不足しています。",
    rate_limited: "提供元の取得上限に達しました。時間をおいて確認してください。",
    temporarily_unavailable: "市場データを一時的に確認できません。推薦結果には影響しません。",
  }[state];
}

