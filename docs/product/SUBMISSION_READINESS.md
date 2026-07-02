# SOLE//MATRIX Submission Readiness

## 推薦経路

8問診断は`gemini-sneaker-research-prompt.ts`からGeminiへ候補調査を依頼します。応答は`gemini-sneaker-research-schema.ts`でshape、具体モデル名、検索語、evidenceUrls、confidenceを検証します。有効候補だけをCore候補へ正規化し、Coreで再スコアリングします。

Gemini未設定・失敗・invalid時は`sneaker-fallback-catalog.ts`の具体モデルへ切り替えます。主見出しは具体モデル名、抽象タイプ名は補足表示だけに使います。

## 購入判断経路

商品名・URL・画像の入力対象をCore候補として固定します。URL metadataと画像分析は外部証拠であり、Core completenessやscoreを変更しません。Geminiは理由とリスクの補助説明を作りますが、DecisionはCoreだけが決定します。

## 参考リンク

具体モデル名からGoogle・楽天・SNKRDUNK検索入口を生成します。検索入口は未検証であることを表示します。直接URL候補はSSRF対策、redirect制限、tracking・secret query除去、HTTP応答確認を通った場合だけ表示します。

Rakutenが`blocked_forbidden`、rate limit、network error、invalid responseでも検索入口を表示し、画面を失敗扱いにしません。

## 認証と保存

Supabase設定時はserver-side Auth API経由でsignup、signin、session確認、logoutを行い、access tokenをHttpOnly cookieに保持します。未設定時は認証を無効化し、ゲスト入口を維持します。

ゲストは何回でも利用でき、診断・商品入力・画像・履歴を保存しません。ログインユーザーは既存のローカルuser-memory APIを保存入口として利用します。現時点でSupabase DBへの診断履歴保存は行いません。

## READY判定条件

- 診断結果の主見出しが具体モデル名
- 参考リンクが具体モデル名ベース
- ゲストで診断・商品名・URL・画像判断を繰り返せる
- Gemini候補が検証とCore再評価を通る、または具体fallbackへ移る
- 商品判断のGemini補助説明とCore Decisionが分離
- typecheck・test・buildが成功
- PC・mobileブラウザで主要動線、console、runtime、layoutを確認
- 実APIの未確認・fallback状態を正確に報告

## 2026-07-02 最終検証

- `typecheck`: 成功
- `test`: 54 files / 382 tests 成功
- `web:build`: 成功
- browser E2E: PC 1280x720、mobile 390x844で主要動線成功。横overflow、console error、console warningなし
- Gemini: 候補調査（具体候補4件）、補助説明、画像解析、統合推薦を実通信HTTP 200で再確認。schema・shape検証成功、最終DecisionはTypeScript Coreを維持。過去のHTTP 429 / 503時も具体モデルfallbackとrule-based説明へ安全に切り替わる
- Rakuten: 実通信はHTTP 403（referrer / originの可能性）およびtransport比較時HTTP 429。`blocked_forbidden` / `blocked_rate_limit`へ分類し、具体モデル名の検索リンクfallbackを維持
- Supabase: 環境変数未設定。認証フォームを安全に無効化し、無制限ゲストを維持。実signup / signin / logoutは未検証

提出判定:

- ゲスト診断・推薦・購入判断デモ: READY
- ログイン・新規登録まで実演する提出物: 条件付きREADY

外部APIの制限はゲスト主動線を停止させず、画面上でfallback状態を明示します。Supabase Authへの対応境界は実装済みですが、ログイン・新規登録を実際に利用できると説明するには、環境変数設定後にsignup / signin / logoutの追加実通信確認が必要です。
