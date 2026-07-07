# SOLE//MATRIX

スニーカーを、流行や価格だけでなく、歴史・素材・服との相性・文化背景まで含めて整理し、購入判断を補助する Web アプリです。

商品名・URL・画像からの単体判断と、11問診断にもとづく推薦を分けて扱い、Gemini の候補調査と TypeScript Core の最終判断を明確に分離しています。価格、在庫、サイズ、購入可能性は販売元での確認を前提にしています。

## 1. Overview

SOLE//MATRIX は、好みを言語化しにくい人でも、服装・パンツ・素材・予算・カルチャーの軸でスニーカー選びを整理できるように設計したアプリです。

- 11問診断から `RyoPreferenceVector v4` を生成できる
- 商品名・URL・画像から個別の商品判断ができる
- Gemini を候補調査と補助説明に使い、Core が schema 検証・fallback・再ランキング・最終判断を担う
- Ryo Mode v4 で文化背景、素材の育ち、パンツ相性を強く反映する
- 価格・在庫・サイズ・購入可能性は販売元で要確認

## 2. Screenshots

以下は、2026-07-07 にローカル環境で確認した画面です。実 API に依存しない確認用キャプチャを含みます。

### 11問診断の開始画面

![Ryo Mode v4 start](docs/product/screenshots/ryo-mode-v4-start.png)

### 回答サマリー

![Ryo Mode v4 summary](docs/product/screenshots/ryo-mode-v4-summary.png)

### 推薦結果のメイン画面

![Ryo Mode v4 result](docs/product/screenshots/ryo-mode-v4-result.png)

### Ryo Mode v4 の score 表示

![Ryo Mode v4 scores](docs/product/screenshots/ryo-mode-v4-scores.png)

### フィードバック保存 UI

![Ryo Mode v4 feedback](docs/product/screenshots/ryo-mode-v4-feedback.png)

## 3. Why I built this

私は中学生の頃からスニーカーが好きで、ただ新しいモデルや高いモデルを追うよりも、「なぜその靴が生まれたのか」「どんな人や文化に履かれてきたのか」「履き込んだ後にどう育つのか」を考えて選ぶことが多くありました。

一方で、スニーカー選びは情報量が多く、流行・価格・ブランド名だけで判断すると、自分の服装や履き方に合わないことがあります。そこで、感覚だけで終わらせず、歴史・素材・服装・予算・文化背景から判断を整理できるアプリを作りたいと考えました。

SOLE//MATRIX は、AI におすすめを丸投げするためのアプリではありません。Gemini で候補調査や補助説明を行いつつ、最終的な評価や再ランキングは Core 側で制御し、ユーザーの好みと実際の購入判断に近づけることを目指しています。

## 4. Main features

- 11問診断
- 商品判断（商品名 / URL / 画像）
- `RyoPreferenceVector v4`
- `productScore` / `recommendationScore` / `totalRyoScore`
- cultural recommendation metadata
- retro running taxonomy
- Gemini candidate research readiness
- fallback catalog
- feedback localStorage persistence

## 5. Ryo Mode v4

Ryo Mode v4 は、古い型、復刻、素材の育ち方、パンツ相性、文化背景を重視する推薦補助レイヤーです。

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

## 6. Gemini and Core responsibilities

Gemini は候補調査と補助説明の担当です。Core は schema 検証、fallback、Ryo Mode 再ランキング、最終判断を担当します。Gemini の出力はそのまま採用せず、Core 側で検証します。fallback catalog は Gemini 成功扱いにしません。

| Role | Responsibility |
| --- | --- |
| Candidate research | Gemini |
| Grounding / citation gathering | Gemini / Google Search Grounding |
| Validation / schema / fallback | Core |
| Ryo Mode reranking | Core |
| Final decision | Core |
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

## 8. Tech stack

- Next.js 16
- React 19
- TypeScript
- Vitest
- Gemini GenerateContent REST API
- Google Search Grounding

## 9. What I focused on

- AI 出力を鵜呑みにしないこと
- Gemini と Core の責務分離を README 上でも明確にすること
- 11問診断を構造化して `RyoPreferenceVector v4` へ変換すること
- 歴史・文化・素材・パンツ相性を recommendation logic に落とし込むこと
- feedback をブラウザ側で保存し、見返せる導線を用意すること
- 実装されている内容と README の説明を一致させること

## 10. Verification

2026-07-07 時点で、以下をローカルで確認しました。

- TypeScript: passed
- Tests: 65 files / 461 tests passed
- Production build: passed
- Browser check: passed（`localhost:3000` の guest flow、実 API なしで 11問開始・回答サマリー・結果・score・feedback UI を確認）

## 11. Future improvements

- 価格や在庫確認への導線をより分かりやすくする
- 画像理解と URL 解析の精度を上げる
- cultural rules と curated seed の拡張
- feedback の活用範囲を広げる
- モバイル UI の読みやすさをさらに改善する

## 12. Developer note

このプロジェクトでは、「AI を使うこと」よりも「AI をどう制御して、購入判断に近い形へ落とし込むか」を重視しました。Gemini の便利さを活かしつつ、最後は Core が責任を持って判断する構成にしたことが、今回もっとも大きな学びです。
