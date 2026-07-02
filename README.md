# SOLE//MATRIX

SOLE//MATRIXは、スニーカーの8問好み診断と、商品名・URL・画像を使った購入判断を提供するNext.jsアプリです。AIは候補調査と説明を補助しますが、最終的なscore・budgetFit・DecisionはTypeScript Coreだけが決定します。

## 主な機能

- 8問診断から具体的なスニーカーモデル名を推薦
- 商品名・URL・画像のいずれかから購入判断
- Ryo Mode / Balanced Modeの2つの評価視点
- Geminiによる候補調査、推薦理由、注意点、購入判断の補助説明
- Rakuten listing、URL metadata、画像分析を外部証拠として分離表示
- 具体モデル名からGoogle・楽天・SNKRDUNK検索リンクを生成
- Supabase Auth設定時の新規登録・ログイン・ログアウト
- Gemini、Rakuten、Supabase未設定・失敗時の安全なfallback

## 使い方

1. `/login`でログイン、新規登録、または「ゲストで試す」を選びます。
2. `/app`で「8問診断」または「商品・URL・画像から購入判断」を選びます。
3. 8問診断では各質問に「好き・普通・苦手」で回答し、推薦結果を表示します。
4. 商品判断では商品名・URL・画像のいずれかと、任意の予算を入力します。
5. Decision、理由、注意点、外部証拠、商品参考リンクを確認します。

ゲストモードは何回でも利用できます。ゲストの診断・商品入力・画像・履歴は保存しません。ブラウザに旧版の`hasCompletedDiagnosis`が残っていても利用をブロックしません。

## GeminiとCoreの境界

8問診断ではGeminiが実在候補を調査し、次の順でCoreが検証します。

1. JSON shapeを検証
2. 「クラシック・デイリー型」などの抽象モデル名を除外
3. `evidenceUrls`にHTTP/HTTPS URLが1件以上あることを確認
4. 有効候補だけをCandidateProfileへ正規化
5. CoreがPreferenceVector・候補特徴・budgetFitで再スコアリング
6. Coreが最終Decisionを決定

Geminiのreason・cautions・evidenceUrlsは補助説明にだけ使います。GeminiはCore score・budgetFit・Decisionを上書きできません。URLの有無もscoreを変えません。

Geminiが未設定、失敗、または全候補がinvalidの場合は、次を含むアプリ内fallback catalogから具体モデルを推薦します。

- adidas SAMBA OG
- New Balance 991
- Nike Air Jordan 1 High
- PUMA Suede
- Vans Era
- Converse Jack Purcell
- New Balance 2002R
- ASICS GEL-KAYANO 14
- Nike Air Force 1 Low
- Converse All Star / Chuck Taylor

商品名・URL・画像の購入判断でもGeminiは補助説明に使われますが、最終DecisionはCoreが決定します。

## 商品参考リンク

参考リンクは必ず具体モデル名から生成します。Google・楽天・SNKRDUNKの検索リンクは未検証の検索入口であり、直接商品URLではありません。GeminiのevidenceUrlsとRakuten listing URLは公開URLとして応答を確認できた場合だけ直接リンクとして表示します。

参考リンクはCore score・Decision・budgetFitを変更しません。価格・在庫・サイズ・真贋・購入可能性は保証しません。購入前に販売元、サイズ、状態、返品条件を確認してください。

Rakuten APIが`blocked_forbidden`になる場合は、Application ID・Access Key・利用API・楽天側設定の確認が必要です。APIが利用できない場合でも、Google・楽天・SNKRDUNK検索リンクfallbackでアプリは動作します。

## ログイン・新規登録

Supabase Authが設定済みなら、`/login`からメールアドレスとパスワードで新規登録・ログインできます。ログイン成功時は`/app`へ移動し、ワークスペース上にログイン状態とログアウトボタンを表示します。メール確認が必要なSupabase設定では、登録後に確認メールの案内を表示します。

Supabase未設定時は認証フォームを無効化し、prepared UIとして説明します。ゲストモードは引き続き利用できます。APIキーや内部エラー詳細は画面に表示しません。

ログインユーザーの診断メモとfeedbackは、既存の`/api/users/*`とローカル`data/users/*`を保存入口として使います。これはローカル／単一Nodeプロセス向けの既存実装で、Supabase DBへの永続保存ではありません。ゲストは保存しません。

## セットアップ

```powershell
npx --yes pnpm@11.5.2 install
Copy-Item .env.local.example .env.local
npx --yes pnpm@11.5.2 web:dev
```

`.env.local.example`には環境変数名だけがあります。実際のAPIキーをREADME、docs、ログ、commitへ書かないでください。`.env.local`は`.gitignore`対象です。

```env
GEMINI_API_KEY=
GEMINI_RESEARCH_MODEL=gemini-2.5-flash
RAKUTEN_APPLICATION_ID=
RAKUTEN_ACCESS_KEY=
RUN_EXTERNAL_SMOKE=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

認証はserver-sideの`SUPABASE_URL` / `SUPABASE_ANON_KEY`を優先します。`NEXT_PUBLIC_*`も利用できますが、ブラウザへ公開される前提の値だけを設定してください。

## 通常検証

```powershell
npx --yes pnpm@11.5.2 typecheck
npx --yes pnpm@11.5.2 test
npx --yes pnpm@11.5.2 web:build
```

## 実API smoke

実APIキーが`.env.local`にある場合だけ、明示的にopt-inして実行します。

```powershell
$env:RUN_EXTERNAL_SMOKE = "1"
npx --yes pnpm@11.5.2 exec vitest run app/_lib/external-smoke app/_lib/core-v1/geminiActualSmoke.test.ts --disableConsoleIntercept --reporter=verbose
Remove-Item Env:RUN_EXTERNAL_SMOKE -ErrorAction SilentlyContinue
```

smokeが未実行、missing config、network error、`blocked_forbidden`の場合は成功扱いにしません。キー値、request URLのsecret、raw responseは出力しません。

## 主要ディレクトリ

```text
app/_lib/ai/                         Gemini候補調査prompt・schema・fallback catalog
app/_lib/core-v1/                    Core score・Decision・Gemini説明・Rakuten境界
app/_lib/auth-session/               guest session・Supabase server auth境界
app/_lib/product-links/              具体モデル名ベースの参考リンク
app/_components/                     診断・商品判断・認証状態UI
app/api/auth/                        signup・signin・session・logout
app/api/                             Next.js API routes
docs/product/SUBMISSION_READINESS.md  提出前の検証境界
```

## 制約

- 価格・在庫・サイズ・真贋・購入可能性を保証しない
- Gemini出力を無検証で表示しない
- evidenceUrlsがないGemini候補を採用しない
- 抽象タイプ名だけをmodelNameとして表示しない
- URLや外部API結果をCore score・budgetFit・Decisionへ混ぜない
- 実API未確認やブラウザ未確認を「確認済み」と報告しない
