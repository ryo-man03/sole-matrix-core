# SOLE//MATRIX

[![CI](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml/badge.svg)](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml)

スニーカーを、流行や価格だけでなく、歴史・素材・服との相性・文化背景まで含めて整理し、購入判断を補助する Web アプリです。

商品名・URL・画像からの単体判断と、11問診断にもとづく推薦を分けて扱い、Gemini の候補調査、TypeScript Core / Ryo Mode の推薦判断、Rakuten `market_find` の購入サポートを明確に分離しています。価格、在庫、サイズ、購入可能性は販売元での確認を前提にしています。

## 1. Overview

SOLE//MATRIX は、好みを言語化しにくい人でも、服装・パンツ・素材・予算・カルチャーの軸でスニーカー選びを整理できるように設計したアプリです。

- 11問診断から `RyoPreferenceVector v4` を生成できる
- 最初の一足、普段使い、二足目、アーカイブという購入目的と、所有・苦手モデルを今回の推薦文脈に反映できる
- 商品名・URL・画像から個別の商品判断ができる
- Gemini を候補調査と補助説明に使い、Core がモデル名・正式カラー名・Style Code・根拠 URL の検証、fallback、再ランキング、最終判断を担う
- Ryo Mode v4 で文化背景、素材の育ち、パンツ相性を強く反映する
- Rakuten `market_find` で、推薦後に楽天市場の購入候補を別枠で探せる
- 価格・在庫・サイズ・購入可能性は販売元で要確認

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

Rakuten `market_find` は推薦後の購入サポートです。楽天の商品情報は Core / Ryo Mode のスコア、ランキング、最終 Decision を変更しません。また、公式モデル同定、正規品判定、価格・在庫・サイズの保証には使いません。

| Role | Responsibility |
| --- | --- |
| Preference / recommendation logic | TypeScript Core / Ryo Mode v4 |
| Grounded candidate research / explanation support | Gemini / Google Search Grounding |
| Validation / schema / fallback / final decision | TypeScript Core |
| Purchase-support product search | Rakuten `market_find` |
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

## 9. What I focused on

- AI 出力を鵜呑みにしないこと
- Gemini と Core の責務分離を README 上でも明確にすること
- Rakuten を推薦ロジックから分離し、購入サポートとして扱うこと
- 11問診断を構造化して `RyoPreferenceVector v4` へ変換すること
- 歴史・文化・素材・パンツ相性を recommendation logic に落とし込むこと
- feedback をブラウザ側で保存し、見返せる導線を用意すること
- 実装されている内容と README の説明を一致させること

## 10. Limitations

- Gemini の Grounding は候補調査の根拠を補いますが、情報の完全性や恒久的な正確性を保証するものではありません。候補は Core で検証し、失敗時は具体モデルの fallback catalog を使います。
- モデルを確認できても正式カラーを確認できない場合があります。その場合はカラー名と Style Code を推測せず、モデルのみを表示します。
- Rakuten `market_find` は検索語に近い販売商品を表示する購入サポートです。公式モデル同定、正規品判定、推薦根拠には使用しません。
- 価格・在庫・サイズ・商品状態・返品条件は変動します。購入前に販売ページで確認してください。
- 外部 API が未設定、拒否、rate limit、network error の場合も、推薦結果を残したまま fallback または soft error を表示します。
- フィードバック保存は現在ブラウザの localStorage が中心です。端末間同期を保証しません。

## 11. Run locally

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
```

- `GEMINI_API_KEY`: Gemini の grounded candidate research と補助説明に使用します。
- `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY`: Rakuten `market_find` の実 API 呼び出しに必要です。
- `RAKUTEN_AFFILIATE_ID`: 任意です。楽天アフィリエイトを利用する場合だけ設定します。
- `RAKUTEN_REQUEST_ORIGIN`: Rakuten Web Service の Allowed websites に登録した Web サイトの origin（例: `https://example.com`）と一致させます。

Rakuten 側の Allowed websites 設定によっては `localhost` が拒否されます。実 API smoke では、Allowed websites に登録したデプロイ済みドメイン、または必要に応じて ngrok などの HTTPS origin を使ってください。

Supabase など、ほかの任意設定は [`.env.local.example`](.env.local.example) を参照してください。

## 12. Submission / demo notes

- 基本デモはゲスト導線で、11問診断 → 回答サマリー → Ryo Mode v4 推薦結果まで確認できます。
- Gemini が利用できない場合は具体モデルの fallback、Rakuten が利用できない場合は推薦結果を維持した soft error になります。
- Rakuten の商品カードは推薦候補そのものではなく、推薦後に確認する購入候補です。
- 実 API を見せる場合は、デモ前に API key と `RAKUTEN_REQUEST_ORIGIN` / Allowed websites の組み合わせを確認してください。

## 13. Verification

2026-07-29 時点で、以下をローカルで確認しました。

- TypeScript: passed
- Tests: 77 files / 554 tests passed
- Production build: passed（21 routes）
- Browser check: passed（360 / 390 / 430 / 768 / 1024 / 1366 / 1440 / 1920px。ホーム、設定、購入文脈、説明付き11問、サマリー、推薦の本命・別案・下げた候補を確認。横スクロールなし、console error / warning 0件）
- GitHub Actions: `Typecheck` / `Tests` / `Production build` の3ジョブを PR、`main` push、merge queue で実行する構成
- External API contract: CI では Gemini / Rakuten の live API を呼ばず、mock と fallback contract を検証。live Gemini colorway verification は未確認

## 14. Future improvements

- 購入サポートの検索精度と対応 provider を広げる
- 画像理解と URL 解析の精度を上げる
- cultural rules と curated seed の拡張
- feedback の活用範囲を広げる
- モバイル UI の読みやすさをさらに改善する

## 15. Developer note

このプロジェクトでは、「AI を使うこと」よりも「AI をどう制御して、購入判断に近い形へ落とし込むか」を重視しました。Gemini の便利さを活かしつつ、最後は Core が責任を持って判断する構成にしたことが、今回もっとも大きな学びです。
