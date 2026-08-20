# SOLE//MATRIX

## Pre-API personalization foundation

The application now includes Supabase SSR session refresh, RLS-backed profiles and consent, structured preferences and sizes, private collection/wishlist/history, canonical sneaker identity, and deterministic daily picks at `/today`. Database changes are additive migrations under `supabase/migrations`; run `pnpm test:migrations` and `pnpm test:rls` before applying them to a local Supabase stack.

Release data has an evidence/conflict model, reviewed database boundary, and staging-only manual pipeline. An authorized automated Release Provider is not yet available. Login and `/today` never call an external Release Provider, market search, or AI service. Production migration and deployment are intentionally outside this change; the authorized-provider next phase is documented in `docs/roadmap/authorized-release-provider-handoff.md`.

[![CI](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml/badge.svg)](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml)

## Current operational status

Current source of truth, rechecked on 2026-08-20:

```text
APPLICATION FOUNDATION: COMPLETE
MAIN INTEGRATION: COMPLETE
DATABASE EXECUTION: REAL EPHEMERAL SUPABASE VERIFIED
LOCAL WINDOWS DATABASE: NOT REQUIRED FOR CI VERIFICATION
PRODUCTION DATABASE: NOT TOUCHED
PRODUCTION DATA LAYER: NOT DEPLOYED
PRODUCTION APPLICATION: NOT DEPLOYED
PRODUCTION READINESS: PENDING EXTERNAL REHEARSAL
```

The latest verified `main` run applied all seven migrations to a fresh ephemeral Supabase/PostgreSQL environment and passed 65 pgTAP migration, ownership, RLS, and Data Steward checks. This is non-production evidence only; it is not a staging or production deployment claim. The single current source of truth is the [Production Readiness Program Report](docs/audits/production-readiness-program-report.md); the [production integration review](docs/operations/production-integration-review.md) is its operator runbook.

スニーカーを、流行や価格だけでなく、歴史・素材・服との相性・文化背景まで含めて整理し、購入判断を補助する Web アプリです。

商品名・URL・画像からの単体判断と、11問診断にもとづく推薦を分けて扱い、Gemini の候補調査、TypeScript Core / Ryo Mode の推薦判断、楽天市場・Yahoo!ショッピング・eBayの購入参考情報、Fit / Purchase Confidenceを明確に分離しています。価格、在庫、サイズ、真贋、購入可能性、将来価格、利益は保証しません。

## 1. Overview

SOLE//MATRIX は、好みを言語化しにくい人でも、服装・パンツ・素材・予算・カルチャーの軸でスニーカー選びを整理できるように設計したアプリです。

- 11問診断から `RyoPreferenceVector v4` を生成できる
- 最初の一足、普段使い、二足目、アーカイブという購入目的と、所有・苦手モデルを今回の推薦文脈に反映できる
- 商品名・URL・画像から個別の商品判断ができる
- Gemini を候補調査と補助説明に使い、Core がモデル名・正式カラー名・Style Code・根拠 URL の検証、fallback、再ランキング、最終判断を担う
- Ryo Mode v4 で文化背景、素材の育ち、パンツ相性を強く反映する
- 推薦後、明示ボタンから楽天市場・Yahoo!ショッピングの現在販売価格とeBayの現在出品価格を別枠で確認できる
- 商品同一性、販売商品の一致度、所有・サイズ履歴の近さを混ぜずにPurchase Confidenceとして確認できる
- 価格・在庫・サイズ・真贋・購入可能性・利益は販売元と利用者自身で要確認

## 2. Screenshots

UI v3 のローカル確認用キャプチャです。実 API には依存せず、Core の fallback 候補で診断開始から結果比較までを確認しています。

| State | Mobile | Desktop |
| --- | --- | --- |
| ホーム / 入口の分離 | [390px](docs/product/screenshots/ui-v3/home-390.png) | — |
| 11問診断 / 進捗と固定ナビゲーション | [390px](docs/product/screenshots/ui-v3/diagnosis-progress-390.png) | — |
| 回答サマリー / 各回答の編集導線 | [390px](docs/product/screenshots/ui-v3/diagnosis-summary-390.png) | — |
| 本命候補 / 理由・注意点 | [390px](docs/product/screenshots/ui-v3/result-primary-390.png) | [1024px](docs/product/screenshots/ui-v3/result-1024.png) / [1440px](docs/product/screenshots/ui-v3/result-1440.png) |
| 現実的な別案 / Ryo Modeらしい別案 / 下げた候補 | [390px](docs/product/screenshots/ui-v3/result-alternatives-390.png) | [1440px](docs/product/screenshots/ui-v3/result-1440.png) |

