# Ryo recommendation coherence audit

## Scope and baseline

- Base: PR #26 head `bc48de3f35bc99ccfcf58a13791269b2cc3126ef`
- Branch: `fix/ryo-recommendation-coherence-v1`
- Baseline: 99 files / 763 tests, typecheck success, 22 routes/pages build success
- Baseline audit: critical/high/moderate 0, low 1
- External providers during QA: disabled

Audited paths:

- fallback catalog
- 53 Ryo anchor models
- parent-model metadata
- Gemini candidate normalization
- trusted candidate funnel
- Core shortlist and reranking
- Primary / Practical / Ryo / Caution display selection
- explanation generation
- result UI and local structured feedback

## Reproduction

Observed set:

- Primary: Vans Authentic
- Practical: Nike Air Force 1 Low
- Ryo: New Balance 991

VansとAF1には同じユーザーのdaily／classic文脈があったが、NB 991はrunning関心、comfort／heritage tech、suede／mesh、wide pants、second-pair purpose、premium budgetを確認せず、Ryo scoreが残候補内で相対的に高いという理由だけでRyo枠へ入れた。

## Root cause

1. `hasRyoAlternativeSignal`がsignature、material、archive、colorのどれか1つでtrueになった。
2. Ryo候補のfloorがPrimaryからの相対差であり、絶対適格条件がなかった。
3. 候補選択がブランド・parent-modelの多様性を加点し、カテゴリ移動の説明可能性を評価しなかった。
4. model familyに`core / adjacent / situational / practical / excluded`の契約がなかった。
5. category-specific gateがなく、retro runnerがrunning関心なしでも昇格できた。
6. 3候補を前提にしたUIにRyo nullの正常状態がなかった。
7. role説明がsignature bonusの汎用文で、Primary／Practicalとの差を契約化していなかった。
8. feedbackにmodel mismatchとrole mismatchの区別がなかった。

## Changed design

### Model affinity

全53 anchorをmodel family単位で分類した。分布は`core 19 / adjacent 15 / situational 12 / practical 6 / excluded 1`。未知の正規化候補は保守的にPracticalから開始する。全件表は`docs/recommendation/ryo-model-affinity-audit.md`に記録した。

### Absolute eligibility

`RyoRoleEligibility`は次を独立して返す。

- `eligible`
- `affinityTier`
- `hardFailures`
- `softWarnings`
- `positiveReasons`
- `contextMatchScore`
- `wardrobeMatchScore`
- `purposeMatchScore`
- `cultureMatchScore`
- `materialMatchScore`
- `categoryGate`

score最大だけではRyo roleにならない。budget、owned、disliked、explicit preference、score floors、wardrobe、purpose、culture／history／material、category gate、role separationをすべて通過した候補だけを比較する。

### Category gates

- retro_running: 4/6以上かつrunning関心必須
- terrace: 3/5以上かつfootball関心必須
- skate: 3/5以上かつskate関心必須
- basketball_classic: 3/5以上かつbasketball関心必須
- canvas_classic: 2/5以上
- workwear_heritage: 2/5以上

単一boolではなく、matched evidenceとmissing evidenceを保持する。

### Candidate funnel

上限は維持した。

- Discovery 24
- Normalized 20
- Verified 16
- Shortlist 8
- Display 3
- Caution 1

search slotは`hard_constraint → balanced_core → ryo_core → category_match → ryo_adjacent → practical_anchor → archive_wildcard`へ整理した。Ryo role内の探索は`core → adjacent → situational`であり、各tierで絶対適格条件を省略しない。

### Display set coherence

`RecommendationSetCoherence`は次を返す。

- narrative score
- purposeful diversity score
- role separation score
- category continuity score
- typed violations

model-family重複、forced Ryo slot、practical modelのRyo昇格、adjacent過剰昇格、説明不能なcategory jump、purpose／wardrobe／budget／ownership／disliked leakを検出する。意図的に壊したfixtureで`adjacent_overpromotion`、`unexplained_category_jump`、`duplicate_model_family`が非0になることを確認した。

### Empty Ryo state

