import {
  parsePayslipDownloadRecords,
  payslipDownloadSourceSchema,
  type PayslipDownloadRecord,
  type PayslipDownloadSource,
} from "@/lib/payslip-downloads-schema";
import type { PaginatedResult } from "@/lib/pagination";

export type { PayslipDownloadRecord, PayslipDownloadSource };

const BASE = "/api/payslips/downloads";

function errorMessageFromResponse(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return fallback;
}

export type RecordPayslipDownloadInput = {
  employeeId: string;
  employeeName: string;
  agencyIdNo: string;
  month: number;
  year: number;
  filename: string;
  source: PayslipDownloadSource;
};

export async function recordPayslipDownload(
  input: RecordPayslipDownloadInput,
): Promise<PayslipDownloadRecord> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(data, "Failed to record payslip download."));
  }
  const records = parsePayslipDownloadRecords([data]);
  const record = records[0];
  if (!record) {
    throw new Error("Invalid response from server.");
  }
  return record;
}

export async function listPayslipDownloads(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<PayslipDownloadRecord>> {
  const params = new URLSearchParams({
    page: String(options?.page ?? 1),
    pageSize: String(options?.pageSize ?? 20),
  });
  const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(data, "Failed to load download history."));
  }
  if (!data || typeof data !== "object" || !("items" in data)) {
    return { items: [], total: 0, page: 1, pageSize: options?.pageSize ?? 20, totalPages: 1 };
  }
  const body = data as PaginatedResult<unknown>;
  return {
    ...body,
    items: parsePayslipDownloadRecords(body.items),
  };
}

export function payslipDownloadSourceLabel(source: PayslipDownloadSource): string {
  const parsed = payslipDownloadSourceSchema.safeParse(source);
  if (!parsed.success) return "Unknown";
  return parsed.data === "button" ? "Download button" : "PDF viewer";
}
