import type { ProviderReadiness } from "./types";

export type RakutenProviderStatus = "ready" | "manual_only" | "missing_config" | "blocked_forbidden" | "blocked_rate_limit" | "network_or_http_error" | "invalid_response";

export function createRakutenProviderReadiness(status: RakutenProviderStatus): ProviderReadiness {
  const details: Record<RakutenProviderStatus, string> = {
    ready: "楽天APIから安全に正規化できたlistingを外部参考情報として表示します。Core scoreには使いません。",
    manual_only: "楽天の販売情報は推薦後にユーザーが手動で確認します。推薦処理では外部リクエストを行いません。",
    missing_config: "楽天APIは未設定です。具体モデル名から検索リンクfallbackを表示します。",
    blocked_forbidden: "楽天APIは現在利用許可を確認できません。Application ID・Access Key・利用API・楽天側設定を確認してください。検索リンクfallbackは利用できます。",
    blocked_rate_limit: "楽天APIの利用回数制限に達しました。検索リンクfallbackを利用します。",
    network_or_http_error: "楽天APIへ接続できませんでした。検索リンクfallbackを利用します。",
    invalid_response: "楽天API応答を安全に正規化できませんでした。検索リンクfallbackを利用します。",
  };
  return { provider: "rakuten", status, detail: details[status] };
}
