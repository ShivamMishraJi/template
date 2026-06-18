"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/empty-state";
import { employeesPanelClassName } from "@/features/employees/employees-panel-styles";
import { createPayrollEmployeeColumns } from "@/features/employees/payroll-employee-table-columns";
import type { PayrollEmployeeListItem } from "@/lib/payroll-employee-schema";
import { listPayrollEmployees } from "@/lib/payroll-employees-api";
import { cn } from "@/lib/utils";
import type { VisibilityState } from "@/components/data-table/data-table";

const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
  stateCity: false,
  siteName: false,
  employmentStatusYn: false,
  agencyName: false,
  krcSiteBiometricIdNo: false,
  lastWorkingDay: false,
  empFatherSpouseName: false,
  dateOfBirth: false,
  gender: false,
  bloodGroup: false,
  employmentApplicationStatus: false,
  educationCertificate: false,
  aadharNumber: false,
  panNumber: false,
  uanPfNo: false,
  esicNo: false,
  bankName: false,
  bankAccountNumber: false,
  bankIfscNumber: false,
  pccApplicationNo: false,
  pccApplicationDate: false,
  pccNo: false,
  pccIssueDate: false,
  policeVerificationValidity: false,
  permanentAddress: false,
  nextOfKinName: false,
  nextOfKinContactNumber: false,
  salary: false,
  recordStatus: false,
};

const employeesTableClassName =
  "[&_table]:min-w-max [&_thead]:bg-sky-100 [&_th]:whitespace-nowrap [&_th]:border-sky-200/60 [&_th]:px-2 [&_th]:py-2.5 [&_td]:px-2 [&_td]:py-2 dark:[&_thead]:bg-sky-950 dark:[&_th]:border-sky-800/60";

export function EmployeesManagement() {
  const [employees, setEmployees] = useState<PayrollEmployeeListItem[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [siteName, setSiteName] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<"" | "active" | "inactive">("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listPayrollEmployees({
        page: pageIndex + 1,
        pageSize,
        search,
        siteName: siteName || undefined,
        employmentStatus: employmentStatus || undefined,
        includeSites: true,
      });
      setEmployees(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.sites) {
        setSites(result.sites);
      }
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load employees.");
      setEmployees([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, search, siteName, employmentStatus]);

  useEffect(() => {
    setPageIndex(0);
  }, [search, siteName, employmentStatus]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refresh().finally(() => setHydrated(true));
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  const columns = useMemo(() => createPayrollEmployeeColumns(), []);

  if (!hydrated) {
    return (
      <div className={employeesPanelClassName}>
        <div className="flex gap-2 border-b px-4 py-3">
          <div className="h-9 min-w-0 flex-1 animate-pulse rounded-md bg-muted sm:max-w-sm" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="min-h-0 flex-1 animate-pulse bg-muted/40" />
      </div>
    );
  }

  return (
    <div className={cn(employeesPanelClassName, employeesTableClassName)}>
      {loadError ? (
        <p className="shrink-0 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <DataTable
        embedded
        className="min-h-0 flex-1"
        columns={columns}
        data={employees}
        initialColumnVisibility={DEFAULT_HIDDEN_COLUMNS}
        enableGlobalFilter
        globalFilterPlaceholder="Search employees…"
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
          <Button className="gap-2" asChild>
            <Link href="/employees/add">
              <Plus className="h-4 w-4" />
              Add employee
            </Link>
          </Button>
        }
        toolbarExtras={() => (
          <>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">SITE NAME</span>
              <select
                className="h-9 max-w-[160px] rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm"
                value={siteName || "all"}
                onChange={(e) => setSiteName(e.target.value === "all" ? "" : e.target.value)}
              >
                <option value="all">All sites</option>
                {sites.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Status</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm"
                value={employmentStatus || "all"}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmploymentStatus(
                    value === "active" || value === "inactive" ? value : "",
                  );
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </>
        )}
        emptyState={
          <EmptyState
            icon={Users}
            title={
              loadError
                ? "Could not load employees"
                : total === 0
                  ? "No employees yet"
                  : "No employees match filters"
            }
            description={
              loadError
                ? "Fix MongoDB connection (.env MONGODB_URI), then reload the page."
                : total === 0
                  ? "Add employees one at a time or import from Excel on the add employee page."
                  : "Clear search and filters to see more results."
            }
            action={
              !loadError && total === 0 ? (
                <Button className="gap-2" asChild>
                  <Link href="/employees/add">
                    <Plus className="h-4 w-4" />
                    Add employee
                  </Link>
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
}
