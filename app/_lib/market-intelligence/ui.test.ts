import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MARKET_UI_STATE_LABELS,
  marketStatusMessage,
  parseMarketProviderStatusPayload,
  type MarketUiState,
} from "./ui";

describe("responsive market intelligence UI contract", () => {
  it.each([
    "loaded",
    "partial",
    "not_configured",
    "not_authorized",
    "insufficient_data",
    "rate_limited",
    "temporarily_unavailable",
  ] satisfies readonly MarketUiState[])("has explicit copy for %s", (state) => {
    expect(MARKET_UI_STATE_LABELS[state]).toBeTruthy();
    expect(marketStatusMessage(state)).toBeTruthy();
  });

  it("parses a status payload that proves no automatic request was made", () => {
    expect(parseMarketProviderStatusPayload({
      stockx: "not_configured",
      snkrdunk: "not_authorized",
      mercari: "not_authorized",
      automaticRequestMade: false,
    })).toEqual({
      stockx: "not_configured",
      snkrdunk: "not_authorized",
      mercari: "not_authorized",
      automaticRequestMade: false,
    });
    expect(parseMarketProviderStatusPayload({
      stockx: "configured",
      snkrdunk: "not_authorized",
      mercari: "not_authorized",
      automaticRequestMade: true,
    })).toBeNull();
  });

  it("renders semantic price types, accessible chart points, and non-zero missing data", () => {
    const source = readFileSync(
      join(process.cwd(), "app/_components/MarketIntelligencePanel.tsx"),
      "utf8",
    );
    expect(source).toContain('"lowest_ask"');
    expect(source).toContain('"highest_bid"');
    expect(source).toContain('"listing_price"');
    expect(source).toContain('"sold_price"');
    expect(source).toContain("tabIndex={0}");
    expect(source).toContain("実線・記号は実測、破線は予測");
    expect(source).toContain('summary ? formatMoney(summary.median, currency) : "—"');
    expect(source).not.toContain('データなし ? "0円"');
  });

  it("has narrow-screen layout without a horizontally scrolling chart", () => {
    const css = readFileSync(
      join(process.cwd(), "app/globals.css"),
      "utf8",
    );
    expect(css).toContain("@media (max-width: 560px)");
    expect(css).toContain(".market-chart svg");
    expect(css).toContain("width: 100%");
    expect(css).not.toMatch(
      /\.market-chart\s*\{[^}]*overflow-x:\s*(auto|scroll)/su,
    );
  });
});

