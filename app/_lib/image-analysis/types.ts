export type SneakerSilhouette = "low" | "mid" | "high" | "unknown";

export type SneakerCategory =
  | "basketball"
  | "running"
  | "training"
  | "skate"
  | "terrace"
  | "canvas"
  | "lifestyle"
  | "unknown";

export type SneakerVisualAnalysis = {
  detectedBrand?: string;
  detectedModelName?: string;
  detectedColorway?: string;
  mainColors: string[];
  silhouette: SneakerSilhouette;
  category: SneakerCategory;
  materialHints: string[];
  vintageScore: number;
  streetScore: number;
  cleanScore: number;
  uniquenessScore: number;
  culturalContext: string[];
  confidence: number;
  cautions: string[];
};

export type ValidatedSneakerImage = {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileName: string;
};
