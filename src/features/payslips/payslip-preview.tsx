"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, Download, FileText, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { employeeNativeSelectClassName } from "@/features/employees/employee-form-styles";
import {
  employeesPanelBodyClassName,
  employeesPanelClassName,
  employeesPanelHeaderClassName,
} from "@/features/employees/employees-panel-styles";
import {
  listAttendancePeriodsForEmployee,
  type AttendancePeriod,
} from "@/lib/attendance-api";
import {
  payslipDownloadFilename,
  payslipPreviewUrl,
  validatePayslipPreview,
} from "@/lib/payslips-api";
import type { PayrollEmployeeListItem } from "@/lib/payroll-employee-schema";
import { listPayrollEmployees } from "@/lib/payroll-employees-api";
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

function latestAttendancePeriod(periods: AttendancePeriod[]): AttendancePeriod | null {
  return periods[0] ?? null;
}

export function PayslipPreview() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(getDefaultPayrollYear);
  const [query, setQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployeeListItem | null>(null);
  const [attendancePeriods, setAttendancePeriods] = useState<AttendancePeriod[]>([]);
  const [results, setResults] = useState<PayrollEmployeeListItem[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const hasAttendanceFilter = selectedEmployee !== null && attendancePeriods.length > 0;

  const yearOptions = useMemo(() => {
    if (hasAttendanceFilter) {
      return [...new Set(attendancePeriods.map((period) => period.year))].sort((a, b) => b - a);
    }
    if (selectedEmployee) {
      return [];
    }
    return getPayrollYearOptions();
  }, [attendancePeriods, hasAttendanceFilter, selectedEmployee]);

  const monthOptions = useMemo(() => {
    if (hasAttendanceFilter) {
      const monthsForYear = new Set(
        attendancePeriods.filter((period) => period.year === year).map((period) => period.month),
      );
      return MONTHS.filter((entry) => monthsForYear.has(entry.value));
    }
    return MONTHS;
  }, [attendancePeriods, hasAttendanceFilter, year]);

  const previewUrl = useMemo(() => {
    if (!selectedEmployee) return null;
    return payslipPreviewUrl(
      selectedEmployee.id,
      month,
      year,
      selectedEmployee.nameOfEmployee,
    );
  }, [selectedEmployee, month, year]);

  useEffect(() => {
    if (!listOpen) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        setLoadingEmployees(true);
        try {
          const result = await listPayrollEmployees({
            activeOnly: true,
            page: 1,
            pageSize: 50,
            search: query,
          });
          if (!cancelled) {
            setResults(result.items);
            setLoadError(null);
          }
        } catch (e) {
          if (!cancelled) {
            setLoadError(e instanceof Error ? e.message : "Failed to load employees.");
            setResults([]);
          }
        } finally {
          if (!cancelled) setLoadingEmployees(false);
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [query, listOpen]);

  useEffect(() => {
    if (!selectedEmployee) {
      setAttendancePeriods([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoadingPeriods(true);
      setPreviewReady(false);
      setPreviewError(null);
      try {
        const periods = await listAttendancePeriodsForEmployee(selectedEmployee.id);
        if (cancelled) return;
        setAttendancePeriods(periods);
        const latest = latestAttendancePeriod(periods);
        if (latest) {
          setYear(latest.year);
          setMonth(latest.month);
        }
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load attendance periods.");
          setAttendancePeriods([]);
        }
      } finally {
        if (!cancelled) setLoadingPeriods(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedEmployee]);

  useEffect(() => {
    if (!hasAttendanceFilter) return;
    if (monthOptions.some((entry) => entry.value === month)) return;
    const nextMonth = monthOptions[0]?.value;
    if (nextMonth) setMonth(nextMonth);
  }, [hasAttendanceFilter, monthOptions, month]);

  useEffect(() => {
    if (!hasAttendanceFilter) return;
    if (yearOptions.includes(year)) return;
    const nextYear = yearOptions[0];
    if (nextYear) setYear(nextYear);
  }, [hasAttendanceFilter, yearOptions, year]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setListOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const validatePreview = useCallback(async () => {
    if (!selectedEmployee) return;

    setLoadingPreview(true);
    setPreviewReady(false);
    setPreviewError(null);

    const result = await validatePayslipPreview(
      selectedEmployee.id,
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
  }, [selectedEmployee, month, year]);

  useEffect(() => {
    if (!selectedEmployee) return;
    const id = window.setTimeout(() => {
      void validatePreview();
    }, 300);
    return () => window.clearTimeout(id);
  }, [selectedEmployee, month, year, validatePreview]);

  const handleSelectEmployee = (employee: PayrollEmployeeListItem) => {
    setSelectedEmployee(employee);
    setQuery(employee.nameOfEmployee);
    setListOpen(false);
    setPreviewReady(false);
    setPreviewError(null);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedEmployee(null);
    setAttendancePeriods([]);
    setYear(getDefaultPayrollYear());
    setPreviewReady(false);
    setPreviewError(null);
    setListOpen(true);
  };

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
          <div ref={searchContainerRef} className="relative min-w-[264px] max-w-[460px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-8"
              placeholder="Search employee by name or agency ID…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setListOpen(true)}
              autoComplete="off"
              role="combobox"
              aria-expanded={listOpen}
              aria-controls="payslip-employee-results"
            />
            {listOpen ? (
              <ul
                id="payslip-employee-results"
                role="listbox"
                className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
              >
                {loadingEmployees ? (
                  <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Searching employees…
                  </li>
                ) : results.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">
                    {query.trim() ? "No employees match your search." : "No active employees found."}
                  </li>
                ) : (
                  results.map((employee) => {
                    const isSelected = selectedEmployee?.id === employee.id;
                    return (
                      <li key={employee.id} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent",
                            isSelected && "bg-accent",
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectEmployee(employee)}
                        >
                          <span className="font-medium text-foreground">
                            {employee.nameOfEmployee}
                          </span>
                          {employee.agencyIdNo ? (
                            <span className="text-xs text-muted-foreground">
                              {employee.agencyIdNo}
                              {employee.siteName ? ` · ${employee.siteName}` : ""}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>
          <select
            className={cn(employeeNativeSelectClassName, "w-[140px]")}
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setPreviewReady(false);
              setPreviewError(null);
            }}
            disabled={loadingPeriods || monthOptions.length === 0}
          >
            {monthOptions.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
          <select
            className={cn(employeeNativeSelectClassName, "w-[100px]")}
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setPreviewReady(false);
              setPreviewError(null);
            }}
            disabled={loadingPeriods || yearOptions.length === 0}
          >
            {yearOptions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
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
        ) : selectedEmployee && !loadingPeriods && attendancePeriods.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={CalendarClock}
              title="No attendance for this employee"
              description="Import attendance for this employee first, then return here to preview payslips."
            />
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={FileText}
              title="Select an employee"
              description="Search for an employee by name or agency ID, then choose month and year to preview the payslip."
            />
          </div>
        )}
      </div>
    </div>
  );
}
