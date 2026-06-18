"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  FileText,
  Loader2,
  Minus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  employeesPanelBodyClassName,
  employeesPanelClassName,
  employeesPanelHeaderClassName,
} from "@/features/employees/employees-panel-styles";
import { getDashboardStats } from "@/lib/dashboard-api";
import type { DashboardStats } from "@/lib/dashboard-stats-server";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function HeadcountTrendChart({ data }: { data: DashboardStats["headcountByMonth"] }) {
  const maxValue = useMemo(
    () => Math.max(1, ...data.map((entry) => Math.max(entry.newHires, entry.cumulativeActive))),
    [data],
  );

  return (
    <div className="space-y-4">
      <div className="flex h-52 items-end gap-3 border-b border-border pb-2">
        {data.map((entry) => {
          const hireHeight = Math.max(8, Math.round((entry.newHires / maxValue) * 100));
          const activeHeight = Math.max(8, Math.round((entry.cumulativeActive / maxValue) * 100));
          return (
            <div key={`${entry.year}-${entry.month}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div
                  className="w-3 rounded-t bg-sky-500/80 dark:bg-sky-400"
                  style={{ height: `${hireHeight}%` }}
                  title={`${entry.newHires} new hires`}
                />
                <div
                  className="w-3 rounded-t bg-emerald-500/70 dark:bg-emerald-400"
                  style={{ height: `${activeHeight}%` }}
                  title={`${entry.cumulativeActive} active`}
                />
              </div>
              <span className="truncate text-center text-[11px] text-muted-foreground">{entry.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-500/80" />
          New hires
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/70" />
          Active headcount
        </span>
      </div>
    </div>
  );
}

function SiteBreakdown({ sites }: { sites: DashboardStats["topSites"] }) {
  if (sites.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No site data yet"
        description="Add employees with site names to see workforce distribution."
      />
    );
  }

  const max = Math.max(...sites.map((site) => site.count), 1);

  return (
    <div className="space-y-3">
      {sites.map((site) => (
        <div key={site.siteName} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{site.siteName}</span>
            <span className="shrink-0 text-muted-foreground">{site.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: `${Math.round((site.count / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardManagement() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const growthLabel =
    stats === null
      ? "—"
      : stats.netChangeThisMonth > 0
        ? `+${stats.netChangeThisMonth}`
        : String(stats.netChangeThisMonth);

  const GrowthIcon =
    stats === null
      ? Minus
      : stats.netChangeThisMonth > 0
        ? ArrowUpRight
        : stats.netChangeThisMonth < 0
          ? ArrowDownRight
          : Minus;

  return (
    <div className={employeesPanelClassName}>
      <div className={employeesPanelHeaderClassName}>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Workforce overview across employees, sites, and attendance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/employees/add">Add employee</Link>
          </Button>
        </div>
      </div>

      <div className={employeesPanelBodyClassName}>
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading && !stats ? (
          <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading dashboard…
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Active headcount"
                value={stats.activeHeadcount}
                description="Unique active employees"
                icon={Users}
              />
              <StatCard
                title="Sites"
                value={stats.uniqueSites}
                description="Unique active sites"
                icon={Building2}
              />
              <StatCard
                title="New hires"
                value={stats.newHiresThisMonth}
                description="Added this month"
                icon={UserPlus}
              />
              <StatCard
                title="Attendance rows"
                value={stats.attendanceThisMonth}
                description="Records for current month"
                icon={CalendarClock}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="border-border bg-card shadow-none xl:col-span-2">
                <CardHeader>
                  <CardTitle>Headcount trend</CardTitle>
                  <CardDescription>
                    New hires and active headcount over the last 6 months.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HeadcountTrendChart data={stats.headcountByMonth} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Monthly change</CardTitle>
                  <CardDescription>Compared with last month&apos;s new hires.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        stats.netChangeThisMonth > 0
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : stats.netChangeThisMonth < 0
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      <GrowthIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{growthLabel}</p>
                      <p className="text-xs text-muted-foreground">Net new-hire change</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">This month</p>
                      <p className="mt-1 text-lg font-semibold">{stats.newHiresThisMonth}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Last month</p>
                      <p className="mt-1 text-lg font-semibold">{stats.newHiresLastMonth}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Inactive</p>
                      <p className="mt-1 text-lg font-semibold">{stats.inactiveHeadcount}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Archived</p>
                      <p className="mt-1 text-lg font-semibold">{stats.archivedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Top sites by headcount</CardTitle>
                  <CardDescription>Active employees grouped by site.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SiteBreakdown sites={stats.topSites} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-none">
                <CardHeader>
                  <CardTitle>Quick links</CardTitle>
                  <CardDescription>Jump into common HR workflows.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <Link href="/employees">
                      <Users className="h-4 w-4" />
                      Employees
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <Link href="/attendance">
                      <CalendarClock className="h-4 w-4" />
                      Attendance
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <Link href="/payslips">
                      <FileText className="h-4 w-4" />
                      Payslips
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <Link href="/employees/add">
                      <UserPlus className="h-4 w-4" />
                      Add employee
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
