import { NextResponse } from "next/server";
import { loadDashboardStatsFromDb } from "@/lib/dashboard-stats-server";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";

export async function GET() {
  try {
    const stats = await loadDashboardStatsFromDb();
    return NextResponse.json(stats);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard stats." }, { status: 500 });
  }
}
