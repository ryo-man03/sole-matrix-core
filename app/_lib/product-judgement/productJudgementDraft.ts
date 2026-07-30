export type ProductJudgementMode = "ryo" | "balanced";

export type ProductJudgementDraft = {
  version: 1;
  mode: ProductJudgementMode;
  sneakerName: string;
  productUrl: string;
  budgetText: string;
};

export const PRODUCT_JUDGEMENT_DRAFT_KEY = "sole-matrix:product-judgement:v1";

const MAX_NAME_LENGTH = 160;
const MAX_URL_LENGTH = 2_048;
const MAX_BUDGET_LENGTH = 12;

export function createProductJudgementDraft(input: Omit<ProductJudgementDraft, "version">): ProductJudgementDraft {
  return {
    version: 1,
    mode: input.mode === "balanced" ? "balanced" : "ryo",
    sneakerName: input.sneakerName.trim().slice(0, MAX_NAME_LENGTH),
    productUrl: input.productUrl.trim().slice(0, MAX_URL_LENGTH),
    budgetText: input.budgetText.trim().slice(0, MAX_BUDGET_LENGTH),
  };
}

export function readProductJudgementDraft(
  storage?: Pick<Storage, "getItem">,
): ProductJudgementDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PRODUCT_JUDGEMENT_DRAFT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ProductJudgementDraft>;
    if (value.version !== 1) return null;
    return createProductJudgementDraft({
      mode: value.mode === "balanced" ? "balanced" : "ryo",
      sneakerName: typeof value.sneakerName === "string" ? value.sneakerName : "",
      productUrl: typeof value.productUrl === "string" ? value.productUrl : "",
      budgetText: typeof value.budgetText === "string" ? value.budgetText : "",
    });
  } catch {
    return null;
  }
}

export function writeProductJudgementDraft(
  storage: Pick<Storage, "setItem"> | undefined,
  draft: Omit<ProductJudgementDraft, "version">,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PRODUCT_JUDGEMENT_DRAFT_KEY, JSON.stringify(createProductJudgementDraft(draft)));
    return true;
  } catch {
    return false;
  }
}
