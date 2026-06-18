"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
  downloadImportTemplate,
  parsePayrollEmployeeWorkbook,
  validateImportRows,
  type ParsedExcelEmployeeRow,
} from "@/lib/payroll-employee-excel-import";
import { importPayrollEmployees } from "@/lib/payroll-employees-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void | Promise<void>;
};

export function EmployeeExcelImportDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedExcelEmployeeRow[]>([]);
  const [sheetName, setSheetName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

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
      const result = parsePayrollEmployeeWorkbook(buffer);
      if (!result.rows.length) {
        setParseError(
          "No employee rows found. Use a sheet with a header row containing “NAME OF EMPLOYEE” (like your Master Data sheet).",
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

  const validations = parsedRows.length ? validateImportRows(parsedRows) : [];
  const validCount = validations.filter((v) => v.ok).length;
  const invalidCount = validations.length - validCount;

  async function handleImport() {
    const validRows = parsedRows.filter((_, i) => validations[i]?.ok);
    if (!validRows.length) return;

    setImporting(true);
    setSummary(null);
    try {
      const result = await importPayrollEmployees(
        validRows.map((r) => ({ rowNumber: r.rowNumber, values: r.values })),
        { skipDuplicates: true },
      );
      if (!result.ok) {
        setSummary(result.error);
        return;
      }
      const { imported, skipped, failed } = result.summary;
      await onImported();
      handleOpenChange(false);
      toast.success(
        `${imported} employee${imported === 1 ? "" : "s"} imported successfully` +
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
          <DialogTitle>Import employees from Excel</DialogTitle>
          <DialogDescription>
            Matches your KRC file &quot;Master Data&quot; (34 columns with
            exact header names). Download the template with the correct headers, then fill in your rows.
            Rows with invalid data are listed below and are not imported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              onClick={downloadImportTemplate}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download master template
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
                        Row {v.rowNumber} ({v.fullName}): {v.error}
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
                    {r.values.nameOfEmployee}
                    {r.values.agencyIdNo ? ` · ${r.values.agencyIdNo}` : ""} · {r.values.siteName}
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
            {importing ? "Importing…" : `Import ${validCount} employee${validCount === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
