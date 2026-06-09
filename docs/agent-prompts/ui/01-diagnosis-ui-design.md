# UI Prompt 01: Diagnosis UI Design

あなたは、TypeScript個人開発プロジェクトのプロダクト設計者兼UI設計者です。

対象リポジトリは `SOLE//MATRIX Core v0.1` です。

現在の状態:

* Core推薦ロジックは実装済み
* 公開API `recommendSneakers(input)` は実装済み
* サンプルデータは実装済み
* CLI demoは実装済み
* ルールベース説明文生成は実装済み
* Gemini Adapterは実装済み
* 現時点ではWeb UI、DB、API Route、認証、外部価格API、スクレイピングは未実装

今回の目的:

B2Yのスニーカー診断のような軽い診断体験を参考にして、SOLE//MATRIX用の診断UI設計書を作成してください。

今回は実装しません。
今回は設計書だけを追加してください。

重要:

B2Yをそのままコピーしないでください。
採用するのは「8問程度・3択・1画面1質問・軽い回答体験」という構造だけです。

SOLE//MATRIXでは、診断回答はおすすめを直接確定するものではありません。
診断回答は `PreferenceProfile` の初期値を作る入口として扱います。
最終的な `finalScore`、`Decision`、`Demotion` はCoreが計算します。

Gemini Adapterは実装済みですが、UI-01ではGemini説明生成の画面設計は扱わないでください。
AI説明表示は別設計で扱います。

作成してよいファイル:

* `docs/ui/01_DIAGNOSIS_UI_SPEC.md`
* `docs/agent-prompts/ui/01-diagnosis-ui-design.md`

編集してはいけないファイル:

* `src/**`
* `package.json`
* `pnpm-lock.yaml`
* `README.md`
* `.github/**`
* 既存fixture
* 既存test
* 既存Coreロジック

`docs/ui/01_DIAGNOSIS_UI_SPEC.md` に含める内容:

1. 診断UIの目的
2. B2Y風診断体験から参考にする点
3. B2Yからコピーしない点
4. 画面構成
5. 8問の質問設計
6. 回答形式
7. PreferenceVector / PreferencePolicy / AxisImportance への変換方針
8. 画面遷移
9. 状態設計
10. エラー・空状態
11. アクセシビリティ方針
12. Coreとの境界
13. 実装禁止事項
14. 最終チェックリスト

診断UIの基本方針:

* 1画面1質問
* 質問数は最初は8問
* 回答は「好き / 普通 / 苦手」の3択
* YES / SOSO / NOのような表現をUIに使う場合でも、内部仕様では「好き / 普通 / 苦手」に対応させる
* 中央カード型レイアウト
* 質問番号を表示する
* 進捗を表示する
* イラスト枠を用意する
* 前の質問へ戻れる
* 未回答のまま次へ進めない
* 最後の質問で「診断結果を見る」を有効化する
* 戻ったときに前の回答を保持する
* スマホでは縦並びを優先する
* 白基調、余白多め、落ち着いたUIを想定する

質問案:

1. ハイカットよりローカットが好き？
2. ローテクな雰囲気が好き？
3. ストリートに合う靴が好き？
4. アメカジや古着に合わせたい？
5. シンプルで合わせやすい靴が好き？
6. 通学や普段使いで履きやすさを重視する？
7. 長く履ける・劣化しにくいことを重視する？
8. ゴツめ・ボリューム感のある靴が好き？

各質問について必ず書くこと:

* 質問番号
* 質問文
* ユーザーに聞きたい意味
* UI上の補足文
* 回答形式
* 影響するPreferenceVectorの軸
* 影響するPreferencePolicyの軸
* 影響するAxisImportance
* 注意点

質問設計で特に注意すること:

* Q1「ローカット」はvolumeを直接測る質問ではない

  * 主にstyleFitに影響する
  * volumeには軽く影響する程度にする
* Q2「ローテク」はsimplicity中心

  * cultureに影響させる場合は副次的に扱う
  * ローテク好き = 文化背景重視、と決めつけない
* 「ローテク」「アメカジ」「古着」「ストリート」「ゴツめ」は人によって理解が違うため、UI上に短い補足文を入れる
* 性別を固定するような質問は避ける
* 価格、在庫、プレ値、真贋は診断UIでは扱わない
* 診断だけでBUY / WAIT / SKIPを決めない
* GeminiやAIに判定を作らせない
* Candidate Sneaker Checkはこの設計書では扱わない
* スニーカー名、タグ、金額から診断する画面はUI-02で別設計にする

回答値の考え方:

* 好き = その方向を少し強める
* 普通 = 大きく変えない
* 苦手 = その方向を少し弱める

ただし、1問だけでPreferenceProfileが極端に変わらないようにする。
1問あたりの更新幅は控えめにする。
最終的にはCore側の推薦ロジックに渡すための初期値として扱う。

アクセシビリティ方針:

* 回答ボタンはスマホで押しやすい大きさにする
* 選択状態は色だけでなく、枠・文字・ラベルでも分かるようにする
* 無効ボタンは見た目だけでなくdisabled状態にする
* Question番号だけに頼らず、現在の進捗をテキストでも表示する
* 「好き / 普通 / 苦手」はスクリーンリーダーでも意味が通る文言にする
* キーボード操作でも回答できる設計にする

Coreとの境界:

UIが行ってよいこと:

* 回答を保持する
* 回答をPreferenceProfile初期値へ変換するための仕様を定義する
* Coreへ渡す入力の形を整理する
* Coreの出力を表示するための前提を整理する

UIが行ってはいけないこと:

* finalScoreを再計算する
* Decisionを変更する
* Demotionを隠す
* Geminiの文章を理由に判定を変える
* 価格、在庫、真贋、プレ値を断言する
* 診断結果だけでおすすめを確定する

`docs/agent-prompts/ui/01-diagnosis-ui-design.md` には、このPromptの内容を保存してください。

実行すべきコマンド:

```bash
pnpm test
pnpm typecheck
git diff --stat
git status --short --untracked-files=all
```

期待する結果:

* 既存テストがすべて成功する
* typecheckが成功する
* 変更範囲が `docs/ui/**` と `docs/agent-prompts/ui/**` のみ
* `src/**` に変更がない
* `package.json` に変更がない
* `pnpm-lock.yaml` に変更がない
* `README.md` に変更がない
* `.github/**` に変更がない

commit message案:

```txt
docs: add B2Y-style diagnosis UI design spec
```

完了後に報告すること:

* 追加したファイル一覧
* 変更していないことを確認した範囲
* `pnpm test` の結果
* `pnpm typecheck` の結果
* `git diff --stat` の結果
* `git status --short --untracked-files=all` の結果
* 次に実装すべきPrompt番号

今回の目的は、Web UI実装ではなく、B2Y風の軽い診断体験をSOLE//MATRIXの設計に落とし込むことです。
実装はまだ行わず、docsだけで設計を固定してください。
