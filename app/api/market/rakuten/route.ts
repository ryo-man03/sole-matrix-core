import { NextResponse } from "next/server";

import {
  RAKUTEN_MARKET_DISCLAIMER,
  RakutenApiError,
  RakutenCredentialsMissingError,
  searchRakutenProducts,
} from "../../../_lib/market/rakuten";
import type { SearchRakutenProductsInput } from "../../../_lib/market/types";

const SORT_VALUES = new Set<NonNullable<SearchRakutenProductsInput["sort"]>>([
  "standard",
  "+itemPrice",
  "-itemPrice",
  "-reviewCount",
  "-reviewAverage",
  "-updateTimestamp",
]);

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const query = parameters.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "missing_query", message: "q is required." },
      { status: 400 },
    );
  }
  if (Array.from(query).length > 128) {
    return NextResponse.json(
      { error: "query_too_long", message: "q must be 128 chars or less." },
      { status: 400 },
    );
  }

  const parsed = parseOptionalParameters(parameters);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "invalid_parameters", message: parsed.message },
      { status: 400 },
    );
  }

  try {
    const products = await searchRakutenProducts({ query, ...parsed.input });
    return NextResponse.json({
      source: "rakuten",
      slot: "market_find",
      query,
      fetchedAt: products[0]?.fetchedAt ?? new Date().toISOString(),
      disclaimer: RAKUTEN_MARKET_DISCLAIMER,
      products,
    });
  } catch (error) {
    if (error instanceof RakutenCredentialsMissingError) {
      return NextResponse.json(
        {
          error: "missing_rakuten_credentials",
          message: "Rakuten API credentials are not configured.",
        },
        { status: 503 },
      );
    }
    if (error instanceof RakutenApiError) {
      return NextResponse.json(
        { error: "rakuten_api_error", message: error.message },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        error: "rakuten_api_error",
        message: "Rakuten API request failed.",
      },
      { status: 502 },
    );
  }
}

function parseOptionalParameters(searchParams: URLSearchParams):
  | { ok: true; input: Omit<SearchRakutenProductsInput, "query"> }
  | { ok: false; message: string } {
  const minPrice = positiveInteger(searchParams.get("minPrice"), 999_999_998);
  const maxPrice = positiveInteger(searchParams.get("maxPrice"), 999_999_998);
  const hits = positiveInteger(searchParams.get("hits"), 30);
  const page = positiveInteger(searchParams.get("page"), 100);
  const sortValue = searchParams.get("sort");

  if (minPrice === null || maxPrice === null || hits === null || page === null) {
    return { ok: false, message: "Numeric parameters are out of range." };
  }
  if (minPrice !== undefined && maxPrice !== undefined && maxPrice <= minPrice) {
    return { ok: false, message: "maxPrice must be greater than minPrice." };
  }
  if (sortValue && !SORT_VALUES.has(sortValue as NonNullable<SearchRakutenProductsInput["sort"]>)) {
    return { ok: false, message: "sort is invalid." };
  }

  return {
    ok: true,
    input: {
      ...(minPrice !== undefined ? { minPrice } : {}),
      ...(maxPrice !== undefined ? { maxPrice } : {}),
      ...(hits !== undefined ? { hits } : {}),
      ...(page !== undefined ? { page } : {}),
      ...(sortValue
        ? { sort: sortValue as NonNullable<SearchRakutenProductsInput["sort"]> }
        : {}),
    },
  };
}

function positiveInteger(
  rawValue: string | null,
  maximum: number,
): number | undefined | null {
  if (rawValue === null) return undefined;
  if (!/^\d+$/.test(rawValue)) return null;
  const value = Number(rawValue);
  return Number.isSafeInteger(value) && value >= 1 && value <= maximum
    ? value
    : null;
}
