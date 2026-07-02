import type { ProviderReadiness } from "./types";

export function createGeminiFallbackReadiness(configured: boolean): ProviderReadiness {
  return configured
    ? { provider: "gemini", status: "fallback", detail: "Geminiの出力を安全に採用できなかったため、検証済みfallbackとrule-based説明を使用しています。" }
    : { provider: "gemini", status: "missing_config", detail: "Geminiは未設定です。検証済みfallbackとrule-based説明を使用しています。" };
}
