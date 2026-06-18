import { loadAttendanceForEmployeeFromDb } from "@/lib/attendance-db-server";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { loadPayrollEmployeeByIdFromDb } from "@/lib/payroll-employees-db-server";
import {
  buildPayslipTemplateVariables,
  missingAttendanceMessage,
} from "@/lib/payslip-template-variables";
import { compilePayslipPdf } from "@/lib/payslip-typst-server";
import { payslipDownloadFilename } from "@/lib/payslips-api";
import { NextResponse } from "next/server";

function payslipContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `inline; filename="${filename}"; filename*=UTF-8''${encoded}`;
}

export async function buildPayslipPreviewResponse(
  employeeId: string,
  month: number,
  year: number,
): Promise<NextResponse> {
  const employee = await loadPayrollEmployeeByIdFromDb(employeeId);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const attendance = await loadAttendanceForEmployeeFromDb(month, year, employee.agencyIdNo);
  if (!attendance) {
    return NextResponse.json(
      { error: missingAttendanceMessage(month, year) },
      { status: 422 },
    );
  }

  const variables = buildPayslipTemplateVariables(employee, month, year, attendance);
  const pdf = await compilePayslipPdf(variables);
  const filename = payslipDownloadFilename(employee.nameOfEmployee, month, year);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": payslipContentDisposition(filename),
      "Cache-Control": "no-store",
    },
  });
}

export async function payslipPreviewGet(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId")?.trim();
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required." }, { status: 400 });
    }
    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: "Valid month and year are required." }, { status: 400 });
    }

    return await buildPayslipPreviewResponse(employeeId, month, year);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to generate payslip preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
