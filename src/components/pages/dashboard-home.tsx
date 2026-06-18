"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/empty-state";

export function DashboardHome() {
  const [headcount, setHeadcount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/payroll-employees/count", { cache: "no-store" });
        const data: unknown = await res.json().catch(() => null);
        if (cancelled || !res.ok) return;
        if (data && typeof data === "object" && "count" in data && typeof data.count === "number") {
          setHeadcount(data.count);
        }
      } catch {
        // Leave headcount as null when the API is unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
            Overview of employees, attendance, and payslips.
          </p>
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Quick actions</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Quick actions</DrawerTitle>
              <DrawerDescription>
                Common workflows for day-to-day HR operations.
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid gap-2 px-4 pb-4">
              <Button variant="secondary" asChild>
                <Link href="/employees/add">Add employee</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/attendance">Import attendance</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/payslips">Generate payslips</Link>
              </Button>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Headcount</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{headcount ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending items</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Approvals & exceptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payslips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">No payslips issued yet</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team activity</CardTitle>
          <CardDescription>
            Audit trail placeholder — connect to your events stream or HRIS
            webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CalendarClock}
            title="No activity yet"
            description="Team actions and audit events will show here once connected to your workflow."
          />
        </CardContent>
      </Card>
    </div>
  );
}
