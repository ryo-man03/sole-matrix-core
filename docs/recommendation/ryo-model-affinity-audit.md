# Ryo model affinity audit

## Scope

対象はRyo anchor catalog 53モデル、fallback catalog、Gemini正規化候補、parent-model metadataである。すべて同じ`getRyoModelAffinityProfile`へ通し、ブランドではなくモデルファミリーで分類する。未知のGemini候補もtagsとmodel typeから保守的に`practical`へ分類され、絶対適格条件を通らない限りRyo枠へ入らない。

## Distribution

| tier | models |
| --- | ---: |
| core | 19 |
| adjacent | 15 |
| situational | 12 |
| practical | 6 |
| excluded | 1 |
| total | 53 |

| category | models |
| --- | ---: |
| retro_running | 14 |
| canvas_classic | 11 |
| basketball_classic | 12 |
| practical_classic | 3 |
| skate | 4 |
| terrace | 5 |
| technical_running | 4 |
| total | 53 |

## Per-model classification

| model | affinityTier | category | budgetBand | role summary |
| --- | --- | --- | --- | --- |
| Nike Air Force 1 Low White/White | adjacent | basketball_classic | standard | basketball、leather、pantsの追加根拠が必要 |
| Converse Jack Purcell Leather Black | core | canvas_classic | standard | quiet classicと革の履き込み |
| Converse One Star J VTG Black | core | canvas_classic | premium | 一つ星、スエード、古着・デニム |
| PUMA Suede Black/White | core | basketball_classic | value | basketball／streetとスエード |
| PUMA Clyde Black/White | core | basketball_classic | value | basketball／streetとスエード |
| adidas Superstar Vintage | situational | basketball_classic | standard | basketball、shell toe、leather条件付き |
| Converse Pro Leather | situational | basketball_classic | standard | basketball、leather、pants条件付き |
| Nike Air Jordan 1 Low Black/White | situational | basketball_classic | standard | basketballとlow leather条件付き |
| Nike Air Jordan 1 High Black/White | situational | basketball_classic | premium | basketball、volume、leather条件付き |
| Nike Terminator Low Black/White | situational | basketball_classic | standard | college basketballとleather条件付き |
| Nike Terminator High Black/White | situational | basketball_classic | standard | high cut、basketball、workwear条件付き |
| Converse All Star Hi Black | practical | practical_classic | value | 現行定番として実用評価 |
| Vans Half Cab Black | situational | skate | value | skate、work pants、suede条件付き |
| adidas Bern GORE-TEX | situational | terrace | standard | terraceとutility material条件付き |
| New Balance 993 | adjacent | retro_running | premium | heritage runningの強い文脈が必要 |
| Reebok Classic Leather | adjacent | retro_running | value | 80s runner、leather、用途条件が必要 |
| Nike Blazer Mid '77 | situational | basketball_classic | value | basketball、leather、mid cut条件付き |
| Converse Weapon | situational | basketball_classic | standard | basketball、leather、volume条件付き |
| Vans Authentic Black/White | core | skate | value | skate、canvas aging、denim |
| Last Resort AB VM001 Black/White | situational | skate | value | independent skate、suede条件付き |
| Converse One Star J | core | canvas_classic | standard | 一つ星、suede、denim |
| Converse One Star Leather | core | canvas_classic | standard | 一つ星、leather、denim |
| Converse One Star Suede | core | canvas_classic | standard | 一つ星、suede aging |
| Converse All Star J Hi | core | canvas_classic | value | J、high cut、canvas aging |
| Converse All Star J VTG Hi | core | canvas_classic | standard | VTG、high cut、canvas aging |
| Converse All Star J VTG 59 Hi TimeLine | core | canvas_classic | premium |復刻背景、high cut、canvas aging |
| Converse Addict Chuck Taylor Hi | core | canvas_classic | premium | 上位仕様、high cut、長期使用 |
| Converse Jack Purcell CL | core | canvas_classic | value | quiet classic、canvas、daily use |
| Converse Jack Purcell 1935 | core | canvas_classic | standard | archive thought、quiet classic |
| Nike Cortez | adjacent | retro_running | value | 70s runningと薄いshape条件付き |
| Nike Cortez Leather | adjacent | retro_running | value | 70s running、leather、slim pants条件付き |
| Nike LD-1000 | adjacent | retro_running | standard | 70s running、suede条件付き |
| Nike Astro Grabber | adjacent | retro_running | premium | archive runningと予算条件付き |
| adidas SL 72 | adjacent | retro_running | value | nylon／suede running条件付き |
| adidas Country OG | adjacent | retro_running | standard | archive runningとslim wardrobe条件付き |
| adidas Japan | adjacent | retro_running | standard | archive trainingとleather条件付き |
| adidas Tobacco | core | terrace | standard | terrace、suede、straight pants |
| adidas London | core | terrace | standard | City Series、UK casual |
| adidas Hamburg | core | terrace | standard | City Series、suede、gum sole |
| adidas Handball Spezial | core | terrace | standard | terrace、handball background、suede |
| Vans Era 95 | core | skate | value | skate／punk／DIYとcanvas aging |
| New Balance 990v3 | adjacent | retro_running | premium | running、comfort、suede／mesh、budgetが必要 |
| New Balance 990v4 | adjacent | retro_running | premium | running、comfort、suede／mesh、budgetが必要 |
| New Balance 991 | adjacent | retro_running | premium | running、comfort、suede／mesh、pants、purpose、budgetが必要 |
| New Balance 998 | adjacent | retro_running | premium | running、90s context、suede／mesh、budgetが必要 |
| New Balance 1500 | adjacent | retro_running | premium | running、slim wardrobe、suede／mesh、budgetが必要 |
| New Balance 2002R | practical | technical_running | standard | comfort中心の実用候補 |
| New Balance 2010 | practical | technical_running | standard | modern volumeとcomfort中心の実用候補 |
| New Balance 1906 | excluded | technical_running | standard | 現行Ryo枠から除外。実用評価は別 |
| Nike Air Max 95 | practical | technical_running | standard | technical／streetの実用候補 |
| Reebok Classic Nylon | practical | practical_classic | value | 日常価格とcomfort中心 |
| Reebok Club C | practical | practical_classic | value | classic tennisの日常候補 |
| PRO-Keds Royal Plus | situational | basketball_classic | value | old basketball、NY culture条件付き |

