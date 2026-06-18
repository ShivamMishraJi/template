import { payslipPreviewGet } from "@/lib/payslip-preview-server";

type RouteCtx = { params: Promise<{ filename: string }> };

export async function GET(request: Request, ctx: RouteCtx) {
  await ctx.params;
  return payslipPreviewGet(request);
}
