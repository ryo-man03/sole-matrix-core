# Ryo recommendation role policy

## Ryoの定義

Ryo Modeは、古いスポーツシューズを歴史・開発目的・素材・文化・服装との関係ごと理解し、実際に履き込んで自分のものへ育てる選び方である。高価、希少、日本製、海外製、限定、廃番という属性だけではRyo適格にならない。

## roleとscoreの違い

`ryoIdentityScore`は候補の比較材料であり、Ryo Alternativeの入場券ではない。推薦処理は次の順序で行う。

1. 予算、嫌い、所有重複、明示回答の矛盾を検査する。
2. モデルファミリーの`affinityTier`を取得する。
3. カテゴリ固有ゲートを複数根拠で評価する。
4. wardrobe、purpose、culture、material、総合scoreの絶対基準を検査する。
5. Primary、Practicalとのモデルファミリーと役割の重複を検査する。
6. 適格者だけを`core → adjacent → situational`の順で比較する。
7. 適格者がいなければRyo枠を空にする。

## affinity tier

| tier | 役割 |
| --- | --- |
| `core` | Ryoの中心になりやすいが、服装・用途・素材・カテゴリゲートは省略しない |
| `adjacent` | 高いcontext match、明示カテゴリ関心、wardrobe、purposeが揃う場合だけ昇格 |
| `situational` | 複数の強いカテゴリ根拠がある場合だけ昇格。Ryo Strongだけでは昇格しない |
| `practical` | 原則として実用候補。Ryo枠へ入れない |
| `excluded` | Ryo枠へ入れない |

## 絶対適格条件

Ryo Alternativeは次をすべて満たす。

- hard failureが0
- disliked modelでない
- owned duplicateでない
- 確認できる価格が予算内
- `finalRecommendationScore`、`userFitScore`、`ryoIdentityScore`が各floor以上
- wardrobe matchがfloor以上
- purpose matchがfloor以上
- culture、history、materialの根拠が1つ以上
- category gateがtier別基準を通過
- PrimaryおよびPracticalとモデルファミリーが重複しない
- 内部reason codeから役割説明を生成できる

数値floorは現行スコア分布に合わせて`role-policy.ts`へ集約し、カテゴリゲートやhard failureを置き換える相対閾値として使わない。

## category gates

| category | 必要な複数根拠 |
| --- | --- |
| `retro_running` | running関心、heritage tech／comfort、suede／mesh、wide denim／work pants、daily rotation／second pair、予算のうち4つ以上。running関心は必須 |
| `terrace` | football、UK casual相当、slim／straight pants、suede、low profileのうち3つ以上。football関心は必須 |
| `skate` | skate、street／amekaji、wide／work／denim、canvas／suede aging、low techのうち3つ以上。skate関心は必須 |
| `basketball_classic` | basketball history、street／amekaji、leather／suede、volumeを受けるpants、予算のうち3つ以上。basketball関心は必須 |
| `canvas_classic` | canvas aging、amekaji／normcore、denim／work／straight、low tech、classic shapeのうち2つ以上 |
| `workwear_heritage` | leather／suede aging、denim／work、amekaji、long-use／archive、予算のうち2つ以上 |

## New Balance heritage runner

991、998、1500、990v3、990v4、993などをブランド単位で除外しない。これらは`adjacent / retro_running`であり、次が揃う場合はRyo Alternativeになり得る。

- running関心
- heritage technologyまたは履き心地への関心
- suede／mesh
- wide denim、work pants
- daily rotationまたはsecond pair
- 十分な予算

関心が弱い場合はPractical、Adjacent Discovery、Cautionとして扱い、相対score最大だけでRyoへ昇格させない。2002Rや2010は主にPractical、1906は現行ポリシーではRyo excludedである。これはNew Balance全体の除外ではなく、モデルファミリーと文脈の区別である。

## Ryo不在状態

Ryo Alternativeはnullableである。候補が不適格な場合は次のいずれかを表示する。

- 「今回の条件では、Ryo枠として十分に説明できる別候補は見つかりませんでした。」
- 「候補はありましたが、今回の服装・用途・予算を同時に満たすRyo枠はありませんでした。」
- 「所有済み・避けたいモデルを除くと、Ryo枠として十分に説明できる別候補はありませんでした。」

空状態は推薦失敗ではない。説明できない候補を表示しない正常状態である。

## 説明生成規則

Ryo Alternativeの表示は`RyoRoleEligibility`のreason codeから生成し、次を含める。

- なぜRyo枠なのか
- 一致した回答
- 文化・素材・服装の根拠
- Primaryではない理由
- Practicalではない理由
- 注意点
- affinity tier
- eligibility結果

未確認の素材、生産国、限定性、希少性を生成しない。「Ryoらしい」「個性的」「珍しい」「高価」「歴史がある」だけの説明は禁止する。

## 禁止する単純化

- NBまたは特定ブランドの一律除外
- NB 991だけを対象にしたif文
- rarity、price、countryだけでの昇格
- Ryo Strongだけでのhard constraint無視
- 3枠を埋めるための強制採用
- ブランド分散またはカテゴリ分散そのものを目的にした選択
- scoreと無関係な説明テンプレート
