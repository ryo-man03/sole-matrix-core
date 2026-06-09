# Prompt 06: Gemini Adapter

あなたは、TypeScript個人開発プロジェクトのテックリード兼実装者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core v0.1の推薦ロジック、ScoreBreakdown、Decision、Demotion、Golden Testは実装済み
* v0.2開発計画は `docs/v0.2-development-plan.md` に追加済み
* 公開API `recommendSneakers(input)` は `src/core/**` に追加済み
* v0.2デモ用サンプルデータは `src/data/**` に追加済み
* v0.2 CLI demo は `src/demo/**` に追加済み
* AIなしのルールベース説明文生成は `src/explanation/**` に追加済み
* `pnpm demo` は成功
* `pnpm test` は成功
* `pnpm typecheck` は成功
* GitHub Actions CI は成功
* 現時点では UI、DB、API Route、外部価格API、スクレイピングは未実装

今回の目的:
Gemini APIを使った説明文生成Adapterを追加してください。

ただし、GeminiはCoreのスコアや判定を作るものではありません。
Geminiは、Coreが出した `RecommendationResult` と、既存のルールベース説明文をもとに、文章を自然にする補助だけを担当します。

今回のゴール:

* Gemini Adapterを追加する
* Geminiが失敗した場合は、必ず既存のルールベース説明文にfallbackする
* テストでは実際のGemini APIを呼ばない
* APIキーをGitHubに含めない
* Coreの計算結果、Decision、Demotionを絶対に変更しない

重要:
今回はWeb UIを作らないでください。
今回はDBを作らないでください。
今回はAPI Routeを作らないでください。
今回は外部価格APIを使わないでください。
今回はスクレイピングを提案しないでください。
今回はCLIの表示にはまだ組み込まないでください。
今回はpackage.jsonに依存関係を追加しないでください。
今回はpnpm-lock.yamlを変更しないでください。

Geminiの呼び出し方針:

* 依存パッケージは追加しない
* Node.js標準の `fetch` を使う
* APIキーは `process.env.GEMINI_API_KEY` から読む
* v0.2では `GOOGLE_API_KEY` は読まない
* `GEMINI_API_KEY` がない場合はGeminiを呼ばず、ルールベース説明にfallbackする
* テストでは `fetch` 相当の関数を注入してmockする
* テスト中に実ネットワーク通信を行わない
* APIキーをコードに直書きしない
* `.env` を作成しない

実装するもの:

* Gemini説明生成用の型
* Gemini Adapter
* Gemini入力プロンプト生成関数
* Gemini出力の簡易validation
* Gemini失敗時fallback
* Gemini Adapterのテスト
* このPromptを `docs/agent-prompts/v0.2/06-gemini-adapter.md` として保存

作成・編集してよいファイル:

* `src/ai/types.ts`
* `src/ai/createGeminiExplanationPrompt.ts`
* `src/ai/generateGeminiExplanation.ts`
* `src/ai/index.ts`
* `src/ai/__tests__/createGeminiExplanationPrompt.test.ts`
* `src/ai/__tests__/generateGeminiExplanation.test.ts`
* `docs/agent-prompts/v0.2/06-gemini-adapter.md`

編集してはいけないファイル:

* `src/domain/recommendation/**`
* `src/domain/recommendation/__fixtures__/**`
* `src/domain/recommendation/__tests__/**`
* `src/core/**`
* `src/data/**`
* `src/demo/**`
* `src/explanation/createRuleBasedExplanation.ts`
* `src/explanation/types.ts`
* `README.md`
* `package.json`
* `pnpm-lock.yaml`
* `.github/**`

Gemini Adapterの仕様:

* 入力は `RecommendationResult` と `RuleBasedExplanation` を基本にする
* Geminiへ渡す情報は、Coreが生成した事実だけに限定する
* Geminiには以下を禁止するプロンプトを含める

  * スコアを変更すること
  * finalDecisionを変更すること
  * demotionsを変更すること
  * 実在価格を断言すること
  * 在庫を断言すること
  * プレ値を断言すること
  * 真贋を判定すること
  * 「絶対に買うべき」と断定すること
* Geminiの出力は説明文だけにする
* Geminiの出力が空、長すぎる、不適切、または失敗した場合はfallbackする

