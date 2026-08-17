# Fit Confidence V2

Fit Confidence はサイズの断定ではなく、購入候補にどの程度近い個人履歴があるかを示す意思決定支援です。認証済み利用者自身の `owned_sneakers`、`user_sizes`、構造化された `fit_feedback` だけを参照し、Core Score、Ryo Score、推薦順位、最終Decisionは変更しません。

## 参照レベル

| レベル | 必要な根拠 |
| --- | --- |
| `strong` | 同じCanonical model（Style Codeまたはブランド＋モデル）で、互換性のあるAudienceと有効なサイズ記録がある |
| `medium` | 同じModel family、同じGeneration、互換性のあるAudience、有効なサイズ記録がそろう |
| `limited` | 同じブランド、別世代、通常サイズのみ、または弱い購入後フィードバックしかない |
| `unknown` | 利用できる履歴がない |

Generation、メンズ／ウィメンズ／キッズ、JP・US・UK・EU表記、履歴内のサイズ差を別々に確認します。フィードバックが `too_small`、`too_large`、または「次回は同じサイズを選ばない」の場合は注意を追加します。

この機能は「必ず合う」「完璧なサイズ」を保証せず、医学的・整形外科的な診断もしません。メーカーサイズ表、販売先の返品条件、実際の試着を置き換えるものではありません。レスポンスは `private, no-store` で、DB障害時は `unknown` に安全退避します。
