import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { attendanceImportRowSchema } from "@/lib/attendance-schema";
import { loadAttendanceDuplicateKeysForMonth } from "@/lib/attendance-db-server";
import { ATTENDANCE_COLLECTION } from "@/lib/attendance-mongo-constants";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    if (!json || typeof json !== "object" || !("rows" in json)) {
      return NextResponse.json({ error: "Expected { rows: [...], month, year }." }, { status: 400 });
    }
    const body = json as {
      rows?: Array<{ rowNumber?: number; values?: { agencyNo: string; name: string; daysWorked: number; weeklyOff: number; total: number } }>;
      month?: number;
      year?: number;
    };

    const month = body.month;
    const year = body.year;
    if (!month || !year || month < 1 || month > 12 || year < 2000) {
      return NextResponse.json({ error: "Valid month and year are required." }, { status: 400 });
    }

    const incoming = Array.isArray(body.rows) ? body.rows : [];
    if (incoming.length === 0) {
      return NextResponse.json({ error: "No rows to import." }, { status: 400 });
    }
    if (incoming.length > 500) {
      return NextResponse.json({ error: "Maximum 500 rows per import." }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection(ATTENDANCE_COLLECTION);

    const existing = await loadAttendanceDuplicateKeysForMonth(month, year);
    const existingKeys = new Set(
      existing.map((d) => `${d.agencyNo.trim().toLowerCase()}_${d.name.trim().toLowerCase()}`),
    );

    const results: Array<{ rowNumber: number; name: string; status: "imported" | "skipped" | "failed"; error?: string }> = [];
    const toInsert: Array<Record<string, unknown>> = [];

    for (const item of incoming) {
      const rowNumber = typeof item.rowNumber === "number" ? item.rowNumber : 0;
      const values = item.values;
      const name = values?.name?.trim() || "Unknown";

      if (!values) {
        results.push({ rowNumber, name, status: "failed", error: "Missing row data." });
        continue;
      }

      const parsed = attendanceImportRowSchema.safeParse(values);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        const msg = first ? `${first.path.join(".")}: ${first.message}` : "Invalid data";
        results.push({ rowNumber, name, status: "failed", error: msg });
        continue;
      }

      const key = `${parsed.data.agencyNo.trim().toLowerCase()}_${parsed.data.name.trim().toLowerCase()}`;
      if (existingKeys.has(key)) {
        results.push({ rowNumber, name, status: "skipped", error: `Duplicate: ${parsed.data.agencyNo} - ${parsed.data.name} already exists for this month.` });
        continue;
      }

      existingKeys.add(key);
      const record = {
        id: crypto.randomUUID(),
        agencyNo: parsed.data.agencyNo,
        name: parsed.data.name,
        daysWorked: parsed.data.daysWorked,
        weeklyOff: parsed.data.weeklyOff,
        total: parsed.data.total,
        month,
        year,
        createdAt: new Date().toISOString(),
      };
      toInsert.push(record);
      results.push({ rowNumber, name, status: "imported" });
    }

    if (toInsert.length > 0) {
      await col.insertMany(toInsert);
    }

    const summary = {
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
    const message = error instanceof Error ? error.message : "Failed to import attendance.";
    if (message.includes("MONGODB_URI")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to import attendance." }, { status: 500 });
  }
}
