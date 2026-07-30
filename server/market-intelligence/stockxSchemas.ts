type JsonRecord = Record<string, unknown>;

export type StockXCatalogProduct = Readonly<{
  productId: string;
  title: string;
  brand: string;
  styleId: string | null;
  colorway: string | null;
  releaseYear: number | null;
}>;

export type StockXCatalogPage = Readonly<{
  products: readonly StockXCatalogProduct[];
  hasNextPage: boolean;
  pageNumber: number;
}>;

export type StockXVariant = Readonly<{
  productId: string;
  variantId: string;
  size: string;
  sizeType: string;
}>;

export type StockXVariantMarketData = Readonly<{
  productId: string;
  variantId: string;
  currencyCode: string;
  lowestAskAmount: number | null;
  highestBidAmount: number | null;
}>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nullableText(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return requiredText(value) ?? undefined;
}

function parseYear(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-\d{2}-\d{2}/u.exec(value);
  if (!match?.[1]) return null;
  const year = Number(match[1]);
  return Number.isSafeInteger(year) ? year : null;
}

function parseAmount(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

export function parseStockXCatalogPage(
  value: unknown,
): StockXCatalogPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.products) ||
    typeof value.hasNextPage !== "boolean" ||
    typeof value.pageNumber !== "number"
  ) {
    return null;
  }

  const products: StockXCatalogProduct[] = [];
  for (const item of value.products) {
    if (!isRecord(item)) return null;
    const productId = requiredText(item.productId);
    const title = requiredText(item.title);
    const brand = requiredText(item.brand);
    const styleId = nullableText(item.styleId);
    const attributes = isRecord(item.productAttributes)
      ? item.productAttributes
      : {};
    const colorway = nullableText(attributes.colorway);
    if (!productId || !title || !brand || styleId === undefined || colorway === undefined) {
      return null;
    }
    products.push({
      productId,
      title,
      brand,
      styleId,
      colorway,
      releaseYear: parseYear(attributes.releaseDate),
    });
  }

  return {
    products,
    hasNextPage: value.hasNextPage,
    pageNumber: value.pageNumber,
  };
}

export function parseStockXVariants(
  value: unknown,
): readonly StockXVariant[] | null {
  if (!Array.isArray(value)) return null;
  const variants: StockXVariant[] = [];

  for (const item of value) {
    if (!isRecord(item) || !isRecord(item.sizeChart)) return null;
    const productId = requiredText(item.productId);
    const variantId = requiredText(item.variantId);
    const conversion = isRecord(item.sizeChart.defaultConversion)
      ? item.sizeChart.defaultConversion
      : null;
    const size = conversion ? requiredText(conversion.size) : null;
    const sizeType = conversion ? requiredText(conversion.type) : null;
    if (!productId || !variantId || !size || !sizeType) return null;
    variants.push({ productId, variantId, size, sizeType });
  }

  return variants;
}

export function parseStockXMarketData(
  value: unknown,
): StockXVariantMarketData | null {
  if (!isRecord(value)) return null;
  const productId = requiredText(value.productId);
  const variantId = requiredText(value.variantId);
  const currencyCode = requiredText(value.currencyCode);
  const lowestAskAmount = parseAmount(value.lowestAskAmount);
  const highestBidAmount = parseAmount(value.highestBidAmount);
  if (
    !productId ||
    !variantId ||
    !currencyCode ||
    !/^[A-Z]{3}$/u.test(currencyCode) ||
    lowestAskAmount === undefined ||
    highestBidAmount === undefined
  ) {
    return null;
  }
  return {
    productId,
    variantId,
    currencyCode,
    lowestAskAmount,
    highestBidAmount,
  };
}

