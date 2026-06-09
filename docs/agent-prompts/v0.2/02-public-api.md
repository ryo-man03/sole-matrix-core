# v0.2 Prompt 02: Public Core API

あなたは、TypeScript個人開発プロジェクトのテックリード兼実装者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core v0.1の推薦ロジック、ScoreBreakdown、Decision、Demotion、Snapshot、Golden Testは実装済み
* `pnpm test` は成功
* `pnpm typecheck` は成功
* GitHub Actions CI は成功
* v0.2開発計画は `docs/v0.2-development-plan.md` に追加済み
* 現時点では UI、CLI、DB、API Route、AI、外部価格API、スクレイピングは未実装

今回の目的:

Core v0.1の既存ロジックを壊さずに、v0.2以降で安全に呼び出すための公開APIを追加してください。

今回のゴールは、CLIやWeb UIの前に、Coreを外側から呼び出すための安定した入口を作ることです。

実装するもの:

* `recommendSneakers(input)` を追加する
* `recommendSneakers(input)` は複数の候補スニーカーを受け取り、推薦結果配列を返す
* 既存のBalancedScore、Decision、Demotion、Snapshot関連処理を内部で利用する
* UIやCLIが `src/domain/recommendation/**` の細かい関数へ直接依存しなくてよい形にする
* 既存Golden Testの期待値は一切変更しない
* 新しい公開API用のテストを追加する
* 必要に応じて、このPromptを `docs/agent-prompts/v0.2/02-public-api.md` として保存する

作成・編集してよいファイル:

* `src/core/index.ts`
* `src/core/recommendSneakers.ts`
* `src/core/types.ts`
* `src/core/__tests__/recommendSneakers.test.ts`
* `docs/agent-prompts/v0.2/02-public-api.md`

編集してはいけないファイル:

* `src/domain/recommendation/balancedScore.ts`
* `src/domain/recommendation/decision.ts`
* `src/domain/recommendation/demotion.ts`
* `src/domain/recommendation/snapshot.ts`
* `src/domain/recommendation/__fixtures__/**`
* `src/domain/recommendation/__tests__/balancedScore.golden.test.ts`
* `src/domain/recommendation/__tests__/decision.test.ts`
* `src/domain/recommendation/__tests__/demotion.test.ts`
* `README.md`
* `package.json`
* `pnpm-lock.yaml`
* `.github/**`

公開APIの仕様:

`recommendSneakers(input)` は以下のような入力を受け取ること。

```ts
type RecommendSneakersInput = {
  preferenceProfile: PreferenceProfile;
  candidates: SneakerVector[];
  ownedSneakers?: OwnedSneaker[];
};
```

戻り値は、候補ごとの推薦結果配列にすること。

```ts
type RecommendationResult = {
  sneakerId: string;
  name: string;
  inputIndex: number;
  scoreBreakdown: ScoreBreakdown;
  rawDecision: Decision;
  finalDecision: Decision;
  demotions: Demotion[];
};
```

注意:

* `RecommendationResult` に `snapshot` を直接含めるかどうかは、既存の `snapshot.ts` の設計を読んだ上で判断すること
* Snapshotの既存設計を変える必要がある場合は、今回は変更せず、コメントまたはTODOとして残すこと
* 新しい型は、既存domain型を再定義せず、可能な限りimportして使うこと
* 同じ意味の型を二重定義しないこと

並び順:

* `scoreBreakdown.finalScore` の高い順に並べる
* 同点の場合は入力順を維持する
* 入力順維持のため、内部で `inputIndex` を保持すること

禁止事項:

* UIを作らない
* CLIを作らない
* DBを作らない
* API Routeを作らない
* OpenAI APIを入れない
* 外部価格APIを入れない
* スクレイピングを提案しない
* 既存fixtureの期待値を変更しない
* テストが落ちた場合に期待値を変更して解決しない
* finalScore、Decision、Demotion、Snapshotの既存仕様を変更しない
* Core内部のスコアや判定を再計算・改変しない
* README.mdを変更しない
* package.jsonを変更しない

テスト要件:

`src/core/__tests__/recommendSneakers.test.ts` に以下を含めること。

1. 複数候補を受け取って推薦結果配列を返す
2. finalScoreの高い順に並ぶ
3. 同点の場合は入力順を維持する
4. 各結果に sneakerId / name / inputIndex / scoreBreakdown / rawDecision / finalDecision / demotions が含まれる
5. 既存fixtureやexpected値を変更しない

実行すべきコマンド:

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short
```

期待する結果:

* 既存テストがすべて成功する
* 新しく追加した公開APIテストが成功する
* typecheckが成功する
* 既存Golden Testが壊れていない
* 既存fixtureや期待値に変更がない
* README.md、package.json、pnpm-lock.yaml、`.github/**` に変更がない

commit message案:

```txt
feat: expose stable core recommendation API
```

完了後に報告すること:

* 追加・変更したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* 次に実装すべきPrompt番号

今回の目的は、機能を増やすことではなく、Coreの呼び出し口を安定させることです。
