# Provider data policy

- API credential、OAuth token、raw responseはブラウザへ返さず、リポジトリへ保存しない。
- eBay Application Access Tokenはサーバー内の1検索でのみ使用し、永続化しない。
- eBay結果は履歴・学習データ・予測へ保存しない。eBay価格はforecastに使用しない。
- API価格は購入参考情報であり、推薦順位、Core Score、Ryo Score、推薦セット整合性、Ryo role eligibilityへ入力しない。
- 通常テストとCIは`EXTERNAL_PROVIDERS_DISABLED=true`で外部通信を止める。live smokeはローカルでProviderごとに最大1検索を明示実行する。
- timeout、connection reset、一時的502/503だけ最大1回再試行する。400/401/403/404/409/429、invalid JSON、schema mismatch、利用者中断は再試行しない。
- 1レスポンスは1.5MBまで、URLはpublic HTTPSのみ、表示件数はProviderごとに最大10件とする。
- raw payloadは保存せず、監査には正規化件数、一致度、不足フィールド、競合、通貨、schema warning、安全でないURL、重複の件数だけを残す。
