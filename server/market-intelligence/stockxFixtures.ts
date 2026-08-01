export const STOCKX_CATALOG_FIXTURE = {
  count: 1,
  pageSize: 1,
  pageNumber: 1,
  hasNextPage: false,
  products: [
    {
      productId: "product-1",
      urlKey: "air-jordan-1-retro-high-og-chicago-reimagined",
      styleId: "DZ5485-612",
      productType: "sneakers",
      title: "Air Jordan 1 Retro High OG Chicago Reimagined",
      brand: "Nike",
      productAttributes: {
        gender: "men",
        releaseDate: "2022-11-19",
        colorway: "Chicago",
      },
    },
  ],
} as const;

export const STOCKX_VARIANTS_FIXTURE = [
  {
    productId: "product-1",
    variantId: "variant-us-m-9",
    variantName: "9",
    variantValue: "9",
    sizeChart: {
      availableConversions: [{ size: "9", type: "us m" }],
      defaultConversion: { size: "9", type: "us m" },
    },
  },
] as const;

export const STOCKX_MARKET_DATA_FIXTURE = {
  productId: "product-1",
  variantId: "variant-us-m-9",
  currencyCode: "JPY",
  lowestAskAmount: "42000",
  highestBidAmount: "38000",
  sellFasterAmount: "41000",
  earnMoreAmount: "41500",
} as const;

