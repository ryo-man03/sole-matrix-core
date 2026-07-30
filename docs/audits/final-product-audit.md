# SOLE//MATRIX 最終プロダクト監査

監査日: 2026-07-30  
基準 commit: `b9b2a677c6f345501360677fef14cfb454df5a57`  
対象 branch: `feat/final-trusted-market-intelligence-v1`

## 判定基準

- **PASS**: 実装済みで操作可能、かつ自動テストまたは実ブラウザの根拠がある
- **PARTIAL**: 実装済みだが、状態保持、障害処理、テスト、表示のいずれかが不足
- **MISSING**: 最終要件に必要だが未実装
- **BROKEN**: 実装はあるが、通常のユーザー操作で期待どおり動作しない
- **OUT OF SCOPE**: 外部許可、credential、運用基盤などが必要で今回のローカル実装だけでは完了できない

## Baseline

| 項目 | 結果 | 根拠 |
| --- | --- | --- |
| origin/main | PASS | `b9b2a67`。`git pull --ff-only origin main` で同期済み |
| working tree | PASS | branch 作成前に tracked / untracked 差分なし |
| `.env.local` | PASS | `.gitignore:14` で除外。差分なし |
| install | PASS | `pnpm install --frozen-lockfile` |
| typecheck | PASS | `pnpm typecheck`、約 9 秒 |
| tests | PASS | 77 files / 554 tests、6.10 秒 |
| production build | PASS | Next.js 16.2.7、compile 8.2 秒、TypeScript 12.7 秒、21 pages / 22 routes |
| CI | PASS | Typecheck / Tests / Production build の独立 job。PR、main push、merge group が対象 |

## 1. Home

| 機能 | 監査時 | 根拠ファイル | 根拠テスト / ブラウザ | 問題・改善 | 改善後の確認 |
| --- | --- | --- | --- | --- | --- |
| アプリの目的 | PASS | `app/page.tsx` | 実ブラウザで H1、説明、Safety boundary を確認 | なし | H1 と説明の accessible tree |
| 診断開始 | PASS | `app/page.tsx` | `/app?session=guest&path=diagnosis` を確認 | なし | 診断画面へ遷移 |
| 商品判断開始 | PASS | `app/page.tsx` | `/app?session=guest&path=product` を確認 | なし | 商品判断画面へ遷移 |
| 診断と商品判断の違い | PASS | `HomeEntryCard.tsx`, `ExperienceModeSelector.tsx` | 実ブラウザで2入口の説明を確認 | なし | 各入口に別の説明と CTA |
| ゲスト導線 | PASS | `ProductSessionBoundary.tsx` | 実ブラウザでゲスト状態を確認 | なし | login 未設定でも利用可能 |
| ログイン導線 | PASS | `app/login/page.tsx` | auth-session tests | 外部 Supabase 未設定時はゲストのみ | 未設定表示と guest fallback |
| 設定 | PASS | `SettingsPanel.tsx` | `settingsPage.test.ts` | なし | `/settings` と保存状態 |
| AIが最終決定しない説明 | PASS | `app/page.tsx`, `CoreV1RecommendationPanel.tsx` | 実ブラウザで Core 決定表示を確認 | なし | AI / Core の境界文言 |
| スマホのファーストビュー | PASS | `app/globals.css` | 390×844、overflow 0、44px 未満の主要操作 0 | なし | viewport matrix で再確認 |

## 2. Diagnosis

