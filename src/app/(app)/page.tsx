import { Suspense } from "react";
import { DashboardHome } from "@/components/pages/dashboard-home";
import { CardGridSkeleton } from "@/components/loading-skeletons";

export default function DashboardPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="p-4">
            <CardGridSkeleton />
          </div>
        }
      >
        <DashboardHome />
      </Suspense>
    </div>
  );
}
