import type { RyoModeQuestion } from "./types";

export const RYO_MODE_V4_QUESTIONS = [
  {
    id: "style",
    title: "今日の服装・気分はどれに近い？",
    options: [
      { id: "amekaji", label: "アメカジ・古着", description: "デニムやワークウェアに馴染む、履き込める定番を優先します。" },
      { id: "normcore", label: "ノームコア・シンプル", description: "主張を抑え、毎日の服に合わせやすい端正なモデルを優先します。" },
      { id: "street", label: "ストリート", description: "足元に存在感が出る、バスケットやスケート由来のモデルを重視します。" },
      { id: "clean_casual", label: "きれいめカジュアル", description: "細身やストレートのパンツに収まりやすい、すっきりした形を選びます。" },
      { id: "undecided", label: "まだ決めていない", description: "服装の方向を固定せず、ほかの回答との相性を中心に比較します。" },
    ],
  },
  {
    id: "pantsFit",
    title: "合わせたいパンツは？",
    options: [
      { id: "wide_pants", label: "太めパンツ", description: "裾幅に負けないボリュームや輪郭を持つモデルを評価します。" },
      { id: "straight_pants", label: "ストレートパンツ", description: "太すぎず細すぎない形で、裾から自然に見えるモデルを優先します。" },
      { id: "denim", label: "デニム", description: "革・スエード・キャンバスがデニムと一緒に育つモデルを重視します。" },
      { id: "work_pants", label: "ワークパンツ", description: "丈夫な素材や古いスポーツ由来の形など、無骨さと馴染む候補を選びます。" },
      { id: "slim_pants", label: "細め・すっきりしたパンツ", description: "足元が膨らみすぎない、薄めでシャープなシルエットを優先します。" },
      { id: "undecided", label: "まだ決めていない", description: "パンツ相性を固定せず、汎用性とほかの回答を中心に判断します。" },
    ],
  },
  {
    id: "taste",
    title: "好きな雰囲気は？",
    options: [
      { id: "classic", label: "昔ながらのクラシック", description: "競技やカルチャーの背景があり、長く残ってきた形を優先します。" },
      { id: "simple", label: "クセが少ないシンプル", description: "ロゴや装飾が控えめで、迷わず合わせやすいモデルを重視します。" },
      { id: "muted_color", label: "渋い色・落ち着いた色", description: "彩度を抑えた配色や、履き込んで馴染む色を評価します。" },
      { id: "rare_color", label: "珍しい色・遊び心のある配色", description: "定番色よりも、服に馴染む珍色や渋い配色を優先します。" },
      { id: "limited_collab", label: "コラボ・限定感", description: "背景や仕様に意味がある限定・別注候補を条件付きで評価します。" },
    ],
  },
  {
    id: "sportOrigin",
    title: "好きなスポーツ、またはやっていたスポーツは？",
    options: [
      { id: "basketball", label: "バスケットボール", description: "コート由来のレザーやHigh/Midなど、輪郭のあるモデルを評価します。" },
      { id: "tennis", label: "テニス", description: "白基調や低めの形など、端正なコートモデルを中心に見ます。" },
      { id: "football", label: "サッカー・フットサル", description: "テラスやトレーニング由来の薄い形、ガムソール系を重視します。" },
      { id: "skate", label: "スケートボード", description: "キャンバスやスエード、丈夫さとパンツへの収まりを評価します。" },
      { id: "running", label: "ランニング・陸上", description: "レトロランナーから快適な現代モデルまで、許容範囲に合わせて選びます。" },
      { id: "no_sport", label: "特になし／見た目で選びたい", description: "競技背景を加点せず、形・素材・色の回答を優先します。" },
    ],
  },
  {
    id: "cut",
    title: "カットの好みは？",
    options: [
      { id: "high", label: "Highが好き", description: "足首まで輪郭が出るHighを優先し、Low専用候補は強く下げます。" },
      { id: "low", label: "Lowが好き", description: "パンツの裾に収まりやすいLowを優先し、High/Midは慎重に扱います。" },
      { id: "ox", label: "OXが好き", description: "クラシックなローカットのOX表記・系統を優先します。" },
      { id: "mid", label: "Midもあり", description: "足首まわりに適度な存在感があるMidを候補に残します。" },
      { id: "depends_on_model", label: "モデルによって変わる", description: "カットを固定せず、モデル固有の形とほかの回答を優先します。" },
    ],
  },
  {
    id: "wearingStyle",
    title: "履き方の好みは？",
    options: [
      { id: "tied_silhouette", label: "紐をしっかり締めてシルエットを出したい", description: "シューレースを締めたときに形がきれいに出るモデルを重視します。" },
      { id: "loose_fit", label: "ゆるく履きたい", description: "少し力を抜いて履いても、パンツとのバランスが崩れにくい形を選びます。" },
      { id: "slim_look", label: "細身に見える靴がいい", description: "薄いソールや細いトウなど、足元をすっきり見せる候補を優先します。" },
      { id: "volume_look", label: "少しボリュームがある靴がいい", description: "太めのパンツにも負けない、適度な厚みと存在感を評価します。" },
      { id: "no_preference", label: "特にこだわりなし", description: "履き方の加点を固定せず、素材や服装との適合を中心に見ます。" },
    ],
  },
  {
    id: "materialAging",
    title: "素材はどれに惹かれる？",
    options: [
      { id: "leather_sinking", label: "革の沈み・履きジワ", description: "履くほど柔らかくなり、甲や側面に深いシワが出る革モデルを優先します。" },
      { id: "suede_fading_nap", label: "スエードの抜け感・毛並み変化", description: "毛並みの変化や色抜けを楽しめるスエードモデルを優先します。" },
      { id: "canvas_fading", label: "キャンバスの退色", description: "キャンバスの退色やアタリを楽しめるモデルを優先します。" },
      { id: "gore_tex", label: "GORE-TEXなど機能素材", description: "防水性などの実用機能を持つ素材を、見た目との相性も含めて評価します。" },
      { id: "aging_material", label: "履き込んで味が出る素材なら何でも", description: "革・スエード・キャンバスを限定せず、経年変化の余地を重視します。" },
    ],
  },
  {
    id: "color",
    title: "色の好みは？",
    options: [
      { id: "black_white", label: "Black / White", description: "白黒のコントラストが実在確認できる候補を優先します。" },
      { id: "earth_tone", label: "Brown / Navy / Olive", description: "デニムやワークウェアに馴染む、土や濃色系の配色を重視します。" },
      { id: "warm_accent", label: "Burgundy / Orange / Red", description: "落ち着いた服の差し色になる、暖色のアクセントを評価します。" },
      { id: "odd_color", label: "Sky Blue / Mustard / Purpleなど少し変な色", description: "派手さだけでなく、服に取り入れやすい少し外した色を探します。" },
      { id: "cream_gum", label: "Cream / Gum / Off White", description: "生成りやガムソールなど、柔らかく古着に馴染む配色を優先します。" },
      { id: "rare_color", label: "珍しい色・限定カラー", description: "実在証拠がある範囲で、定番から少し離れたカラーを評価します。" },
    ],
  },
  {
    id: "budget",
    title: "予算感は？",
    options: [
      { id: "under_15000", label: "1万円台まで", description: "買いやすさを優先し、高価格な復刻・上位仕様は強く抑えます。" },
      { id: "under_20000", label: "2万円以下", description: "現実的な買い足しを中心に、予算内の定番と少しの変化を探します。" },
      { id: "under_25000", label: "2万円台まで", description: "日本製や復刻を含めつつ、予算超過候補は慎重に扱います。" },
      { id: "under_35000", label: "3万円台まで", description: "上位仕様やアーカイブも候補に入れ、価格との釣り合いを見ます。" },
      { id: "premium_ok", label: "高くても本当に良いものなら候補に入れたい", description: "Made系や復刻背景を評価し、価格だけでは候補から外しません。" },
    ],
  },
  {
    id: "techTolerance",
    title: "ハイテク系はどこまであり？",
    options: [
      { id: "avoid_tech", label: "基本なし", description: "現代的なハイテク感を避け、薄型・ローテク・クラシックを優先します。" },
      { id: "heritage_tech_ok", label: "歴史があればあり", description: "競技史や世代背景が説明できる機能モデルだけを候補に残します。" },
      { id: "old_tech_look_ok", label: "古臭い見た目ならあり", description: "最新感より、昔の機能靴らしい形や素材感を評価します。" },
      { id: "pure_cool_ok", label: "純粋にかっこよければあり", description: "文化背景だけで絞らず、回答に合う現代的なモデルも比較します。" },
      { id: "airmax_nb_ok", label: "Air Max 95 / New Balance 2002R / New Balance 2010あたりはあり", description: "指定した現代レトロ・ハイテク系を許容し、別枠として評価します。" },
    ],
  },
  {
    id: "ryoStrength",
    title: "Ryo Modeの強さは？",
    options: [
      { id: "balanced", label: "ユーザーの好み優先", description: "明示した好みと実用性を最優先し、Ryoらしさは補助にします。" },
      { id: "ryo_light", label: "少しだけRyoっぽく", description: "好みを中心にしながら、定番から半歩ずらした候補も加えます。" },
      { id: "ryo_mode", label: "歴史・素材・色・パンツ相性をしっかり反映", description: "回答との相性とRyo Identityを近い比率で評価します。" },
      { id: "ryo_strong", label: "かなり濃厚寄せ", description: "一般的な無難さより、歴史・素材・色・アーカイブ性を強く評価します。" },
      { id: "beginner_ryo", label: "初心者向けに2万円以下で現実的に", description: "Ryoらしさを残しつつ、価格と合わせやすさを重視します。" },
    ],
  },
] as const satisfies readonly RyoModeQuestion[];

export const ryoModeV4Questions: readonly RyoModeQuestion[] = RYO_MODE_V4_QUESTIONS;