| 機能群 | 監査時 | 根拠ファイル | 根拠テスト / ブラウザ | 問題・改善 | 改善後の確認 |
| --- | --- | --- | --- | --- | --- |
| 購入目的、所有、回避モデル、回避傾向 | PASS | `SneakerContextForm.tsx`, `sneakerContext.ts` | `sneakerContext.test.ts` | なし | context の正規化と summary |
| 任意入力の折りたたみ | PASS | `SneakerContextForm.tsx` | diagnosis UI tests | なし | keyboard / `aria-expanded` |
| 11問、番号、カテゴリ、progress | PASS | `preferenceDiagnosisQuestions.ts`, `DiagnosisProgress.tsx` | `diagnosisUi.test.ts` | なし | 1〜11、progressbar |
| 戻る、次へ、選択状態 | PASS | `PreferenceDiagnosisFlow.tsx` | diagnosis UI tests | なし | keyboard と disabled |
| draft 保存、reload 復元 | PASS | `diagnosisDraft.ts` | `diagnosisDraft.test.ts` | sessionStorage 破損時の回復を最終障害テストへ追加 | corrupted / quota fixture |
| restart | PASS | `PreferenceDiagnosisFlow.tsx` | `diagnosisDraft.test.ts` | なし | state と draft の同時削除 |
| 回答 summary、質問単位編集 | PASS | `PreferenceDiagnosisSummary.tsx` | SSR UI tests | なし | 編集後に回答保持 |
| loading、二重送信防止 | PARTIAL | `CoreV1RecommendationPanel.tsx` | UI integration tests | button disable はあるが、同一イベント gate と provider error 分類を強化 | rapid click / abort / retry tests |
| recommendation request 重複防止 | PARTIAL | `productLinkResolution.ts` | request gate tests | link 解決には gate、recommend 本体には abort/dedupe が不足 | duplicate request count 0 |

## 3. App Mode

| 機能 | 監査時 | 根拠ファイル | 根拠テスト / ブラウザ | 問題・改善 | 改善後の確認 |
| --- | --- | --- | --- | --- | --- |
| Diagnosis / Product Judgement 選択 | PASS | `ProductSessionBoundary.tsx` | 実ブラウザ | なし | 2モードを明示 |
| モード切替 | PASS | `ExperienceModeSelector.tsx` | 実ブラウザ | なし | 双方向切替 |
| モード別入力状態 | BROKEN | `ProductSessionBoundary.tsx` | 実ブラウザで Product 入力後にモード選択へ戻ると子画面が unmount | 両モードを同一 controller で保持し、非選択側を inactive にする | Product / Diagnosis round trip |
| モード別結果状態 | BROKEN | 同上 | source audit | 推薦結果も unmount で失われる | 結果保持 E2E |
| Browser Back / Forward | PARTIAL | `ProductSessionBoundary.tsx` | URL は初回だけ読み取り | mode 変更を history と同期し、`popstate` を処理 | Back / Forward E2E |
| Reload / URL 状態 | PARTIAL | `ProductSessionBoundary.tsx` | 初回 query は動作 | product 入力と表示モードの安全な session draft を追加 | reload E2E |
| モード間の loading / error / evidence 分離 | PARTIAL | 各 child local state | source audit | unmount 回避後も DOM と accessible tree を分離 | hidden/inert と対象 test |

## 4. Ryo Mode

| 機能群 | 監査時 | 根拠ファイル | 根拠テスト / ブラウザ | 問題・改善 | 改善後の確認 |
| --- | --- | --- | --- | --- | --- |
| Balanced / Beginner / Ryo / Strong | PASS | `preferenceDiagnosisQuestions.ts`, `integration.ts` | Ryo mode tests | なし | 4 strength の mapping |
| vector / query recipe / scoring weight | PASS | `vector.ts`, `integration.ts`, `scoring.ts` | vector / integration / scoring tests | なし | 同じ回答で deterministic |
| Primary / Ryo Alternative / 理由 | PASS | `service.ts`, `modeRecommendation.ts` | mode recommendation tests | trust model を最終 display gate へ統合 | unsupported 表示 0 |
| safe dominance | PARTIAL | `signature-layer.ts` | signature layer / calibration tests | calibration は30台。80以上の横断評価が不足 | final evaluation 80+ |
| rare-only 防止 | PARTIAL | `scoring.ts` | calibration tests | rare だけを理由に上げない invariant を横断 harness に追加 | invalid Ryo alternative 0 |

## 5. AI Candidate Discovery / Recommendation

