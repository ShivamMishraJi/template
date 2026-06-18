"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadAttendanceTemplate,
  parseAttendanceWorkbook,
  validateAttendanceRows,
  type ParsedAttendanceRow,
} from "@/lib/attendance-excel-import";
import { importAttendance } from "@/lib/attendance-api";
import { getDefaultPayrollYear, getPayrollYearOptions } from "@/lib/payroll-year-options";

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void | Promise<void>;
};

export function AttendanceExcelImportDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(getDefaultPayrollYear);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedAttendanceRow[]>([]);
  const [sheetName, setSheetName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const yearOptions = useMemo(() => getPayrollYearOptions(), []);

  const reset = useCallback(() => {
    setFileName(null);
    setParsedRows([]);
    setSheetName("");
    setParseError(null);
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const handleFile = useCallback(async (file: File) => {
    setParseError(null);
    setSummary(null);
    setFileName(file.name);

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setParseError("Please upload an Excel file (.xlsx, .xls) or .csv.");
      setParsedRows([]);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const result = parseAttendanceWorkbook(buffer);
      if (!result.rows.length) {
        setParseError(
          "No attendance rows found. Ensure the sheet has columns: AGENCY NO, NAME, DAYS WORKED, WEEKLY OFF, TOTAL.",
        );
        setParsedRows([]);
        setSheetName(result.sheetName);
        return;
      }
      setSheetName(result.sheetName);
      setParsedRows(result.rows);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Could not read the file.");
      setParsedRows([]);
    }
  }, []);

  const validations = parsedRows.length ? validateAttendanceRows(parsedRows) : [];
  const validCount = validations.filter((v) => v.ok).length;
  const invalidCount = validations.length - validCount;

  const monthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label ?? "";

  async function handleImport() {
    const validRows = parsedRows.filter((_, i) => validations[i]?.ok);
    if (!validRows.length) return;

    setImporting(true);
    setSummary(null);
    try {
      const result = await importAttendance(
        validRows.map((r) => ({ rowNumber: r.rowNumber, values: r.values })),
        selectedMonth,
        selectedYear,
      );
      if (!result.ok) {
        setSummary(result.error);
        return;
      }
      const { imported, skipped, failed } = result.summary;
      await onImported();
      handleOpenChange(false);
      toast.success(
        `${imported} record${imported === 1 ? "" : "s"} imported for ${monthLabel} ${selectedYear}` +
          (skipped ? `. ${skipped} duplicate${skipped === 1 ? "" : "s"} skipped` : "") +
          (failed ? `. ${failed} failed` : ""),
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Attendance from Excel</DialogTitle>
          <DialogDescription>
            Select the month and year, then upload the attendance Excel file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap font-medium">Month</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm"
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(Number(e.target.value)); reset(); }}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap font-medium">Year</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm"
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); reset(); }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Choose file
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={downloadAttendanceTemplate}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download template
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {fileName ? (
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium text-foreground">{fileName}</span>
              {sheetName ? (
                <>
                  {" "}
                  · Sheet: <span className="font-medium text-foreground">{sheetName}</span>
                </>
              ) : null}
            </p>
          ) : null}

          {parseError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {parseError}
            </p>
          ) : null}

          {parsedRows.length > 0 ? (
            <div className="space-y-2 text-sm">
              <p>
                Found <strong>{parsedRows.length}</strong> row
                {parsedRows.length === 1 ? "" : "s"}:{" "}
                <span className="text-green-700 dark:text-green-400">{validCount} ready</span>
                {invalidCount > 0 ? (
                  <>
                    ,{" "}
                    <span className="text-amber-700 dark:text-amber-400">
                      {invalidCount} need fixes
                    </span>
                  </>
                ) : null}
                .
              </p>
              {invalidCount > 0 ? (
                <ul className="max-h-32 overflow-y-auto rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
                  {validations
                    .filter((v) => !v.ok)
                    .slice(0, 8)
                    .map((v) => (
                      <li key={v.rowNumber} className="py-0.5">
                        Row {v.rowNumber} ({v.name}): {v.error}
                      </li>
                    ))}
                  {invalidCount > 8 ? (
                    <li className="py-0.5 text-muted-foreground">…and {invalidCount - 8} more</li>
                  ) : null}
                </ul>
              ) : null}
              <ul className="max-h-28 overflow-y-auto rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                {parsedRows.slice(0, 5).map((r) => (
                  <li key={r.rowNumber}>
                    {r.values.name} · Agency: {r.values.agencyNo} · Days: {r.values.daysWorked} · WO: {r.values.weeklyOff} · Total: {r.values.total}
                  </li>
                ))}
                {parsedRows.length > 5 ? (
                  <li>…and {parsedRows.length - 5} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {summary ? (
            <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">{summary}</p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={importing || validCount === 0}
            onClick={() => void handleImport()}
          >
            {importing ? "Importing…" : `Import ${validCount} record${validCount === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
