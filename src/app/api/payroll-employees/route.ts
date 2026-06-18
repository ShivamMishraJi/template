import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { payrollEmployeeFormAddSchema } from "@/lib/payroll-employee-schema";
import {
  loadAgencyIdsFromDb,
  loadDistinctPayrollSitesFromDb,
  loadPayrollEmployeesPageFromDb,
} from "@/lib/payroll-employees-db-server";
import { createEmployeeWithAutoId } from "@/lib/payroll-employees-logic";
import { PAYROLL_EMPLOYEES_COLLECTION } from "@/lib/payroll-employees-mongo-constants";
import { parsePaginationSearchParams } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationSearchParams(searchParams);
    const search = searchParams.get("search")?.trim() || undefined;
    const siteName = searchParams.get("siteName")?.trim() || undefined;
    const employmentStatus = searchParams.get("employmentStatus");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const includeSites = searchParams.get("includeSites") === "true";

    const result = await loadPayrollEmployeesPageFromDb({
      page,
      pageSize,
      search,
      siteName,
      employmentStatus:
        employmentStatus === "active" || employmentStatus === "inactive"
          ? employmentStatus
          : undefined,
      activeOnly,
    });

    if (includeSites) {
      const sites = await loadDistinctPayrollSitesFromDb();
      return NextResponse.json({ ...result, sites });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to load employees.";
    if (message.includes("MONGODB_URI")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to load employees." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = payrollEmployeeFormAddSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid employee data.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const db = await getDb();
    const col = db.collection(PAYROLL_EMPLOYEES_COLLECTION);
    const agencyIds = await loadAgencyIdsFromDb();
    const result = createEmployeeWithAutoId(
      agencyIds.map((agencyIdNo) => ({ agencyIdNo })),
      parsed.data,
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    await col.insertOne(result.created);
    return NextResponse.json(result.created, { status: 201 });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to create employee.";
    if (message.includes("MONGODB_URI")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create employee." }, { status: 500 });
  }
}
