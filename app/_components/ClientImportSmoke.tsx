"use client";

import { recommendSneakers } from "../../src/core";

export function ClientImportSmoke() {
  const canImportCore = typeof recommendSneakers === "function";

  return (
    <p className="smoke-check" data-core-import-ready={canImportCore}>
      Client import smoke check: {canImportCore ? "ready" : "not ready"}
    </p>
  );
}
