# All-in-one security notes

## Secrets

- `.env.local`はcommitしない
- `GEMINI_API_KEY`と`RAKUTEN_ACCESS_KEY`はserver-sideのみ
- `NEXT_PUBLIC_GEMINI*` / `NEXT_PUBLIC_RAKUTEN*`は禁止
- key、request URL、query全文、raw responseをUI / API / log / screenshotへ出さない

## URL fetch

- protocol、credential、port、hostname、DNS addressを検証
- localhost、private / link-local / reserved IPv4/IPv6を拒否
- redirectはmanualで3回まで、各遷移を再検証
- timeout 5秒、HTML 512KB、`text/html`だけ
- cookieを送らず、許可meta以外を破棄

## Image upload

- JPEG / PNG / WebPだけ
- 1byte〜5MB
- MIMEとmagic bytesの一致を検証
- raw imageをdiskやmemory.mdへ保存しない
- Geminiの禁止fieldまたは不正shapeはstructured fallback

## User data

- safe user IDは`^[A-Za-z0-9_-]{1,64}$`
- path containmentとsymlink boundaryを検証
- runtime memoryは`.gitignore`対象
- user textをJSON文字列として保存
- memoryは常に`untrusted_user_data`

## Decision integrity

- score / DecisionはTypeScriptだけが決定
- Geminiは説明と画像特徴抽出だけ
- 楽天は候補取得だけ
- provider失敗はlocal / rule-based fallback

## Manual audit

```powershell
rg -n "AIza|GEMINI_API_KEY=.+|RAKUTEN_APPLICATION_ID=.+|RAKUTEN_ACCESS_KEY=.+|SUPABASE_.*=.+" . --glob '!node_modules/**' --glob '!.next/**' --glob '!.env.local'

rg -n "NEXT_PUBLIC_GEMINI|NEXT_PUBLIC_RAKUTEN|raw response|response body|searchParams\.toString|request URL|query string" app server docs README.md --glob '!node_modules/**' --glob '!.next/**'
```

説明文と安全性test名の一致は許容し、実値とraw dataの出力経路がないことを個別確認します。
