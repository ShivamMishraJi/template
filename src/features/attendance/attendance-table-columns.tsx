"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AttendanceRecord } from "@/lib/attendance-schema";

const attendanceHeaderClassName =
  "text-[10px] font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100";

export function createAttendanceColumns(): ColumnDef<AttendanceRecord>[] {
  return [
    {
      accessorKey: "agencyNo",
      header: () => <span className={attendanceHeaderClassName}>AGENCY NO</span>,
      cell: ({ getValue }) => (
        <span className="font-medium">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: () => <span className={attendanceHeaderClassName}>NAME</span>,
      cell: ({ getValue }) => String(getValue() ?? "—"),
    },
    {
      accessorKey: "daysWorked",
      header: () => <span className={attendanceHeaderClassName}>DAYS WORKED</span>,
      cell: ({ getValue }) => String(getValue() ?? "0"),
    },
    {
      accessorKey: "weeklyOff",
      header: () => <span className={attendanceHeaderClassName}>WEEKLY OFF</span>,
      cell: ({ getValue }) => String(getValue() ?? "0"),
    },
    {
      accessorKey: "total",
      header: () => <span className={attendanceHeaderClassName}>TOTAL</span>,
      cell: ({ getValue }) => (
        <span className="font-semibold">{String(getValue() ?? "0")}</span>
      ),
    },
  ];
}
