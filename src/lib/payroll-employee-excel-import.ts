import * as XLSX from "xlsx";
import {
  payrollEmployeeFormAddSchema,
  type PayrollEmployeeFormAddValues,
} from "@/lib/payroll-employee-schema";
import {
  buildExcelHeaderIndex,
  MASTER_DATA_EMPLOYEE_FIELDS,
  MASTER_DATA_TEMPLATE_HEADERS,
  type MasterEmployeeFieldKey,
} from "@/lib/payroll-employee-master-fields";

export {
  MASTER_DATA_EMPLOYEE_FIELDS,
  MASTER_DATA_TEMPLATE_HEADERS,
  labelForMasterField,
} from "@/lib/payroll-employee-master-fields";

export type ExcelImportFieldKey = MasterEmployeeFieldKey;

export const EMPLOYEE_IMPORT_TEMPLATE_HEADERS = MASTER_DATA_TEMPLATE_HEADERS;

export function normalizeExcelHeader(header: unknown): string {
  return String(header ?? "")
    .replace(/\r\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

const MONTHS: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

export function parseExcelDate(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    const dmy = /^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/.exec(trimmed);
    if (dmy) {
      const day = Number.parseInt(dmy[1]!, 10);
      const mon = MONTHS[dmy[2]!.toUpperCase()];
      let year = Number.parseInt(dmy[3]!, 10);
      if (mon === undefined || !Number.isFinite(day)) return "";
      if (year < 100) year += year >= 50 ? 1900 : 2000;
      const d = new Date(year, mon, day);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
    return "";
  }
  if (typeof value === "number" && value > 0) {
    const parts = XLSX.SSF.parse_date_code(value);
    if (parts) {
      const y = parts.y;
      const m = String(parts.m).padStart(2, "0");
      const d = String(parts.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  return "";
}

function parseGender(value: unknown): PayrollEmployeeFormAddValues["gender"] {
  const s = String(value ?? "")
    .trim()
    .toLowerCase();
  if (s.startsWith("m")) return "male";
  if (s.startsWith("f")) return "female";
  if (s === "other") return "other";
  return "prefer_not_to_say";
}

function ynToStatus(yn: string, lastWorkingDay: string): PayrollEmployeeFormAddValues["employmentStatus"] {
  if (lastWorkingDay.trim()) {
    const lwd = Date.parse(lastWorkingDay);
    if (!Number.isNaN(lwd) && lwd < Date.now()) return "inactive";
  }
  const s = yn.trim().toUpperCase();
  if (s === "N" || s === "NO") return "inactive";
  return "active";
}

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function cellDigits(value: unknown): string {
  return cellString(value).replace(/\D/g, "");
}

function getCell(row: unknown[], col: number | undefined): unknown {
  if (col === undefined) return "";
  return row[col] ?? "";
}

function pickSheet(workbook: XLSX.WorkBook): string {
  const preferred = workbook.SheetNames.find((n) =>
    /master|manpower|employee/i.test(n),
  );
  if (preferred) return preferred;
  for (const name of workbook.SheetNames) {
    const sh = workbook.Sheets[name];
    if (!sh) continue;
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sh, { header: 1, defval: "" });
    for (const row of matrix.slice(0, 25)) {
      if (!Array.isArray(row)) continue;
      if (row.some((c) => normalizeExcelHeader(c) === "NAME OF EMPLOYEE")) {
        return name;
      }
    }
  }
  return workbook.SheetNames[0] ?? "";
}

function findHeaderRowIndex(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 30); i++) {
    const row = matrix[i];
    if (!Array.isArray(row)) continue;
    if (row.map(normalizeExcelHeader).includes("NAME OF EMPLOYEE")) return i;
  }
  return -1;
}

export type ParsedExcelEmployeeRow = {
  sheetName: string;
  rowNumber: number;
  values: PayrollEmployeeFormAddValues;
};

export type ExcelParseResult = {
  sheetName: string;
  rows: ParsedExcelEmployeeRow[];
  skippedEmpty: number;
};

function rowToFormValues(
  row: unknown[],
  headerIndex: Map<MasterEmployeeFieldKey, number>,
): PayrollEmployeeFormAddValues | null {
  const nameOfEmployee = cellString(getCell(row, headerIndex.get("nameOfEmployee")));
  if (!nameOfEmployee || nameOfEmployee.toUpperCase() === "NAME OF EMPLOYEE") return null;

  const phoneDigits = cellDigits(getCell(row, headerIndex.get("phoneNumber")));
  const phoneNumber =
    phoneDigits.length >= 7
      ? phoneDigits.slice(0, 10)
      : cellString(getCell(row, headerIndex.get("phoneNumber"))).slice(0, 24);

  let currentAddress = cellString(getCell(row, headerIndex.get("currentAddress")));
  let permanentAddress = cellString(getCell(row, headerIndex.get("permanentAddress")));
  if (/^same$/i.test(permanentAddress)) {
    permanentAddress = currentAddress;
  }
  if (!currentAddress && permanentAddress) currentAddress = permanentAddress;
  if (!permanentAddress && currentAddress) permanentAddress = currentAddress;

  const dateOfJoining = parseExcelDate(getCell(row, headerIndex.get("dateOfJoining")));
  const dateOfBirth = parseExcelDate(getCell(row, headerIndex.get("dateOfBirth")));
  const lastWorkingDay = parseExcelDate(getCell(row, headerIndex.get("lastWorkingDay")));
  const employmentStatusYn = cellString(getCell(row, headerIndex.get("employmentStatusYn"))) || "Y";

  let panNumber = cellString(getCell(row, headerIndex.get("panNumber"))).toUpperCase();
  let aadharNumber = cellDigits(getCell(row, headerIndex.get("aadharNumber")));
  let bankIfscNumber = cellString(getCell(row, headerIndex.get("bankIfscNumber"))).toUpperCase();
  if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(panNumber)) panNumber = "";
  if (aadharNumber && !/^\d{12}$/.test(aadharNumber)) aadharNumber = "";
  if (bankIfscNumber && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankIfscNumber)) bankIfscNumber = "";

  const sNoRaw = getCell(row, headerIndex.get("sNo"));
  const sNo = cellString(sNoRaw) || (typeof sNoRaw === "number" ? String(sNoRaw) : "");

  const values: PayrollEmployeeFormAddValues = {
    sNo,
    stateCity: cellString(getCell(row, headerIndex.get("stateCity"))),
    siteName: cellString(getCell(row, headerIndex.get("siteName"))) || "Head office",
    employmentStatusYn,
    agencyName: cellString(getCell(row, headerIndex.get("agencyName"))),
    agencyIdNo: cellString(getCell(row, headerIndex.get("agencyIdNo"))),
    krcSiteBiometricIdNo: cellString(getCell(row, headerIndex.get("krcSiteBiometricIdNo"))),
    dateOfJoining: dateOfJoining || new Date().toISOString().slice(0, 10),
    lastWorkingDay,
    designation: cellString(getCell(row, headerIndex.get("designation"))) || "Staff",
    nameOfEmployee,
    empFatherSpouseName: cellString(getCell(row, headerIndex.get("empFatherSpouseName"))),
    dateOfBirth: dateOfBirth || "1990-01-01",
    gender: parseGender(getCell(row, headerIndex.get("gender"))),
    bloodGroup: cellString(getCell(row, headerIndex.get("bloodGroup"))),
    employmentApplicationStatus: cellString(
      getCell(row, headerIndex.get("employmentApplicationStatus")),
    ),
    educationCertificate: cellString(getCell(row, headerIndex.get("educationCertificate"))),
    aadharNumber,
    panNumber,
    uanPfNo: cellString(getCell(row, headerIndex.get("uanPfNo"))),
    esicNo: cellString(getCell(row, headerIndex.get("esicNo"))),
    bankName: cellString(getCell(row, headerIndex.get("bankName"))),
    bankAccountNumber: cellString(getCell(row, headerIndex.get("bankAccountNumber"))),
    bankIfscNumber,
    pccApplicationNo: cellString(getCell(row, headerIndex.get("pccApplicationNo"))),
    pccApplicationDate: parseExcelDate(getCell(row, headerIndex.get("pccApplicationDate"))),
    pccNo: cellString(getCell(row, headerIndex.get("pccNo"))),
    pccIssueDate: parseExcelDate(getCell(row, headerIndex.get("pccIssueDate"))),
    policeVerificationValidity: cellString(
      getCell(row, headerIndex.get("policeVerificationValidity")),
    ),
    currentAddress: currentAddress || "Not provided",
    permanentAddress,
    phoneNumber: phoneNumber || "0000000000",
    nextOfKinName: cellString(getCell(row, headerIndex.get("nextOfKinName"))),
    nextOfKinContactNumber: cellDigits(getCell(row, headerIndex.get("nextOfKinContactNumber"))),
    employmentStatus: ynToStatus(employmentStatusYn, lastWorkingDay),
    salaryBasic: 1,
    salaryDa: 0,
    salaryHra: 0,
    salaryConveyance: 0,
    salaryEducationAllowance: 0,
    salaryLta: 0,
    salaryWashingAllowance: 0,
    salaryOtherAllowance: 0,
    salaryOtRate: 0,
  };

  return values;
}

