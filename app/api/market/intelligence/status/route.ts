import { NextResponse } from "next/server";

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  const stockxConfigured = [
    "STOCKX_API_KEY",
    "STOCKX_CLIENT_ID",
    "STOCKX_CLIENT_SECRET",
    "STOCKX_ACCESS_TOKEN",
    "STOCKX_TOKEN_EXPIRES_AT",
  ].every(configured);

  return NextResponse.json(
    {
      stockx: stockxConfigured ? "configured" : "not_configured",
      snkrdunk: "not_authorized",
      mercari: "not_authorized",
      automaticRequestMade: false,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

