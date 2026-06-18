import { getDb } from "@/lib/mongodb";
import { PAYSLIP_DOWNLOADS_COLLECTION } from "@/lib/payslip-downloads-mongo-constants";
import {
  parsePayslipDownloadRecords,
  type PayslipDownloadRecord,
  type PayslipDownloadSource,
} from "@/lib/payslip-downloads-schema";
import { buildPaginatedResult, type PaginatedResult } from "@/lib/pagination";
import crypto from "crypto";

export type RecordPayslipDownloadInput = {
  employeeId: string;
  employeeName: string;
  agencyIdNo: string;
  month: number;
  year: number;
  filename: string;
  source: PayslipDownloadSource;
};

export async function recordPayslipDownloadToDb(
  input: RecordPayslipDownloadInput,
): Promise<PayslipDownloadRecord> {
  const db = await getDb();
  const record: PayslipDownloadRecord = {
    id: crypto.randomUUID(),
    employeeId: input.employeeId,
    employeeName: input.employeeName.trim(),
    agencyIdNo: input.agencyIdNo.trim(),
    month: input.month,
    year: input.year,
    filename: input.filename,
    source: input.source,
    downloadedAt: new Date().toISOString(),
  };

  await db.collection(PAYSLIP_DOWNLOADS_COLLECTION).insertOne(record);
  return record;
}

export async function loadPayslipDownloadsPageFromDb(options: {
  page: number;
  pageSize: number;
}): Promise<PaginatedResult<PayslipDownloadRecord>> {
  const db = await getDb();
  const col = db.collection(PAYSLIP_DOWNLOADS_COLLECTION);
  const skip = (options.page - 1) * options.pageSize;

  const [docs, total] = await Promise.all([
    col.find({}).sort({ downloadedAt: -1 }).skip(skip).limit(options.pageSize).toArray(),
    col.countDocuments({}),
  ]);

  const items = parsePayslipDownloadRecords(
    docs.map((d) => {
      const o = { ...(d as Record<string, unknown>) };
      delete o._id;
      return o;
    }),
  );

  return buildPaginatedResult(items, total, options.page, options.pageSize);
}
