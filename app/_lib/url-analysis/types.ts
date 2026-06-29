export type SneakerUrlAnalysis = {
  source?: "metadata" | "gemini_url_context" | "fallback";
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
