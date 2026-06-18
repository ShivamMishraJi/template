import { z } from "zod";

export const employmentStatusSchema = z.enum(["active", "inactive"]);

export type EmploymentStatusActive = z.infer<typeof employmentStatusSchema>;

export const genderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"]);

export type Gender = z.infer<typeof genderSchema>;

const salaryComponentFields = {
  salaryBasic: z.number().min(0),
  salaryDa: z.number().min(0),
  salaryHra: z.number().min(0),
  salaryConveyance: z.number().min(0),
  salaryEducationAllowance: z.number().min(0),
  salaryLta: z.number().min(0),
  salaryWashingAllowance: z.number().min(0),
  salaryOtherAllowance: z.number().min(0),
  salaryOtRate: z.number().min(0),
};

const salaryComponentShape = z.object(salaryComponentFields);

export function monthlySalaryComponentSum(
  v: Pick<
    z.infer<typeof salaryComponentShape>,
    | "salaryBasic"
    | "salaryDa"
    | "salaryHra"
    | "salaryConveyance"
    | "salaryEducationAllowance"
    | "salaryLta"
    | "salaryWashingAllowance"
    | "salaryOtherAllowance"
  >,
): number {
  return (
    v.salaryBasic +
    v.salaryDa +
    v.salaryHra +
    v.salaryConveyance +
    v.salaryEducationAllowance +
    v.salaryLta +
    v.salaryWashingAllowance +
    v.salaryOtherAllowance
  );
}

export function annualSalaryFromMonthlyComponents(
  v: Parameters<typeof monthlySalaryComponentSum>[0],
): number {
  return monthlySalaryComponentSum(v) * 12;
}

/** Master sheet columns + internal payroll fields */
const employeeDataSchema = z
  .object({
    sNo: z.string().max(20),
    stateCity: z.string().max(120),
    siteName: z.string().min(1, "SITE NAME is required").max(200),
    employmentStatusYn: z.string().max(20),
    agencyName: z.string().max(120),
    agencyIdNo: z.string().max(40),
    krcSiteBiometricIdNo: z.string().max(40),
    dateOfJoining: z
      .string()
      .min(1, "DATE OF JOINING is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
    lastWorkingDay: z.string().max(30),
    designation: z.string().min(1, "DESIGNATION is required").max(80),
    nameOfEmployee: z.string().min(2, "NAME OF EMPLOYEE is required").max(120),
    empFatherSpouseName: z.string().max(120),
    dateOfBirth: z
      .string()
      .min(1, "DATE OF BIRTH is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
    gender: genderSchema,
    bloodGroup: z.string().max(12),
    employmentApplicationStatus: z.string().max(20),
    educationCertificate: z.string().max(20),
    aadharNumber: z
      .string()
      .max(24)
      .refine((s) => s === "" || /^\d{12}$/.test(s.replace(/\s/g, "")), "AADHAR must be 12 digits"),
    panNumber: z
      .string()
      .max(20)
      .refine((s) => s === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(s), "Invalid PAN format"),
    uanPfNo: z.string().max(30),
    esicNo: z.string().max(30),
    bankName: z.string().max(120),
    bankAccountNumber: z.string().max(40),
    bankIfscNumber: z
      .string()
      .max(20)
      .refine(
        (s) => s === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(s),
        "Invalid IFSC format",
      ),
    pccApplicationNo: z.string().max(40),
    pccApplicationDate: z.string().max(30),
    pccNo: z.string().max(40),
    pccIssueDate: z.string().max(30),
    policeVerificationValidity: z.string().max(40),
    currentAddress: z.string().min(1, "CURRENT ADDRESS is required").max(500),
    permanentAddress: z.string().max(500),
    phoneNumber: z
      .string()
      .min(7, "PHONE NUMBER is required")
      .max(24)
      .regex(/^[\d\s+().-]+$/, "Invalid phone"),
    nextOfKinName: z.string().max(120),
    nextOfKinContactNumber: z.string().max(24),
    employmentStatus: employmentStatusSchema,
  })
  .merge(salaryComponentShape)
  .superRefine((data, ctx) => {
    const sum = monthlySalaryComponentSum(data);
    if (sum <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Monthly salary must be greater than zero (set BASIC SALARY in payroll section).",
        path: ["salaryBasic"],
      });
    }
  });