## 3. Why I built this

私は中学生の頃からスニーカーが好きで、ただ新しいモデルや高いモデルを追うよりも、「なぜその靴が生まれたのか」「どんな人や文化に履かれてきたのか」「履き込んだ後にどう育つのか」を考えて選ぶことが多くありました。

一方で、スニーカー選びは情報量が多く、流行・価格・ブランド名だけで判断すると、自分の服装や履き方に合わないことがあります。そこで、感覚だけで終わらせず、歴史・素材・服装・予算・文化背景から判断を整理できるアプリを作りたいと考えました。

SOLE//MATRIX は、AI におすすめを丸投げするためのアプリではありません。Gemini で候補調査や補助説明を行いつつ、最終的な評価や再ランキングは Core 側で制御し、ユーザーの好みと実際の購入判断に近づけることを目指しています。

## 4. Main features

- 11問診断
- 購入目的・所有モデル・避けたいモデルを使う `UserSneakerContext`
- 商品判断（商品名 / URL / 画像）
- `RyoPreferenceVector v4`
- `RyoScoreBreakdownV2`（回答との相性 / Ryo Modeらしさ / 現実的な選びやすさ / 二足目・アーカイブ適性）
- 本命・現実的な別案・Ryo Modeらしい別案・下げた候補を決定論的に選ぶ `RecommendationDisplaySet`
- 36シナリオの calibration suite による推薦の多様性・安全性確認
- `productScore` / `recommendationScore` / `totalRyoScore`
- cultural recommendation metadata
- retro running taxonomy
- Gemini grounded candidate research
- verified model / colorway / Style Code と source quality の表示
- fallback catalog
- Rakuten `market_find` purchase-support layer
- authorized Market Intelligence（StockX adapter / Manual Import / trend / forecast）
- feedback localStorage persistence

## 5. Ryo Mode v4

Ryo Mode v4 は、古い型、復刻、素材の育ち方、パンツ相性、文化背景を重視する推薦補助レイヤーです。

Ryo Signature Layer は、既存の候補評価の後段で Ryo Mode の再ランキングを補正します。定番モデルを禁止するのではなく、アメカジ、素材の経年変化、復刻や文化背景を強く求める回答では、Tobacco、Terminator、Converse J / VTG 系、New Balance 998 のような文脈のある隣接候補が上がりやすくなる一方、初心者・シンプル・実用重視の回答では安全牌の推薦を残します。

- `parent model`
  Converse One Star、All Star J / VTG、Jack Purcell、PUMA Suede / Clyde、Vans、New Balance 991 / 998 / 1500 などの親モデル軸を持つ
- `style template`
  アメカジ、ノームコア、きれいめ、ストリートなどの服装文脈を反映する
- `pants template`
  デニム、ワークパンツ、ストレート、ワイド、スラックスなどとの相性を見る
- `material template`
  レザーのシワ、スエードの毛並み、キャンバスの退色など、履き込んだ後の表情を評価に入れる
- `retro-running`
  70s / 80s / premium retro runner / modern retro / high-tech running を分けて扱う

`productScore` は靴単体の魅力、`recommendationScore` は今回の回答条件との適合、`totalRyoScore` はその総合です。

AF1 は完全に排除していません。白レザー定番として機能する文脈では残しつつ、アメカジ Ryo Strong の主軸としては扱わない設計です。ハイテク系も別軸として評価し、Ryo classic と同一視しないようにしています。

## 6. Core / Ryo Mode / Gemini / Rakuten の役割

Ryo Mode は汎用的な AI プロンプトではなく、11問の回答を構造化した preference vector と、親モデル・文化背景・素材・パンツ相性などのルールを使う推薦ロジックです。各選択肢には推薦へどう影響するかの説明があり、購入目的や所有・苦手モデルは `UserSneakerContext` として別に扱います。Gemini は Google Search Grounding を使った候補調査と補助説明を担当しますが、出力はそのまま採用せず、Core 側で schema と内容を検証します。fallback catalog は Gemini 成功扱いにしません。

Gemini 候補は、モデル、カラー、Style Code の根拠を分けて確認します。カラーを同一モデルの信頼できる出典で確認できない場合は推測せず、「モデル確認済み・カラー未確認」と表示します。出典品質は公式、正規取扱店、信頼できる販売店・メディア、マーケットプレイス、未分類に分けます。Core 内の静的候補は「Core候補」、楽天の商品は「楽天市場の購入参考候補」として区別します。

