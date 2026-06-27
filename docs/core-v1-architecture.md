# Core v1 architecture and verification

## 守る境界

Core v1の推薦本線は、外部APIがなくても必ず完結します。

```text
Web UI
  → POST /api/core-v1/recommend (Web Request / Response)
    → validation
    → diagnosis → PreferenceVector
    → local repository ───────────────┐
    → Rakuten provider → normalizer ─┤ 候補だけを合流
                                      ↓
              scoring → decision (TypeScript)
                                      ↓
              Gemini explanation provider
                    ↘ rule-based fallback
                                      ↓
                    safe result + readiness → UI
```

`scoring.ts`と`decision.ts`は外部APIを呼びません。Geminiは計算済みfactsの説明だけを返し、楽天のraw responseはnormalizerより先へ進みません。

## ファイルごとの責務

| ファイル | 責務 |
| --- | --- |
| `validation.ts` | HTTP入力を安全なCore inputへ正規化 |
| `diagnosis.ts` / `preferenceVector.ts` | 診断回答・タグを8軸へ変換 |
| `repository.ts` | local candidateとfeedback mock |
| `rakutenProvider.ts` | server-side通信、HTTP状態の安全な分類 |
| `rakutenNormalizer.ts` | `unknown`を検証済み候補へ変換する純粋関数 |
| `rakutenReadiness.ts` | provider結果をUI向けreadinessへ変換 |
| `scoring.ts` | Balanced Score adapter / Ryo Score純粋関数 |
| `decision.ts` | score・budgetFit・risk・情報量からDecisionを決定 |
| `explanation.ts` | 常に利用できるrule-based explanation |
| `geminiExplanation.ts` | structured explanation。失敗時はfallback |
| `geminiActualSmoke.ts` | 実生成の有無とshapeだけを安全に報告 |
| `service.ts` | 候補の合流から返却までを組み合わせる推薦本線 |

## 楽天providerの安全条件

providerはRoute Handlerからserver sideでのみ呼びます。`RAKUTEN_APPLICATION_ID`と`RAKUTEN_ACCESS_KEY`はprocess envから読み、browser bundleやAPI responseへ含めません。access keyは通常headerへ載せ、ログにはURL、query全文、header、raw bodyを出しません。

候補として利用できるのは次をすべて満たす場合だけです。

1. HTTP 200 / `response.ok === true`
2. JSON parse成功
3. `formatVersion=2`相当の`items[]`
4. 全候補がnormalizerを通過
5. 空でない商品名、正の有限価格、安全なHTTPS URL

失敗時は候補配列を空にしてlocal候補だけで継続します。readinessは`missing_config`、`blocked_forbidden`、`blocked_rate_limit`、`network_or_http_error`、`invalid_response`のいずれかです。403/429をアプリ全体のエラーへ昇格させません。

正規化済み価格はbudgetFitの補助にだけ使用します。price、name、URLが不正なitemをrawのまま採用しません。商品URLはHTTPSだけをUIへ渡します。

## Gemini structured explanation

Geminiへ渡すのはCore確定後のfactsです。返却JSONは`summary`、1件以上の`reasons`、配列の`cautions`、非空の`balancedView`と`ryoView`、許可済み`finalTone`を必須にします。

次の情報はprovider境界を越えません。

- API key
- request URL / query全文
- Geminiまたは楽天のraw response
- prompt全文
- 個人情報

Gemini出力からscore、Decision、budgetFit、riskを読み込む経路はありません。不正出力、通信失敗、未設定時は`createRuleBasedExplanation`へ戻ります。

## Feedback境界

現行の`createMockFeedbackRepository`はprocess内保存です。本番移行時は同じinterfaceを実装する`SupabaseFeedbackRepository`をRoute Handlerのserver sideに置きます。認証前に本番migrationやservice role keyを導入しません。

## 画面確認手順

1. `pnpm web:dev`を実行し、トップの「Core v1診断を始める」から診断へ移動する。
2. 8問に回答して確認画面を開く。未回答を含んでも導線が壊れないことを確認する。
3. 予算を空欄、正常な整数、不正値で試し、empty/loading/error stateを確認する。
4. 推薦結果で候補名、source、Decision、Balanced/Ryo Score、理由、注意点を確認する。
5. Geminiが成功した場合は実生成表示、未設定・失敗時はrule-based表示を確認する。
6. 楽天readinessが成功、設定不足、403、429などに応じた文言になり、失敗時もlocal候補が出ることを確認する。
7. Feedbackを送信し、saving/saved/errorの表示を確認する。
8. browser consoleと画面にraw response、API key、request URLが出ていないことを確認する。

スクリーンショットを更新する場合は、秘密情報が画面・DevTools・ファイル名へ含まれていないことを確認して`docs/screenshots/`へ保存します。

現行の確認済み証跡:

- `docs/screenshots/core-v1-recommendation-result.png`
- `docs/screenshots/core-v1-readiness-feedback.png`
- `docs/screenshots/core-v1-feedback-saved.png`

## 変更時の回帰確認

- Balanced Scoreのadapter・表示内訳: `scoring.ts`
- Ryo Scoreの重み: `scoring.ts`
- Decision threshold: `decision.ts`
- 診断質問の軸寄与: `preferenceVector.ts`

既存Core v0.1 / `recommendSneakers` / golden testを削除せず、Core v1の追加テストで意図を固定します。通常testは実ネットワークを呼ばず、外部通信は`RUN_EXTERNAL_SMOKE=1`の明示opt-inだけで実行します。
