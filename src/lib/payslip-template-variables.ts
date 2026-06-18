import { rupeesInWords } from "@/lib/amount-in-words";
import type { AttendanceRecord } from "@/lib/attendance-schema";
import {
  monthlySalaryComponentSum,
  type PayrollEmployee,
} from "@/lib/payroll-employee-schema";

export type PayslipTemplateVariables = Record<string, string>;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function formatDdMmYyyy(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatAmount(value: number): string {
  return String(Math.round(value));
}

function displayText(value: string | undefined | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed || "-";
}

function findAttendanceForEmployee(
  employee: PayrollEmployee,
  attendance: AttendanceRecord[],
): AttendanceRecord | undefined {
  const agencyId = employee.agencyIdNo.trim().toLowerCase();
  if (!agencyId) return undefined;
  return attendance.find((r) => r.agencyNo.trim().toLowerCase() === agencyId);
}

export function hasAttendanceForEmployee(
  employee: PayrollEmployee,
  attendance: AttendanceRecord | AttendanceRecord[] | null | undefined,
): boolean {
  if (!attendance) return false;
  if (Array.isArray(attendance)) {
    return findAttendanceForEmployee(employee, attendance) !== undefined;
  }
  const agencyId = employee.agencyIdNo.trim().toLowerCase();
  if (!agencyId) return false;
  return attendance.agencyNo.trim().toLowerCase() === agencyId;
}

export function payslipMonthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function missingAttendanceMessage(month: number, year: number): string {
  return `Attendance record for ${payslipMonthLabel(month, year)} is not present for this employee.`;
}

export function buildPayslipTemplateVariables(
  employee: PayrollEmployee,
  month: number,
  year: number,
  attendance: AttendanceRecord | AttendanceRecord[] = [],
): PayslipTemplateVariables {
  const basic = employee.salaryBasic;
  const da = employee.salaryDa;
  const houseRentAllowance = employee.salaryHra;
  const conveyance = employee.salaryConveyance;
  const educationAllowance = employee.salaryEducationAllowance;
  const lta = employee.salaryLta;
  const washingAllowance = employee.salaryWashingAllowance;
  const otherAllowance = employee.salaryOtherAllowance;
  const specialAllowance = 0;
  const overtimeEarning = 0;

  const totalEarning = monthlySalaryComponentSum(employee);
  const pfEmployeeContribution = Math.round(basic * 0.12);
  const esicEmployeeContribution = Math.round(totalEarning * 0.0075);
  const professionalTax = totalEarning > 0 ? 200 : 0;
  const lwf = 0;
  const securityDeposit = 0;

  const totalDeduction =
    pfEmployeeContribution +
    esicEmployeeContribution +
    professionalTax +
    lwf +
    securityDeposit;
  const netAmount = totalEarning - totalDeduction;

  const attendanceRow = Array.isArray(attendance)
    ? findAttendanceForEmployee(employee, attendance)
    : attendance;
  const totalDays = daysInMonth(month, year);
  const duties = attendanceRow?.total ?? attendanceRow?.daysWorked ?? totalDays;

  const locationParts = [employee.siteName, employee.stateCity].filter((s) => s.trim());
  const location = locationParts.join(", ");

  return {
    pay_slip_month: `${MONTH_NAMES[month - 1]} ${year}`,
    employee_name: displayText(employee.nameOfEmployee),
    employee_no: displayText(employee.agencyIdNo),
    pan_no: displayText(employee.panNumber),
    designation: displayText(employee.designation),
    aadhaar_no: displayText(employee.aadharNumber),
    location: displayText(location),
    uan: displayText(employee.uanPfNo),
    bank_account_number: displayText(employee.bankAccountNumber),
    pf_account_number: displayText(employee.uanPfNo),
    date_of_joining: formatDdMmYyyy(employee.dateOfJoining),
    esi_number: displayText(employee.esicNo),
    total_no_of_days: String(totalDays),
    no_of_duties: String(duties),
    basic: formatAmount(basic),
    da: formatAmount(da),
    house_rent_allowance: formatAmount(houseRentAllowance),
    conveyance: formatAmount(conveyance),
    education_allowance: formatAmount(educationAllowance),
    lta: formatAmount(lta),
    washing_allowance: formatAmount(washingAllowance),
    other_allowance: formatAmount(otherAllowance),
    special_allowance: formatAmount(specialAllowance),
    overtime_earning: formatAmount(overtimeEarning),
    pf_employee_contribution: formatAmount(pfEmployeeContribution),
    esic_employee_contribution: formatAmount(esicEmployeeContribution),
    professional_tax: formatAmount(professionalTax),
    lwf: formatAmount(lwf),
    security_deposit: formatAmount(securityDeposit),
    total_earning: formatAmount(totalEarning),
    total_deduction: formatAmount(totalDeduction),
    net_amount: formatAmount(netAmount),
    amount_in_words: rupeesInWords(netAmount),
  };
}

export function escapeTypstText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/#/g, "\\#")
    .replace(/\$/g, "\\$")
    .replace(/@/g, "\\@")
    .replace(/_/g, "\\_");
}

export function fillPayslipTemplate(
  template: string,
  variables: PayslipTemplateVariables,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const raw = variables[key] ?? "";
    return escapeTypstText(raw);
  });
}
