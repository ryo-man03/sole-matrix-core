# PR #26 Final Pre-Merge Review

Review date: 2026-07-30 (JST)  
Repository: `ryo-man03/sole-matrix-core`  
PR: #26  
Base: `main`  
Head branch: `feat/final-trusted-market-intelligence-v1`  
Review start head: `b757df9c6fc8d236f1f5a9917e2fca1fe7e81945`  
Review base: `b9b2a677c6f345501360677fef14cfb454df5a57`

## Verdict

The original PR delta contains 83 files: Critical 23, High 19, Medium 41. Eight merge-blocking findings were reproduced and fixed. Remaining BLOCKER count after local and browser verification is 0. Automatic `pull_request/synchronize` CI evidence is recorded in the PR body and final handoff after the review commit is pushed.

## Findings

| ID | Severity | Class | Area | Evidence / reproduction | Resolution | Tests | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B01 | critical | blocker | security / identity | Manual import accepted `probable`, had no parser byte limit, accepted formula-like text, unsupported currency, duplicate rows, and UI extension/MIME ambiguity. | Require exact identity and Style Code; enforce 2,000,000 UTF-8 bytes, supported currencies, formula rejection, in-import dedupe, filename/MIME checks. | `disabledProviders.test.ts`, `ui.test.ts` | fixed |
| B02 | high | blocker | provider | Generic policy retried 429 and the non-idempotent recommendation POST requested one retry, allowing duplicate provider work after a lost response. | 429 is permanent for the current operation; recommendation POST uses zero automatic retries. | `requestPolicy.test.ts`, `uiIntegration.test.ts` | fixed |
| B03 | high | blocker | recommendation | Rule-based claims about limitation, popularity, appreciation, investment, profit, or production country could pass without structured support. | Classify sensitive market and unsupported production-country claims as unsupported and remove them from display. | `explanation-audit.test.ts` | fixed |
| B04 | critical | blocker | provider / price semantics | StockX market data accepted a response currency different from requested currency; refresh expiry accepted non-finite/non-positive values. | Reject mismatched currency as `schema_error`; reject invalid refresh expiry and fail closed as not authorized. | `stockxProvider.test.ts` | fixed |
| B05 | critical | blocker | persistence | Concurrent mutations could lose observations and malformed local JSON threw instead of recovering. | Serialize mutations per repository instance; treat malformed local payload as empty and recover on the next atomic write. | `marketHistoryRepository.test.ts` | fixed |
| B06 | high | blocker | mode state | Browser Back to mode selection did not clear stored mode, so reload could reopen the prior mode. | Synchronize session storage on `popstate`; preserve visited mode trees without leaking active state. | `experienceModeState.test.ts`, production browser Back/Forward/reload | fixed |
| B07 | medium | blocker | documentation / recommendation | Production fallback result still said “8問診断” after the flow became 11 questions. | Update rule-based explanation and add a regression assertion for 11 questions. | `geminiExplanation.test.ts`, production browser | fixed |
| B08 | high | blocker | responsive | At 320 px, the Market Intelligence file input made the result page 30 px wider than the viewport. | Apply `width: 100%` and `min-width: 0` to the file/select boundary. | `ui.test.ts`, production browser at 25 widths | fixed |
| F01 | low | follow_up | dependency | Dev-only `esbuild` 0.28.0 has GHSA-g7r4-m6w7-qqqr; high/moderate count is zero. | Upgrade when the Vitest/tsx dependency chain resolves to 0.28.1+ without broad lock churn. | `pnpm audit --json` | open |
| F02 | medium | follow_up | performance | Core fallback recommendation can take several seconds on a production run. | Profile provider-independent fallback and reduce latency in a separate PR. | production browser timing | open |
| F03 | low | follow_up | build | Turbopack warns that `globalFeedbackCorpus.ts` causes broad NFT tracing. | Narrow the feedback path/import boundary in a separate PR. | production build warning | open |
| F04 | medium | follow_up | market UI | Forecast/chart fixture states are thoroughly unit-tested but are not exposed as a production-only demo route. | Add a dedicated authorized test/demo surface only if product requirements call for it. | forecast/statistics/UI tests | open |
| F05 | medium | follow_up | persistence | Production DB, scheduler, and multi-process write coordination are intentionally absent. | Design production persistence/scheduling separately after provider approval. | architecture review | open |

