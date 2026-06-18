import { parseAttendanceRecords, type AttendanceRecord } from "@/lib/attendance-schema";
import type { PaginatedResult } from "@/lib/pagination";

const BASE = "/api/attendance";

function errorMessageFromResponse(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return fallback;
}

export type ListAttendanceOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export async function listAttendance(
  month: number,
  year: number,
  options: ListAttendanceOptions = {},
): Promise<PaginatedResult<AttendanceRecord>> {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 20),
  });
  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(data, "Failed to load attendance."));
  }
  if (!data || typeof data !== "object" || !("items" in data)) {
    return { items: [], total: 0, page: 1, pageSize: options.pageSize ?? 20, totalPages: 1 };
  }

  const body = data as PaginatedResult<unknown>;
  return {
    ...body,
    items: parseAttendanceRecords(body.items),
  };
}

export type AttendancePeriod = {
  month: number;
  year: number;
};

export async function listAttendancePeriodsForEmployee(
  employeeId: string,
): Promise<AttendancePeriod[]> {
  const res = await fetch(
    `${BASE}/periods?employeeId=${encodeURIComponent(employeeId)}`,
    { cache: "no-store" },
  );
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(data, "Failed to load attendance periods."));
  }
  if (!data || typeof data !== "object" || !("periods" in data)) {
    return [];
  }
  const periods = (data as { periods: unknown }).periods;
  if (!Array.isArray(periods)) return [];

  return periods.filter(
    (period): period is AttendancePeriod =>
      !!period &&
      typeof period === "object" &&
      typeof (period as AttendancePeriod).month === "number" &&
      typeof (period as AttendancePeriod).year === "number",
  );
}

export type AttendanceImportSummary = {
  imported: number;
  updated: number;
  failed: number;
  results: Array<{
    rowNumber: number;
    name: string;
    status: "imported" | "updated" | "failed";
    error?: string;
  }>;
};

export async function importAttendance(
  rows: Array<{ rowNumber: number; values: { agencyNo: string; name: string; daysWorked: number; weeklyOff: number; total: number } }>,
  month: number,
  year: number,
): Promise<{ ok: true; summary: AttendanceImportSummary } | { ok: false; error: string }> {
  const res = await fetch(`${BASE}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, month, year }),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to import attendance.") };
  }
  if (!data || typeof data !== "object" || !("imported" in data)) {
    return { ok: false, error: "Invalid response from server." };
  }
  return { ok: true, summary: data as AttendanceImportSummary };
}

export async function deleteAttendance(
  month: number,
  year: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${BASE}?month=${month}&year=${year}`, { method: "DELETE" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to delete attendance.") };
  }
  return { ok: true };
}
