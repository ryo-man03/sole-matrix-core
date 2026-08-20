import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { buildStagingPreflightReport } from "../src/application/operations/stagingPreflight";

const migrationDirectory = path.join(process.cwd(), "supabase", "migrations");
const migrations = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => ({
    name,
    sql: readFileSync(path.join(migrationDirectory, name), "utf8"),
  }));

const report = buildStagingPreflightReport(process.env, migrations);
console.log(JSON.stringify(report, null, 2));

if (report.status !== "READY") process.exitCode = 1;
