import { payslipPreviewGet } from "@/lib/payslip-preview-server";

export async function GET(request: Request) {
  return payslipPreviewGet(request);
}
