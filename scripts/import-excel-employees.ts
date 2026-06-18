/**
 * Import employees from an Excel master sheet into MongoDB.
 *
 * Usage:
 *   npx tsx scripts/import-excel-employees.ts "C:\path\to\MASTER DATA.xlsx"
 *
 * Requires MONGODB_URI in .env.local (defaults: mongodb://127.0.0.1:27017)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import {
  parsePayrollEmployeeWorkbook,
  validateImportRows,
} from "../src/lib/payroll-employee-excel-import";
import { payrollEmployeeFormAddSchema } from "../src/lib/payroll-employee-schema";
import { createEmployeeWithAutoId } from "../src/lib/payroll-employees-logic";
import { PAYROLL_EMPLOYEES_COLLECTION } from "../src/lib/payroll-employees-mongo-constants";

function loadEnvLocal() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvLocal();

  const defaultPath =
    "C:\\Users\\aman\\Downloads\\MASTER DATA - KRC CINEVISTA- KANJUR (1).xlsx";
  const filePath = resolve(process.argv[2] ?? defaultPath);

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017";
  const dbName = process.env.MONGODB_DB_NAME?.trim() || "template";

  const buffer = readFileSync(filePath);
  const parsed = parsePayrollEmployeeWorkbook(buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ));
  const validations = validateImportRows(parsed.rows);
  const validRows = parsed.rows.filter((_, i) => validations[i]?.ok);

  console.log(`Sheet: ${parsed.sheetName}`);
  console.log(`Rows found: ${parsed.rows.length} (${validRows.length} valid)`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
  await client.connect();
  const col = client.db(dbName).collection(PAYROLL_EMPLOYEES_COLLECTION);

  const existing = await col.find({}).toArray();
  const list = existing.map((d) => {
    const o = { ...(d as Record<string, unknown>) };
    delete o._id;
    return o;
  });

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const toInsert: Record<string, unknown>[] = [];
  let workingList = list as Parameters<typeof createEmployeeWithAutoId>[0];

  for (const row of validRows) {
    const zod = payrollEmployeeFormAddSchema.safeParse(row.values);
    if (!zod.success) {
      failed++;
      continue;
    }
    const want = zod.data.agencyIdNo.trim().toLowerCase();
    if (want && workingList.some((e) => e.agencyIdNo.trim().toLowerCase() === want)) {
      skipped++;
      console.log(`  Skip (exists): ${zod.data.nameOfEmployee} · ${zod.data.agencyIdNo}`);
      continue;
    }
    const result = createEmployeeWithAutoId(workingList, zod.data);
    if ("error" in result) {
      failed++;
      console.log(`  Fail: ${zod.data.nameOfEmployee} — ${result.error}`);
      continue;
    }
    workingList = [...workingList, result.created];
    toInsert.push(result.created);
    imported++;
    console.log(`  + ${result.created.agencyIdNo} — ${result.created.nameOfEmployee}`);
  }

  if (toInsert.length > 0) {
    await col.insertMany(toInsert);
  }

  await client.close();

  console.log(`\nDone: imported ${imported}, skipped ${skipped}, failed ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