Market Intelligence V2 は推薦後の購入サポートです。楽天市場・Yahoo!ショッピング・eBayの規約内APIから現在情報だけを取得し、Core / Ryo Mode のスコア、ランキング、最終 Decision を変更しません。公式モデル同定、正規品判定、価格・在庫・サイズの保証にも使いません。

| Role | Responsibility |
| --- | --- |
| Preference / recommendation logic | TypeScript Core / Ryo Mode v4 |
| Grounded candidate research / explanation support | Gemini / Google Search Grounding |
| Validation / schema / fallback / final decision | TypeScript Core |
| Current retail / listing search | Market Intelligence V2（決定論的TypeScript） |
| Owned-size reference | Fit Confidence（認証済み個人データ） |
| Purchase evidence summary | Purchase Confidence（推薦後・非スコア） |
| Feedback persistence | UI / localStorage |

## 7. Scoring structure

| Field | Meaning |
| --- | --- |
| `productScore` | 靴単体の歴史・素材・形の評価 |
| `recommendationScore` | 今回の回答条件との適合 |
| `totalRyoScore` | 単体評価と推薦適合の総合 |
| `parentModelAffinity` | 親モデルとの文化的な軸の近さ |
| `templateAffinity` | 服装テンプレートとの一致度 |
| `retroRunningAffinity` | レトロランニング文脈との一致度 |
| `materialAffinity` | 素材の育ち方や経年変化との相性 |
| `pantsAffinity` | パンツとの合わせやすさ |
| `userFitScore` | 11問と購入文脈への近さ |
| `ryoIdentityScore` | 定番に寄りすぎない Ryo Mode らしさ |
| `practicalFitScore` | 予算や用途を含む現実的な選びやすさ |
| `explorationScore` | 二足目・アーカイブ枠としての面白さ |
| `contextPenalty` | 所有・苦手モデルなど今回の文脈による減点 |
| `finalRecommendationScore` | ブレンドと文脈補正後の最終推薦スコア |

## 8. Tech stack

- Next.js 16
- React 19
- TypeScript
- Vitest
- Gemini GenerateContent REST API
- Google Search Grounding
- Rakuten Ichiba Item Search API
- StockX Public API v2 adapter（承認済みcredentialがある場合のみ）

## 9. What I focused on

- AI 出力を鵜呑みにしないこと
- Gemini と Core の責務分離を README 上でも明確にすること
- Rakuten を推薦ロジックから分離し、購入サポートとして扱うこと
- 11問診断を構造化して `RyoPreferenceVector v4` へ変換すること
- 歴史・文化・素材・パンツ相性を recommendation logic に落とし込むこと
- feedback をブラウザ側で保存し、見返せる導線を用意すること
- 実装されている内容と README の説明を一致させること

## 10. Market Intelligence

市場情報は推薦判断と分離しています。ログイン、`/today`、推薦結果の初期表示では外部Providerへ接続せず、利用者が購入参考情報のボタンを押した場合だけ検索します。

```text
Diagnosis
  → Search Slots
  → Verified Recommendation
  → Canonical Identity
  → Explicit user action
  → Authorized current-price Providers
  → Exact / Probable / Related / Rejected
  → Purchase Confidence UI
```

### Provider capability

| Provider | 現在の扱い | 自動通信 |
| --- | --- | --- |
| 楽天市場 | 商品検索APIの現在販売価格 | 明示ボタン時のみ |
| Yahoo!ショッピング | v3商品検索APIの現在販売価格 | 明示ボタン時のみ |
| eBay | Browse APIの現在出品価格 | 明示ボタン時のみ |
| StockX | 現行ライセンスと本用途の整合が確認できないためpolicy blocked | なし |
| SNKRDUNK | 公式APIまたは書面許可を確認できないためdisabled | なし。scraping / private endpoint / Cookie利用なし |
| Mercari | Mercari Shops APIを一般相場検索へ転用せずmanual only | なし。一般marketplaceの許可取得後に再監査 |

### Identity and price semantics

Style Codeは正規化後の完全一致だけを `exact` に使います。モデル＋確認済みカラーは `probable`、比較用だけの候補は `related`、衝突は `rejected` とし、自動統合しません。別カラー、別世代、メンズ／ウィメンズ／キッズ、サイズ、新品／中古、Provider、通貨を分離します。