想定する型:

```ts
type GeminiExplanationInput = {
  result: RecommendationResult;
  fallback: RuleBasedExplanation;
};

type GeminiExplanationOutput = {
  provider: "gemini" | "rule-based";
  sneakerId: string;
  name: string;
  summary: string;
  reasons: string[];
  cautions: string[];
};
```

想定する関数:

```ts
createGeminiExplanationPrompt(input: GeminiExplanationInput): string

generateGeminiExplanation(
  input: GeminiExplanationInput,
  options?: {
    apiKey?: string;
    model?: string;
    fetcher?: typeof fetch;
  }
): Promise<GeminiExplanationOutput>
```

実装方針:

* `options.apiKey` が渡された場合はそれを使う
* `options.apiKey` がない場合は `process.env.GEMINI_API_KEY` を読む
* `GEMINI_API_KEY` もない場合は即座にfallbackする
* `fetcher` が渡された場合はそれを使う
* `fetcher` がない場合はglobal fetchを使う
* modelのデフォルトは `gemini-2.5-flash` とする
* modelは `options.model` で差し替え可能にする
* APIレスポンスから本文を取り出せない場合はfallbackする
* 例外発生時もfallbackする
* fallback時は `provider: "rule-based"` を返す
* Gemini成功時は `provider: "gemini"` を返す
* Gemini成功時も `sneakerId` と `name` はCore由来の値を使う
* Gemini成功時も `finalDecision` やscoreは返さない、変更しない

テスト要件:
`src/ai/__tests__/createGeminiExplanationPrompt.test.ts` に以下を含めること。

1. プロンプトに sneakerId / name / finalDecision / finalScore が含まれる
2. スコアやDecisionを変更しないよう指示が含まれる
3. 価格、在庫、プレ値、真贋を断言しない指示が含まれる
4. fallback説明の内容がプロンプトに含まれる

`src/ai/__tests__/generateGeminiExplanation.test.ts` に以下を含めること。

1. apiKeyがない場合はrule-based fallbackを返す
2. fetcherが成功レスポンスを返した場合はproviderがgeminiになる
3. Geminiレスポンスが空の場合はfallbackする
4. fetcherが例外を投げた場合はfallbackする
5. 出力のsneakerIdとnameは入力result由来の値を維持する
6. テスト中に実ネットワーク通信を行わない
7. 同じmock入力に対して同じ結果が返る
8. `GEMINI_API_KEY` がない場合にfetcherを呼ばない
9. `GOOGLE_API_KEY` だけがある場合も、v0.2ではfallbackする

禁止事項:

* Coreの計算式を変更しない
* `recommendSneakers()` の仕様を変更しない
* ルールベース説明関数を変更しない
* GeminiにscoreやDecisionを決めさせない
* Geminiの文章を根拠にfinalDecisionを変更しない
* Gemini APIキーをコードに直書きしない
* `.env` を作成しない
* `.env` をcommitしない
* package.jsonを変更しない
* pnpm-lock.yamlを変更しない
* README.mdを変更しない
* CLIに組み込まない
* 実ネットワーク通信をテストで行わない
* 外部価格APIを入れない
* スクレイピングを提案しない

実行すべきコマンド:

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

期待する結果:

* 既存テストがすべて成功する
* 新しく追加したGemini Adapterテストが成功する
* typecheckが成功する
* 既存Golden Testが壊れていない
* 既存fixtureや期待値に変更がない
* `src/domain/**`, `src/core/**`, `src/data/**`, `src/demo/**`, `src/explanation/**` に変更がない
* README.md、package.json、pnpm-lock.yaml、`.github/**` に変更がない
* 変更範囲が `src/ai/**` と `docs/agent-prompts/v0.2/06-gemini-adapter.md` に限定されている

commit message案:

```txt
feat: add Gemini explanation adapter with fallback
```

完了後に報告すること:

* 追加・変更したファイル一覧
* 変更していないことを確認した範囲
* Geminiを実ネットワークで呼んでいないこと
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、Geminiを安全に差し込むためのAdapterを作ることです。
実際のCLI組み込みや `demo:gemini` script追加は次のPromptで行います。

