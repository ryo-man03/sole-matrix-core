import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type { MarketCollectionTarget } from "../server/market-intelligence/collector";
import { collectMarketSnapshots } from "../server/market-intelligence/collector";
import {
  createMarketHistoryRepository,
} from "../server/market-intelligence/marketHistoryRepository";
import {
  InMemoryStockXTokenStore,
  readStockXConfigFromEnv,
  StockXProvider,
} from "../server/market-intelligence/stockxProvider";

type CliOptions = Readonly<{
  provider: "stockx";
  limit: number;
  dryRun: boolean;
  targetsFile: string;
}>;

function argumentValue(args: readonly string[], name: string): string | null {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? null : null;
}

function parseOptions(args: readonly string[]): CliOptions {
  const provider = argumentValue(args, "--provider");
  const limit = Number(argumentValue(args, "--limit") ?? "10");
  if (provider !== "stockx") {
    throw new Error("--provider must be stockx");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("--limit must be an integer from 1 to 100");
  }
  return {
    provider,
    limit,
    dryRun: args.includes("--dry-run"),
    targetsFile:
      argumentValue(args, "--targets") ??
      process.env.MARKET_COLLECTION_TARGETS_FILE ??
      ".data/market-collection-targets.json",
  };
}

async function loadTargets(
  filePath: string,
  workspaceRoot: string,
): Promise<readonly MarketCollectionTarget[]> {
  const root = resolve(workspaceRoot);
  const target = resolve(root, filePath);
  const relativeTarget = relative(root, target);
  if (
    !relativeTarget ||
    relativeTarget.startsWith("..") ||
    isAbsolute(relativeTarget)
  ) {
    throw new Error("targets file must be inside the workspace");
  }
  try {
    const parsed: unknown = JSON.parse(await readFile(target, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("targets file must be an array");
    return parsed as MarketCollectionTarget[];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const workspaceRoot = process.cwd();
  const tokenStore = new InMemoryStockXTokenStore(
    process.env.STOCKX_ACCESS_TOKEN && process.env.STOCKX_TOKEN_EXPIRES_AT
      ? {
          accessToken: process.env.STOCKX_ACCESS_TOKEN,
          refreshToken: process.env.STOCKX_REFRESH_TOKEN ?? null,
          expiresAt: process.env.STOCKX_TOKEN_EXPIRES_AT,
        }
      : null,
  );
  const provider = new StockXProvider(
    readStockXConfigFromEnv(process.env, tokenStore),
  );
  const repository = createMarketHistoryRepository(
    process.env,
    workspaceRoot,
  );
  const targets = await loadTargets(options.targetsFile, workspaceRoot);
  const summary = await collectMarketSnapshots({
    provider,
    repository,
    targets,
    limit: options.limit,
    dryRun: options.dryRun,
    maxRetries: 1,
  });
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "collector failed";
  process.stderr.write(`${JSON.stringify({ status: "error", message })}\n`);
  process.exitCode = 1;
});

