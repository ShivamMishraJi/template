"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  employeesPanelBodyClassName,
  employeesPanelClassName,
  employeesPanelHeaderClassName,
} from "@/features/employees/employees-panel-styles";
import {
  listPayslipDownloads,
  payslipDownloadSourceLabel,
  type PayslipDownloadRecord,
} from "@/lib/payslip-downloads-api";
import { payslipDownloadFilename, payslipPreviewUrl } from "@/lib/payslips-api";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
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
] as const;

const historyTableClassName =
  "[&_table]:w-full [&_thead]:bg-sky-100 [&_th]:whitespace-nowrap [&_th]:border-sky-200/60 [&_th]:px-3 [&_th]:py-2.5 [&_td]:px-3 [&_td]:py-2.5 dark:[&_thead]:bg-sky-950 dark:[&_th]:border-sky-800/60";

function formatDownloadedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PayslipDownloadHistory() {
  const [items, setItems] = useState<PayslipDownloadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPayslipDownloads({ page, pageSize });
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load download history.");
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleRedownload = (record: PayslipDownloadRecord) => {
    const url = payslipPreviewUrl(
      record.employeeId,
      record.month,
      record.year,
      record.employeeName,
      { download: true, source: "button" },
    );
    const link = document.createElement("a");
    link.href = url;
    link.download =
      record.filename ||
      payslipDownloadFilename(record.employeeName, record.month, record.year);
    link.click();
  };

  return (
    <div className={cn(employeesPanelClassName, historyTableClassName)}>
      <div className={employeesPanelHeaderClassName}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href="/payslips">
              <ArrowLeft className="size-4" />
              Back to payslips
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground">Download history</h1>
            <p className="text-sm text-muted-foreground">
              Payslips saved using the Download button on the preview page are listed here.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(employeesPanelBodyClassName, "flex min-h-0 flex-1 flex-col gap-0 p-0")}>
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading history…
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={History}
              title="No payslip downloads yet"
              description="Download a payslip from the preview page to see it recorded here."
              action={
                <Button asChild>
                  <Link href="/payslips">Go to payslips</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="text-sm">
                <thead className="sticky top-0 z-10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="font-medium">Employee</th>
                    <th className="font-medium">Period</th>
                    <th className="font-medium">Downloaded</th>
                    <th className="font-medium">Source</th>
                    <th className="font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((record) => (
                    <tr key={record.id} className="border-b border-border/60 last:border-0">
                      <td>
                        <div className="font-medium text-foreground">{record.employeeName}</div>
                        {record.agencyIdNo ? (
                          <div className="text-xs text-muted-foreground">{record.agencyIdNo}</div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap">
                        {MONTH_LABELS[record.month - 1]} {record.year}
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {formatDownloadedAt(record.downloadedAt)}
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {payslipDownloadSourceLabel(record.source)}
                      </td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => handleRedownload(record)}
                        >
                          <Download className="size-3.5" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <span>
                {total} download{total === 1 ? "" : "s"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span>
                  Page {page} of {Math.max(1, totalPages)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
