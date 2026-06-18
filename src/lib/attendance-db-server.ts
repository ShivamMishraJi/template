import { getDb } from "@/lib/mongodb";
import { ATTENDANCE_COLLECTION } from "@/lib/attendance-mongo-constants";
import { buildPaginatedResult, type PaginatedResult } from "@/lib/pagination";
import { parseAttendanceRecords, type AttendanceRecord } from "@/lib/attendance-schema";
import type { Filter } from "mongodb";

const caseInsensitiveCollation = { locale: "en", strength: 2 } as const;

function serializeAttendanceDocs(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((d) => {
    const o = { ...d };
    delete o._id;
    return o;
  });
}

function buildAttendanceMonthFilter(
  month: number,
  year: number,
  search?: string,
): Filter<Record<string, unknown>> {
  const filter: Filter<Record<string, unknown>> = { month, year };
  const q = search?.trim();
  if (q) {
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: pattern, $options: "i" };
    filter.$or = [{ name: regex }, { agencyNo: regex }];
  }
  return filter;
}

export async function countAttendanceForMonthFromDb(month: number, year: number): Promise<number> {
  const db = await getDb();
  return db.collection(ATTENDANCE_COLLECTION).countDocuments({ month, year });
}

export async function loadAttendanceForMonthFromDb(
  month: number,
  year: number,
): Promise<AttendanceRecord[]> {
  const result = await loadAttendancePageFromDb(month, year, {
    page: 1,
    pageSize: 10_000,
  });
  return result.items;
}

export async function loadAttendancePageFromDb(
  month: number,
  year: number,
  options: { page: number; pageSize: number; search?: string },
): Promise<PaginatedResult<AttendanceRecord>> {
  const db = await getDb();
  const col = db.collection(ATTENDANCE_COLLECTION);
  const filter = buildAttendanceMonthFilter(month, year, options.search);
  const skip = (options.page - 1) * options.pageSize;

  const [docs, total] = await Promise.all([
    col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.pageSize).toArray(),
    col.countDocuments(filter),
  ]);

  const items = parseAttendanceRecords(serializeAttendanceDocs(docs));
  return buildPaginatedResult(items, total, options.page, options.pageSize);
}

export async function loadAttendanceForEmployeeFromDb(
  month: number,
  year: number,
  agencyNo: string,
): Promise<AttendanceRecord | null> {
  const trimmed = agencyNo.trim();
  if (!trimmed) return null;

  const db = await getDb();
  const doc = await db.collection(ATTENDANCE_COLLECTION).findOne(
    { month, year, agencyNo: trimmed },
    { collation: caseInsensitiveCollation },
  );

  if (!doc) return null;

  const o = { ...(doc as Record<string, unknown>) };
  delete o._id;
  const records = parseAttendanceRecords([o]);
  return records[0] ?? null;
}

export async function loadAttendanceDuplicateKeysForMonth(
  month: number,
  year: number,
): Promise<Array<{ agencyNo: string; name: string }>> {
  const db = await getDb();
  const docs = await db
    .collection(ATTENDANCE_COLLECTION)
    .find({ month, year }, { projection: { agencyNo: 1, name: 1, _id: 0 } })
    .toArray();

  return docs.map((d) => ({
    agencyNo: String(d.agencyNo ?? ""),
    name: String(d.name ?? ""),
  }));
}

export type AttendancePeriod = {
  month: number;
  year: number;
};

export async function loadAttendancePeriodsForAgencyFromDb(
  agencyNo: string,
): Promise<AttendancePeriod[]> {
  const trimmed = agencyNo.trim();
  if (!trimmed) return [];

  const db = await getDb();
  const docs = await db
    .collection(ATTENDANCE_COLLECTION)
    .aggregate<AttendancePeriod>(
      [
        { $match: { agencyNo: trimmed } },
        { $group: { _id: { month: "$month", year: "$year" } } },
        {
          $project: {
            _id: 0,
            month: "$_id.month",
            year: "$_id.year",
          },
        },
        { $sort: { year: -1, month: -1 } },
      ],
      { collation: caseInsensitiveCollation },
    )
    .toArray();

  return docs.filter(
    (period) =>
      period.month >= 1 &&
      period.month <= 12 &&
      period.year >= 2000 &&
      period.year <= 2100,
  );
}
