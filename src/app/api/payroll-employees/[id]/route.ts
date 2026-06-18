import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { payrollEmployeeFormSchema } from "@/lib/payroll-employee-schema";
import { loadPayrollEmployeeByIdFromDb } from "@/lib/payroll-employees-db-server";
import {
  restoreEmployeeInList,
  softDeleteEmployeeInList,
  updateEmployeeInList,
} from "@/lib/payroll-employees-logic";
import { PAYROLL_EMPLOYEES_COLLECTION } from "@/lib/payroll-employees-mongo-constants";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const employee = await loadPayrollEmployeeByIdFromDb(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    return NextResponse.json(employee);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load employee." }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const json: unknown = await request.json();

    if (json !== null && typeof json === "object" && "action" in json) {
      const action = (json as { action?: unknown }).action;
      if (action === "restore") {
        const current = await loadPayrollEmployeeByIdFromDb(id);
        if (!current) {
          return NextResponse.json({ error: "Employee not found." }, { status: 404 });
        }
        const updated = restoreEmployeeInList([current], id).find((e) => e.id === id);
        if (!updated) {
          return NextResponse.json({ error: "Employee not found." }, { status: 404 });
        }
        const db = await getDb();
        await db.collection(PAYROLL_EMPLOYEES_COLLECTION).replaceOne({ id }, updated);
        return NextResponse.json(updated);
      }
    }

    const parsed = payrollEmployeeFormSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid employee data.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const current = await loadPayrollEmployeeByIdFromDb(id);
    if (!current) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    const result = updateEmployeeInList([current], id, parsed.data);
    if ("error" in result) {
      const status = result.error === "Employee not found." ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }
    const db = await getDb();
    await db.collection(PAYROLL_EMPLOYEES_COLLECTION).replaceOne({ id }, result.updated);
    return NextResponse.json(result.updated);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to update employee.";
    if (message.includes("MONGODB_URI")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update employee." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const current = await loadPayrollEmployeeByIdFromDb(id);
    if (!current) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    const updated = softDeleteEmployeeInList([current], id).find((e) => e.id === id);
    if (!updated) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    const db = await getDb();
    await db.collection(PAYROLL_EMPLOYEES_COLLECTION).replaceOne({ id }, updated);
    return NextResponse.json(updated);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to archive employee.";
    if (message.includes("MONGODB_URI")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to archive employee." }, { status: 500 });
  }
}
