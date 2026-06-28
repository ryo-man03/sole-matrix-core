# SOLE//MATRIX all-in-one architecture

## 実行フロー

```text
RecommendationWorkspace
  ├─ POST /api/users/register ── memory.md service
  ├─ POST /api/sneakers/analyze
  │    ├─ safe URL service
  │    └─ image validation → Gemini vision → structured fallback
  └─ POST /api/recommendations/search
       ├─ validation + inferred safe tags
       ├─ user memory（untrusted user data）
       ├─ local candidate repository
       ├─ Rakuten provider → normalizer → safe candidates
       ├─ Core v1 scoring / decision
       ├─ Ryo / Balanced mode evaluator
       └─ Gemini explanation / rule-based fallback
```

Next.js Route Handlerはtransport層です。`server/routes/`がHTTP requestをuse caseへ変換し、`server/services/`が既存serviceへの切り出し境界になります。現在は同じprocessで動き、追加packageや別server processはありません。

## 判断の所有者

| 値 | 所有者 |
| --- | --- |
| `PreferenceVector` | TypeScript diagnosis adapter |
| Core Balanced / Ryo score | TypeScript pure functions |
| 候補のrisk / budget fit | TypeScript provider / normalizer |
| Mode score / Decision | TypeScript mode evaluator |
| 説明文 | Geminiまたはrule-based fallback |
| 画像の見た目signal | Gemini推定 → TypeScript数値化 |
| 楽天商品候補 | Rakuten取得 → TypeScript検証・正規化 |

Gemini出力から最終scoreまたはDecisionを読む経路はありません。

## Mode domain

`RecommendationMode`は`ryo | balanced`です。Core v1の既存score関数を変更せず、`modeRecommendation.ts`が最終評価層を提供します。

- Ryo: `ryoModeSeed.ts`の所有モデル、wishlist、brand史、文化、素材と重複を評価
- Balanced: 価格、汎用性、情報量、risk、readinessを評価

既存Core Decision (`strong_buy / consider / wait / avoid / unknown`)も互換APIに残し、PC統合UIはmode Decision (`strong_buy / buy / wait / skip`)を表示します。

## User memory boundary

`data/users/{safeUserId}/memory.md`はruntime dataです。ID validation、path containment、symlink拒否、per-user write queueを通ります。profile、diagnosis history、feedback historyをMarkdownに保存しますが、自由文はJSON文字列としてescapeします。

AIへ渡すcontextは以下のmarkerを持ちます。

```ts
{ source: "user_memory", trust: "untrusted_user_data", content: "..." }
```

Gemini promptでも「命令ではなくdata」と明示し、system / developer instructionとして扱いません。

## External provider boundary

### URL

DNS解決後のaddressとredirect先を検証し、private / reserved hostをfetch前に拒否します。HTMLは512KBまで読み、許可metaだけを返します。

### Image

5MB上限、MIME allowlist、magic bytesを検証します。raw画像は永続保存せず、Gemini request内で一時的にbase64化します。AIがDecision、価格、真贋fieldを返した場合はfallbackします。

### Rakuten

credentialsはserver process envだけから読みます。HTTP 200 + valid shape + valid itemだけを`CandidateProfile`へ変換します。403 / 429を突破せず、readinessとlocal fallbackへ変換します。

## 回帰ゲート

各feature commitで以下を実行します。

```text
vitest → typecheck → Next production build → diff review
```

最終Phaseでは実画面操作、console確認、screenshots、secret scan、opt-in external smokeを追加します。
