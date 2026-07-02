export type DiagnosisAnswerId = "like" | "neutral" | "dislike";

export type DiagnosisQuestion = {
  id: string;
  question: string;
  helperText: string;
  options: { id: DiagnosisAnswerId; label: "好き" | "普通" | "苦手"; description: string }[];
};

const answerOptions: DiagnosisQuestion["options"] = [
  { id: "like", label: "好き", description: "この方向を強めに見たい" },
  { id: "neutral", label: "普通", description: "大きくは重視しない" },
  { id: "dislike", label: "苦手", description: "この方向は控えめにしたい" },
];

export const preferenceDiagnosisQuestions: DiagnosisQuestion[] = [
  { id: "trusted-classic", question: "長く親しまれてきた定番感のあるスニーカーに惹かれますか？", helperText: "歴史や背景のあるクラシックなモデルを好むか確認します。", options: answerOptions },
  { id: "simple-daily", question: "シンプルで毎日の服に合わせやすい靴が好きですか？", helperText: "装飾を抑えた汎用性の高いデザインを好むか確認します。", options: answerOptions },
  { id: "street-presence", question: "街の服装になじみながら、少し存在感のある靴が好きですか？", helperText: "ストリート寄りの主張や文化的背景を重視するか確認します。", options: answerOptions },
  { id: "soft-volume", question: "足元にほどよいボリュームがある靴が好きですか？", helperText: "細身よりも立体感のあるシルエットを楽しむか確認します。", options: answerOptions },
  { id: "walking-comfort", question: "履き心地や歩きやすさを重視しますか？", helperText: "通学・通勤・休日の外出で足への負担を抑えたいか確認します。", options: answerOptions },
  { id: "long-use", question: "長く履けることや扱いやすさを重視しますか？", helperText: "手入れのしやすさと耐久性を重視するか確認します。", options: answerOptions },
  { id: "sporty-mood", question: "ランニング系やスポーティーな雰囲気が好きですか？", helperText: "軽快で動きやすそうな印象を好むか確認します。", options: answerOptions },
  { id: "premium-detail", question: "上質感や特別感のあるディテールを重視しますか？", helperText: "素材や細部の作りに魅力を感じるか確認します。", options: answerOptions },
];
