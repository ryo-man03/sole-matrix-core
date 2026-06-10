export type CandidateTagId =
  | "classic"
  | "low_tech"
  | "street"
  | "minimal"
  | "chunky"
  | "running"
  | "basketball"
  | "comfortable"
  | "durable"
  | "retro"
  | "heritage"
  | "premium";

export type CandidateTagOption = {
  id: CandidateTagId;
  label: string;
  helper: string;
};

export const maxCandidateTagSelection = 5;

export const candidateSneakerTagOptions: CandidateTagOption[] = [
  {
    id: "classic",
    label: "クラシック",
    helper: "長く親しまれてきた雰囲気",
  },
  {
    id: "low_tech",
    label: "シンプルな作り",
    helper: "低めで飾りすぎない形",
  },
  {
    id: "street",
    label: "ストリート感",
    helper: "街の服装になじむ存在感",
  },
  {
    id: "minimal",
    label: "合わせやすい",
    helper: "普段の服に入れやすい",
  },
  {
    id: "chunky",
    label: "ボリューム感",
    helper: "足元にほどよい厚みがある",
  },
  {
    id: "running",
    label: "ランニング系",
    helper: "軽快でスポーティーな印象",
  },
  {
    id: "basketball",
    label: "バスケット系",
    helper: "少し力強いスポーツ感",
  },
  {
    id: "comfortable",
    label: "履きやすい",
    helper: "歩きやすさを期待したい",
  },
  {
    id: "durable",
    label: "長く履けそう",
    helper: "扱いやすく長く使えそう",
  },
  {
    id: "retro",
    label: "昔っぽい雰囲気",
    helper: "どこか懐かしい形や色",
  },
  {
    id: "heritage",
    label: "定番・歴史がある",
    helper: "背景を知ると楽しい一足",
  },
  {
    id: "premium",
    label: "上質・高級感",
    helper: "素材や細部に特別感がある",
  },
];
