import { NextResponse } from "next/server";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { parsePaginationSearchParams } from "@/lib/pagination";
import {
  loadPayslipDownloadsPageFromDb,
  recordPayslipDownloadToDb,
} from "@/lib/payslip-downloads-db-server";
import { payslipDownloadSourceSchema } from "@/lib/payslip-downloads-schema";
import { z } from "zod";

const recordPayslipDownloadBodySchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  agencyIdNo: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  filename: z.string().min(1),
  source: payslipDownloadSourceSchema,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationSearchParams(searchParams);
    const result = await loadPayslipDownloadsPageFromDb({ page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load download history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = recordPayslipDownloadBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid download record." }, { status: 400 });
    }

    const record = await recordPayslipDownloadToDb(parsed.data);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to record download." }, { status: 500 });
  }
}
