# SOLE//MATRIX Core v1 MVP

[![CI](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml/badge.svg)](https://github.com/ryo-man03/sole-matrix-core/actions/workflows/ci.yml)

SOLE//MATRIX は、スニーカーの好みを診断し、一般的な勧めやすさと個人らしい納得感を分けて表示する判断支援プロトタイプです。

Core v1 MVP では、診断から推薦結果・説明・feedback skeleton までを Web UI と API Route で一貫して実行できます。score と Decision は TypeScript の決定論的なロジックが確定し、Gemini は説明文の生成だけを補助します。

## セットアップ

必要環境は Node.js、pnpm、Git です。

```bash
pnpm install
pnpm web:dev
```

開発サーバーは通常 `http://localhost:3000` で起動します。

## 検証

```bash
pnpm test
pnpm typecheck
pnpm web:build
```

現時点の `package.json` に lint script はありません。テストは Vitest、型チェックは `tsc --noEmit`、production build は Next.js で行います。

## Core v1 MVP の流れ

```txt
8問の診断 / 対応タグ
→ PreferenceVector（0〜100の8軸）
→ local/mock候補
→ Balanced Score
→ Ryo Score
→ Decision
→ Gemini structured explanation または rule-based fallback
→ Recommendation UI
→ Feedback API skeleton / mock repository
```

PreferenceVector の軸:

```txt
culture / styleFit / simplicity / street
volume / comfort / durability / priceLevel
```

Decision:

```txt
strong_buy / consider / wait / avoid / unknown
```

Balanced Score は、既存の `recommendSneakers` と Core score breakdown を薄い adapter から再利用します。Ryo Score は文化背景、クラシック／レトロ、ストリート、落ち着いた合わせやすさ、趣味としての納得感を別の純粋関数で評価します。

## API

### Recommendation

`POST /api/core-v1/recommend`

```json
{
  "diagnosisAnswers": {
    "trusted-classic": "like",
    "simple-daily": "neutral"
  },
  "preferenceTags": ["classic", "minimal"],
  "budgetYen": 20000
}
```

診断回答または対応タグが少なくとも1つ必要です。予算は任意です。候補は外部商品ではなく、`app/_lib/core-v1/repository.ts` のローカル仮候補を使います。

### Feedback skeleton

`POST /api/core-v1/feedback`

```json
{
  "recommendationId": "core-v1:local-classic-daily",
  "sentiment": "helpful",
  "comment": "理由が分かりやすかった"
}
```

`sentiment` は `helpful`、`not_helpful`、`unsure` のいずれかです。現在は process 内の mock repository へ保存し、Supabase 未設定でも落ちません。永続化・認証・本番DB接続はまだ行いません。

## Gemini の役割と fallback

Gemini に渡すのは、Core が確定した Decision、Balanced/Ryo Score、安全な候補要約、タグ、予算、rule-based explanation です。

Gemini は以下を行いません。

- score の計算・変更
- Decision の決定・変更
- 実在価格、在庫、URL、真贋の判断
- Rakuten response や個人情報の処理

出力は次の structured JSON schema を検証します。

```ts
type GeminiExplanationJson = {
  summary: string;
  reasons: string[];
  cautions: string[];
  balancedView: string;
  ryoView: string;
  finalTone: "positive" | "balanced" | "cautious" | "negative" | "unknown";
};
```

APIキー未設定、通信失敗、HTTPエラー、JSON不正、schema不一致、安全でない表現のいずれでも rule-based explanation へ fallback します。Gemini の API キーは URL へ含めず、request header から送信します。

## Rakuten readiness

Rakuten API は Core v1 の商品候補、価格、budgetFit、URL に接続していません。現在の既知状態は `blocked_forbidden` で、UI には外部商品データを使っていないことを表示します。

`RUN_EXTERNAL_SMOKE=1` のときだけ隔離 smoke を明示実行できます。HTTP 200 と response shape が確認できても、normalizer を実装して明示接続するまでは本線へ混ぜません。

## 環境変数

`.env.example` を参照してください。本物の値は commit しません。

```env
GEMINI_API_KEY=
RAKUTEN_APPLICATION_ID=
RAKUTEN_ACCESS_KEY=
RUN_EXTERNAL_SMOKE=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

Gemini と Supabase は未設定でもアプリが動きます。Rakuten は設定の有無に関係なく Core v1 の推薦候補へは使いません。

## 主なディレクトリ

```txt
app/_lib/core-v1/
  diagnosis / PreferenceVector / scoring / Decision
  explanation / Gemini provider / readiness
  service / repository / validation

app/api/core-v1/
  recommend / feedback Route Handlers

app/_components/CoreV1RecommendationPanel.tsx
  Recommendation UI / readiness / feedback skeleton

src/core/
  既存 recommendSneakers 公開API（Core v1からadapter経由で再利用）
```

設計境界、provider追加、Supabase移行案は [docs/core-v1-architecture.md](docs/core-v1-architecture.md) を参照してください。

## 現在の制限

- 候補は商品カタログではなくローカルの仮候補
- 実在価格、在庫、市場価格、真贋は扱わない
- Rakuten 商品検索は本線へ未接続
- Feedback は process 内 mock のため再起動で消える
- Supabase 本番接続、認証、RLS 運用は未実装
- 検索入力型 UI は補助レーンで、Core v1 の別 Decision ロジックは持たない

## Legacy / CLI

既存の `recommendSneakers`、サンプルデータ、CLI demo、v0.2テストは維持しています。

```bash
pnpm demo
pnpm demo:gemini
```
