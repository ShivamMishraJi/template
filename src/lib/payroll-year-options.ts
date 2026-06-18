export const PAYROLL_START_YEAR = 2026;

/** Payroll years from start year through the current calendar year (newest first). */
export function getPayrollYearOptions(now = new Date()): number[] {
  const currentYear = now.getFullYear();
  const endYear = Math.max(PAYROLL_START_YEAR, currentYear);
  const years: number[] = [];
  for (let y = PAYROLL_START_YEAR; y <= endYear; y++) {
    years.push(y);
  }
  return years.sort((a, b) => b - a);
}

/** Default selected payroll year (current year, but not before PAYROLL_START_YEAR). */
export function getDefaultPayrollYear(now = new Date()): number {
  return Math.max(PAYROLL_START_YEAR, now.getFullYear());
}
