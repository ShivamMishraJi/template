import { countAttendanceForMonthFromDb } from "@/lib/attendance-db-server";
import { loadAllPayrollEmployeesFromDb } from "@/lib/payroll-employees-db-server";
import { uniqueSitesFromEmployees } from "@/lib/payroll-employees-logic";
import type { PayrollEmployee } from "@/lib/payroll-employee-schema";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type DashboardHeadcountMonth = {
  month: number;
  year: number;
  label: string;
  newHires: number;
  cumulativeActive: number;
};

export type DashboardSiteCount = {
  siteName: string;
  count: number;
};

export type DashboardStats = {
  activeHeadcount: number;
  inactiveHeadcount: number;
  archivedCount: number;
  uniqueSites: number;
  newHiresThisMonth: number;
  newHiresLastMonth: number;
  netChangeThisMonth: number;
  attendanceThisMonth: number;
  headcountByMonth: DashboardHeadcountMonth[];
  topSites: DashboardSiteCount[];
};

function isActiveEmployee(employee: PayrollEmployee): boolean {
  return employee.deletedAt === null && employee.employmentStatus === "active";
}

function parseCreatedAtMonth(createdAt: string): { year: number; month: number } | null {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function getRecentMonths(count: number, from = new Date()) {
  const months: Array<{ year: number; month: number; label: string }> = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  return months;
}

function countNewHiresInMonth(employees: PayrollEmployee[], year: number, month: number): number {
  return employees.filter((employee) => {
    const created = parseCreatedAtMonth(employee.createdAt);
    return created?.year === year && created?.month === month;
  }).length;
}

function countCumulativeActiveThroughMonth(
  employees: PayrollEmployee[],
  year: number,
  month: number,
): number {
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return employees.filter((employee) => {
    if (!isActiveEmployee(employee)) return false;
    const created = new Date(employee.createdAt);
    if (Number.isNaN(created.getTime())) return false;
    return created.getTime() <= end.getTime();
  }).length;
}

function topSitesByHeadcount(employees: PayrollEmployee[], limit = 6): DashboardSiteCount[] {
  const counts = new Map<string, number>();
  for (const employee of employees) {
    if (!isActiveEmployee(employee)) continue;
    const site = employee.siteName.trim() || "Unassigned";
    counts.set(site, (counts.get(site) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([siteName, count]) => ({ siteName, count }))
    .sort((a, b) => b.count - a.count || a.siteName.localeCompare(b.siteName))
    .slice(0, limit);
}

export async function loadDashboardStatsFromDb(): Promise<DashboardStats> {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();

  const [employees, attendanceThisMonth] = await Promise.all([
    loadAllPayrollEmployeesFromDb(),
    countAttendanceForMonthFromDb(thisMonth, thisYear),
  ]);

  const activeEmployees = employees.filter(isActiveEmployee);
  const inactiveHeadcount = employees.filter(
    (employee) => employee.deletedAt === null && employee.employmentStatus !== "active",
  ).length;
  const archivedCount = employees.filter((employee) => employee.deletedAt !== null).length;

  const newHiresThisMonth = countNewHiresInMonth(employees, thisYear, thisMonth);
  const newHiresLastMonth = countNewHiresInMonth(employees, lastMonthYear, lastMonth);

  const headcountByMonth = getRecentMonths(6, now).map((entry) => ({
    month: entry.month,
    year: entry.year,
    label: entry.label,
    newHires: countNewHiresInMonth(employees, entry.year, entry.month),
    cumulativeActive: countCumulativeActiveThroughMonth(employees, entry.year, entry.month),
  }));

  return {
    activeHeadcount: activeEmployees.length,
    inactiveHeadcount,
    archivedCount,
    uniqueSites: uniqueSitesFromEmployees(activeEmployees).length,
    newHiresThisMonth,
    newHiresLastMonth,
    netChangeThisMonth: newHiresThisMonth - newHiresLastMonth,
    attendanceThisMonth,
    headcountByMonth,
    topSites: topSitesByHeadcount(employees),
  };
}
