"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchKey?: keyof TData & string;
  searchPlaceholder?: string;
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  filterSlot?: React.ReactNode;
  toolbarExtras?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  hideSearch?: boolean;
  className?: string;
};

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search…",
  enableGlobalFilter,
  globalFilterPlaceholder = "Search all columns…",
  filterSlot,
  toolbarExtras,
  toolbarEnd,
  hideSearch,
  className,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    Boolean(
      enableGlobalFilter &&
        String(table.getState().globalFilter ?? "").trim().length > 0,
    );
  const column = searchKey ? table.getColumn(searchKey) : undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {enableGlobalFilter && !hideSearch && (
          <Input
            placeholder={globalFilterPlaceholder}
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-9 w-full sm:max-w-sm"
          />
        )}
        {column && (
          <Input
            placeholder={searchPlaceholder}
            value={(column.getFilterValue() as string) ?? ""}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="h-9 w-full sm:max-w-xs"
          />
        )}
        {filterSlot}
        {toolbarExtras}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              if (enableGlobalFilter) {
                table.setGlobalFilter("");
              }
            }}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {toolbarEnd}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(() => {
            const hideableCols = table
              .getAllColumns()
              .filter((c) => c.getCanHide());
            const allVisible = hideableCols.every((c) => c.getIsVisible());
            return (
              <>
                <DropdownMenuCheckboxItem
                  className="text-xs font-semibold"
                  checked={allVisible}
                  onCheckedChange={(value) => {
                    for (const col of hideableCols) {
                      col.toggleVisibility(!!value);
                    }
                  }}
                >
                  {allVisible ? "Hide all" : "Show all"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {hideableCols.map((column) => {
                  const label =
                    (column.columnDef.meta as { label?: string } | undefined)
                      ?.label ?? column.id.replace(/_/g, " ");
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="text-xs"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </>
            );
          })()}
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