export const payrollEmployeeFormSchema = employeeDataSchema;

export type PayrollEmployeeFormValues = z.infer<typeof payrollEmployeeFormSchema>;

export const payrollEmployeeFormAddSchema = employeeDataSchema;

export type PayrollEmployeeFormAddValues = z.infer<typeof payrollEmployeeFormAddSchema>;

export const emptyPayrollEmployeeFormAddValues: PayrollEmployeeFormAddValues = {
  sNo: "",
  stateCity: "",
  siteName: "",
  employmentStatusYn: "Y",
  agencyName: "",
  agencyIdNo: "",
  krcSiteBiometricIdNo: "",
  dateOfJoining: "",
  lastWorkingDay: "",
  designation: "",
  nameOfEmployee: "",
  empFatherSpouseName: "",
  dateOfBirth: "",
  gender: "prefer_not_to_say",
  bloodGroup: "",
  employmentApplicationStatus: "",
  educationCertificate: "",
  aadharNumber: "",
  panNumber: "",
  uanPfNo: "",
  esicNo: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfscNumber: "",
  pccApplicationNo: "",
  pccApplicationDate: "",
  pccNo: "",
  pccIssueDate: "",
  policeVerificationValidity: "",
  currentAddress: "",
  permanentAddress: "",
  phoneNumber: "",
  nextOfKinName: "",
  nextOfKinContactNumber: "",
  employmentStatus: "active",
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

export const emptyPayrollEmployeeFormValues: PayrollEmployeeFormValues =
  emptyPayrollEmployeeFormAddValues;

export const payrollEmployeeSchema = employeeDataSchema.extend({
  id: z.string().min(1),
  salary: z.number().min(0),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PayrollEmployee = z.infer<typeof payrollEmployeeSchema>;

export type PayrollEmployeeListItem = Omit<
  PayrollEmployee,
  | "salaryBasic"
  | "salaryDa"
  | "salaryHra"
  | "salaryConveyance"
  | "salaryEducationAllowance"
  | "salaryLta"
  | "salaryWashingAllowance"
  | "salaryOtherAllowance"
  | "salaryOtRate"
  | "updatedAt"
>;

export function toPayrollEmployeeListItem(employee: PayrollEmployee): PayrollEmployeeListItem {
  const {
    salaryBasic,
    salaryDa,
    salaryHra,
    salaryConveyance,
    salaryEducationAllowance,
    salaryLta,
    salaryWashingAllowance,
    salaryOtherAllowance,
    salaryOtRate,
    updatedAt,
    ...rest
  } = employee;
  void salaryBasic;
  void salaryDa;
  void salaryHra;
  void salaryConveyance;
  void salaryEducationAllowance;
  void salaryLta;
  void salaryWashingAllowance;
  void salaryOtherAllowance;
  void salaryOtRate;
  void updatedAt;
  return rest;
}

export function parsePayrollEmployeeListItems(raw: unknown): PayrollEmployeeListItem[] {
  return parsePayrollEmployees(raw).map(toPayrollEmployeeListItem);
}

export function payrollEmployeeToFormValues(employee: PayrollEmployee): PayrollEmployeeFormValues {
  const { id, salary, deletedAt, createdAt, updatedAt, ...rest } = employee;
  void id;
  void salary;
  void deletedAt;
  void createdAt;
  void updatedAt;
  return rest;
}

export const payrollEmployeeStorageDefaults: Record<string, unknown> = {
  ...emptyPayrollEmployeeFormAddValues,
};

function ynToEmploymentStatus(yn: string, lastWorkingDay: string): EmploymentStatusActive {
  if (lastWorkingDay.trim()) {
    const lwd = Date.parse(lastWorkingDay);
    if (!Number.isNaN(lwd) && lwd < Date.now()) return "inactive";
  }
  const s = yn.trim().toUpperCase();
  if (s === "N" || s === "NO") return "inactive";
  return "active";
}

function coerceLegacyEmployeeFields(row: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...row };

  const mappings: Array<[string, string]> = [
    ["fullName", "nameOfEmployee"],
    ["employeeId", "agencyIdNo"],
    ["customEmployeeId", "agencyIdNo"],
    ["branchOrSite", "siteName"],
    ["phone", "phoneNumber"],
    ["department", "agencyName"],
    ["location", "stateCity"],
    ["joiningDate", "dateOfJoining"],
    ["fatherOrSpouseName", "empFatherSpouseName"],
    ["aadhaarNumber", "aadharNumber"],
    ["uanNumber", "uanPfNo"],
    ["pfNumber", "uanPfNo"],
    ["esicNumber", "esicNo"],
    ["bankIfsc", "bankIfscNumber"],
    ["bankBranchName", ""],
  ];

  for (const [oldKey, newKey] of mappings) {
    if (oldKey in next && newKey && !(newKey in next)) {
      next[newKey] = next[oldKey];
    }
    if (oldKey in next && newKey) delete next[oldKey];
  }

  const legacyAddress = String(next.address ?? "").trim();
  if (!String(next.currentAddress ?? "").trim()) {
    next.currentAddress = legacyAddress || "Not provided";
  }
  if (!String(next.permanentAddress ?? "").trim()) {
    next.permanentAddress =
      legacyAddress || String(next.currentAddress ?? "") || "Not provided";
  }
  delete next.address;
  delete next.email;
  delete next.photoDataUrl;

  if (!String(next.employmentStatusYn ?? "").trim()) {
    const st = String(next.employmentStatus ?? "active");
    next.employmentStatusYn = st === "inactive" ? "N" : "Y";
  }

  if (!String(next.dateOfBirth ?? "").trim()) {
    next.dateOfBirth = "1990-01-01";
  }

  if (!String(next.dateOfJoining ?? "").trim()) {
    next.dateOfJoining = new Date().toISOString().slice(0, 10);
  }

  if (!String(next.siteName ?? "").trim()) {
    next.siteName = "Head office";
  }

  const g = String(next.gender ?? "").trim();
  if (!g) {
    next.gender = "prefer_not_to_say";
  } else if (!genderSchema.safeParse(g).success) {
    const lower = g.toLowerCase();
    if (lower.startsWith("m")) next.gender = "male";
    else if (lower.startsWith("f")) next.gender = "female";
    else next.gender = "prefer_not_to_say";
  }

  next.employmentStatus = ynToEmploymentStatus(
    String(next.employmentStatusYn ?? "Y"),
    String(next.lastWorkingDay ?? ""),
  );

  const pan = String(next.panNumber ?? "").trim();
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) {
    next.panNumber = "";
  }
  const aad = String(next.aadharNumber ?? "").replace(/\s/g, "");
  if (aad && !/^\d{12}$/.test(aad)) {
    next.aadharNumber = "";
  }
  const ifsc = String(next.bankIfscNumber ?? "").trim();
  if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
    next.bankIfscNumber = "";
  }

  if (!String(next.sNo ?? "").trim() && next.sNo !== 0) {
    next.sNo = "";
  } else if (typeof next.sNo === "number") {
    next.sNo = String(next.sNo);
  }

  return next;
}

