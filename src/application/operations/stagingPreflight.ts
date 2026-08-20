export type Presence = "present" | "missing" | "not-required";

export type MigrationRisk =
  | "data-rewrite"
  | "drop-column"
  | "drop-constraint"
  | "drop-table"
  | "rls-disable"
  | "truncate"
  | "unsafe-alter";

export interface MigrationInput {
  name: string;
  sql: string;
}

export interface MigrationFinding {
  migration: string;
  risks: MigrationRisk[];
}

export interface StagingPreflightReport {
  status: "READY" | "BLOCKED";
  checks: {
    environmentDesignation: boolean;
    httpsSupabaseUrl: boolean;
    projectRefMatchesHostname: boolean;
    productionProjectIsDifferent: boolean;
    backupVerified: boolean;
    rollbackPlanVerified: boolean;
    dataRewriteApproved: boolean;
    cliAuthorizationPresent: boolean;
  };
  secretInventory: Record<string, Presence>;
  migrationFindings: MigrationFinding[];
  hardBlockers: MigrationFinding[];
}

const HARD_BLOCKERS = new Set<MigrationRisk>([
  "drop-column",
  "drop-table",
  "rls-disable",
  "truncate",
  "unsafe-alter",
]);

const SECRET_KEYS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "INTERNAL_JOB_SIGNING_SECRET",
  "GEMINI_API_KEY",
  "YAHOO_SHOPPING_APP_ID",
  "EBAY_PRODUCTION_CLIENT_ID",
  "EBAY_PRODUCTION_CLIENT_SECRET",
  "RAKUTEN_APPLICATION_ID",
  "RAKUTEN_ACCESS_KEY",
  "RAKUTEN_REQUEST_ORIGIN",
] as const;

export function assessMigrationRisks(migrations: MigrationInput[]): MigrationFinding[] {
  return migrations.flatMap(({ name, sql }) => {
    const normalized = sql.replace(/--.*$/gmu, " ").replace(/\s+/gu, " ").toLowerCase();
    const risks = new Set<MigrationRisk>();

    if (/\bdrop\s+table\b/u.test(normalized)) risks.add("drop-table");
    if (/\bdrop\s+column\b/u.test(normalized)) risks.add("drop-column");
    if (/\btruncate(?:\s+table)?\b/u.test(normalized)) risks.add("truncate");
    if (/\bdisable\s+row\s+level\s+security\b/u.test(normalized)) risks.add("rls-disable");
    if (/\balter\s+table\b[^;]*\b(?:rename\s+(?:column|to)|alter\s+column\b[^;]*\btype\b)/u.test(normalized)) risks.add("unsafe-alter");
    if (/\bdrop\s+constraint\b/u.test(normalized)) risks.add("drop-constraint");
    if (/(?:^|;)\s*(?:update\b|delete\s+from\b)/u.test(normalized)) risks.add("data-rewrite");

    return risks.size > 0 ? [{ migration: name, risks: [...risks].sort() }] : [];
  });
}

export function buildStagingPreflightReport(
  env: NodeJS.ProcessEnv,
  migrations: MigrationInput[],
): StagingPreflightReport {
  const findings = assessMigrationRisks(migrations);
  const hardBlockers = findings.filter(({ risks }) => risks.some((risk) => HARD_BLOCKERS.has(risk)));
  const url = parseUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL);
  const stagingRef = clean(env.STAGING_SUPABASE_PROJECT_REF);
  const productionRef = clean(env.PRODUCTION_SUPABASE_PROJECT_REF);
  const requiresRewriteApproval = findings.some(({ risks }) =>
    risks.some((risk) => risk === "data-rewrite" || risk === "drop-constraint"),
  );

  const checks = {
    environmentDesignation: env.SOLE_MATRIX_ENVIRONMENT === "staging",
    httpsSupabaseUrl: url?.protocol === "https:",
    projectRefMatchesHostname: Boolean(
      url && stagingRef && url.hostname.toLowerCase() === `${stagingRef.toLowerCase()}.supabase.co`,
    ),
    productionProjectIsDifferent: Boolean(stagingRef && productionRef && stagingRef !== productionRef),
    backupVerified: env.STAGING_BACKUP_VERIFIED === "true",
    rollbackPlanVerified: env.STAGING_ROLLBACK_PLAN_VERIFIED === "true",
    dataRewriteApproved: !requiresRewriteApproval || env.STAGING_DATA_REWRITE_APPROVED === "true",
    cliAuthorizationPresent: present(env.SUPABASE_ACCESS_TOKEN) && present(env.SUPABASE_DB_PASSWORD),
  };
  const secretInventory = Object.fromEntries(
    SECRET_KEYS.map((key) => [key, presence(env[key], optionalForPreflight(key))]),
  );
  const ready = Object.values(checks).every(Boolean) && hardBlockers.length === 0;

  return {
    status: ready ? "READY" : "BLOCKED",
    checks,
    secretInventory,
    migrationFindings: findings,
    hardBlockers,
  };
}

function clean(value: string | undefined): string | null {
  const result = value?.trim();
  return result ? result : null;
}

function parseUrl(value: string | undefined): URL | null {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}

function present(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function presence(value: string | undefined, optional: boolean): Presence {
  if (present(value)) return "present";
  return optional ? "not-required" : "missing";
}

function optionalForPreflight(key: (typeof SECRET_KEYS)[number]): boolean {
  return [
    "GEMINI_API_KEY",
    "YAHOO_SHOPPING_APP_ID",
    "EBAY_PRODUCTION_CLIENT_ID",
    "EBAY_PRODUCTION_CLIENT_SECRET",
    "RAKUTEN_APPLICATION_ID",
    "RAKUTEN_ACCESS_KEY",
    "RAKUTEN_REQUEST_ORIGIN",
  ].includes(key);
}
