import type { ProviderReadiness } from "./types";

type SafeEnvironment = Record<string, string | undefined>;

export type RakutenObservedStatus =
  | "blocked_forbidden"
  | "shape_valid_200"
  | "not_checked";

export function createRakutenReadiness(
  env: SafeEnvironment,
  observedStatus: RakutenObservedStatus = "blocked_forbidden",
): ProviderReadiness {
  if (!hasValue(env["RAKUTEN_APPLICATION_ID"]) || !hasValue(env["RAKUTEN_ACCESS_KEY"])) {
    return {
      provider: "rakuten",
      status: "missing_config",
      detail:
        "楽天API設定がないため、商品データ取得には使っていません。診断結果とローカルの仮候補で判定しています。",
    };
  }

  if (observedStatus === "shape_valid_200") {
    return {
      provider: "rakuten",
      status: "ready_not_connected",
      detail:
        "楽天APIの応答形式は確認できましたが、Core v1 の候補にはまだ接続していません。",
    };
  }

  if (observedStatus === "not_checked") {
    return {
      provider: "rakuten",
      status: "not_checked",
      detail:
        "楽天APIはこの実行では未確認です。外部商品データは使わず、診断結果とローカルの仮候補で判定しています。",
    };
  }

  return {
    provider: "rakuten",
    status: "blocked_forbidden",
    detail:
      "楽天APIは現在HTTP 403のため、商品データ取得には使っていません。Dashboard / credential / referrer-origin確認が必要です。",
  };
}

export function createGeminiFallbackReadiness(
  configured: boolean,
): ProviderReadiness {
  return configured
    ? {
        provider: "gemini",
        status: "fallback",
        detail:
          "AI補助を利用できなかったため、ルールベースで説明しています。",
      }
    : {
        provider: "gemini",
        status: "missing_config",
        detail:
          "AI補助が未設定のため、ルールベースで説明しています。",
      };
}

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
