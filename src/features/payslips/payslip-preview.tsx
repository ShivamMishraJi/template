"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { employeeNativeSelectClassName } from "@/features/employees/employee-form-styles";
import {
  employeesPanelBodyClassName,
  employeesPanelClassName,
  employeesPanelHeaderClassName,
} from "@/features/employees/employees-panel-styles";
import {
  payslipDownloadFilename,
  payslipPreviewUrl,
  validatePayslipPreview,
} from "@/lib/payslips-api";
import type { PayrollEmployeeListItem } from "@/lib/payroll-employee-schema";
import { listPayrollEmployees } from "@/lib/payroll-employees-api";
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

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }
  return years;
}

export function PayslipPreview() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<PayrollEmployeeListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const yearOptions = useMemo(() => getYearOptions(), []);

  const activeEmployees = useMemo(
    () =>
      [...employees]
        .filter((e) => e.employmentStatus === "active" && !e.deletedAt)
        .sort((a, b) => a.nameOfEmployee.localeCompare(b.nameOfEmployee)),
    [employees],
  );

  const selectedEmployee = activeEmployees.find((e) => e.id === employeeId);

  const previewUrl = useMemo(() => {
    if (!employeeId || !selectedEmployee) return null;
    return payslipPreviewUrl(employeeId, month, year, selectedEmployee.nameOfEmployee);
  }, [employeeId, month, year, selectedEmployee]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingEmployees(true);
      try {
        const list = await listPayrollEmployees();
        if (!cancelled) {
          setEmployees(list);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load employees.");
          setEmployees([]);
        }
      } finally {
        if (!cancelled) setLoadingEmployees(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!employeeId && activeEmployees.length > 0) {
      setEmployeeId(activeEmployees[0]!.id);
    }
  }, [activeEmployees, employeeId]);

  const validatePreview = useCallback(async () => {
    if (!employeeId || !selectedEmployee) return;

    setLoadingPreview(true);
    setPreviewReady(false);
    setPreviewError(null);

    const result = await validatePayslipPreview(
      employeeId,
      month,
      year,
      selectedEmployee.nameOfEmployee,
    );

    if (!result.ok) {
      setPreviewError(result.error);
      setPreviewReady(false);
    } else {
      setPreviewReady(true);
    }
    setLoadingPreview(false);
  }, [employeeId, month, year, selectedEmployee]);

  useEffect(() => {
    if (!employeeId || !selectedEmployee) return;
    const id = window.setTimeout(() => {
      void validatePreview();
    }, 300);
    return () => window.clearTimeout(id);
  }, [employeeId, month, year, selectedEmployee, validatePreview]);

  const handleDownload = () => {
    if (!previewUrl || !selectedEmployee) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = payslipDownloadFilename(selectedEmployee.nameOfEmployee, month, year);
    link.click();
  };

  return (
    <div className={employeesPanelClassName}>
      <div className={employeesPanelHeaderClassName}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <select
            className={cn(employeeNativeSelectClassName, "min-w-[220px] max-w-full flex-1")}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={loadingEmployees || activeEmployees.length === 0}
          >
            {activeEmployees.length === 0 ? (
              <option value="">No active employees</option>
            ) : (
              activeEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nameOfEmployee}
                  {e.agencyIdNo ? ` (${e.agencyIdNo})` : ""}
                </option>
              ))
            )}
          </select>
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
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!previewReady || loadingPreview}
        >
          <Download className="mr-2 size-4" />
          Download
        </Button>
      </div>

      <div className={cn(employeesPanelBodyClassName, "flex flex-col gap-3 p-0")}>
        {loadError ? (
          <div className="px-4 py-4 text-sm text-destructive">{loadError}</div>
        ) : null}

        {loadingPreview ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Generating payslip preview…
          </div>
        ) : previewError ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={CalendarClock}
              title="Attendance not found"
              description={previewError}
            />
          </div>
        ) : previewReady && previewUrl ? (
          <iframe
            key={previewUrl}
            title="Payslip preview"
            src={previewUrl}
            className="min-h-[calc(100dvh-14rem)] w-full flex-1 border-0 bg-muted/30"
          />
        ) : !loadError && activeEmployees.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="No employees to preview"
              description="Add employees first, then return here to preview payslips."
            />
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="Select an employee"
              description="Choose an employee and pay period to preview the payslip."
            />
          </div>
        )}
      </div>
    </div>
  );
}