Ryo Alternativeはnullableである。適格者がいない場合は、服装・用途・予算、owned／disliked、または一般的な絶対条件不足に対応した空状態理由を返す。UIは「Ryo枠は空欄です」として正常表示する。

### Explanation and UI

Ryo cardはtierを次の自然言語で区別する。

- Ryoの中心候補
- 条件が合ったRyo隣接候補
- 条件付きRyo候補

展開表示は、なぜRyoか、一致回答、文化・素材・服装、Primaryではない理由、Practicalではない理由、注意点を内部reason codeから表示する。

### Feedback

即時学習は行わない。端末内feedbackへ任意のstructured calibration reasonを追加した。

- model mismatch
- role mismatch
- Ryo role mismatch
- good as practical
- set incoherence
- too safe
- rare only
- wardrobe mismatch
- purpose mismatch
- owned too similar

## Deterministic evaluation

| suite | evaluations |
| --- | ---: |
| 12 archetypes × 4 purposes × 4 strengths | 192 |
| pairwise / metamorphic | 48 |
| adversarial profiles | 26 |
| total matrix evaluations | 266 |
| direct role-policy / NB / broken-fixture tests | 10 |

Archetypes: amekaji denim、military workwear、UK terrace、skate、minimal monotone、retro running、basketball street、comfort first、first-pair safe、second-pair expressive、archive collector、mixed neutral。

## NB 991 cases

| case | result |
| --- | --- |
| A: running low / amekaji / first pair | Ryo不適格。retro-running gate fail |
| B: running high / comfort・heritage tech / suede・mesh / wide denim / second pair / budget sufficient | adjacent Ryo適格 |
| C: running high / budget insufficient | Ryo不適格。budget violation |
| D: running high / NB 991 owned | 表示不可。owned duplicate |
| E: running high / NB 991 disliked | 表示不可。disliked model |

## Violation results

266件の正常matrixでは次を0として検証する。broken fixtureでは対応detectorが非0になる。

| metric | result |
| --- | ---: |
| roleMismatchCount | 0 |
| forcedSlotCount | 0 |
| unexplainedCategoryJumpCount | 0 |
| duplicateNarrativeCount | 0 |
| duplicateModelFamilyCount | 0 |
| safeCandidateDominanceCount | 0 |
| rareOnlyBiasCount | 0 |
| practicalModelInRyoRoleCount | 0 |
| adjacentOverpromotionCount | 0 |
| purposeMismatchCount | 0 |
| wardrobeMismatchCount | 0 |
| budgetViolationCount | 0 |
| ownershipDuplicateCount | 0 |
| dislikedLeakCount | 0 |
| explanationRoleMismatchCount | 0 |
| modeSensitivityFailureCount | 0 |
| modeOverreactionCount | 0 |

## Browser QA

Production buildを`EXTERNAL_PROVIDERS_DISABLED=true`で起動し、実ブラウザから確認した。

- 代表10プロファイルすべてで11問回答、回答確認、推薦完了まで到達
- 購入目的はfirst pair、daily add、second pair、archiveを横断
- archiveプロファイルで「Ryoの中心候補」を表示
- 適格候補がないプロファイルでは「Ryo枠は空欄です」を正常表示
- Primary、現実的な別案、Ryo、下げた候補の4役割を同一結果で確認
- structured reason、コメント、評価の端末内保存を確認
- 回答編集からRyo strengthを変更し、回答サマリーへの反映を確認
- 診断の最初からやり直し、ブラウザの戻る、進む、再読込を確認
- 320 / 360 / 390 / 430 / 600 / 768 / 1024 / 1280 / 1440 / 1920pxで横方向overflow 0
- 10プロファイルすべてでconsole error 0、warning 0、hydration warning 0
- viewport overrideは検証後にreset済み

## Known limitations

- 11問には独立したcomfort-priority質問がない。running、heritage-tech許容、用途を複数根拠として使い、単一proxyによる昇格はしない。
- 価格はanchorの参考帯でありlive availabilityを保証しない。
- 未知のGemini model familyは自動でRyo昇格せず、Practicalから保守的に評価する。
- live provider、scraping、private endpoint、credential利用は今回のscope外であり、QAでは無効化する。