Accepted limitations:

1. StockX live collection is not verified because approved credentials are unavailable; no live request was made.
2. SNKRDUNK automated communication remains disabled.
3. Mercari general-market communication remains disabled; provenance-bearing manual import only.
4. Live market history count is zero.
5. Live-market forecast accuracy is not evaluated.
6. Production scheduler is not implemented.
7. Production market persistence is disabled.
8. The local repository lock is per process/repository instance, not cross-process.

## Original 83-file risk map

`Reviewed` is “yes” for every original delta file. “Browser” is direct when the rendered production surface was inspected, indirect when behavior was exercised through its consumer, and n/a for non-rendered artifacts.

| # | Path | Purpose | Risk | Reviewed | Test coverage | Browser | Finding / classification / resolution |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `.env.example` | Provider/server configuration contract | Critical | yes | status/config tests | n/a | No secret value; accepted StockX-live limitation |
| 2 | `README.md` | User/operator behavior and provider boundaries | Medium | yes | doc review | n/a | No blocker; limitations explicit |
| 3 | `app/_components/CoreV1RecommendationPanel.tsx` | Recommendation request/result/trust UI | High | yes | UI integration, trust tests | direct | B02 fixed; fallback and retained result verified |
| 4 | `app/_components/MainContainer.tsx` | Main landmark and responsive shell | High | yes | accessibility tests | direct | No blocker |
| 5 | `app/_components/MarketIntelligencePanel.tsx` | Provider status, import, price/chart/forecast UI | High | yes | market UI/quality tests | direct | B01/B08 fixed |
| 6 | `app/_components/ProductSessionBoundary.tsx` | Auth/session and experience-mode lifetime | High | yes | draft/mode tests | direct | B06 fixed |
| 7 | `app/_components/RecommendationWorkspace.tsx` | Product judgment input/result state | High | yes | draft/retention/responsive tests | direct | No result/mode leak found |
| 8 | `app/_components/VerifiedCandidateResult.tsx` | Verified model/color/style presentation | High | yes | verified candidate UI tests | direct | Unverified color/style hidden |
| 9 | `app/_lib/accessibility/finalAccessibility.test.ts` | Static accessibility gate | Medium | yes | self | indirect | No blocker |
| 10 | `app/_lib/ai/gemini-sneaker-research-schema.ts` | Grounded candidate schema/evidence policy | High | yes | Gemini research tests | indirect | No blocker |
| 11 | `app/_lib/ai/gemini-sneaker-research.test.ts` | Gemini validation regression suite | Medium | yes | self | n/a | No blocker |
| 12 | `app/_lib/ai/gemini-sneaker-research.ts` | Grounded research adapter and normalization | High | yes | Gemini integration tests | indirect | No secret or raw-response display |
| 13 | `app/_lib/app-mode/experienceModeState.test.ts` | Mode URL/storage regressions | Medium | yes | self | indirect | B06 regression coverage |
| 14 | `app/_lib/app-mode/experienceModeState.ts` | Canonical mode URL/storage state | Critical | yes | mode tests | direct | B06 consumer fixed |
| 15 | `app/_lib/core-v1/geminiActualSmoke.test.ts` | Credential-gated Gemini smoke | Medium | yes | self | n/a | Accepted: not treated as live success |
| 16 | `app/_lib/core-v1/geminiSneakerResearchIntegration.test.ts` | Research/fallback/Core re-evaluation integration | Medium | yes | self | indirect | No blocker |
| 17 | `app/_lib/core-v1/service.ts` | Core-owned candidate selection and final decision | High | yes | core/trust/integration suites | indirect | AI does not own final decision |
| 18 | `app/_lib/core-v1/types.ts` | Recommendation/trust result contract | High | yes | TypeScript + consumers | indirect | No blocker |
| 19 | `app/_lib/core-v1/uiIntegration.test.ts` | Recommendation UI contract | Medium | yes | self | indirect | B02 regression coverage |
| 20 | `app/_lib/core-v1/verifiedCandidateUi.test.ts` | Model/color/style display policy | Medium | yes | self | indirect | No unsupported presentation |
| 21 | `app/_lib/diagnosis/diagnosisDraft.test.ts` | Diagnosis restore/restart/UI wiring | Medium | yes | self | direct | Reload restore verified |
| 22 | `app/_lib/final-evaluation/finalQualityGate.test.ts` | Cross-domain quality gate | Medium | yes | self | indirect | No blocker |
| 23 | `app/_lib/final-evaluation/finalQualityGate.ts` | Final machine-readable quality summary | High | yes | final gate tests | indirect | No blocker |
| 24 | `app/_lib/market-intelligence/disabledProviders.test.ts` | Disabled providers/manual import regressions | Medium | yes | self | indirect | B01 regression coverage |
| 25 | `app/_lib/market-intelligence/disabledProviders.ts` | SNKRDUNK/Mercari authorization gates | Critical | yes | provider tests | direct | Unauthorized communication remains zero |
| 26 | `app/_lib/market-intelligence/forecast.test.ts` | Deterministic forecast/backtest fixtures | Medium | yes | self | indirect | No leakage/invalid interval |
| 27 | `app/_lib/market-intelligence/forecast.ts` | Forecast selection and rolling backtest | Critical | yes | forecast tests | indirect | Insufficient data returns no forecast |
| 28 | `app/_lib/market-intelligence/identity.test.ts` | Identity/variant match regressions | Medium | yes | self | indirect | Exact-only aggregation confirmed |
| 29 | `app/_lib/market-intelligence/identity.ts` | Canonical sneaker/variant identity | Critical | yes | identity tests | indirect | No model/size/condition mixing |
| 30 | `app/_lib/market-intelligence/manualImport.ts` | CSV/JSON trust boundary | Critical | yes | import tests | direct | B01 fixed |
| 31 | `app/_lib/market-intelligence/marketIntelligenceQualityGate.test.ts` | Market cross-domain invariants | Medium | yes | self | indirect | No blocker |
| 32 | `app/_lib/market-intelligence/provider.test.ts` | Provider capability validation | Medium | yes | self | indirect | Manual import cannot enable automation |
| 33 | `app/_lib/market-intelligence/provider.ts` | Provider capability/result contracts | Critical | yes | provider tests | indirect | No blocker |
| 34 | `app/_lib/market-intelligence/snapshot.test.ts` | Series key and snapshot validation | Medium | yes | self | indirect | No price/currency/variant mixing |
| 35 | `app/_lib/market-intelligence/snapshot.ts` | Normalized observation and series identity | Critical | yes | snapshot/quality tests | indirect | Missing remains missing, not zero |
| 36 | `app/_lib/market-intelligence/statistics.test.ts` | Summary edge-case fixtures | Medium | yes | self | indirect | NaN/Infinity/mixed series rejected |
| 37 | `app/_lib/market-intelligence/statistics.ts` | Deterministic market summaries | Critical | yes | statistics tests | indirect | No blocker |
| 38 | `app/_lib/market-intelligence/ui.test.ts` | Market rendering/responsive contract | Medium | yes | self | direct | B01/B08 regression coverage |
| 39 | `app/_lib/market-intelligence/ui.ts` | Provider UI state parser/messages | Critical | yes | UI/route tests | direct | Provider states accurate |
| 40 | `app/_lib/product-judgement/productJudgementDraft.test.ts` | Product draft corruption/quota regressions | Medium | yes | self | direct | No blocker |
| 41 | `app/_lib/product-judgement/productJudgementDraft.ts` | Session-scoped product input state | Critical | yes | draft tests | direct | Reload and mode-switch preservation verified |
| 42 | `app/_lib/product-links/urlVerification.test.ts` | URL/redirect SSRF boundary | Medium | yes | self | indirect | Private, metadata, scheme, tunnel targets blocked |
| 43 | `app/_lib/provider-reliability/requestPolicy.test.ts` | Timeout/status/schema retry regressions | Medium | yes | self | indirect | B02 regression coverage |
| 44 | `app/_lib/provider-reliability/requestPolicy.ts` | Bounded provider request policy | Critical | yes | request policy tests | indirect | B02 fixed |
| 45 | `app/_lib/recommendation-feedback/globalFeedbackCorpus.ts` | Server-only feedback append/read boundary | High | yes | corpus tests/build | indirect | F03 broad trace warning |
| 46 | `app/_lib/recommendation-trust/evaluation.test.ts` | Trust evaluation regressions | Medium | yes | self | indirect | No blocker |
| 47 | `app/_lib/recommendation-trust/evaluation.ts` | Factual/Ryo/explanation trust aggregation | High | yes | trust tests | direct | No blocker |
| 48 | `app/_lib/recommendation-trust/explanation-audit.test.ts` | Unsupported/contradictory claim regressions | Medium | yes | self | direct | B03 regression coverage |
| 49 | `app/_lib/recommendation-trust/explanation-audit.ts` | Display claim allowlist/audit | High | yes | explanation audit tests | direct | B03 fixed |
| 50 | `app/_lib/recommendation-trust/factual-verification.test.ts` | Evidence quality and mismatch regressions | Medium | yes | self | indirect | No blocker |
| 51 | `app/_lib/recommendation-trust/factual-verification.ts` | Model/color/style evidence evaluation | High | yes | factual tests | direct | Unverified color/style nulled |
| 52 | `app/_lib/recommendation-trust/trusted-pipeline.test.ts` | Pool/dedupe/funnel regressions | Medium | yes | self | indirect | No duplicate candidate/constraint breach |
| 53 | `app/_lib/recommendation-trust/trusted-pipeline.ts` | Trusted pool and shortlist limits | High | yes | trusted pipeline tests | indirect | No blocker |
| 54 | `app/_lib/recommendation-trust/types.ts` | Trust evidence/result types | High | yes | TypeScript + trust tests | indirect | No blocker |
| 55 | `app/_lib/responsive-workspace/responsiveWorkspace.test.ts` | Workspace breakpoint regression gate | Medium | yes | self | direct | No blocker |
| 56 | `app/_lib/ryo-mode-v4/candidates.test.ts` | Ryo rerank/display set invariants | Medium | yes | self | indirect | Primary/alternative/caution constraints pass |
| 57 | `app/_lib/security/finalSecurity.test.ts` | Headers/client-secret static gate | Medium | yes | self | indirect | No client secret exposure |
| 58 | `app/_lib/url-analysis/sneakerUrlService.test.ts` | URL metadata/redirect/SSRF fixtures | Medium | yes | self | indirect | No blocker |
| 59 | `app/api/market/intelligence/status/route.test.ts` | Status route disclosure/no-fetch regressions | Medium | yes | self | direct | No secret/raw response |
| 60 | `app/api/market/intelligence/status/route.ts` | Read-only provider configuration status | Critical | yes | route tests | direct | No external request |
| 61 | `app/globals.css` | Responsive, focus, market/chart/result layout | High | yes | responsive/a11y/UI tests | direct | B08 fixed |
| 62 | `app/layout.tsx` | Root metadata, skip link, landmarks | High | yes | accessibility tests | direct | No blocker |
| 63 | `docs/audits/final-product-audit.md` | Prior product quality evidence | Medium | yes | doc review | n/a | No blocker |
| 64 | `docs/market/data-model.md` | Identity/series semantics | Medium | yes | doc/code comparison | n/a | No blocker |
| 65 | `docs/market/forecast-methodology.md` | Forecast/backtest limitations | Medium | yes | doc/code comparison | n/a | F04 accepted for this PR |
| 66 | `docs/market/manual-import.md` | Import contract/security guidance | Medium | yes | doc/code comparison | n/a | B01 documentation updated |
| 67 | `docs/market/persistence.md` | Retention/production persistence policy | Medium | yes | doc/code comparison | n/a | F05/A07/A08 |
| 68 | `docs/market/provider-capabilities.md` | Provider authorization matrix | Medium | yes | doc/code comparison | n/a | A01-A03 |
| 69 | `docs/market/security-and-compliance.md` | Market threat model/compliance | Medium | yes | doc/code comparison | n/a | No blocker |
| 70 | `docs/security/all-in-one-security.md` | Repository security runbook | Medium | yes | doc review/scans | n/a | No blocker |
| 71 | `next.config.ts` | Build/security headers/tracing config | Critical | yes | security tests/build | indirect | F03 warning; headers pass |
| 72 | `package.json` | Runtime/toolchain/dependency contract | Critical | yes | frozen install/build/audit | n/a | No high advisory |
| 73 | `pnpm-lock.yaml` | Reproducible dependency graph | Critical | yes | frozen install/audit | n/a | F01 low dev advisory |
| 74 | `pnpm-workspace.yaml` | Workspace and dependency policy | Critical | yes | frozen install | n/a | No blocker |
| 75 | `scripts/market-collect.ts` | Bounded authorized collection CLI | Critical | yes | collector tests/dry-run | n/a | No credential output/live request |
| 76 | `server/market-intelligence/collector.test.ts` | Collector dry-run/rate/retention regressions | Medium | yes | self | n/a | No blocker |
| 77 | `server/market-intelligence/collector.ts` | Provider collection orchestration | Critical | yes | collector/provider tests | n/a | No unauthorized provider path |
| 78 | `server/market-intelligence/marketHistoryRepository.test.ts` | Persistence/dedupe/recovery regressions | Medium | yes | self | n/a | B05 regression coverage |
| 79 | `server/market-intelligence/marketHistoryRepository.ts` | Workspace-scoped normalized persistence | Critical | yes | repository tests | n/a | B05 fixed; production disabled |
| 80 | `server/market-intelligence/stockxFixtures.ts` | Official-response-shaped test fixtures | Critical | yes | StockX/schema tests | n/a | Fixture only; not live success |
| 81 | `server/market-intelligence/stockxProvider.test.ts` | OAuth/request/currency/dedupe regressions | Medium | yes | self | n/a | B04 regression coverage |
| 82 | `server/market-intelligence/stockxProvider.ts` | Approved StockX OAuth/API adapter | Critical | yes | StockX tests/dry-run | n/a | B04 fixed; live not executed |
| 83 | `server/market-intelligence/stockxSchemas.ts` | Exact provider response schemas | Critical | yes | schema/provider tests | n/a | Invalid/partial response fails closed |

