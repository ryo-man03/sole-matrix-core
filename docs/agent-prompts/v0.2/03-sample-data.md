# v0.2 Prompt 03: Sample Data

あなたは、TypeScript個人開発プロジェクトのテックリード兼実装者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core v0.1の推薦ロジック、ScoreBreakdown、Decision、Demotion、Snapshot、Golden Testは実装済み
* v0.2開発計画は `docs/v0.2-development-plan.md` に追加済み
* 公開API `recommendSneakers(input)` は `src/core/**` に追加済み
* `pnpm test` は成功
* `pnpm typecheck` は成功
* GitHub Actions CI は成功
* 現時点では UI、CLI、DB、API Route、AI、外部価格API、スクレイピングは未実装

今回の目的:
v0.2のCLIデモで使うための、固定サンプルスニーカーデータ、サンプルユーザープロファイル、サンプル所有靴データを追加してください。

今回のゴール:
公開API `recommendSneakers(input)` に渡せる安全な固定サンプルデータを用意することです。

重要:
今回はCLIを作らないでください。
今回はWeb UIを作らないでください。
今回はDBや外部APIを使わないでください。
今回はREADME.mdを変更しないでください。
今回はpackage.jsonを変更しないでください。
今回は既存Coreロジックを変更しないでください。

実装するもの:

* デモ用スニーカー候補データ
* デモ用ユーザープロファイル
* デモ用所有スニーカーデータ
* サンプルデータのvalidationテスト
* このPromptを `docs/agent-prompts/v0.2/03-sample-data.md` として保存

作成・編集してよいファイル:

* `src/data/sampleSneakers.ts`
* `src/data/sampleProfiles.ts`
* `src/data/sampleOwnedSneakers.ts`
* `src/data/index.ts`
* `src/data/__tests__/sampleData.test.ts`
* `docs/agent-prompts/v0.2/03-sample-data.md`

編集してはいけないファイル:

* `src/domain/recommendation/**`
* `src/domain/recommendation/__fixtures__/**`
* `src/domain/recommendation/__tests__/**`
* `src/core/recommendSneakers.ts`
* `src/core/types.ts`
* `src/core/__tests__/recommendSneakers.test.ts`
* `README.md`
* `package.json`
* `pnpm-lock.yaml`
* `.github/**`

データ方針:

* `src/data/**` はv0.2デモ専用の固定サンプルとする
* 既存Golden Test fixtureとは分離する
* 既存fixtureを変更しない
* サンプルスニーカーは10〜20件程度にする
* サンプルプロファイルは3件以上作る
* サンプル所有靴データを数件作る
* 価格、相場、在庫、プレ値、真贋は断言しない
* ブランド名やモデル名はデモ用の属性として扱う
* 実在の販売価格や在庫状況をソースなしに書かない
* 文化的背景や人気度は断言しすぎず、デモ用タグ・デモ用スコアとして扱う
* `recommendSneakers(input)` に渡せる型に合わせる
* 既存の公開API仕様にデータ側を合わせる。公開APIの仕様を変更しない

サンプルデータに含めたい方向性:

* クラシック系
* ストリート系
* スポーティー系
* シンプル系
* ボリューム感のある系
* 落ち着いた色
* 派手め
* 文化的背景があるもの

テスト要件:
`src/data/__tests__/sampleData.test.ts` に以下を含めてください。

1. サンプルスニーカーが10件以上ある
2. 各スニーカーに `sneakerId` と `name` がある
3. `sneakerId` が重複していない
4. 各スニーカーが `recommendSneakers(input)` に渡せる
5. サンプルプロファイルが3件以上ある
6. `recommendSneakers()` がサンプルデータで実行できる
7. 推薦結果が1件以上返る
8. 既存Golden Test fixtureを変更していない

禁止事項:

* CLIを作らない
* UIを作らない
* DBを作らない
* API Routeを作らない
* OpenAI APIを入れない
* 外部価格APIを入れない
* スクレイピングを提案しない
* 実在価格、在庫、プレ値、真贋を断言しない
* 既存fixtureの期待値を変更しない
* Coreの計算式を変更しない
* `recommendSneakers()` の仕様を変更しない
* README.mdを変更しない
* package.jsonを変更しない
* pnpm-lock.yamlを変更しない

実行すべきコマンド:

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

期待する結果:

* 既存テストがすべて成功する
* 新しく追加したsample data testが成功する
* typecheckが成功する
* 既存Golden Testが壊れていない
* 既存fixtureや期待値に変更がない
* README.md、package.json、pnpm-lock.yaml、`.github/**` に変更がない
* `git status --short --untracked-files=all` で変更範囲が `src/data/**` と `docs/agent-prompts/v0.2/03-sample-data.md` に限定されている

commit message案:

```txt
data: add v0.2 sample sneaker dataset
```

完了後に報告すること:

* 追加・変更したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、CLIデモの前に、Core公開APIへ渡せる安全な固定サンプルデータを整えることです。
