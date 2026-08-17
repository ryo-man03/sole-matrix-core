# Purchase Confidence

Purchase Confidence は推薦後の購入確認レイヤーです。価格の安さや「買うべき度」ではなく、購入前に確認できている証拠の範囲を独立した軸で表示します。Core Score、Ryo Score、推薦順位、最終Decisionは変更しません。

- Product identity: モデル、カラー、Style Codeの確認状態
- Market match quality: 外部Provider候補の `exact` / `probable` / `related`
- Condition clarity: 新品・中古・不明が明示されている割合
- Shipping clarity: 送料が明示されている割合
- Listing freshness: 取得後15分以内／24時間以内／それより古い情報
- Fit reference: Fit Confidence V2の `strong` / `medium` / `limited` / `unknown`
- Evidence warnings: 不明・矛盾・古い情報を購入前チェックへ変換した注意

価格はConfidence入力に含めません。同一の販売証拠で価格だけを安くしても判定は上がりません。状態、送料、鮮度、サイズ、返品条件を混ぜず、不明値は不明のまま残します。真贋、在庫、将来価格、利益、購入結果は保証しません。

外部の楽天市場・Yahoo!ショッピング・eBayへの取得は、利用者がボタンを押したときだけ開始します。表示・クリックイベントは自社の同意境界を通り、第三者トラッカーは使いません。
