export type PurchasePurpose =
  | "first_pair"
  | "daily_rotation"
  | "second_pair"
  | "archive_collection";

export type UserSneakerContext = {
  purchasePurpose: PurchasePurpose;
  ownedModels: string[];
  dislikedModels: string[];
  dislikedSignals: string[];
};

export const DEFAULT_USER_SNEAKER_CONTEXT: UserSneakerContext = {
  purchasePurpose: "daily_rotation",
  ownedModels: [],
  dislikedModels: [],
  dislikedSignals: [],
};

export const PURCHASE_PURPOSE_OPTIONS: readonly {
  id: PurchasePurpose;
  label: string;
  description: string;
}[] = [
  { id: "first_pair", label: "最初の一足", description: "予算と合わせやすさを優先し、極端な候補を抑えます。" },
  { id: "daily_rotation", label: "普段使いの買い足し", description: "耐久性と着回し、所有モデルとの重複を見ます。" },
  { id: "second_pair", label: "定番とは違う二足目", description: "近い系統の新しい発見や、色・素材の違いを強めます。" },
  { id: "archive_collection", label: "復刻・アーカイブ・コレクション", description: "歴史、復刻、Made系やVTGなどの背景を重視します。" },
];

export const DISLIKED_SIGNAL_OPTIONS = [
  "流行りすぎ",
  "真っ白",
  "大きいN",
  "厚底",
  "ハイテク",
  "ボリューム過多",
  "ローカット",
  "ハイカット",
  "合皮感",
] as const;

const purchasePurposeSet = new Set<PurchasePurpose>(PURCHASE_PURPOSE_OPTIONS.map((option) => option.id));

export function normalizeUserSneakerContext(value: unknown): UserSneakerContext {
  const record = isRecord(value) ? value : {};
  const rawPurpose = record["purchasePurpose"];
  const purchasePurpose = typeof rawPurpose === "string" && purchasePurposeSet.has(rawPurpose as PurchasePurpose)
    ? rawPurpose as PurchasePurpose
    : DEFAULT_USER_SNEAKER_CONTEXT.purchasePurpose;
  return {
    purchasePurpose,
    ownedModels: normalizeContextList(record["ownedModels"]),
    dislikedModels: normalizeContextList(record["dislikedModels"]),
    dislikedSignals: normalizeContextList(record["dislikedSignals"]),
  };
}

export function normalizeContextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const text = item.normalize("NFKC").trim().replace(/\s+/gu, " ").slice(0, 80);
    if (!text) continue;
    const key = text.toLocaleLowerCase("ja-JP");
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(text);
    if (normalized.length === 10) break;
  }
  return normalized;
}

export function parseContextListInput(value: string): string[] {
  return normalizeContextList(value.split(/[\n,、]+/u));
}

export function purchasePurposeLabel(value: PurchasePurpose): string {
  return PURCHASE_PURPOSE_OPTIONS.find((option) => option.id === value)?.label ?? "普段使いの買い足し";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
