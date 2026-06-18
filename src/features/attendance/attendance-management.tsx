"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/empty-state";
import { AttendanceExcelImportDialog } from "@/features/attendance/attendance-excel-import-dialog";
import { createAttendanceColumns } from "@/features/attendance/attendance-table-columns";
import { employeeNativeSelectClassName } from "@/features/employees/employee-form-styles";
import { employeesPanelClassName } from "@/features/employees/employees-panel-styles";
import type { AttendanceRecord } from "@/lib/attendance-schema";
import { listAttendance } from "@/lib/attendance-api";
import { getDefaultPayrollYear, getPayrollYearOptions } from "@/lib/payroll-year-options";
import { cn } from "@/lib/utils";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const attendanceTableClassName =
  "[&_table]:min-w-max [&_thead]:bg-sky-100 [&_th]:whitespace-nowrap [&_th]:border-sky-200/60 [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-sky-900 [&_td]:px-2 [&_td]:py-2 dark:[&_thead]:bg-sky-950 dark:[&_th]:border-sky-800/60 dark:[&_th]:text-sky-100";

export function AttendanceManagement() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(getDefaultPayrollYear);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const yearOptions = useMemo(() => getPayrollYearOptions(), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAttendance(month, year, {
        page: pageIndex + 1,
        pageSize,
        search,
      });
      setRecords(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load attendance.");
      setRecords([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [month, year, pageIndex, pageSize, search]);

  useEffect(() => {
    setPageIndex(0);
  }, [month, year, search]);

  useEffect(() => {
    setHydrated(false);
    const id = window.setTimeout(() => {
      void refresh().finally(() => setHydrated(true));
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  const columns = useMemo(() => createAttendanceColumns(), []);

  if (!hydrated) {
    return (
      <div className={employeesPanelClassName}>
        <div className="flex gap-2 border-b px-4 py-3">
          <div className="h-9 min-w-0 flex-1 animate-pulse rounded-md bg-muted sm:max-w-sm" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="min-h-0 flex-1 animate-pulse bg-muted/40" />
      </div>
    );
  }

  return (
    <div className={cn(employeesPanelClassName, attendanceTableClassName)}>
      {loadError ? (
        <p className="shrink-0 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <DataTable
        embedded
        className="min-h-0 flex-1"
        columns={columns}
        data={records}
        enableGlobalFilter
        globalFilterPlaceholder="Search by NAME, AGENCY NO…"
        globalFilterValue={search}
        onGlobalFilterChange={setSearch}
        manualPagination
        pageIndex={pageIndex}
        onPageIndexChange={setPageIndex}
        pageCount={totalPages}
        totalRows={total}
        controlledPageSize={pageSize}
        onControlledPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        loading={loading}
        toolbarEnd={
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setImportOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Excel
          </Button>
        }
        toolbarExtras={() => (
          <>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Month</span>
              <select
                className={cn(employeeNativeSelectClassName, "w-[140px]")}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Year</span>
              <select
                className={cn(employeeNativeSelectClassName, "w-[100px]")}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        emptyState={
          <EmptyState
            icon={CalendarClock}
            title={
              loadError
                ? "Could not load attendance"
                : total === 0
                  ? "No attendance records"
                  : "No records match filters"
            }
            description={
              loadError
                ? "Fix MongoDB connection (.env MONGODB_URI), then reload the page."
                : "Import an attendance Excel sheet to populate this table."
            }
            action={
              !loadError && total === 0 ? (
                <Button
                  type="button"
                  variant="default"
                  className="gap-2"
                  onClick={() => setImportOpen(true)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Import Excel
                </Button>
              ) : undefined
            }
          />
        }
      />

      <AttendanceExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          setPageIndex(0);
          void refresh();
        }}
      />
    </div>
  );
}
