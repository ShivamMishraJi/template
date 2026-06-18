import type { DashboardStats } from "@/lib/dashboard-stats-server";

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (data && typeof data === "object" && "error" in data) {
      const e = (data as { error?: unknown }).error;
      if (typeof e === "string" && e.trim()) throw new Error(e);
    }
    throw new Error("Failed to load dashboard stats.");
  }
  return data as DashboardStats;
}
