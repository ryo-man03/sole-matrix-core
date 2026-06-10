export type DiagnosisAnswerId = "like" | "neutral" | "dislike";

export type DiagnosisQuestion = {
  id: string;
  question: string;
  helperText: string;
  options: {
    id: DiagnosisAnswerId;
    label: "好き" | "普通" | "苦手";
    description: string;
  }[];
};

const answerOptions: DiagnosisQuestion["options"] = [
  {
    id: "like",
    label: "好き",
    description: "この方向を少し強めに見たい",
  },
  {
    id: "neutral",
    label: "普通",
    description: "大きくは変えずに見たい",
  },
  {
    id: "dislike",
    label: "苦手",
    description: "この方向は少し控えめに見たい",
  },
];

export const preferenceDiagnosisQuestions: DiagnosisQuestion[] = [
  {
    id: "trusted-classic",
    question: "長く親しまれてきた定番感のあるスニーカーに惹かれますか？",
    helperText:
      "背景を知ると楽しい一足や、長く履かれてきた安心感のある形を好むかを確認します。",
    options: answerOptions,
  },
  {
    id: "simple-daily",
    question: "シンプルで合わせやすい靴が好きですか？",
    helperText:
      "服を選ばず、毎日のコーディネートに入れやすい雰囲気を好むかを確認します。",
    options: answerOptions,
  },
  {
    id: "street-presence",
    question: "街の服装になじみながら、少し存在感のある靴が好きですか？",
    helperText:
      "カジュアルな服や太めのパンツに合わせやすい、少し主張のある雰囲気を好むかを確認します。",
    options: answerOptions,
  },
  {
    id: "soft-volume",
    question: "足元にほどよいボリューム感がある靴が好きですか？",
    helperText:
      "形が大きめでも、服とのバランスとして楽しめるかを確認します。",
    options: answerOptions,
  },
  {
    id: "walking-comfort",
    question: "履き心地や歩きやすさを重視しますか？",
    helperText:
      "通勤、通学、休日の外出などで、足元の負担を少なくしたいかを確認します。",
    options: answerOptions,
  },
  {
    id: "long-use",
    question: "長く履けることや扱いやすさを重視しますか？",
    helperText:
      "すぐ傷みにくいこと、手入れしやすいこと、日常で気兼ねなく履けることを確認します。",
    options: answerOptions,
  },
  {
    id: "sporty-mood",
    question: "ランニング系やスポーティーな雰囲気が好きですか？",
    helperText:
      "軽快で動きやすく見える印象や、すっきりした足元を好むかを確認します。",
    options: answerOptions,
  },
  {
    id: "premium-detail",
    question: "上質感や特別感のある靴を重視しますか？",
    helperText:
      "素材の見え方、細部の作り、少し特別に感じられる雰囲気を好むかを確認します。",
    options: answerOptions,
  },
];
