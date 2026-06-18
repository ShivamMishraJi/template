import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { payrollEmployeeFormAddSchema } from "@/lib/payroll-employee-schema";
import { loadAgencyIdsFromDb } from "@/lib/payroll-employees-db-server";
import { createEmployeeWithAutoId } from "@/lib/payroll-employees-logic";
import { PAYROLL_EMPLOYEES_COLLECTION } from "@/lib/payroll-employees-mongo-constants";
import type {
  PayrollEmployee,
  PayrollEmployeeFormAddValues,
} from "@/lib/payroll-employee-schema";

export type PayrollEmployeeImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  results: Array<{
    rowNumber: number;
    fullName: string;
    status: "imported" | "skipped" | "failed";
    employeeId?: string;
    error?: string;
  }>;
};

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    if (!json || typeof json !== "object" || !("rows" in json)) {
      return NextResponse.json({ error: "Expected { rows: [...] }." }, { status: 400 });
    }
    const body = json as {
      rows?: Array<{ rowNumber?: number; values?: PayrollEmployeeFormAddValues }>;
      skipDuplicates?: boolean;
    };
    const incoming = Array.isArray(body.rows) ? body.rows : [];
    if (incoming.length === 0) {
      return NextResponse.json({ error: "No rows to import." }, { status: 400 });
    }
    if (incoming.length > 500) {
      return NextResponse.json({ error: "Maximum 500 rows per import." }, { status: 400 });
    }

    const skipDuplicates = body.skipDuplicates !== false;
    const db = await getDb();
    const col = db.collection(PAYROLL_EMPLOYEES_COLLECTION);
    let agencyIds = await loadAgencyIdsFromDb();
    const agencyIdSet = new Set(agencyIds.map((id) => id.trim().toLowerCase()));

    const results: PayrollEmployeeImportResult["results"] = [];
    const toInsert: PayrollEmployee[] = [];

    for (const item of incoming) {
      const rowNumber = typeof item.rowNumber === "number" ? item.rowNumber : 0;
      const values = item.values;
      const fullName = values?.nameOfEmployee?.trim() || "Unknown";

      if (!values) {
        results.push({ rowNumber, fullName, status: "failed", error: "Missing row data." });
        continue;
      }

      const parsed = payrollEmployeeFormAddSchema.safeParse(values);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const msg = first ? `${first.path.join(".")}: ${first.message}` : "Invalid data";
        results.push({ rowNumber, fullName, status: "failed", error: msg });
        continue;
      }

      const wantId = parsed.data.agencyIdNo.trim().toLowerCase();
      if (skipDuplicates && wantId) {
        if (agencyIdSet.has(wantId)) {
          results.push({
            rowNumber,
            fullName,
            status: "skipped",
            error: `AGENCY ID NO ${parsed.data.agencyIdNo} already exists.`,
          });
          continue;
        }
      }

      const createdResult = createEmployeeWithAutoId(
        agencyIds.map((agencyIdNo) => ({ agencyIdNo })),
        parsed.data,
      );
      if ("error" in createdResult) {
        results.push({ rowNumber, fullName, status: "failed", error: createdResult.error });
        continue;
      }

      agencyIds = [...agencyIds, createdResult.created.agencyIdNo];
      agencyIdSet.add(createdResult.created.agencyIdNo.trim().toLowerCase());
      toInsert.push(createdResult.created);
      results.push({
        rowNumber,
        fullName,
        status: "imported",
        employeeId: createdResult.created.agencyIdNo,
      });
    }

    if (toInsert.length > 0) {
      await col.insertMany(toInsert);
    }

    const summary: PayrollEmployeeImportResult = {
      imported: results.filter((r) => r.status === "imported").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    };

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to import employees.";
    if (message.includes("MONGODB_URI")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to import employees." }, { status: 500 });
  }
}