function toIsoDateString(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v;
  return "";
}

function toIsoDateTimeString(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return "";
}

function toNonNegativeNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizePayrollEmployeeDocument(row: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...row };

  for (const key of [
    "dateOfBirth",
    "dateOfJoining",
    "lastWorkingDay",
    "pccApplicationDate",
    "pccIssueDate",
    "policeVerificationValidity",
  ] as const) {
    if (key in next) next[key] = toIsoDateString(next[key]);
  }

  next.createdAt = toIsoDateTimeString(next.createdAt);
  next.updatedAt = toIsoDateTimeString(next.updatedAt);
  if (next.deletedAt instanceof Date) {
    next.deletedAt = next.deletedAt.toISOString();
  }

  for (const key of [
    "salaryBasic",
    "salaryDa",
    "salaryHra",
    "salaryConveyance",
    "salaryEducationAllowance",
    "salaryLta",
    "salaryWashingAllowance",
    "salaryOtherAllowance",
    "salaryOtRate",
    "salary",
  ] as const) {
    if (key in next) next[key] = toNonNegativeNumber(next[key]);
  }

  if (!String(next.id ?? "").trim()) {
    const mongoId = next._id;
    next.id =
      mongoId && typeof mongoId === "object" && "toString" in mongoId
        ? String(mongoId)
        : `legacy-${String(next.agencyIdNo ?? "employee")}`;
  }
  delete next._id;

  if (next.deletedAt === undefined) next.deletedAt = null;

  const createdFallback = String(next.createdAt || new Date().toISOString());
  if (!String(next.createdAt ?? "").trim()) next.createdAt = createdFallback;
  if (!String(next.updatedAt ?? "").trim()) next.updatedAt = createdFallback;

  if (!String(next.designation ?? "").trim()) next.designation = "Employee";

  const phone = String(next.phoneNumber ?? "").trim();
  if (phone.length < 7) next.phoneNumber = "0000000";

  return next;
}

