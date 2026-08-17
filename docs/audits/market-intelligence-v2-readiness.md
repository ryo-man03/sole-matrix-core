# Market Intelligence V2 readiness audit

Audit date: 2026-08-17  
Baseline: `main` at `ddce9814a181b432f2942fd28f98bd17a44e94a1`  
Stack: PR A #34 → PR B #35 → PR C #36 → PR D

## Final gates

| Gate | Result |
| --- | --- |
| Full Vitest | 132 files / 1,947 tests passed |
| Provider contracts | 24 files / 488 tests passed |
| Provider foundation matrix | 102 deterministic cases passed |
| Listing matching | 80 deterministic cases passed |
| Market semantics | 50 deterministic cases passed |
| Fit / Purchase Confidence | 70 deterministic and route cases passed |
| Metamorphic invariants | 51 cases passed |
| Active security detectors | 77 cases passed; broken fixtures trip counters |
| Migrations | 4 additive transactional migrations verified |
| RLS | 117 tests passed |
| TypeScript | passed |
| Production build | passed; `/api/me/fit-confidence` included |
| E2E / accessibility | 4 tests passed; 320–1,920 px |
| In-app browser | 40 route/viewport checks plus purchase-result state passed |
| Dependency audit | 0 known vulnerabilities after patched transitive overrides |

The build retains the pre-existing Turbopack NFT trace warning for the local feedback corpus path. It did not produce a compile, runtime, console, hydration, or route failure and is not a Market Intelligence release blocker.

## Active detector results

Security counters are derived from observations; no exported constant-zero detector remains. Broken fixtures cover cross-user access, private-route auth, client secret/token exposure, unsafe origin, missing rate limit, partial Style Code, generation/audience mismatch, Core mutation, automatic login/`/today` requests, production fixture leakage, unauthorized writes, secret exposure, and raw response persistence.

Observed release-blocking counts in the clean fixture and browser runs:

- Core/Ryo ranking mutation from market data: 0
- external market request before explicit action: 0
- related listing included in price summary: 0
- completed-sale semantic claims: 0
- credential, token, authorization header, or raw response exposure: 0
- unsafe normalized URL accepted: 0
- browser horizontal overflow: 0
- console, hydration, and page errors in the result flow: 0

## Live provider evidence

One local provider invocation was made per provider using server-only values from `.env.local`; values were not printed or persisted.

| Provider | Result | Decision |
| --- | --- | --- |
| Rakuten | `unauthorized`, 0 normalized | not live verified; recheck credential authorization / Allowed websites |
| Yahoo! Shopping | `success`, 4 normalized, JPY | `live_verified` for temporary current-retail display |
| eBay | `success`, 10 normalized, USD | `live_verified` for temporary current-listing display |
| StockX | no request | `policy_blocked` |
| alias | no request | `approval_pending` |

Yahoo/eBay observations are current shop/listing evidence only. They do not establish a completed sale, market value, authenticity, future price, or buy/sell recommendation.

## Browser evidence

The home, login, `/today`, and guest product workspace were checked at 320, 360, 390, 430, 600, 768, 1,024, 1,280, 1,440, and 1,920 px. All 40 checks had a visible H1, zero horizontal overflow, and no visible primary form control below 44 px. On the 390 px result screen, Purchase Confidence was visible, the market action was 46 px high, all three Provider sections rendered, and Decision remained `BUY` before and after the manual request. Automated E2E repeats the manual-call count and score-invariance assertions with a deterministic partial-provider fixture.

## Release conclusion

Readiness blocker count: **0** for the scope of the stacked PRs. PRs may move to review once their GitHub checks are green. Do not merge to `main` as part of this handoff.