export function parsePayrollEmployeeWorkbook(buffer: ArrayBuffer): ExcelParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = pickSheet(workbook);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { sheetName: "", rows: [], skippedEmpty: 0 };
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const headerRowIdx = findHeaderRowIndex(matrix);
  if (headerRowIdx < 0) {
    return { sheetName, rows: [], skippedEmpty: 0 };
  }

  const headers = matrix[headerRowIdx] ?? [];
  const headerIndex = buildExcelHeaderIndex(headers);

  const rows: ParsedExcelEmployeeRow[] = [];
  let skippedEmpty = 0;

  for (let i = headerRowIdx + 1; i < matrix.length; i++) {
    const row = matrix[i];
    if (!Array.isArray(row)) {
      skippedEmpty++;
      continue;
    }
    const values = rowToFormValues(row, headerIndex);
    if (!values) {
      skippedEmpty++;
      continue;
    }
    rows.push({ sheetName, rowNumber: i + 1, values });
  }

  return { sheetName, rows, skippedEmpty };
}

export type ExcelRowValidation = {
  rowNumber: number;
  fullName: string;
  ok: boolean;
  error?: string;
};

export function validateImportRows(rows: ParsedExcelEmployeeRow[]): ExcelRowValidation[] {
  return rows.map(({ rowNumber, values }) => {
    const parsed = payrollEmployeeFormAddSchema.safeParse(values);
    if (parsed.success) {
      return { rowNumber, fullName: values.nameOfEmployee, ok: true };
    }
    const first = parsed.error.issues[0];
    const msg = first ? `${first.path.join(".")}: ${first.message}` : "Invalid row";
    return { rowNumber, fullName: values.nameOfEmployee, ok: false, error: msg };
  });
}

export function downloadImportTemplate(): void {
  const wb = XLSX.utils.book_new();
  const sheetData: (string | number)[][] = [[...MASTER_DATA_TEMPLATE_HEADERS]];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = MASTER_DATA_EMPLOYEE_FIELDS.map((f) => ({
    wch: Math.min(52, Math.max(10, Math.ceil((f.tableMinWidth ?? 100) / 7))),
  }));
  XLSX.utils.book_append_sheet(wb, ws, "Master Data");
  XLSX.writeFile(wb, "employee-master-data-template.xlsx");
}
