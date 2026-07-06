// CLI runner for the Day Off importer (no dev server needed):
//   npx tsx scripts/dayoff-import-run.ts
// Loads .env.local manually, then dynamically imports the lib so
// lib/supabase.ts sees the env at module-init time.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of file.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    const [, k, raw] = m;
    if (process.env[k] !== undefined) continue;
    process.env[k] = raw.replace(/^"(.*)"$/, "$1").trim();
  }
}

async function main() {
  loadEnvLocal();
  const { runDayoffImport } = await import("../lib/dayoff/import");
  const started = Date.now();
  const res = await runDayoffImport();
  if (!res.ok) {
    console.error("\nIMPORT ABORTED:", res.error);
    process.exit(1);
  }
  const r = res.report;
  console.log(JSON.stringify(r, null, 2));
  console.error(
    `\nDone in ${Math.round((Date.now() - started) / 1000)}s — ` +
      `${r.employees.matched.length}/${r.employees.total} employees matched, ` +
      `${r.requests.imported} requests imported (${r.requests.compOffCredits} comp credits), ` +
      `${r.balances.adjustmentsWritten} balance adjustments, ${r.snapshots} snapshots, ` +
      `${r.warnings.length} warnings.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
