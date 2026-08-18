import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  detectSecurityViolations,
  finalReadinessDetectorKinds,
  type SecurityObservation,
} from "../security/detectors";

const root = process.cwd();

describe("final repository boundary audit", () => {
  it("derives zero for every named detector from the clean repository", () => {
    const observations = repositoryObservations();
    const result = detectSecurityViolations(observations);
    expect(Object.fromEntries(finalReadinessDetectorKinds.map((kind) => [kind, result[kind]]))).toEqual(
      Object.fromEntries(finalReadinessDetectorKinds.map((kind) => [kind, 0])),
    );
  });

  it("keeps prohibited infrastructure out of runtime dependencies", () => {
    const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).join(" ");
    expect(dependencies).not.toMatch(/kafka|amq|rabbit|airflow|kubernetes|snowflake|bigquery|redis|vector/iu);
  });

  it("keeps all Data Steward route writes behind server authorization", () => {
    const routes = files(join(root, "app", "api", "admin")).filter((file) => file.endsWith("route.ts"));
    expect(routes.length).toBeGreaterThanOrEqual(5);
    for (const route of routes) {
      expect(read(route), relative(root, route)).toContain("authorizeDataSteward");
    }
  });

  it("keeps market lookup out of login and Today automatic flows", () => {
    const loginAndToday = [
      ...files(join(root, "app", "login")),
      ...files(join(root, "app", "today")),
      join(root, "app", "_components", "TodayPanel.tsx"),
    ].map(read).join("\n");
    expect(loginAndToday).not.toMatch(/api\/market|searchCurrentMarketPrices|searchRakuten|searchYahoo|searchEbay/u);
  });

  it("keeps the required release-conflict caution visible and technical evidence collapsed", () => {
    const today = read(join(root, "app", "_components", "TodayPanel.tsx"));
    expect(today).toContain("発売日は情報源によって異なります");
    expect(today).toContain("<details><summary>技術的な根拠</summary>");
  });
});

function repositoryObservations(): SecurityObservation[] {
  const appSources = files(join(root, "app")).filter(sourceFile).map((path) => ({ path, source: read(path) }));
  const clientSources = appSources.filter(({ source }) => /^\s*["']use client["'];/u.test(source));
  const combined = appSources.map(({ source }) => source).join("\n");
  const clientCombined = clientSources.map(({ source }) => source).join("\n");
  const marketSources = files(join(root, "app", "_lib", "market")).filter(sourceFile).map(read).join("\n");
  const ebaySource = read(join(root, "app", "_lib", "market", "providers.ts"));
  const todaySource = read(join(root, "app", "_components", "TodayPanel.tsx"));
  const loginAndToday = [
    ...files(join(root, "app", "login")),
    ...files(join(root, "app", "today")),
    join(root, "app", "_components", "TodayPanel.tsx"),
  ].map(read).join("\n");
  const releaseEvidence = read(join(root, "src", "domain", "release", "releaseEvidence.ts"));
  const postPurchase = read(join(root, "src", "infrastructure", "repositories", "postPurchaseRepository.ts"));
  const rls = files(join(root, "supabase", "migrations")).filter((path) => path.endsWith(".sql")).map(read).join("\n");
  const adminRoutes = files(join(root, "app", "api", "admin")).filter((path) => path.endsWith("route.ts")).map(read).join("\n");
  const userCopy = files(join(root, "app", "_components")).filter(sourceFile).map(read).join("\n");

  const occurrences = (matches: readonly unknown[]) => Math.max(1, matches.length);
  const observation = (kind: SecurityObservation["kind"], matches: readonly unknown[]): SecurityObservation => ({
    kind,
    detected: matches.length > 0,
    occurrences: occurrences(matches),
    evidence: `repository:${kind}`,
  });

  const secretMatches = combined.match(/(?:AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,})/gu) ?? [];
  const clientCredentialMatches = clientCombined.match(/process\.env\.[A-Z0-9_]*(?:SECRET|TOKEN|PRIVATE_KEY|SERVICE_ROLE|ACCESS_KEY)/gu) ?? [];
  const autoProviderMatches = loginAndToday.match(/api\/market|searchCurrentMarketPrices|searchRakuten|searchYahoo|searchEbay/gu) ?? [];
  const eBayWrites = ebaySource.match(/(?:db|supabase)\.from\(|\.insert\(\{|\.upsert\(\{|writeFile|appendFile/gu) ?? [];
  const eBayForecast = ebaySource.match(/forecast|predicted_price|recommended_(?:buy|sell)/giu) ?? [];
  const fitClaims = userCopy.match(/必ずフィット|フィット(?:感)?を保証|サイズが合うことを保証/gu) ?? [];
  const medicalClaims = userCopy.match(/治療でき|治癒|診断します|医学的に保証/gu) ?? [];

  return [
    observation("secretExposureCount", secretMatches),
    observation("clientCredentialBundleCount", clientCredentialMatches),
    observation("crossUserReadCount", /auth\.uid\(\)\)\s*=\s*user_id/u.test(rls) ? [] : ["owner-read-policy-missing"]),
    observation("crossUserWriteCount", /with check\s*\(\(select auth\.uid\(\)\)\s*=\s*user_id\)/u.test(rls) ? [] : ["owner-write-policy-missing"]),
    observation("crossUserFeedbackLinkCount", postPurchase.includes(".eq(\"user_id\", userId)") ? [] : ["feedback-owner-filter-missing"]),
    observation("coreMutationFromMarketCount", marketSources.match(/updateCore|mutateCore|setCoreScore/gu) ?? []),
    observation("ryoMutationFromMarketCount", marketSources.match(/updateRyo|mutateRyo|setRyoScore/gu) ?? []),
    observation("marketplaceOfficialPromotionCount", releaseEvidence.includes("marketplace_official") ? ["marketplace-promoted"] : []),
    observation("partialStyleCodeAcceptedCount", marketSources.includes("styleCodeFromTitle") && marketSources.includes("exactToken") ? [] : ["complete-style-boundary-missing"]),
    observation("generationMismatchCount", marketSources.includes("hasGenerationConflict") ? [] : ["generation-boundary-missing"]),
    observation("audienceMismatchCount", marketSources.includes("isAudienceConflict") ? [] : ["audience-boundary-missing"]),
    observation("ebayPersistentWriteCount", eBayWrites),
    observation("ebayForecastUseCount", eBayForecast),
    observation("autoProviderLoginCount", autoProviderMatches),
    observation("autoProviderTodayCount", autoProviderMatches),
    observation("releaseConflictHiddenCount", todaySource.includes("発売日は情報源によって異なります") ? [] : ["conflict-caution-missing"]),
    observation("duplicateEvidenceLostCount", releaseEvidence.includes("sourceIndependenceKey") ? [] : ["source-independence-missing"]),
    observation("unauthorizedAdminAccessCount", adminRoutes.split("export async function").slice(1).filter((route) => !route.includes("authorizeDataSteward"))),
    observation("fitGuaranteeClaimCount", fitClaims),
    observation("medicalClaimCount", medicalClaims),
  ];
}

function files(directory: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) output.push(...files(path));
    else output.push(path);
  }
  return output;
}

function sourceFile(path: string): boolean {
  return /\.(?:ts|tsx)$/u.test(path) && !/\.(?:test|spec)\.tsx?$/u.test(path);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}
