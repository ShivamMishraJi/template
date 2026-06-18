import { NextResponse } from "next/server";
import { loadAttendancePeriodsForAgencyFromDb } from "@/lib/attendance-db-server";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { loadPayrollEmployeeByIdFromDb } from "@/lib/payroll-employees-db-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId")?.trim();

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
    }

    const employee = await loadPayrollEmployeeByIdFromDb(employeeId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (!employee.agencyIdNo.trim()) {
      return NextResponse.json({ periods: [] });
    }

    const periods = await loadAttendancePeriodsForAgencyFromDb(employee.agencyIdNo);
    return NextResponse.json({ periods });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load attendance periods." }, { status: 500 });
  }
}
