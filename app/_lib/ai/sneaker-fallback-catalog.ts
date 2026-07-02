import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";

export type SneakerFallbackCatalogEntry = {
  id: string;
  brand: string;
  modelName: string;
  modelType: string;
  reason: string;
  cautions: string[];
  searchKeywords: string[];
  evidenceUrls: string[];
  tags: SneakerTag[];
  vector: SneakerVector;
  risk: "low" | "medium";
  informationCompleteness: number;
};

const vectors = {
  classic: { culture: 88, styleFit: 86, simplicity: 90, street: 55, volume: 35, comfort: 72, durability: 80, priceLevel: 48 },
  street: { culture: 82, styleFit: 80, simplicity: 52, street: 92, volume: 78, comfort: 72, durability: 82, priceLevel: 65 },
  runner: { culture: 70, styleFit: 80, simplicity: 62, street: 72, volume: 68, comfort: 92, durability: 84, priceLevel: 66 },
} satisfies Record<string, SneakerVector>;

function evidence(modelName: string): string[] {
  const query = encodeURIComponent(modelName);
  return [
    `https://www.google.com/search?q=${query}`,
    `https://snkrdunk.com/search?keyword=${query}`,
  ];
}

export const sneakerFallbackCatalog: readonly SneakerFallbackCatalogEntry[] = [
  entry("adidas-samba-og", "adidas", "adidas SAMBA OG", "クラシック・デイリー", "細身で合わせやすく、クラシック感と日常使いのバランスが良い候補です。", ["classic", "minimal", "low_tech", "heritage"], vectors.classic, "low"),
  entry("new-balance-991", "New Balance", "New Balance 991", "プレミアム・ランナー", "上質感と歩行時の快適性を両立しやすい、落ち着いたランニング由来のモデルです。", ["running", "comfortable", "premium", "heritage"], vectors.runner, "medium"),
  entry("nike-aj1-high", "Nike", "Nike Air Jordan 1 High", "ストリート・バスケットボール", "存在感のあるハイカットと文化的背景を重視する場合の候補です。", ["basketball", "street", "retro", "heritage"], vectors.street, "medium"),
  entry("puma-suede", "PUMA", "PUMA Suede", "クラシック・ストリート", "シンプルな形とストリート文化の背景を両立したローテクモデルです。", ["classic", "low_tech", "street", "heritage"], vectors.classic, "low"),
  entry("vans-era", "Vans", "Vans Era", "スケート・ローテク", "軽快でシンプルな見た目を好み、日常の服装に自然に合わせたい場合の候補です。", ["classic", "canvas", "low_tech", "street"], vectors.classic, "low"),
  entry("converse-jack-purcell", "Converse", "Converse Jack Purcell", "ミニマル・キャンバス", "装飾を抑えたキャンバスシューズで、きれいめな日常服にも合わせやすい候補です。", ["classic", "canvas", "minimal", "low_tech"], vectors.classic, "low"),
  entry("new-balance-2002r", "New Balance", "New Balance 2002R", "コンフォート・ランナー", "快適性とレトロランニングの表情を両立しやすいモデルです。", ["running", "comfortable", "retro", "street"], vectors.runner, "medium"),
  entry("asics-gel-kayano-14", "ASICS", "ASICS GEL-KAYANO 14", "テクニカル・ランナー", "スポーティーな存在感と歩行時の快適性を重視する場合の候補です。", ["running", "comfortable", "retro", "street"], vectors.runner, "medium"),
  entry("nike-af1-low", "Nike", "Nike Air Force 1 Low", "クラシック・バスケットボール", "ボリュームと汎用性のバランスが良く、幅広い服装に合わせやすいモデルです。", ["basketball", "classic", "street", "durable"], vectors.street, "low"),
  entry("converse-all-star", "Converse", "Converse All Star / Chuck Taylor", "クラシック・キャンバス", "長く親しまれてきたシンプルな形で、ローテク感を重視する場合の候補です。", ["classic", "canvas", "low_tech", "heritage"], vectors.classic, "low"),
];

function entry(
  id: string,
  brand: string,
  modelName: string,
  modelType: string,
  reason: string,
  tags: SneakerTag[],
  vector: SneakerVector,
  risk: "low" | "medium",
): SneakerFallbackCatalogEntry {
  return {
    id,
    brand,
    modelName,
    modelType,
    reason,
    cautions: ["価格・在庫・サイズは販売元で確認してください。"],
    searchKeywords: [modelName, `${brand} ${modelName}`],
    evidenceUrls: evidence(modelName),
    tags,
    vector: { ...vector },
    risk,
    informationCompleteness: 82,
  };
}
