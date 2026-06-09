# Prompt 04: CLI Demo

あなたは、TypeScript個人開発プロジェクトのテックリード兼実装者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core v0.1の推薦ロジック、ScoreBreakdown、Decision、Demotion、Golden Testは実装済み
* v0.2開発計画は `docs/v0.2-development-plan.md` に追加済み
* 公開API `recommendSneakers(input)` は `src/core/**` に追加済み
* v0.2デモ用サンプルデータは `src/data/**` に追加済み
* `pnpm test` は成功
* `pnpm typecheck` は成功
* GitHub Actions CI は成功
* 現時点では UI、DB、API Route、AI、外部価格API、スクレイピングは未実装

今回の目的:
v0.2の最小デモとして、固定サンプルデータを使って推薦結果を確認できるCLIデモを追加してください。

今回のゴール:
`pnpm demo` を実行すると、`src/data/**` のサンプルデータを使って `recommendSneakers(input)` が呼び出され、推薦結果がターミナルに読みやすく表示される状態にすることです。

重要:
今回はWeb UIを作らないでください。
今回はDBを作らないでください。
今回はAPI Routeを作らないでください。
今回はOpenAI APIを使わないでください。
今回は外部価格APIを使わないでください。
今回はスクレイピングを提案しないでください。
今回はCoreの計算式や既存fixtureを変更しないでください。

最初に確認すること:

* `package.json` に `tsx` が既に依存関係として存在するか確認してください。
* `tsx` が既に使える場合のみ、`scripts.demo` を追加してください。
* `tsx` が存在しない場合は、依存関係を追加せず、作業を中断して「tsxが未導入のため、依存追加なしではdemo scriptを追加できない」と報告してください。
* 今回は依存関係を追加しないでください。
* `pnpm-lock.yaml` を変更しないでください。

実装するもの:

* CLIデモ実行ファイル
* 推薦結果を読みやすく整形するformatter
* CLIデモのテスト
* `package.json` に `demo` scriptを追加
* このPromptを `docs/agent-prompts/v0.2/04-cli-demo.md` として保存

作成・編集してよいファイル:

* `src/demo/runRecommendationDemo.ts`
* `src/demo/formatRecommendationResult.ts`
* `src/demo/__tests__/formatRecommendationResult.test.ts`
* `docs/agent-prompts/v0.2/04-cli-demo.md`
* `package.json`

編集してはいけないファイル:

* `src/domain/recommendation/**`
* `src/domain/recommendation/__fixtures__/**`
* `src/domain/recommendation/__tests__/**`
* `src/core/recommendSneakers.ts`
* `src/core/types.ts`
* `src/core/__tests__/recommendSneakers.test.ts`
* `src/data/**`
* `README.md`
* `pnpm-lock.yaml`
* `.github/**`

`package.json` の変更ルール:

* 変更してよいのは `scripts` への `demo` 追加だけ
* 依存関係を追加しない
* devDependenciesを変更しない
* pnpm-lock.yamlを変更しない
* 既存の `test`, `test:watch`, `typecheck` scriptを変更しない

想定するscript:

```json
{
  "scripts": {
    "demo": "tsx src/demo/runRecommendationDemo.ts"
  }
}
```

ただし、既存scriptsを消さずに `demo` だけ追加してください。

CLIデモの仕様:

* `sampleProfiles` から代表プロファイルを1つ選ぶ
* `sampleSneakers` を候補として使う
* `sampleOwnedSneakers` を所有靴として使う
* `recommendSneakers(input)` を呼ぶ
* 上位5件程度を表示する
* 表示内容には最低限以下を含める

  * 順位
  * sneakerId
  * name
  * finalScore
  * rawDecision
  * finalDecision
  * demotionsの有無
* 実在価格、在庫、プレ値、真贋を断言しない
* 表示は日本語でよい
* 失敗時は例外を握りつぶさず、エラーとして分かるようにする

formatterの仕様:

* `formatRecommendationResult(result, rank)` のように、1件の推薦結果を文字列化する関数を作る
* `formatRecommendationResults(results)` のように、複数件をまとめて文字列化する関数を作ってもよい
* Coreのscoreやdecisionを変更しない
* 表示整形だけを行う
* formatterはテスト可能な純粋関数にする

テスト要件:
`src/demo/__tests__/formatRecommendationResult.test.ts` に以下を含めること。

1. 推薦結果1件を文字列化できる
2. rank / sneakerId / name / finalScore / finalDecision が含まれる
3. demotionsがある場合に表示される
4. demotionsがない場合も表示が壊れない
5. formatterがscoreやdecisionを変更しない

実行すべきコマンド:

```bash
pnpm demo
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

期待する結果:

* `pnpm demo` で推薦結果が表示される
* 既存テストがすべて成功する
* 新しく追加したformatter testが成功する
* typecheckが成功する
* 既存Golden Testが壊れていない
* 既存fixtureや期待値に変更がない
* `src/domain/**`, `src/core/**`, `src/data/**` に変更がない
* README.md、pnpm-lock.yaml、`.github/**` に変更がない
* package.jsonは `scripts.demo` 追加のみ

禁止事項:

* Web UIを作らない
* DBを作らない
* API Routeを作らない
* OpenAI APIを入れない
* 外部価格APIを入れない
* スクレイピングを提案しない
* 実在価格、在庫、プレ値、真贋を断言しない
* 既存fixtureの期待値を変更しない
* Coreの計算式を変更しない
* `recommendSneakers()` の仕様を変更しない
* サンプルデータを変更しない
* README.mdを変更しない
* pnpm-lock.yamlを変更しない
* 依存関係を追加しない

commit message案:

```txt
feat: add v0.2 CLI recommendation demo
```

完了後に報告すること:

* 追加・変更したファイル一覧
* package.jsonの変更内容
* 変更していないことを確認した範囲
* `pnpm demo` の出力概要
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、v0.2で初めて「人間が推薦結果を確認できる最小デモ」を作ることです。

Prompt 04が終わったら、すぐcommitせずに変更ファイル一覧と `pnpm demo` の出力を貼ってください。