function migrateLegacySalaryRow(row: Record<string, unknown>): Record<string, unknown> {
  const sum =
    Number(row.salaryBasic ?? 0) +
    Number(row.salaryDa ?? 0) +
    Number(row.salaryHra ?? 0) +
    Number(row.salaryConveyance ?? 0) +
    Number(row.salaryEducationAllowance ?? 0) +
    Number(row.salaryLta ?? 0) +
    Number(row.salaryWashingAllowance ?? 0) +
    Number(row.salaryOtherAllowance ?? 0);
  const salary = Number(row.salary);
  if (sum <= 0 && Number.isFinite(salary) && salary > 0) {
    return { ...row, salaryBasic: Math.round(salary / 12) };
  }
  if (sum <= 0) {
    return { ...row, salaryBasic: 1 };
  }
  return row;
}

function finalizePayrollEmployeeSalary(row: Record<string, unknown>): Record<string, unknown> {
  const components = {
    salaryBasic: toNonNegativeNumber(row.salaryBasic),
    salaryDa: toNonNegativeNumber(row.salaryDa),
    salaryHra: toNonNegativeNumber(row.salaryHra),
    salaryConveyance: toNonNegativeNumber(row.salaryConveyance),
    salaryEducationAllowance: toNonNegativeNumber(row.salaryEducationAllowance),
    salaryLta: toNonNegativeNumber(row.salaryLta),
    salaryWashingAllowance: toNonNegativeNumber(row.salaryWashingAllowance),
    salaryOtherAllowance: toNonNegativeNumber(row.salaryOtherAllowance),
  };
  const salary = toNonNegativeNumber(row.salary);
  if (salary > 0) {
    return { ...row, ...components, salary };
  }
  return { ...row, ...components, salary: monthlySalaryComponentSum(components) * 12 };
}

export function parsePayrollEmployees(raw: unknown): PayrollEmployee[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out: PayrollEmployee[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const merged = finalizePayrollEmployeeSalary(
      migrateLegacySalaryRow(
        normalizePayrollEmployeeDocument(
          coerceLegacyEmployeeFields({
            ...payrollEmployeeStorageDefaults,
            ...(item as Record<string, unknown>),
          }),
        ),
      ),
    );
    const parsed = payrollEmployeeSchema.safeParse(merged);
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return out;
}
