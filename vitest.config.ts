import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./app/_lib/testing/server-only.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "app/**/*.test.ts",
      "server/**/*.test.ts",
    ],
  },
});
