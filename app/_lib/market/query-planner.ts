import type { MarketSearchContext, MarketSearchQuery } from "./contracts";
import { normalizeStyleCode } from "./listing-match";

export function planMarketQueries(context: MarketSearchContext): MarketSearchQuery[] {
  const brand = clean(context.identity.brand);
  const model = clean(context.identity.modelName) ?? context.query.normalize("NFKC").trim().slice(0, 128);
  const styleCode = normalizeStyleCode(context.identity.styleCode);
  const colorway = context.identity.verificationState === "model_color_style_verified"
    || context.identity.verificationState === "model_color_verified"
    ? clean(context.identity.colorwayName)
    : null;
  const candidates: MarketSearchQuery[] = [];

  if (styleCode) {
    candidates.push({ mode: "strict", query: styleCode, reason: "style_code" });
    if (brand) candidates.push({ mode: "strict", query: `${brand} ${styleCode}`, reason: "brand_style_code" });
    candidates.push({ mode: "relaxed", query: `${model} ${styleCode}`, reason: "model_style_code" });
  }
  if (colorway) candidates.push({ mode: "relaxed", query: `${model} ${colorway}`, reason: "model_colorway" });
  candidates.push({ mode: "model_only", query: model, reason: "model" });

  const seen = new Set<string>();
  return candidates.filter(({ query }) => {
    const normalized = query.normalize("NFKC").replace(/\s+/gu, " ").trim().slice(0, 128);
    if (!normalized || seen.has(normalized.toLocaleLowerCase("en-US"))) return false;
    seen.add(normalized.toLocaleLowerCase("en-US"));
    return true;
  }).map((query) => ({ ...query, query: query.query.normalize("NFKC").replace(/\s+/gu, " ").trim().slice(0, 128) }));
}

function clean(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim();
  return normalized ? normalized.slice(0, 128) : null;
}
