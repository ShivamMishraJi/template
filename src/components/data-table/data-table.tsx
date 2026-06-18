"use client";

import type { ReactNode } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  SortingState,
  Table as TanstackTable,
  VisibilityState,
} from "@tanstack/react-table";
export type { VisibilityState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableToolbar } from "./data-table-toolbar";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: keyof TData & string;
  searchPlaceholder?: string;
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  globalFilterFn?: FilterFn<TData>;
  filterSlot?: ReactNode;
  toolbarExtras?: (table: TanstackTable<TData>) => ReactNode;
  toolbarEnd?: ReactNode;
  toolbarClassName?: string;
  emptyState?: ReactNode;
  className?: string;
  embedded?: boolean;
  initialColumnVisibility?: VisibilityState;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPaginationInfo?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageIndexChange?: (pageIndex: number) => void;
  controlledPageSize?: number;
  onControlledPageSizeChange?: (pageSize: number) => void;
  totalRows?: number;
  globalFilterValue?: string;
  onGlobalFilterChange?: (value: string) => void;
  loading?: boolean;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  enableGlobalFilter,
  globalFilterPlaceholder,
  globalFilterFn,
  filterSlot,
  toolbarExtras,
  toolbarEnd,
  toolbarClassName,
  emptyState,
  className,
  embedded,
  initialColumnVisibility,
  pageSize = 8,
  pageSizeOptions,
  showPaginationInfo = true,
  manualPagination = false,
  pageCount,
  pageIndex = 0,
  onPageIndexChange,
  controlledPageSize,
  onControlledPageSizeChange,
  totalRows,
  globalFilterValue,
  onGlobalFilterChange,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const resolvedPageSize = controlledPageSize ?? pageSize;
  const globalFilter = globalFilterValue ?? internalGlobalFilter;

  // TanStack Table returns unstable function references; React Compiler skips memoization here.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable is the supported API
  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize: resolvedPageSize,
      },
      ...(enableGlobalFilter ? { globalFilter } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    onPaginationChange: manualPagination
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater({ pageIndex, pageSize: resolvedPageSize })
              : updater;
          if (next.pageIndex !== pageIndex) {
            onPageIndexChange?.(next.pageIndex);
          }
          if (next.pageSize !== resolvedPageSize) {
            onControlledPageSizeChange?.(next.pageSize);
            onPageIndexChange?.(0);
          }
        }
      : undefined,
    ...(enableGlobalFilter
      ? {
          onGlobalFilterChange: (value: string) => {
            if (onGlobalFilterChange) {
              onGlobalFilterChange(value);
            } else {
              setInternalGlobalFilter(value);
            }
          },
          globalFilterFn:
            manualPagination
              ? () => true
              : globalFilterFn ??
                ((row, _columnId, filterValue: unknown) => {
                  const q = String(filterValue ?? "")
                    .toLowerCase()
                    .trim();
                  if (!q) return true;
                  const hay = Object.values(row.original as Record<string, unknown>)
                    .filter((v) => typeof v === "string" || typeof v === "number")
                    .join(" ")
                    .toLowerCase();
                  return hay.includes(q);
                }),
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(manualPagination ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: manualPagination
      ? undefined
      : {
          pagination: { pageSize },
        },
  });

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        embedded ? "h-full overflow-hidden" : "gap-3",
        className,
      )}
    >
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        enableGlobalFilter={enableGlobalFilter}
        globalFilterPlaceholder={globalFilterPlaceholder}
        filterSlot={filterSlot}
        toolbarExtras={toolbarExtras?.(table)}
        toolbarEnd={toolbarEnd}
        className={cn(
          embedded && "shrink-0 border-b bg-muted/30 px-4 py-3",
          toolbarClassName,
        )}
      />
      <div
        className={cn(
          "min-h-0 flex-1 overflow-auto bg-card",
          embedded ? "border-0" : "rounded-md border border-border",
        )}
      >
        <Table>
          <TableHeader className="[&_tr]:bg-inherit">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sticky = (
                    header.column.columnDef.meta as
                      | { sticky?: "left" | "right" }
                      | undefined
                  )?.sticky;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        sticky &&
                          "sticky z-20 bg-inherit after:pointer-events-none after:absolute after:inset-y-0 after:w-4",
                        sticky === "left" && "left-0 after:-right-4 after:shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)]",
                        sticky === "right" && "right-0 after:-left-4 after:shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.12)]",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </span>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const sticky = (
                      cell.column.columnDef.meta as
                        | { sticky?: "left" | "right" }
                        | undefined
                    )?.sticky;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          sticky &&
                            "sticky z-10 bg-[var(--color-card)] after:pointer-events-none after:absolute after:inset-y-0 after:w-4",
                          sticky === "left" && "left-0 after:-right-4 after:shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)]",
                          sticky === "right" && "right-0 after:-left-4 after:shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.12)]",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  {emptyState ?? (
                    <span className="text-sm text-muted-foreground">
                      No results.
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div
        className={cn(
          "flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          embedded && "border-t bg-muted/20 px-4 py-2.5",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>
            {manualPagination && totalRows !== undefined
              ? `${totalRows} row(s)`
              : `${table.getFilteredRowModel().rows.length} row(s)`}
          </span>
          {showPaginationInfo && (
            <>
              <span aria-hidden>·</span>
              <span>
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {Math.max(1, table.getPageCount())}
              </span>
            </>
          )}
          {pageSizeOptions && pageSizeOptions.length > 0 && (
            <label className="ml-0 flex items-center gap-2 sm:ml-2">
              <span className="sr-only sm:not-sr-only sm:inline">Rows per page</span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
                value={resolvedPageSize}
                onChange={(e) => {
                  const nextSize = Number(e.target.value);
                  if (manualPagination) {
                    onControlledPageSizeChange?.(nextSize);
                    onPageIndexChange?.(0);
                  } else {
                    table.setPageSize(nextSize);
                    table.setPageIndex(0);
                  }
                }}
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
