import type { ProviderReadiness } from "./types";

export type RakutenProviderStatus =
  | "ready"
  | "missing_config"
  | "blocked_forbidden"
  | "blocked_rate_limit"
  | "network_or_http_error"
  | "invalid_response";

export function createRakutenProviderReadiness(
  status: RakutenProviderStatus,
): ProviderReadiness {
  switch (status) {
    case "ready":
      return {
        provider: "rakuten",
        status: "ready",
        detail:
          "楽天APIから取得し、安全に正規化できた商品候補を含めて判定しています。",
      };
    case "missing_config":
      return {
        provider: "rakuten",
        status: "missing_config",
        detail:
          "楽天APIが未設定のため、診断結果とローカル候補をもとに判定しています。",
      };
    case "blocked_forbidden":
      return {
        provider: "rakuten",
        status: "blocked_forbidden",
        detail:
          "楽天APIは現在利用を許可していないため、ローカル候補で判定しています。credentialや利用元設定の確認が必要です。",
      };
    case "blocked_rate_limit":
      return {
        provider: "rakuten",
        status: "blocked_rate_limit",
        detail:
          "楽天APIの利用回数制限により、今回はローカル候補で判定しています。",
      };
    case "invalid_response":
      return {
        provider: "rakuten",
        status: "invalid_response",
        detail:
          "楽天APIの応答を安全な商品候補へ変換できなかったため、ローカル候補で判定しています。",
      };
    case "network_or_http_error":
      return {
        provider: "rakuten",
        status: "network_or_http_error",
        detail:
          "楽天APIへ接続できないため、診断結果とローカル候補をもとに判定しています。",
      };
  }
}