## Remediation-only files added to the final delta

- `app/_lib/core-v1/explanation.ts`: corrected the stale 8-question rule-based explanation to 11 questions (B07).
- `app/_lib/core-v1/geminiExplanation.test.ts`: regression coverage for B07.
- `docs/audits/pr-26-final-review.md`: this audit record.

## Validation record

- Local runtime: Node 22.21.0, pnpm 11.9.0, Next.js 16.2.11.
- CI runtime contract: Node 24, pnpm 11.5.2.
- Frozen install: success.
- Typecheck: success.
- Tests: 99 files, 763 tests, all success.
- Production build: success, 22 generated routes/pages.
- Audit: critical 0, high 0, moderate 0, low 1 (dev-only F01).
- Browser: production build, external providers disabled, 11 specified viewports plus 14 breakpoint-adjacent widths; overflow 0, hidden clipping 0, console errors 0, hydration errors 0, sub-44 px visible buttons 0, `word-break: break-all` 0.
- State: product input/mode preserved across resize, Back/Forward, reload, and diagnosis-to-product switch; diagnosis 11/11 completed and restored.
- Market UI: StockX not configured; SNKRDUNK and Mercari not authorized; no zero substitution; manual import disabled when verified Style Code is absent.
- StockX live: not executed.
- Main: not merged.