| 機能群 | 監査時 | 根拠ファイル | 根拠テスト / ブラウザ | 問題・改善 | 改善後の確認 |
| --- | --- | --- | --- | --- | --- |
| discovery / normalize / dedupe | PASS | `gemini-sneaker-research.ts`, schema | Gemini tests | pool 上限と search slot 名を契約として固定 | contract tests |
| model verification | PASS | `factual-verification.ts` | factual verification tests | marketplace-only は verified にしない | evaluation metric 0 |
| colorway verification | PASS | 同上 | factual verification tests | 未確認は null に統一して display gate と結合 | unsupported color 0 |
| Style Code verification | PASS | 同上 | factual verification tests | exact match のみを UI 契約へ固定 | unsupported code 0 |
| EvidenceClaim / Trust report | PASS | `recommendation-trust/*` | trust tests | UIへの trust summary が不足 | Trust report UI test |
| unsupported claim 除外 | PASS | `explanation-audit.ts` | explanation audit tests | service / display の最終 invariant を追加 | unsupported explanation 0 |
| Core fallback | PASS | `service.ts`, fallback catalog | Gemini integration tests | なし | provider failures |
| provider error 分類 | PARTIAL | API routes / client | provider unit tests | status/JSON/network/abort を統一分類し、一時障害だけ1回 retry | error matrix |
| Core / Ryo scoring | PASS | core-v1, ryo-mode-v4 | golden / scoring tests | なし | deterministic |
| Signature Layer | PASS | `signature-layer.ts` | signature layer tests | なし | explicit constraint guard |
| Primary / Practical / Ryo / Caution | PASS | `modeRecommendation.ts` | mode recommendation tests | Primary=ranked[0] invariant を横断評価に追加 | display-set tests |
| 根拠 / score 詳細 | PASS | result components | UI integration tests | trust state を見える化 | browser |
| 前回結果保持 | PASS | `resultRetention.ts` | result retention tests | Core diagnosis側の error taxonomy を揃える | error E2E |
| feedback | PASS | feedback repositories | feedback tests | localStorage quota 失敗を可視化 | storage error test |
| Rakuten purchase support | PASS | authorized Rakuten API | route / provider tests | 推薦と市場データを明確に分離したまま維持 | browser |

## 6. Quality / Security / Responsive

| 機能群 | 監査時 | 根拠 | 問題・改善 | 改善後の確認 |
| --- | --- | --- | --- | --- |
| Unit / Integration / Calibration / Contract | PASS | baseline 77 files / 554 tests | 横断評価80+と障害 matrix を追加 | full regression |
| UI tests | PASS | SSR contract tests | 実クリック E2E の自動化基盤は未導入 | browser evidence を文書化 |
| GitHub Actions | PASS | `.github/workflows/ci.yml` | job 表示名を required check と照合 | PR run |
| branch protection | OUT OF SCOPE | GitHub repository setting | 無断変更しない | PR checks で確認 |
| README / screenshots | PARTIAL | README / existing screenshots | 最終構成・制限・監査証跡を更新 | docs gate |
| error logging | PARTIAL | route sanitization | error taxonomy と secret-safe message を統一 | error matrix |
| accessibility | PASS | semantic components / browser tree | modal/Escape 該当なし。主要操作44pxを全viewport再確認 | keyboard / target audit |
| responsive | PASS | CSS / responsive tests | 指定 viewport / breakpoint の全 matrix を最終実施 | overflow 0 |
| security | PASS | SSRF / upload / env tests | dependency audit と forbidden-pattern scan を最終実施 | security gate |
| performance | PARTIAL | no large chart dependency | request dedupe、unnecessary remount、bundle を改善 | build + request count |

## 実ブラウザ監査（修正前）

| シナリオ | 結果 | 証跡 |
| --- | --- | --- |
| Home 390×844 | PASS | 日本語正常、`lang=ja`、scrollWidth=clientWidth、44px未満の主要操作0、console error/warning 0 |
| Home → Product Judgement | PASS | ゲスト状態、商品名/URL/画像/予算、Ryo/Balanced、結果/feedback領域を確認 |
| Product 入力 → モード選択 → Product | BROKEN | child component の unmount により入力と結果を保持できない |
| URL と Back/Forward | PARTIAL | 初回 query は反映するが、UI切替が history に反映されない |
| 日本語 | PASS | accessible tree 上で文字化けなし。端末表示のみコードページ差異あり、ファイル実体は正常UTF-8 |

## Milestone A 修正順

1. experience mode を単一 controller と URL history に統合し、両モードの state を保持する
2. Product の安全な session draft と Ryo/Balanced 表示モードを復元する
3. trusted recommendation の pool / display / factual / explanation invariant を統合する
4. provider / storage / upload / URL の障害分類と retry 上限を固定する
5. security、responsive、a11y、performance の横断 gate を追加する
6. 80シナリオ以上の final evaluation を実行し、全指標0を Milestone A の必須条件にする

