# Colorway verification policy

AI出力は検索候補であり、事実ではない。AIの`confidence`は検証状態へ使用しない。

## 状態

- `model_color_style_verified`: 公式または正規取扱店1ソース、あるいは独立した高品質2ドメイン以上で、モデル・カラー・Style Codeが完全一致。
- `model_color_verified`: モデルとカラーは同条件で一致するが、Style Codeは未提供または未確認。
- `model_only`: モデルだけ確認済み。カラー名とStyle Codeは表示しない。
- `unverified`: モデル自体を確認できない。AI候補の表示対象外または明確なfallback扱い。

楽天、Yahoo、eBayなどmarketplace listingは補助照合には使えるが、それだけで公式カラー確認済みにしない。Style CodeはNFKC、英大文字、空白・ハイフン差を正規化して完全一致を判定し、部分一致を拒否する。

同一Style Codeの異なるカラー、同一カラーの異なるStyle Code、別世代、メンズ／ウィメンズ／キッズ競合、複数コードを含むタイトル、AIと根拠の不一致がある場合はカラーを非表示にして`model_only`へ落とす。
