import { getDb } from "@/lib/mongodb";
import { ATTENDANCE_COLLECTION } from "@/lib/attendance-mongo-constants";
import { parseAttendanceRecords, type AttendanceRecord } from "@/lib/attendance-schema";

export async function loadAttendanceForMonthFromDb(
  month: number,
  year: number,
): Promise<AttendanceRecord[]> {
  const db = await getDb();
  const docs = await db
    .collection(ATTENDANCE_COLLECTION)
    .find({ month, year })
    .sort({ createdAt: -1 })
    .toArray();

  const records = docs.map((d) => {
    const o = { ...(d as Record<string, unknown>) };
    delete o._id;
    return o;
  });

  return parseAttendanceRecords(records);
}