Milestone B は上記の修正、全回帰、typecheck、production build、browser QA がすべて成功するまで開始しない。

## Milestone A 最終クローズ

初回監査の `BROKEN` / `PARTIAL` は、以下の実装と再検証によりすべてクローズした。

| 領域 | 最終判定 | 最終根拠 |
| --- | --- | --- |
| App Mode state / URL / Back / Forward / Reload | PASS | 単一controller、visited modeのmounted保持、`hidden` / `inert`、session draft、history / popstate。Product入力の往復・Back・Forward・reload保持を実ブラウザ確認 |
| Trusted recommendation | PASS | discovery 24、normalize 20、verified 16、score 8、display 3の上限、dedupe、factual verification、safe explanation、Trust Report |
| Provider / UI recovery | PASS | 400 / 401 / 403 / 404 / 409 / 429 / 500 / 502 / 503、timeout、abort、offline、connection reset、invalid / empty / partial JSON。恒久障害はretryなし、一時障害は最大1回 |
| Storage / upload / URL | PASS | corrupt / quota storage、JPEG / PNG / WebP、5MB、magic bytes、invalid URL、private DNS、redirect再検証・上限、host failure |
| Security | PASS | Next.js 16.2.11、Sharp 0.35.0、PostCSS 8.5.18。high advisory 0、`.env.local` untracked、全route security headers |
| Accessibility / performance | PASS | 本文skip link、focus-visible、`aria-busy` / live region、44px以上、reduced motion、below-fold paint defer、recommend single-flight |
| Responsive / Japanese | PASS | 390 / 768 / 1280でHome overflow 0・小さい主要操作0。390の結果で見つけたnested grid overflowを `min-width: 0` で修正し、scrollWidth 375 = clientWidth 375へ再計測 |
| Final evaluation | PASS | Balanced / Ryo × 4 strength × 3 purpose × 4 provider state = 96 scenarios。80件未満を拒否し、意図的な違反fixtureで全指標の検出も確認 |

### FinalEvaluationMetrics

```json
{
  "scenarioCount": 96,
  "unsupportedModelDisplayed": 0,
  "unsupportedColorwayDisplayed": 0,
  "unsupportedStyleCodeDisplayed": 0,
  "unsupportedExplanationDisplayed": 0,
  "primaryConstraintViolation": 0,
  "duplicateCandidateCount": 0,
  "duplicateParentCount": 0,
  "singleBrandTopThreeCount": 0,
  "safeOnlySecondPairCount": 0,
  "invalidRyoAlternativeCount": 0,
  "modeStateLeakCount": 0,
  "responsiveStateResetCount": 0,
  "duplicateRequestCount": 0,
  "unhandledErrorCount": 0,
  "horizontalOverflowCount": 0
}
```

### 最終ブラウザ証跡

| viewport / flow | scrollWidth / clientWidth | 44px未満 | console error / warning | 判定 |
| --- | --- | --- | --- | --- |
| Home 390×844 | 375 / 375 | 0 | 0 | PASS |
| Home 768×1024 | 753 / 753 | 0 | 0 | PASS |
| Home 1280×720 | 1265 / 1265 | 0 | 0 | PASS |
| Diagnosis 390×844、11問、二足目、reload | state保持 | 0 | 0 | PASS |
| Recommendation 390×844、Trust Report | 375 / 375 | 0 | 0 | PASS |

推薦結果は未確認カラーとStyle Codeを表示せず、`AI Trust Report: 追加確認が必要`を表示した。ブラウザ表示・自動テストとも日本語は正常UTF-8で、raw provider responseやcredentialの露出はない。

### 最終ローカルゲート

- `pnpm test`: 87 files / 638 tests PASS
- `pnpm typecheck`: PASS
- `pnpm web:build`: Next.js 16.2.11、21 static pages / 22 routes PASS
- `pnpm audit --audit-level=high`: high 0（low 1）
- `git diff --check`: PASS
- `.env.local`: ignored / untracked

**Milestone A 最終判定: PASS。Milestone B の開始条件を満たした。**
