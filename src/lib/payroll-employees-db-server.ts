import { getDb } from "@/lib/mongodb";
import {
  parsePayrollEmployeeListItems,
  parsePayrollEmployees,
  type PayrollEmployee,
  type PayrollEmployeeListItem,
} from "@/lib/payroll-employee-schema";
import { PAYROLL_EMPLOYEES_COLLECTION } from "@/lib/payroll-employees-mongo-constants";
import { buildPaginatedResult, type PaginatedResult } from "@/lib/pagination";
import type { Filter } from "mongodb";

const caseInsensitiveCollation = { locale: "en", strength: 2 } as const;

const PAYROLL_SALARY_FIELD_PROJECTION = {
  salaryBasic: 0,
  salaryDa: 0,
  salaryHra: 0,
  salaryConveyance: 0,
  salaryEducationAllowance: 0,
  salaryLta: 0,
  salaryWashingAllowance: 0,
  salaryOtherAllowance: 0,
  salaryOtRate: 0,
  updatedAt: 0,
} as const;

function serializePayrollEmployeeDocs(
  docs: Record<string, unknown>[],
): Record<string, unknown>[] {
  return docs.map((d) => {
    const o = { ...d };
    delete o._id;
    return o;
  });
}

export type PayrollEmployeesPageQuery = {
  page: number;
  pageSize: number;
  search?: string;
  siteName?: string;
  employmentStatus?: "active" | "inactive";
  activeOnly?: boolean;
  includeDeleted?: boolean;
};

function buildPayrollEmployeesFilter(query: PayrollEmployeesPageQuery): Filter<Record<string, unknown>> {
  const filter: Filter<Record<string, unknown>> = {};

  if (!query.includeDeleted) {
    filter.deletedAt = null;
  }

  if (query.activeOnly) {
    filter.employmentStatus = "active";
  } else if (query.employmentStatus) {
    filter.employmentStatus = query.employmentStatus;
  }

  if (query.siteName?.trim()) {
    filter.siteName = query.siteName.trim();
  }

  const q = query.search?.trim();
  if (q) {
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: pattern, $options: "i" };
    filter.$or = [
      { nameOfEmployee: regex },
      { agencyIdNo: regex },
      { siteName: regex },
      { designation: regex },
    ];
  }

  return filter;
}

export async function loadAllPayrollEmployeesFromDb() {
  const db = await getDb();
  const docs = await db.collection(PAYROLL_EMPLOYEES_COLLECTION).find({}).toArray();
  return parsePayrollEmployees(serializePayrollEmployeeDocs(docs));
}

export async function loadPayrollEmployeeByIdFromDb(id: string): Promise<PayrollEmployee | null> {
  const db = await getDb();
  const doc = await db.collection(PAYROLL_EMPLOYEES_COLLECTION).findOne({ id });
  if (!doc) return null;
  const o = { ...(doc as Record<string, unknown>) };
  delete o._id;
  const list = parsePayrollEmployees([o]);
  return list[0] ?? null;
}

export async function isAgencyIdTaken(
  agencyIdNo: string,
  excludeId?: string,
): Promise<boolean> {
  const trimmed = agencyIdNo.trim();
  if (!trimmed) return false;

  const db = await getDb();
  const filter: Filter<Record<string, unknown>> = { agencyIdNo: trimmed };
  if (excludeId) {
    filter.id = { $ne: excludeId };
  }

  const count = await db
    .collection(PAYROLL_EMPLOYEES_COLLECTION)
    .countDocuments(filter, { collation: caseInsensitiveCollation });

  return count > 0;
}

export async function loadAgencyIdsFromDb(): Promise<string[]> {
  const db = await getDb();
  const docs = await db
    .collection(PAYROLL_EMPLOYEES_COLLECTION)
    .find({}, { projection: { agencyIdNo: 1, _id: 0 } })
    .toArray();
  return docs.map((d) => String(d.agencyIdNo ?? ""));
}

export async function loadPayrollEmployeesListFromDb(): Promise<PayrollEmployeeListItem[]> {
  const page = await loadPayrollEmployeesPageFromDb({ page: 1, pageSize: 10_000 });
  return page.items;
}

export async function loadPayrollEmployeesPageFromDb(
  query: PayrollEmployeesPageQuery,
): Promise<PaginatedResult<PayrollEmployeeListItem>> {
  const db = await getDb();
  const col = db.collection(PAYROLL_EMPLOYEES_COLLECTION);
  const filter = buildPayrollEmployeesFilter(query);
  const skip = (query.page - 1) * query.pageSize;

  const [docs, total] = await Promise.all([
    col
      .find(filter)
      .project(PAYROLL_SALARY_FIELD_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.pageSize)
      .toArray(),
    col.countDocuments(filter),
  ]);

  const items = parsePayrollEmployeeListItems(serializePayrollEmployeeDocs(docs));
  return buildPaginatedResult(items, total, query.page, query.pageSize);
}

export async function loadDistinctPayrollSitesFromDb(): Promise<string[]> {
  const db = await getDb();
  const sites = await db
    .collection(PAYROLL_EMPLOYEES_COLLECTION)
    .distinct("siteName", { deletedAt: null });

  return sites
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export async function countActivePayrollEmployeesFromDb(): Promise<number> {
  const db = await getDb();
  return db.collection(PAYROLL_EMPLOYEES_COLLECTION).countDocuments({
    deletedAt: null,
    employmentStatus: "active",
  });
}
