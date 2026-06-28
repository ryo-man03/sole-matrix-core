export type SneakerUrlAnalysis = {
  inputUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  canonicalUrl?: string;
  extractedNameHint?: string;
  confidence: number;
  cautions: string[];
};
