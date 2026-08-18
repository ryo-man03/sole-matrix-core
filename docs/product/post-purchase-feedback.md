# Post-purchase feedback

## User flow

`Recommendation → Market research → Wishlist → Purchase report → Owned sneaker → Fit feedback → Preference Profile update → Offline evaluation`

購入報告はOwned sneakerを作成し、任意のサイズ、全体のフィット、つま先、横幅、かかと、甲、次回も同じサイズを選ぶか、短いメモを記録します。各mutationはユーザー単位の冪等キーを持ち、再送で購入・フィードバック・イベント件数を増やしません。推薦Snapshot、Wishlist、Owned、購入報告の参照はすべて複合所有者キーで同じユーザーに固定します。

## Consent and no silent learning

- 購入、Fit、Wishlist、推薦フィードバック、Market検索は明示的なProduct actionです。Analytics同意がなくても、利用者が送信した操作は保存できます。
- Recommendation viewとMarket listing clickはBehavior analyticsです。最新のAnalytics同意がONのときだけ保存します。
- Fit feedback自体は明示的操作として保存します。Fit Preference Profileの再集計は最新のBehavior personalization同意がONのときだけ実行します。
- イベント保存はCore学習ではありません。Click、Purchase、Fit feedbackから推薦順位を自動変更せず、外部ML trainingにも送りません。

更新時の表示は「Preference Profileを更新しました」です。「AIがあなたを学習しました」のような表現は使いません。

## Offline evaluation

`feedback-evaluation-v1.0.0` は推薦Snapshotにリンクした決定論的なFixture interfaceです。イベントIDを重複排除してから、Top-k stability、ブランドDiversity、Canonical accuracy、Ryo coherence、Fit warning correctness、フィードバック集計を計算します。入力順を変えても結果は同じで、これはML training pipelineではありません。
