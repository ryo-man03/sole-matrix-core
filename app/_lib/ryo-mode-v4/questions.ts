import type { RyoModeQuestion } from "./types";

export const RYO_MODE_V4_QUESTIONS = [
  {
    id: "style",
    title: "今日の服装・気分はどれに近い？",
    options: [
      { id: "amekaji", label: "アメカジ・古着" },
      { id: "normcore", label: "ノームコア・シンプル" },
      { id: "street", label: "ストリート" },
      { id: "clean_casual", label: "きれいめカジュアル" },
      { id: "undecided", label: "まだ決めていない" },
    ],
  },
  {
    id: "pantsFit",
    title: "合わせたいパンツは？",
    options: [
      { id: "wide_pants", label: "太めパンツ" },
      { id: "straight_pants", label: "ストレートパンツ" },
      { id: "denim", label: "デニム" },
      { id: "work_pants", label: "ワークパンツ" },
      { id: "slim_pants", label: "細め・すっきりしたパンツ" },
      { id: "undecided", label: "まだ決めていない" },
    ],
  },
  {
    id: "taste",
    title: "好きな雰囲気は？",
    options: [
      { id: "classic", label: "昔ながらのクラシック" },
      { id: "simple", label: "クセが少ないシンプル" },
      { id: "muted_color", label: "渋い色・落ち着いた色" },
      { id: "rare_color", label: "珍しい色・遊び心のある配色" },
      { id: "limited_collab", label: "コラボ・限定感" },
    ],
  },
  {
    id: "sportOrigin",
    title: "好きなスポーツ、またはやっていたスポーツは？",
    options: [
      { id: "basketball", label: "バスケットボール" },
      { id: "tennis", label: "テニス" },
      { id: "football", label: "サッカー・フットサル" },
      { id: "skate", label: "スケートボード" },
      { id: "running", label: "ランニング・陸上" },
      { id: "no_sport", label: "特になし／見た目で選びたい" },
    ],
  },
  {
    id: "cut",
    title: "カットの好みは？",
    options: [
      { id: "high", label: "Highが好き" },
      { id: "low", label: "Lowが好き" },
      { id: "ox", label: "OXが好き" },
      { id: "mid", label: "Midもあり" },
      { id: "depends_on_model", label: "モデルによって変わる" },
    ],
  },
  {
    id: "wearingStyle",
    title: "履き方の好みは？",
    options: [
      { id: "tied_silhouette", label: "紐をしっかり締めてシルエットを出したい" },
      { id: "loose_fit", label: "ゆるく履きたい" },
      { id: "slim_look", label: "細身に見える靴がいい" },
      { id: "volume_look", label: "少しボリュームがある靴がいい" },
      { id: "no_preference", label: "特にこだわりなし" },
    ],
  },
  {
    id: "materialAging",
    title: "素材はどれに惹かれる？",
    options: [
      { id: "leather_sinking", label: "革の沈み・履きジワ" },
      { id: "suede_fading_nap", label: "スエードの抜け感・毛並み変化" },
      { id: "canvas_fading", label: "キャンバスの退色" },
      { id: "gore_tex", label: "GORE-TEXなど機能素材" },
      { id: "aging_material", label: "履き込んで味が出る素材なら何でも" },
    ],
  },
  {
    id: "color",
    title: "色の好みは？",
    options: [
      { id: "black_white", label: "Black / White" },
      { id: "earth_tone", label: "Brown / Navy / Olive" },
      { id: "warm_accent", label: "Burgundy / Orange / Red" },
      { id: "odd_color", label: "Sky Blue / Mustard / Purpleなど少し変な色" },
      { id: "cream_gum", label: "Cream / Gum / Off White" },
      { id: "rare_color", label: "珍しい色・限定カラー" },
    ],
  },
  {
    id: "budget",
    title: "予算感は？",
    options: [
      { id: "under_15000", label: "1万円台まで" },
      { id: "under_20000", label: "2万円以下" },
      { id: "under_25000", label: "2万円台まで" },
      { id: "under_35000", label: "3万円台まで" },
      { id: "premium_ok", label: "高くても本当に良いものなら候補に入れたい" },
    ],
  },
  {
    id: "techTolerance",
    title: "ハイテク系はどこまであり？",
    options: [
      { id: "avoid_tech", label: "基本なし" },
      { id: "heritage_tech_ok", label: "歴史があればあり" },
      { id: "old_tech_look_ok", label: "古臭い見た目ならあり" },
      { id: "pure_cool_ok", label: "純粋にかっこよければあり" },
      { id: "airmax_nb_ok", label: "Air Max 95 / New Balance 2002R / New Balance 2010あたりはあり" },
    ],
  },
  {
    id: "ryoStrength",
    title: "Ryo Modeの強さは？",
    options: [
      { id: "balanced", label: "ユーザーの好み優先" },
      { id: "ryo_light", label: "少しだけRyoっぽく" },
      { id: "ryo_mode", label: "歴史・素材・色・パンツ相性をしっかり反映" },
      { id: "ryo_strong", label: "かなり濃厚寄せ" },
      { id: "beginner_ryo", label: "初心者向けに2万円以下で現実的に" },
    ],
  },
] as const satisfies readonly RyoModeQuestion[];

export const ryoModeV4Questions: readonly RyoModeQuestion[] = RYO_MODE_V4_QUESTIONS;
