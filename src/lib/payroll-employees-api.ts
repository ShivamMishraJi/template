import {
  parsePayrollEmployeeListItems,
  parsePayrollEmployees,
  type PayrollEmployee,
  type PayrollEmployeeFormAddValues,
  type PayrollEmployeeFormValues,
  type PayrollEmployeeListItem,
} from "@/lib/payroll-employee-schema";
import type { PaginatedResult } from "@/lib/pagination";

const BASE = "/api/payroll-employees";

function errorMessageFromResponse(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return fallback;
}

export type ListPayrollEmployeesOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  siteName?: string;
  employmentStatus?: "active" | "inactive";
  activeOnly?: boolean;
  includeSites?: boolean;
};

export type PayrollEmployeesListResponse = PaginatedResult<PayrollEmployeeListItem> & {
  sites?: string[];
};

export async function getPayrollEmployee(id: string): Promise<PayrollEmployee | null> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(data, "Failed to load employee."));
  }
  const list = parsePayrollEmployees([data]);
  return list[0] ?? null;
}

export async function listPayrollEmployees(
  options: ListPayrollEmployeesOptions = {},
): Promise<PayrollEmployeesListResponse> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 20),
  });
  if (options.search?.trim()) params.set("search", options.search.trim());
  if (options.siteName?.trim()) params.set("siteName", options.siteName.trim());
  if (options.employmentStatus) params.set("employmentStatus", options.employmentStatus);
  if (options.activeOnly) params.set("activeOnly", "true");
  if (options.includeSites) params.set("includeSites", "true");

  const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(data, "Failed to load employees."));
  }
  if (!data || typeof data !== "object" || !("items" in data)) {
    return { items: [], total: 0, page: 1, pageSize: options.pageSize ?? 20, totalPages: 1 };
  }

  const body = data as PayrollEmployeesListResponse;
  return {
    ...body,
    items: parsePayrollEmployeeListItems(body.items),
  };
}

export async function createPayrollEmployee(
  values: PayrollEmployeeFormAddValues,
): Promise<{ ok: true; created: PayrollEmployee } | { ok: false; error: string }> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const data: unknown = await res.json().catch(() => null);
  if (res.status === 409) {
    return { ok: false, error: errorMessageFromResponse(data, "Employee ID already exists.") };
  }
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to create employee.") };
  }
  const list = parsePayrollEmployees([data]);
  const created = list[0];
  if (!created) {
    return { ok: false, error: "Invalid response from server." };
  }
  return { ok: true, created };
}

export async function updatePayrollEmployee(
  id: string,
  values: PayrollEmployeeFormValues,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to save changes.") };
  }
  return { ok: true };
}

export async function archivePayrollEmployee(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to archive employee.") };
  }
  return { ok: true };
}

export type PayrollEmployeeImportSummary = {
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

export async function importPayrollEmployees(
  rows: Array<{ rowNumber: number; values: PayrollEmployeeFormAddValues }>,
  options?: { skipDuplicates?: boolean },
): Promise<{ ok: true; summary: PayrollEmployeeImportSummary } | { ok: false; error: string }> {
  const res = await fetch(`${BASE}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rows,
      skipDuplicates: options?.skipDuplicates ?? true,
    }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to import employees.") };
  }
  if (!data || typeof data !== "object" || !("imported" in data)) {
    return { ok: false, error: "Invalid response from server." };
  }
  return { ok: true, summary: data as PayrollEmployeeImportSummary };
}

export async function restorePayrollEmployee(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "restore" }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to restore employee.") };
  }
  return { ok: true };
}
