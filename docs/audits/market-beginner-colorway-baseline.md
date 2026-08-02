# Market / Beginner / Colorway baseline

実施日: 2026-08-01（Asia/Tokyo）
開始 SHA: `76a9f47f9206caca9ba1c7bb4723cd4fa5efe01d`

## 実行結果

| 項目 | 結果 | 記録 |
| --- | --- | --- |
| Node.js | PASS | v22.21.0 |
| pnpm | PASS | 11.9.0 |
| Next.js | PASS | 16.2.11 |
| install | PASS | lockfile変更なし、398ms |
| typecheck | PASS | 22.9秒 |
| tests | PASS | 101 files / 1,043 tests、20.47秒 |
| production build | PASS | 22 routes/pages、58.2秒 |
| audit | PASS | high以上0、low 1 |
| working tree | PASS | 開始時clean |

Production buildには既存のNext.js NFT trace warningが1件ある。`globalFeedbackCorpus.ts`から動的なfilesystem参照を追跡した警告であり、Baselineの失敗ではない。

## 変更前監査の要点

- 楽天市場の個別検索は存在したが、価格セマンティクス、送料、状態、サイズ、一致度を共通契約として表示できなかった。
- Yahoo!ショッピングとeBay Browse APIのAdapterおよび部分成功表示はなかった。
- 既存の事実検証はmarketplace-onlyを確認済みにしないが、`model_color_style_verified`を明示する統一契約がなかった。
- 推薦順位と市場価格は分離済みであり、その境界を維持して拡張する。