## Metadata contract

各行は実装上、以下を持つ。値はモデル名の未確認事実を推測せず、model familyとcategoryの確認済み内部知識から構成する。

- `affinityTier`
- `historicalContext`
- `culturalContexts`
- `materialCharacter`
- `agingPotential`
- `wardrobeMatches`
- `purposeMatches`
- `category`
- `comfortProfile`
- `silhouetteProfile`
- `budgetBand`
- `reasonForTier`
- `disqualifyingConditions`
- `promotionConditions`

## Curated seed and fallback coverage

49件の`curatedRecommendationModels`もrawNameのまま同じfamily policyへ通す。重複colorwayをanchor分布へ二重計上しない。seed内の分布は`core 13 / adjacent 12 / situational 10 / practical 14 / excluded 0`である。collaboration、release watch、珍色という情報だけの昇格は行わず、One Star、All Star J、Authentic、PUMA Suede／Clyde／Brasil、NB heritage codeなど、モデルファミリーを特定できた場合だけ対応tierを使う。

fallback catalog 10件は次のとおり。

| fallback model | tier |
| --- | --- |
| adidas Samba OG | situational |
| New Balance 991 | adjacent |
| Nike Air Jordan 1 High | situational |
| PUMA Suede | core |
| Vans Era | core |
| Converse Jack Purcell | core |
| New Balance 2002R | practical |
| ASICS GEL-KAYANO 14 | excluded |
| Nike Air Force 1 Low | adjacent |
| Converse All Star / Chuck Taylor | practical |

Gemini正規化候補は、model familyが上表またはanchor familyへ一致すれば同じtierを使う。不明な場合は`practical`とし、verified候補であってもRyoへ自動昇格しない。

## Known limitations

- 価格はanchorの参考帯であり、在庫や実売価格を保証しない。
- fallback／Gemini候補のcolorway、素材、生産国はverified evidenceがない限り説明へ出さない。
- 11問には独立した「comfort priority」質問がないため、running関心、heritage-tech許容、用途を組み合わせて判定する。単独のproxyでは昇格しない。
- `New Balance 1906`のexcludedはRyo role限定であり、商品自体を否定せずPractical表示を妨げない。
