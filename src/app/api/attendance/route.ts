import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import { loadAttendancePageFromDb } from "@/lib/attendance-db-server";
import { ATTENDANCE_COLLECTION } from "@/lib/attendance-mongo-constants";
import { parsePaginationSearchParams } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: "Valid month and year are required." }, { status: 400 });
    }

    const { page, pageSize } = parsePaginationSearchParams(searchParams);
    const search = searchParams.get("search")?.trim() || undefined;

    const result = await loadAttendancePageFromDb(month, year, { page, pageSize, search });
    return NextResponse.json(result);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load attendance." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: "Valid month and year are required." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection(ATTENDANCE_COLLECTION).deleteMany({ month, year });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to delete attendance." }, { status: 500 });
  }
}