| Type | 意味 |
| --- | --- |
| `current_retail_price` | 楽天市場・Yahoo!ショッピングの現在販売価格 |
| `current_listing_price` | eBayの現在出品価格。成約価格ではない |

欠損値を0円や送料無料へ変換しません。新品・中古と通貨ごとに件数、最小、中央値、最大、取得時刻を表示し、`related` は概要集計から除外します。成約価格、将来価格、売買推奨はV2の対象外です。

### Responsive and error behavior

Providerごとの成功・空・資格情報不足・認証失敗・rate limit・timeout・schema error・一時障害・policy disabledを分離し、一部障害でも他Providerと推薦結果を維持します。

詳細: [Provider policy](docs/providers/provider-policy-registry.md)、[Provider contract](docs/providers/market-provider-contract.md)、[Fit Confidence](docs/product/fit-confidence.md)、[Purchase Confidence](docs/product/purchase-confidence.md)。

## 11. Limitations

- Gemini の Grounding は候補調査の根拠を補いますが、情報の完全性や恒久的な正確性を保証するものではありません。候補は Core で検証し、失敗時は具体モデルの fallback catalog を使います。
- モデルを確認できても正式カラーを確認できない場合があります。その場合はカラー名と Style Code を推測せず、モデルのみを表示します。
- Rakuten `market_find` は検索語に近い販売商品を表示する購入サポートです。公式モデル同定、正規品判定、推薦根拠には使用しません。
- StockX adapterはfixture/contractで検証済みですが、承認済みcredentialがないためlive APIは未確認です。
- SNKRDUNK / Mercariの正式連携は、公式APIまたは書面許可の取得・再監査後までdisabledです。
- Manual Importの利用権限と出典の正当性は利用者が確認する必要があります。
- 統計と予測は観測された同一系列の参考値であり、将来価格、実取引価格、流動性、利益を保証しません。
- 価格・在庫・サイズ・商品状態・返品条件は変動します。購入前に販売ページで確認してください。
- 外部 API が未設定、拒否、rate limit、network error の場合も、推薦結果を残したまま fallback または soft error を表示します。
- フィードバック保存は現在ブラウザの localStorage が中心です。端末間同期を保証しません。

## 12. Run locally

Node.js と pnpm を利用できる環境で、リポジトリ直下から実行します。

```powershell
npx --yes pnpm@11.5.2 install
Copy-Item .env.local.example .env.local
npx --yes pnpm@11.5.2 web:dev
```

`http://localhost:3000` を開き、ゲストで診断を開始できます。`.env.local` は秘密情報を含むためコミットしないでください（`.gitignore` で除外済みです）。

主要な環境変数は次のとおりです。

```env
GEMINI_API_KEY=
RAKUTEN_APPLICATION_ID=
RAKUTEN_ACCESS_KEY=
RAKUTEN_AFFILIATE_ID=
RAKUTEN_REQUEST_ORIGIN=
STOCKX_API_KEY=
STOCKX_CLIENT_ID=
STOCKX_CLIENT_SECRET=
STOCKX_REDIRECT_URI=
STOCKX_CURRENCY=JPY
STOCKX_ACCESS_TOKEN=
STOCKX_REFRESH_TOKEN=
STOCKX_TOKEN_EXPIRES_AT=
SNKRDUNK_PROVIDER_MODE=disabled
MERCARI_PROVIDER_MODE=disabled
MARKET_HISTORY_FILE=.data/market-history.json
MARKET_COLLECTION_TARGETS_FILE=.data/market-collection-targets.json
```

- `GEMINI_API_KEY`: Gemini の grounded candidate research と補助説明に使用します。
- `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY`: Rakuten `market_find` の実 API 呼び出しに必要です。
- `RAKUTEN_AFFILIATE_ID`: 任意です。楽天アフィリエイトを利用する場合だけ設定します。
- `RAKUTEN_REQUEST_ORIGIN`: Rakuten Web Service の Allowed websites に登録した Web サイトの origin（例: `https://example.com`）と一致させます。
- `STOCKX_*`: 承認済みStockX developer appのserver-side設定です。tokenをclient/localStorageへ渡さないでください。
- `SNKRDUNK_PROVIDER_MODE` / `MERCARI_PROVIDER_MODE`: 現在は`disabled`以外を指定しても有効化されません。
- `MARKET_HISTORY_FILE` / `MARKET_COLLECTION_TARGETS_FILE`: workspace内のlocal development用です。production persistenceはowned migration基盤ができるまでdisabledです。

