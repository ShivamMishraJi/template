import { z } from "zod";

export const payslipDownloadSourceSchema = z.enum(["button", "pdf_viewer"]);

export type PayslipDownloadSource = z.infer<typeof payslipDownloadSourceSchema>;

export const payslipDownloadRecordSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  agencyIdNo: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  filename: z.string(),
  source: payslipDownloadSourceSchema,
  downloadedAt: z.string(),
});

export type PayslipDownloadRecord = z.infer<typeof payslipDownloadRecordSchema>;

export function parsePayslipDownloadRecords(raw: unknown[]): PayslipDownloadRecord[] {
  const results: PayslipDownloadRecord[] = [];
  for (const item of raw) {
    const parsed = payslipDownloadRecordSchema.safeParse(item);
    if (parsed.success) {
      results.push(parsed.data);
    }
  }
  return results;
}
