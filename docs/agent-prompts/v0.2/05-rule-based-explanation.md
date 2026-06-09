# Prompt 05: Rule-Based Explanation

あなたは、TypeScript個人開発プロジェクトのテックリード兼実装者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core v0.1の推薦ロジック、ScoreBreakdown、Decision、Demotion、Golden Testは実装済み
* v0.2開発計画は `docs/v0.2-development-plan.md` に追加済み
* 公開API `recommendSneakers(input)` は `src/core/**` に追加済み
* v0.2デモ用サンプルデータは `src/data/**` に追加済み
* v0.2 CLI demo は `src/demo/**` に追加済み
* `pnpm demo` は成功
* `pnpm test` は成功
* `pnpm typecheck` は成功
* GitHub Actions CI は成功
* 現時点では UI、DB、API Route、外部LLM、外部価格API、スクレイピングは未実装

今回の目的:

Coreが出した推薦結果をもとに、外部LLMを使わずに説明文を生成するルールベース説明機能を追加してください。

今回のゴール:

`RecommendationResult` の `scoreBreakdown`、`rawDecision`、`finalDecision`、`demotions` をもとに、ユーザーが「なぜこの判定になったのか」を読める日本語説明文を生成できるようにすることです。

重要:

今回はGemini APIを使わないでください。
今回はOpenAI APIを使わないでください。
今回は外部LLMを使ったAI説明生成を入れないでください。
今回はルールベースの説明文生成のみを実装してください。
今回は外部APIを使わないでください。
今回はCLIの表示にはまだ組み込まないでください。
今回はCoreのscore、Decision、Demotionを変更しないでください。

実装するもの:

* ルールベース説明文生成関数
* 説明文生成用の型
* 説明文生成のテスト
* このPromptを `docs/agent-prompts/v0.2/05-rule-based-explanation.md` として保存

作成・編集してよいファイル:

* `src/explanation/types.ts`
* `src/explanation/createRuleBasedExplanation.ts`
* `src/explanation/index.ts`
* `src/explanation/__tests__/createRuleBasedExplanation.test.ts`
* `docs/agent-prompts/v0.2/05-rule-based-explanation.md`

編集してはいけないファイル:

* `src/domain/recommendation/**`
* `src/domain/recommendation/__fixtures__/**`
* `src/domain/recommendation/__tests__/**`
* `src/core/recommendSneakers.ts`
* `src/core/types.ts`
* `src/core/__tests__/recommendSneakers.test.ts`
* `src/data/**`
* `src/demo/**`
* `README.md`
* `package.json`
* `pnpm-lock.yaml`
* `.github/**`

説明文生成の方針:

* 入力は `RecommendationResult` を基本にする
* 必要なら `sneakerId` や `name` も説明文に含める
* `finalScore`、`rawDecision`、`finalDecision`、`demotions` を参照する
* Coreのスコアや判定を変更しない
* 新しい事実を作らない
* 実在価格、在庫、プレ値、真贋を断言しない
* 「絶対に買うべき」と断定しない
* 説明文は日本語で生成する
* 関数はテスト可能な純粋関数にする
* 同じ入力に対して同じ説明文を返す
* ランダム表現、現在時刻、外部状態に依存しない

想定する関数:

```ts
createRuleBasedExplanation(result: RecommendationResult): RuleBasedExplanation
```

想定する戻り値:

```ts
type RuleBasedExplanation = {
  sneakerId: string;
  name: string;
  summary: string;
  reasons: string[];
  cautions: string[];
};
```

説明文の例:

```txt
この候補は総合スコアが高く、現在の好みとの相性が比較的良いため、BUY判定になりました。
一方で、所有靴との被りや一部の評価軸には注意が必要です。
```

ただし、実際の文言は既存の `Decision`、`Demotion`、`ScoreBreakdown` の型に合わせて実装してください。

テスト要件:

`src/explanation/__tests__/createRuleBasedExplanation.test.ts` に以下を含めてください。

1. `RecommendationResult` から説明文を生成できる
2. `sneakerId` と `name` が戻り値に含まれる
3. `summary` が空文字ではない
4. `reasons` が1件以上生成される
5. demotionsがある場合、注意点または理由に反映される
6. demotionsがない場合も説明文が壊れない
7. `BUY` / `WAIT` / `SKIP` の判定ごとに説明文が生成できる
8. 入力された `RecommendationResult` を変更しない
9. 実在価格、在庫、プレ値、真贋を断言する文言を含めない
10. 同じ入力に対して同じ説明文が返る

禁止事項:

* Gemini APIを入れない
* OpenAI APIを入れない
* 外部LLMを使わない
* 外部APIを入れない
* DBを作らない
* API Routeを作らない
* Web UIを作らない
* CLIに組み込まない
* package.jsonを変更しない
* pnpm-lock.yamlを変更しない
* README.mdを変更しない
* Coreの計算式を変更しない
* `recommendSneakers()` の仕様を変更しない
* 既存fixtureの期待値を変更しない
* サンプルデータを変更しない
* テストが落ちた場合に既存期待値を変更して解決しない

実行すべきコマンド:

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

期待する結果:

* 既存テストがすべて成功する
* 新しく追加した説明文生成テストが成功する
* typecheckが成功する
* 既存Golden Testが壊れていない
* 既存fixtureや期待値に変更がない
* `src/domain/**`, `src/core/**`, `src/data/**`, `src/demo/**` に変更がない
* README.md、package.json、pnpm-lock.yaml、`.github/**` に変更がない
* 変更範囲が `src/explanation/**` と `docs/agent-prompts/v0.2/05-rule-based-explanation.md` に限定されている

commit message案:

```txt
feat: add rule-based recommendation explanation
```

完了後に報告すること:

* 追加・変更したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、Geminiを入れる前に、AIなしでも説明文を生成できる安全なfallbackを作ることです。
