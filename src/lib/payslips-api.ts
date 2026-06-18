const PAYSLIP_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function payslipDownloadFilename(
  employeeName: string,
  month: number,
  year: number,
): string {
  const safeName =
    employeeName
      .trim()
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "employee";
  const monthLabel = PAYSLIP_MONTH_NAMES[month - 1] ?? String(month);
  return `${safeName}-${monthLabel}-${year}.pdf`;
}

export function payslipPreviewUrl(
  employeeId: string,
  month: number,
  year: number,
  employeeName: string,
): string {
  const filename = payslipDownloadFilename(employeeName, month, year);
  const params = new URLSearchParams({
    employeeId,
    month: String(month),
    year: String(year),
  });
  return `/api/payslips/preview/${encodeURIComponent(filename)}?${params.toString()}`;
}

export async function validatePayslipPreview(
  employeeId: string,
  month: number,
  year: number,
  employeeName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(payslipPreviewUrl(employeeId, month, year, employeeName), {
    cache: "no-store",
  });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    if (data && typeof data === "object" && "error" in data) {
      const e = (data as { error?: unknown }).error;
      if (typeof e === "string" && e.trim()) {
        return { ok: false, error: e };
      }
    }
    return { ok: false, error: "Failed to generate payslip preview." };
  }
  return { ok: true };
}