Rakuten 側の Allowed websites 設定によっては `localhost` が拒否されます。実 API smoke では、Allowed websites に登録したデプロイ済みドメイン、または必要に応じて ngrok などの HTTPS origin を使ってください。

Supabase など、ほかの任意設定は [`.env.example`](.env.example) を参照してください。

## 13. Submission / demo notes

## Current market prices and verified colorways

推薦結果の「現在価格を確認」を押すと、楽天市場・Yahoo!ショッピングの現在の販売価格と、eBayの現在の出品価格を別々に表示します。価格検索は推薦順位、Core Score、Ryo Scoreを変更しません。送料・状態・サイズ・総額が不明な場合は不明のまま表示し、0円や送料無料へ補完しません。

AIが提案したモデル名・カラー名・Style Codeはそのまま表示しません。公式／正規取扱店、または独立した高品質ソースで検証し、モデルのみ確認できた場合はカラーとStyle Codeを非表示にします。楽天・Yahoo・eBayの出品情報だけで公式カラー確認済みにはしません。

Server-only environment names:

```env
YAHOO_SHOPPING_APP_ID=
EBAY_PRODUCTION_CLIENT_ID=
EBAY_PRODUCTION_CLIENT_SECRET=
EBAY_PRODUCTION_DEV_ID=
EBAY_PRODUCTION_MARKETPLACE_ID=
EXTERNAL_PROVIDERS_DISABLED=true
SUPABASE_SECRET_KEY=
INTERNAL_JOB_SIGNING_SECRET=
```

通常テストとCIでは`EXTERNAL_PROVIDERS_DISABLED=true`を使います。ローカルlive smokeはProviderごとに最大1検索です。

```powershell
pnpm market:smoke --provider rakuten --live
pnpm market:smoke --provider yahoo --live
pnpm market:smoke --provider ebay --live
```

eBay OAuth tokenとAPI raw responseは保存せず、クライアントへ返しません。

`SUPABASE_SECRET_KEY` と `INTERNAL_JOB_SIGNING_SECRET` は server-only です。内部 job は timestamp、job 名、idempotency key、raw JSON body を HMAC-SHA256 で署名し、secret 自体を URL、body、log、client bundle に含めません。本番 scheduler と migration 適用はこのリポジトリ作業では実行しません。

- 基本デモはゲスト導線で、11問診断 → 回答サマリー → Ryo Mode v4 推薦結果まで確認できます。
- Gemini が利用できない場合は具体モデルの fallback、Rakuten が利用できない場合は推薦結果を維持した soft error になります。
- Rakuten の商品カードは推薦候補そのものではなく、推薦後に確認する購入候補です。
- 実 API を見せる場合は、デモ前に API key と `RAKUTEN_REQUEST_ORIGIN` / Allowed websites の組み合わせを確認してください。

## 14. Verification

2026-08-18 時点で、以下をローカルで確認しました。詳細は [`docs/audits/final-product-readiness-v2.md`](docs/audits/final-product-readiness-v2.md) を参照してください。

- TypeScript: passed
- Tests: 157 files / 2,343 tests passed（baselineからmeaningful deterministic cases +396。Provider 569、Security 112、RLS 184を別ゲートでも確認）
- Production build: passed（`/api/market/search`と`/api/me/fit-confidence`を含む）
- Market browser check: passed（320 / 360 / 390 / 430 / 600 / 768 / 1024 / 1280 / 1440 / 1920px。横overflow、duplicate request、console error、hydration error 0件）
- GitHub Actions: `Typecheck` / `Tests` / `Production build` の3ジョブを PR、`main` push、merge queue で実行する構成
- External API contract: CIではlive APIを呼ばない。2026-08-17のbounded smokeは楽天`unauthorized`、Yahoo 4件`success`、eBay 10件`success`。secret/raw response露出0件
- Dependency audit: known vulnerabilities 0件（transitive patched版をworkspace overrideで固定）

## 15. Future improvements

- 購入サポートの検索精度と対応 provider を広げる
- 画像理解と URL 解析の精度を上げる
- cultural rules と curated seed の拡張
- feedback の活用範囲を広げる
- モバイル UI の読みやすさをさらに改善する

## 16. Developer note

このプロジェクトでは、「AI を使うこと」よりも「AI をどう制御して、購入判断に近い形へ落とし込むか」を重視しました。Gemini の便利さを活かしつつ、最後は Core が責任を持って判断する構成にしたことが、今回もっとも大きな学びです。
